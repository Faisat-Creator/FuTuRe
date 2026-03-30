# Performance Testing Documentation

## Overview

Performance benchmarks and regression detection for the Stellar Remittance Platform.

## Test File

`backend/tests/performance.regression.test.js`

## What's Covered

| Area | Description |
|------|-------------|
| Baseline measurement | Captures avg, p95, p99, min, max response times and error rate |
| Regression detection | Compares current run against saved baseline; flags degradation |
| Trend analysis | Identifies improving / degrading / stable trends across runs |
| Alerting thresholds | Fires critical/warning alerts when SLOs are breached |
| Optimization recommendations | Suggests fixes for slow endpoints |
| Comparison tools | Side-by-side delta between two result sets |
| Bottleneck analysis | Identifies the slowest paths in a mixed result set |

## SLOs Enforced

| Metric | Threshold |
|--------|-----------|
| Avg response time | < 500 ms |
| p95 response time | < 1 000 ms |
| Error rate | < 5 % |
| Throughput | > 1 req/s |

## Running

```bash
# Run performance regression tests only
cd backend && npx vitest run tests/performance.regression.test.js

# Run all performance tests
npm run test:performance
```

## Source Modules

- `backend/src/loadTesting/performanceBaseline.js` — baseline capture & persistence
- `backend/src/loadTesting/regressionTester.js` — regression & trend detection
- `backend/src/loadTesting/performanceAlerting.js` — threshold alerting
- `backend/src/loadTesting/optimizationRecommender.js` — recommendations
- `backend/src/loadTesting/bottleneckAnalyzer.js` — bottleneck identification
