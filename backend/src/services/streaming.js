/* backend/src/services/streaming.js */
import prisma from '../db/client.js';
import { sendPayment } from './stellar.js';
import { eventMonitor } from '../eventSourcing/index.js';
import logger from '../config/logger.js';

export async function createStream({ senderPublicKey, recipientPublicKey, assetCode, rateAmount, intervalSeconds = 60, endTime, metadata }) {
  // Ensure users exist
  const [sender, recipient] = await Promise.all([
    prisma.user.upsert({ where: { publicKey: senderPublicKey }, update: {}, create: { publicKey: senderPublicKey } }),
    prisma.user.upsert({ where: { publicKey: recipientPublicKey }, update: {}, create: { publicKey: recipientPublicKey } }),
  ]);

  const stream = await prisma.paymentStream.create({
    data: {
      senderId: sender.id,
      recipientId: recipient.id,
      assetCode: assetCode || 'XLM',
      rateAmount,
      intervalSeconds,
      endTime: endTime ? new Date(endTime) : null,
      metadata: metadata || {},
      status: 'ACTIVE',
    },
  });

  await eventMonitor.publishEvent(senderPublicKey, {
    type: 'StreamCreated',
    data: { 
      streamId: stream.id, 
      recipientPublicKey, 
      assetCode: assetCode || 'XLM',
      rateAmount, 
      intervalSeconds 
    },
    version: 1,
  });

  return stream;
}

export async function pauseStream(id) {
  const stream = await prisma.paymentStream.update({
    where: { id },
    data: { status: 'PAUSED' },
    include: { sender: true },
  });

  await eventMonitor.publishEvent(stream.sender.publicKey, {
    type: 'StreamPaused',
    data: { streamId: id },
    version: 1,
  });

  return stream;
}

export async function resumeStream(id) {
  const stream = await prisma.paymentStream.update({
    where: { id },
    data: { status: 'ACTIVE', lastProcessedAt: new Date() },
    include: { sender: true },
  });

  await eventMonitor.publishEvent(stream.sender.publicKey, {
    type: 'StreamResumed',
    data: { streamId: id },
    version: 1,
  });

  return stream;
}

export async function cancelStream(id) {
  const stream = await prisma.paymentStream.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { sender: true },
  });

  await eventMonitor.publishEvent(stream.sender.publicKey, {
    type: 'StreamCancelled',
    data: { streamId: id },
    version: 1,
  });

  return stream;
}

export async function getStreamAnalytics() {
  const streams = await prisma.paymentStream.findMany({
    include: { sender: true, recipient: true }
  });

  const totalVolume = streams.reduce((acc, s) => acc + parseFloat(s.totalStreamed), 0);
  const activeCount = streams.filter(s => s.status === 'ACTIVE').length;
  const pausedCount = streams.filter(s => s.status === 'PAUSED').length;
  const failedCount = streams.filter(s => s.status === 'FAILED').length;

  return {
    totalVolume: totalVolume.toFixed(7),
    activeStreams: activeCount,
    pausedStreams: pausedCount,
    failedStreams: failedCount,
    totalStreams: streams.length,
    topAssets: Array.from(new Set(streams.map(s => s.assetCode))),
  };
}

export async function processActiveStreams(sourceSecret) {
  if (!sourceSecret) {
    logger.warn('streaming.worker.skip', { reason: 'No sourceSecret provided' });
    return;
  }

  const now = new Date();
  const activeStreams = await prisma.paymentStream.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { endTime: null },
        { endTime: { gt: now } },
      ],
    },
    include: { sender: true, recipient: true },
  });

  logger.debug('streaming.worker.tick', { activeCount: activeStreams.length });

  for (const stream of activeStreams) {
    const lastProcessed = new Date(stream.lastProcessedAt);
    const secondsSinceLast = (now - lastProcessed) / 1000;

    if (secondsSinceLast >= stream.intervalSeconds) {
       try {
         // Execute payment on Stellar
         const result = await sendPayment(
           sourceSecret, 
           stream.recipient.publicKey, 
           stream.rateAmount.toString(), 
           stream.assetCode
         );
         
         if (result.success) {
           await prisma.paymentStream.update({
             where: { id: stream.id },
             data: {
               lastProcessedAt: now,
               totalStreamed: { increment: stream.rateAmount },
               failureCount: 0,
             },
           });

           await eventMonitor.publishEvent(stream.sender.publicKey, {
             type: 'StreamPaymentProcessed',
             data: { streamId: stream.id, amount: stream.rateAmount, hash: result.hash },
             version: 1,
           });

           logger.info('streaming.process.success', { streamId: stream.id, hash: result.hash });
         } else {
           throw new Error('Transaction submission failed');
         }
       } catch (err) {
         logger.error('streaming.process.failed', { streamId: stream.id, error: err.message });
         
         const updatedStream = await prisma.paymentStream.update({
           where: { id: stream.id },
           data: { failureCount: { increment: 1 } },
         });

         if (updatedStream.failureCount >= 5) {
           await prisma.paymentStream.update({
             where: { id: stream.id },
             data: { status: 'FAILED' },
           });
           
           await eventMonitor.publishEvent(stream.sender.publicKey, {
             type: 'StreamFailed',
             data: { streamId: stream.id, reason: 'Consecutive execution failures' },
             version: 1,
           });

           logger.error('streaming.stream.halted', { streamId: stream.id, reason: 'Too many failures' });
         }
       }
    }
  }
}
