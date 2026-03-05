# Contracts Examples

Smart contract lifecycle examples using `@ottochain/sdk/apps/contracts`.

## Examples

### `contract-lifecycle.ts`

Three contract workflow paths:
- **Path A** — Happy path: propose → accept → complete → finalize
- **Path B** — Rejection: propose → reject  
- **Path C** — Dispute: propose → accept → dispute

```bash
# Path A (default)
npx tsx contract-lifecycle.ts

# Path B — rejection
npx tsx contract-lifecycle.ts --path=B

# Path C — dispute
npx tsx contract-lifecycle.ts --path=C

# With cluster
METAGRAPH_URL=http://localhost:9300 BRIDGE_URL=http://localhost:3030 \
  npx tsx contract-lifecycle.ts
```

## Key SDK Types

```typescript
import {
  getContractDefinition,    // State machine JSON definition
  getEscrowDefinition,      // Escrow variant
  ContractState,            // Enum: PROPOSED | ACCEPTED | COMPLETED | FINALIZED | REJECTED | DISPUTED
  Contract,                 // Proto type: contract record
  ProposeContractRequest,   // Input type
  AcceptContractRequest,
  CompleteContractRequest,
  RejectContractRequest,
  DisputeContractRequest,
} from '@ottochain/sdk/apps/contracts';
```

## State Machine Transitions

```
proposed ──accept──→  accepted ──complete──→ completed ──finalize──→ finalized
         ──reject──→  rejected
accepted ──dispute──→ disputed
disputed ──resolve──→ finalized (arbitrated)
```

## Escrow Variant

For payment-secured contracts, use the escrow definition which locks DAG in escrow until completion:

```typescript
import { getEscrowDefinition } from '@ottochain/sdk/apps/contracts';

const escrowDef = getEscrowDefinition();
// initialState: 'funded' (requires upfront DAG deposit)
```
