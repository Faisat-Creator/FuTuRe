import express from 'express';
import { getSnapshot, resetMetrics } from '../monitoring/metrics.js';
import { getFeeBumpStats } from '../services/stellar.js';

const router = express.Router();

// GET /api/metrics — full performance snapshot
router.get('/', (_req, res) => {
  res.json(getSnapshot());
});

// DELETE /api/metrics — reset collected metrics
router.delete('/', (_req, res) => {
  resetMetrics();
  res.json({ message: 'Metrics reset' });
});

// GET /api/metrics/fee-bump — fee bump usage stats for cost tracking
router.get('/fee-bump', (_req, res) => {
  res.json(getFeeBumpStats());
});

export default router;
