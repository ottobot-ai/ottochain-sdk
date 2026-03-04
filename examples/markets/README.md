# Markets Examples

Prediction market examples using `@ottochain/sdk/apps/markets`.

## Examples

### `prediction-market.ts`

Full prediction market lifecycle:
1. Create binary market with oracle
2. Participants commit YES/NO positions
3. Oracle resolves outcome
4. Winners claim proportional payouts

```bash
npx tsx prediction-market.ts

# With cluster
METAGRAPH_URL=http://localhost:9300 BRIDGE_URL=http://localhost:3030 \
  npx tsx prediction-market.ts
```

## Key SDK Types

```typescript
import {
  getMarketDefinition,       // State machine JSON definition (Universal)
  MarketType,                // Enum: BINARY | MULTI_CHOICE | SCALAR | CONDITIONAL
  MarketState,               // Enum: OPEN | LOCKED | RESOLVED | CLAIMED | CANCELLED
  Market,                    // Proto type: market record
  Commitment,                // Proto type: participant commitment
  Resolution,                // Proto type: oracle resolution
  CreateMarketRequest,       // Input type
  CommitToMarketRequest,
  SubmitResolutionRequest,
} from '@ottochain/sdk/apps/markets';
```

## State Machine Transitions

```
open ──commit──→  open (accumulating commitments)
open ──lock──→    locked (stops new commitments)
locked ──resolve──→ resolved (oracle submits outcome)
resolved ──claim──→ claimed (winners collect)
open|locked ──cancel──→ cancelled (emergency)
```

## Payout Formula

Winners receive proportional payouts from the total pool:

```
payout_i = (stake_i / total_winning_pool) × total_pool
```

Example: Alice stakes 100 DAG YES, total YES=175, total pool=225 DAG  
→ Alice receives `(100/175) × 225 ≈ 128.57 DAG`
