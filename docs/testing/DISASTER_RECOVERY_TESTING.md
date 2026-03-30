# Disaster Recovery Testing Documentation

## Overview

Disaster recovery (DR) procedures and automation tests for the Stellar Remittance Platform.

## Test File

`backend/tests/disaster.recovery.test.js`

## What's Covered

| Area | Description |
|------|-------------|
| Disaster simulation | Network partition, service crash, database failure scenarios |
| Backup / restore | Manifest creation, integrity verification, backup listing |
| Failover testing | Service failover recording, MTTR calculation, availability % |
| Data recovery | Snapshot write/read, missing data detection |
| RTO testing | Validates recovery time against 60-second objective |
| Business continuity | DR experiment scheduling |
| DR automation | End-to-end experiment execution and report generation |

## Recovery Objectives

| Metric | Target |
|--------|--------|
| RTO (Recovery Time Objective) | ≤ 60 seconds |
| RPO (Recovery Point Objective) | ≤ 5 minutes |

## Running

```bash
cd backend && npx vitest run tests/disaster.recovery.test.js
```

## Source Modules

- `backend/src/chaos/` — failure injection, recovery time analysis, chaos automation
- `backend/src/backup/manager.js` — backup creation and encryption
