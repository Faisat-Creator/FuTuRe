# Compliance & Regulatory Testing Documentation

## Overview

KYC/AML compliance and regulatory testing for the Stellar Remittance Platform.

## Test File

`backend/tests/compliance.regulatory.test.js`

## What's Covered

| Area | Description |
|------|-------------|
| KYC procedures | Submit, retrieve, approve, reject, verify KYC records |
| AML screening | Large transaction, structuring, rapid succession detection |
| Risk scoring | 0–100 risk score with LOW/MEDIUM/HIGH/CRITICAL levels |
| Audit trail | Append-only event log with filtering by user/type/date |
| Regulatory reporting | AML summary report generation and listing |
| Sanctions checking | Name + nationality screening against sanctions list |

## AML Rules Tested

| Rule | Trigger |
|------|---------|
| LARGE_TX | Single transaction ≥ 10 000 |
| STRUCTURING | Amount between 9 000 and 10 000 |
| RAPID_SUCCESSION | ≥ 5 transactions within 1 hour |
| UNVERIFIED_USER | Sender has no approved KYC |

## Running

```bash
cd backend && npx vitest run tests/compliance.regulatory.test.js
```

## Source Modules

- `backend/src/compliance/kycCollector.js`
- `backend/src/compliance/amlMonitor.js`
- `backend/src/compliance/riskScorer.js`
- `backend/src/compliance/complianceAudit.js`
- `backend/src/compliance/complianceReporting.js`
- `backend/src/compliance/sanctionsChecker.js`
