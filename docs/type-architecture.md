# Type Architecture: Wire-Format vs Proto-Binary

**Card:** 📦 ts-proto: Configure TypeScript type generation for SDK (699621e1)  
**Updated:** 2026-02-22

---

## Overview: Dual-Type Pattern

The OttoChain SDK intentionally ships **two separate type systems** that coexist:

| Layer | Location | Purpose | Format |
|-------|----------|---------|--------|
| **Wire-format JSON** | `src/ottochain/types.ts` | Metagraph REST API payloads | Plain strings (`'Active'`, plain `initialState: string`) |
| **Proto-binary** | `src/generated/` | Cross-language serialization, Scala interop | Proto conventions (`FIBER_STATUS_ACTIVE`, wrapped `StateId { value }`) |

**Do not attempt to merge these two type systems.** The duality resolves naturally when PR #89 (Migrate fiber-engine to generated Scala types) merges.

---

## Why Two Type Systems?

Until PR #89 merges, the Scala side uses Circe-derived JSON encoding where `StateId` is a case class that serializes as `{ "value": "ACTIVE" }`. The wire-format TypeScript types match the metagraph's actual JSON output (post-migration: plain string). Both type sets are correct for their respective consumers.

### Which type to use when

```
┌──────────────────────────────────────────────────────────┐
│ Consumer Action                │ Import from              │
│────────────────────────────────│──────────────────────────│
│ Build a metagraph API request  │ @ottochain/sdk (or /core)│
│ Parse a metagraph API response │ @ottochain/sdk (or /core)│
│ Binary proto serialization     │ @ottochain/sdk/generated │
│ Cross-language Scala interop   │ @ottochain/sdk/generated │
│ Check fiber status from API    │ FiberStatus from /core   │
│ Check fiber status from proto  │ FiberStatus from /gen    │
└──────────────────────────────────────────────────────────┘
```

### FiberStatus example

```typescript
// Wire-format (REST API): plain string enum
import { FiberStatus } from '@ottochain/sdk/core';
// Values: 'Active', 'Archived' — match metagraph JSON responses

// Proto-binary (Scala interop): proto convention
import { FiberStatus } from '@ottochain/sdk/generated';
// Values: 'FIBER_STATUS_ACTIVE', 'FIBER_STATUS_ARCHIVED', 'FIBER_STATUS_UNSPECIFIED'
```

### StateMachineDefinition example

```typescript
// Wire-format (REST API):
const smDef: StateMachineDefinition = {
  initialState: 'ACTIVE',   // plain string
  ...
};

// Proto-binary (generated types):
const smDef: StateMachineDefinition = {
  initialState: { value: 'ACTIVE' },  // wrapped StateId
  ...
};
```

---

## Export Paths

```typescript
// Wire-format types (for metagraph REST API)
import { FiberStatus, StateMachineDefinition, CreateStateMachine } from '@ottochain/sdk';
import { FiberStatus } from '@ottochain/sdk/core';

// Proto-binary types (for binary serialization / Scala interop)
import { FiberStatus, StateMachineDefinition } from '@ottochain/sdk/generated';
import { CreateStateMachine, OttochainMessage } from '@ottochain/sdk/generated';
```

---

## Phase 2: Post-PR #89 Migration (out of scope for Phase 1)

<!-- TODO PR #89 migration: after PR #89 (Migrate fiber-engine to generated Scala types) merges
     and the cluster confirms the new JSON format, migrate:
     - src/apps/*/state-machines/*.json files from Scala Circe format
       ({ "value": "ACTIVE" } wrapped initialState) to plain string format ('ACTIVE')
     - Update hand-written src/ottochain/types.ts StateMachineDefinition.initialState
       from plain string to match proto wire-format
     - Consider whether the dual-type pattern can then be collapsed to a single type system
     Track: https://github.com/scasplte2/ottochain/pull/89
-->

After PR #89 merges:

1. **`src/apps/*/state-machines/*.json`** — migrate from Scala Circe format (`{ "value": "ACTIVE" }` wrapped `initialState`) to proto wire-format (`"ACTIVE"` plain string).
2. **`src/ottochain/types.ts`** — update `StateMachineDefinition.initialState` to match the new format.
3. Consider whether the dual-type pattern can be simplified to a single type system after the cluster confirms compatibility.

**Do not make Phase 2 changes during Phase 1.** The JSON templates must match the cluster's current Circe encoding until PR #89 merges and is deployed.

---

## Removed Dependencies

As of 2026-02-22 Phase 1 cleanup, these packages were removed:

| Package | Reason Removed |
|---------|----------------|
| `@bufbuild/protoc-gen-es` | Was a second code generator; removed from `buf.gen.yaml` in a prior cleanup. Left orphaned `_pb.js` dist artifacts. |
| `@protobuf-ts/plugin` | Unused generator plugin |
| `@protobuf-ts/runtime` | Runtime for unused plugin |
| `grpc-tools` | gRPC code generator; not used in this project |

**Kept:** `@bufbuild/protobuf` in `dependencies` (NOT devDependencies) — required at **runtime** because ts-proto generated files import `BinaryReader` and `BinaryWriter` from `@bufbuild/protobuf/wire`.
