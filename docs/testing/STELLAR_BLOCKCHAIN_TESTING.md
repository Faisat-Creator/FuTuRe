# Stellar Blockchain Testing Documentation

## Overview

Comprehensive Stellar blockchain test suite for the Stellar Remittance Platform.

## Test File

`backend/tests/stellar.blockchain.test.js`

## What's Covered

| Area | Description |
|------|-------------|
| Testnet account creation | Keypair generation, Friendbot funding |
| Transaction testing | Payment ops, transaction building, submission, duplicate handling |
| Network failure handling | Retry on timeout, max-retry exhaustion, 503 handling |
| Blockchain state | Account load, sequence number verification, 404 detection |
| Consensus / finality | Ledger inclusion confirmation, network passphrase validation |
| Performance benchmarking | Submission latency, account load latency, concurrent submissions |
| Smart contract stubs | Soroban contract invocation structure and ID format validation |

## Network Configuration

| Network | Horizon URL | Passphrase |
|---------|-------------|------------|
| Testnet | https://horizon-testnet.stellar.org | `Test SDF Network ; September 2015` |
| Mainnet | https://horizon.stellar.org | `Public Global Stellar Network ; September 2015` |

## Running

```bash
# Unit tests (mocked SDK — no network required)
cd backend && npx vitest run tests/stellar.blockchain.test.js

# Integration tests (real testnet — requires network)
npx vitest run tests/stellar.integration.test.js
```

## Source Modules

- `backend/src/services/stellar.js` — core Stellar operations
- `backend/src/services/stellarNetwork.js` — network management
- `backend/src/services/transactions.js` — transaction service
