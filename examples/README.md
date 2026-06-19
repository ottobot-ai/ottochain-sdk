# OttoChain SDK Examples

Working examples for the OttoChain SDK, organized by domain.

## Prerequisites

```bash
npm install
npm run build
```

## Domain Examples (New)

Domain-specific examples demonstrate the five OttoChain application domains.
Each directory contains a README with full type documentation.

| Domain | Example | What it shows |
|--------|---------|---------------|
| [identity/](./identity/) | `did-credential-workflow.ts` | DID registration, platform links, attestations, reputation |
| [contracts/](./contracts/) | `contract-lifecycle.ts` | Propose → accept → complete / reject / dispute |
| [markets/](./markets/) | `prediction-market.ts` | Binary prediction market, oracle resolution, payout |
| [governance/](./governance/) | `dao-proposal-vote.ts` | Multisig DAO and token-weighted DAO proposals |
| [lending/](./lending/) | `zk-loan.ts` | Privacy-preserving credit: reputation-backed zk eligibility proof, client-side verify, proof-gated origination |

```bash
# Identity: DID + credential workflow
npx tsx examples/identity/did-credential-workflow.ts

# Lending: privacy-preserving zk-loan (runs client-side, no cluster)
npx tsx examples/lending/zk-loan.ts

# Contracts: full lifecycle (Path A/B/C)
npx tsx examples/contracts/contract-lifecycle.ts
npx tsx examples/contracts/contract-lifecycle.ts --path=B

# Markets: prediction market with oracle
npx tsx examples/markets/prediction-market.ts

# Governance: DAO proposal + vote
npx tsx examples/governance/dao-proposal-vote.ts
npx tsx examples/governance/dao-proposal-vote.ts --type=token
```

> **Note:** Domain examples submit transactions to a running cluster.
> Set `METAGRAPH_URL` and `BRIDGE_URL` env vars, or run offline for a
> dry-run walkthrough.

---

## Core Examples

### 1. Agent Registration (`agent-registration.ts`)

Key pair generation, identity registration, signature submission.

```bash
npx ts-node examples/agent-registration.ts
```

### 2. Contract Flow (`contract-flow.ts`)

Basic contract propose → accept → complete lifecycle.

```bash
npx ts-node examples/contract-flow.ts
```

### 3. Batch Transactions (`batch-transactions.ts`)

Multi-party signing, sequential signing, threshold (2-of-3).

```bash
npx ts-node examples/batch-transactions.ts
```

### 4. Wallet Management (`wallet-management.ts`)

Key pair generation, import, derivation, validation, backup.

```bash
npx ts-node examples/wallet-management.ts
```

### 5. Query State (`query-state.ts`)

Read Data L1 / Currency L1 endpoints, error handling.

```bash
METAGRAPH_DATA_URL=http://localhost:9300 npx ts-node examples/query-state.ts
```

---

## Environment Variables

```bash
export METAGRAPH_URL=http://localhost:9300   # Data L1 (domain examples)
export BRIDGE_URL=http://localhost:3030      # Bridge service (state queries)
```

## Common Patterns

### Error Handling

```typescript
import { ValidationError, NetworkError, SigningError } from '@ottochain/sdk';

try {
  const signed = await createSignedObject(data, privateKey);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Invalid input:', error.field, error.message);
  } else if (error instanceof SigningError) {
    console.log('Signing failed:', error.operation);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.statusCode, error.message);
  }
}
```

### Input Validation

```typescript
import { validate, ProposeContractRequestSchema } from '@ottochain/sdk';

const validatedRequest = validate(ProposeContractRequestSchema, inputData);
```

### Network Requests

```typescript
import { DataL1Client } from '@ottochain/sdk';

const client = new DataL1Client({ baseUrl: 'http://localhost:9300' });
await client.sendTransaction(signedTx, parent);
```
