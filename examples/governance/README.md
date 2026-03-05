# Governance Examples

DAO governance examples using `@ottochain/sdk/apps/governance`.

## Examples

### `dao-proposal-vote.ts`

Two DAO types:
- **Multisig** (default) — M-of-N threshold signing
- **Token-weighted** — voting power proportional to token holdings

```bash
# Multisig DAO (2-of-3)
npx tsx dao-proposal-vote.ts

# Token-weighted DAO
npx tsx dao-proposal-vote.ts --type=token

# With cluster
METAGRAPH_URL=http://localhost:9300 BRIDGE_URL=http://localhost:3030 \
  npx tsx dao-proposal-vote.ts
```

## Key SDK Types

```typescript
import {
  getDAODefinition,           // State machine definition by type
  getGovernanceDefinition,    // Legislative/executive/judicial definitions
  DAOType,                    // Enum: SINGLE | MULTISIG | THRESHOLD | TOKEN
  DAOStatus,                  // Enum: ACTIVE | PAUSED | DISSOLVED
  ProposalStatus,             // Enum: PENDING | ACTIVE | PASSED | REJECTED | EXECUTED
  VoteChoice,                 // Enum: YES | NO | ABSTAIN
  Proposal,                   // Proto type: proposal record
  Vote,                       // Proto type: vote record
  VoteTally,                  // Proto type: tally aggregate
  // Multisig helpers:
  isThresholdMet,
  signaturesNeeded,
  hasSigned,
  // Token DAO helpers:
  getVotingPower,
  hasQuorum,
  isPassing,
  canPropose,
} from '@ottochain/sdk/apps/governance';
```

## DAO Types

| Type | How it works | Use case |
|------|-------------|----------|
| `Single` | One owner decides | Personal vaults, simple automation |
| `Multisig` | M-of-N signers required | Team treasuries, ops decisions |
| `Threshold` | % of members must sign | Large committees |
| `Token` | Voting power ∝ token balance | Protocol governance |

## State Machine Transitions

```
active ──propose──→ active (proposal added)
active ──sign/vote──→ active (threshold not met)
active ──sign/vote──→ active (threshold met → execute)
active ──pause──→   paused
paused ──resume──→  active
active ──dissolve──→ dissolved
```
