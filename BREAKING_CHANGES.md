# Breaking Changes

This document describes breaking changes across major and notable minor releases of `@ottochain/sdk`.

---

## v2.1.0 — Identity & Oracle Proto Unification

**PR #132 — refactor: unify v2 protos**

### Identity Proto Restructure

The `agent.proto` file was replaced with `identity.proto`, unifying Agent and Oracle identity types
under a single `IdentityType` enum.

**What changed:**
- Generated types move from `src/generated/ottochain/apps/identity/v1/agent.ts` → `identity.ts`
- `IdentityType` enum now has values: `AGENT`, `ORACLE`, `SERVICE`
- Oracle types previously in `oracles/v1/oracle.ts` are now in `identity/v1/identity.ts`
- The `oracles/` app module has been removed entirely (see v2.0.0 below)

**Migration:**

```typescript
// Before (v2.0.x)
import type { AgentState } from '@ottochain/sdk';
import { OracleState } from '@ottochain/sdk/apps/oracles';

// After (v2.1.0+)
import type { AgentState, OracleState } from '@ottochain/sdk';
// All identity types are now in the main export
```

---

## v2.0.0 — Fiber Apps Overhaul

**PR #130 — refactor!: overhaul fiber apps - universal + specialized pattern**

### State Machine Renames

All app state machines have been renamed and reorganized to follow a `<app>-<variant>` naming pattern.

#### Identity App

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| `agent-identity` | `identity-agent` |
| _(new)_ | `identity-universal` |
| _(moved from oracles/)_ | `identity-oracle` |

**Oracles app removed.** Oracle state machines moved into the Identity app.

#### Contracts App

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| `contract` | `contract-agreement` |
| `escrow` | `contract-escrow` |
| _(new)_ | `contract-universal` |

#### Markets App

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| `market-universal` (full) | `market-universal` (minimal base) |
| _(new)_ | `market-prediction` |
| _(new)_ | `market-auction` |
| _(new)_ | `market-crowdfund` |
| _(new)_ | `market-group-buy` |

#### Governance App

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| `dao-threshold` | `dao-reputation` |
| _(new)_ | `governance-universal` |
| `governance-constitution` | archived (see `docs/archive/governance/`) |
| `governance-legislature` | archived |
| `governance-executive` | archived |
| `governance-judiciary` | archived |

### App Accessor API

Apps are now accessed via namespaced imports with typed helper functions.

**Migration:**

```typescript
// Before (v1.x) — importing JSON directly
import contractDef from '@ottochain/sdk/apps/contracts/state-machines/contract.json';
import identityDef from '@ottochain/sdk/apps/identity/state-machines/agent-identity.json';

// After (v2.0.0+) — use typed helpers
import { contracts, identity, markets, governance, corporate } from '@ottochain/sdk/apps';

const contractDef = contracts.getContractDefinition('agreement');
const identityDef = identity.getIdentityDefinition('agent');
const marketDef = markets.getMarketDefinition('prediction');
const daoDef = governance.getGovernanceDefinition('daoMultisig');
```

---

## v1.1.1 — StateId Unwrapped to Plain Strings

**PR #79/81 — refactor: unwrap StateId value objects to plain strings**

`StateId` was previously a value object `{ value: string }` and is now a plain `string`.

**Migration:**

```typescript
// Before (v1.0.x)
const stateId: StateId = { value: "Idle" };
const raw: string = stateId.value;

// After (v1.1.1+)
const stateId: StateId = "Idle";
const raw: string = stateId;
```

---

## v1.0.0 — ts-proto Migration (protobuf-es → ts-proto)

**PR #16 — refactor: use ts-proto as single source of truth**

### Overview

The SDK switched from `protobuf-es` to `ts-proto` for protobuf code generation. This affects all
generated types for governance, identity, contracts, markets, and oracles domains.

### Field Type Changes

| Field | Before (protobuf-es) | After (ts-proto) | Notes |
|-------|---------------------|-----------------|-------|
| `signers` | `string[]` | `Address[]` | `Address = { value: string }` |
| `addresses` | `string[]` | `Address[]` | Same — use `.value` to access string |
| `createdAt` | `bigint` (timestamp millis) | `Date \| undefined` | Use `.getTime()` for millis |
| `updatedAt` | `bigint` (timestamp millis) | `Date \| undefined` | Use `.getTime()` for millis |
| `executedAt` | `bigint` (timestamp millis) | `Date \| undefined` | Use `.getTime()` for millis |
| `proposalTTLMs` | `proposalTTLMs` (camelCase with caps) | `proposalTtlMs` (lowercase) | Rename field reference |

### Migration Examples

#### Accessing signer/address strings

```typescript
// Before (protobuf-es)
const signer: string = proposal.signers[0];
const addr: string = dao.addresses[0];

// After (ts-proto)
const signer: string = proposal.signers[0].value;
const addr: string = dao.addresses[0].value;
```

#### Working with timestamps

```typescript
// Before (protobuf-es)
const createdMs: bigint = agent.createdAt;  // already milliseconds
const createdNum: number = Number(agent.createdAt);

// After (ts-proto)
const createdDate: Date | undefined = agent.createdAt;
const createdMs: number = agent.createdAt?.getTime() ?? 0;
const createdNum: number = agent.createdAt?.getTime() ?? 0;
```

#### Using proposalTtlMs

```typescript
// Before (protobuf-es)
const ttl = proposal.proposalTTLMs;

// After (ts-proto)
const ttl = proposal.proposalTtlMs;
```

### Removed: Hand-Written Types

All `src/apps/*/types.ts` files were deleted. Proto-generated types are now the single source of
truth. Update any imports that previously referenced these files:

```typescript
// Before
import type { AgentState } from '@ottochain/sdk/apps/identity/types';

// After
import type { AgentState } from '@ottochain/sdk';  // or from generated path
```

---

## Notes

- **JSON state machine files** for all apps are archived to `docs/archive/` (governance) or
  `src/apps/*/state-machines/json-archive/` directories. They are no longer exported.
  Use the typed `getXxxDefinition()` helpers instead.
- **`@bufbuild/protobuf`** is no longer a runtime dependency. Remove it from consumer projects
  if it was only used transitively through this SDK.
