/* backend/src/routes/streaming.js */
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as StreamingService from '../services/streaming.js';
import logger from '../config/logger.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const STELLAR_PUBLIC_KEY = /^G[A-Z2-7]{55}$/;

const streamRules = {
  create: [
    body('senderPublicKey').matches(STELLAR_PUBLIC_KEY).withMessage('Invalid sender public key'),
    body('recipientPublicKey').matches(STELLAR_PUBLIC_KEY).withMessage('Invalid recipient public key'),
    body('assetCode').optional().isString().isLength({ min: 1, max: 12 }),
    body('rateAmount').isFloat({ gt: 0 }).withMessage('rateAmount must be a positive number'),
    body('intervalSeconds').optional().isInt({ min: 10 }).withMessage('intervalSeconds must be at least 10'),
    body('endTime').optional().isISO8601().withMessage('endTime must be a valid ISO8601 date'),
  ],
  idParam: [
    param('id').isUUID().withMessage('Invalid stream ID'),
  ],
};

router.post('/', streamRules.create, validate, async (req, res) => {
  try {
    const stream = await StreamingService.createStream(req.body);
    res.status(201).json(stream);
  } catch (error) {
    logger.error('streaming.route.create.failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const analytics = await StreamingService.getStreamAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error('streaming.route.analytics.failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', streamRules.idParam, validate, async (req, res) => {
  try {
    const stream = await StreamingService.prisma.paymentStream.findUnique({
      where: { id: req.params.id },
      include: { sender: true, recipient: true },
    });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pause', streamRules.idParam, validate, async (req, res) => {
  try {
    const stream = await StreamingService.pauseStream(req.params.id);
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/resume', streamRules.idParam, validate, async (req, res) => {
  try {
    const stream = await StreamingService.resumeStream(req.params.id);
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/cancel', streamRules.idParam, validate, async (req, res) => {
  try {
    const stream = await StreamingService.cancelStream(req.params.id);
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
