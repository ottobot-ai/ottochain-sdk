# ts-proto Cleanup & Export Spec

**Card:** 📦 ts-proto: Configure TypeScript type generation for SDK (699621e1)  
**Status:** Specification Writing → Test Definition  
**Author:** @think (2026-02-22)  
**Feasibility:** Confirmed HIGH by @research (2026-02-22)  

---

## Summary

`ts-proto` is already configured and generating `src/generated/`. This card covers four bounded tasks that clean up generator artifacts, expose generated types correctly, and document the intentional dual-type architecture before it creates confusion.

**Phase 1 (this card):** Cleanup + export path + documentation  
**Phase 2 (after PR #89 merges):** Migrate `src/apps/*/state-machines/*.json` files from Scala Circe format to proto wire-format

---

## Background: Intentional Dual-Type Architecture

The SDK has two intentionally separate type systems:

| Layer | Location | Purpose | Format |
|-------|----------|---------|--------|
| **Proto-binary** | `src/generated/` | Cross-language serialization, Scala interop | Proto conventions (`FIBER_STATUS_ACTIVE`, wrapped `StateId`) |
| **Wire-format JSON** | `src/ottochain/types.ts` | Metagraph REST API payloads | Plain strings (`'Active'`, plain `initialState: string`) |

**Why both?** Until PR #89 (Migrate fiber-engine to generated Scala types) merges, the Scala side uses Circe-derived JSON encoding where `StateId` is a case class that serializes as `{ "value": "ACTIVE" }`. The wire-format TypeScript types match the metagraph's actual JSON output (post-migration: plain string). Both type sets are correct for their respective consumers and should coexist.

**Do not attempt to merge these two type systems.** The duality resolves naturally when PR #89 merges.

---

## Phase 1: Implementation Specification

### Task 1: Remove Orphaned `_pb` Dist Artifacts

**What:** 51 `_pb`-suffixed files in `dist/` (e.g., `dist/cjs/generated/ottochain/apps/contracts/v1/contract_pb.js`) are artifacts from a previously removed second code generator (`@bufbuild/protoc-gen-es`). Zero consumers exist in `src/` or `tests/`.

**How:** Delete all `*_pb.js` and `*_pb.d.ts` files from `dist/`. These should not be re-added by future `npm run build` since `@bufbuild/protoc-gen-es` is no longer in `buf.gen.yaml`.

**Pattern to delete:**
```
dist/**/generated/**/*_pb.js
dist/**/generated/**/*_pb.d.ts
dist/generated/**/*_pb.js
dist/generated/**/*_pb.d.ts
```

**Verification:** After deletion, `git status` should show only the deletions. No `*_pb.*` should appear after running `npm run build`.

---

### Task 2: Remove Orphaned devDependencies

**Remove these 4 packages from `package.json` devDependencies:**

| Package | Why Orphaned |
|---------|-------------|
| `@bufbuild/protoc-gen-es` | Was the second generator; removed from `buf.gen.yaml` |
| `@protobuf-ts/plugin` | Unused generator plugin |
| `@protobuf-ts/runtime` | Runtime for unused plugin |
| `grpc-tools` | gRPC code generator; not used |

**Keep:** `@bufbuild/protobuf` — **this is a RUNTIME dependency** (not just dev). The ts-proto generated files import `BinaryReader` and `BinaryWriter` from `@bufbuild/protobuf/wire`. Removing it would break generated code at runtime.

**Command to remove:**
```bash
npm uninstall @bufbuild/protoc-gen-es @protobuf-ts/plugin @protobuf-ts/runtime grpc-tools
```

**Verification:** `npm ci` completes without errors. `npm run generate` completes without errors. `npm run build` completes without errors.

---

### Task 3: Add `./generated` Export Path to package.json

**Current exports map** (relevant excerpt):
```json
{
  "exports": {
    ".": { "import": "...", "require": "...", "types": "..." },
    "./metakit": { ... },
    "./core": { ... },
    "./apps/identity": { ... }
  }
}
```

**Add this entry:**
```json
"./generated": {
  "import": "./dist/esm/generated/index.js",
  "require": "./dist/cjs/generated/index.js",
  "types": "./dist/types/generated/index.d.ts"
}
```

**After this change, consumers can use:**
```typescript
import { FiberStatus, StateMachineDefinition } from '@ottochain/sdk/generated';
import { CreateStateMachine, TransitionStateMachine } from '@ottochain/sdk/generated';
```

**⚠️ Important naming warning for consumers:** The generated `FiberStatus` enum uses proto-convention strings (`FIBER_STATUS_ACTIVE`), while the wire-format `FiberStatus` from `'@ottochain/sdk'` (or `'@ottochain/sdk/core'`) uses plain strings (`'Active'`). These are distinct — use the right one for the right context.

---

### Task 4: Documentation — Dual-Type Pattern

Add or update a `CONTRIBUTING.md` section (or a new `docs/type-architecture.md`) covering:

#### 4a. Which type to use when

```
┌─────────────────────────────────────────────────────────┐
│ Consumer Action               │ Import from              │
│───────────────────────────────│──────────────────────────│
│ Build a metagraph API request │ @ottochain/sdk (or /core)│
│ Parse a metagraph API response│ @ottochain/sdk (or /core)│
│ Proto binary serialization    │ @ottochain/sdk/generated │
│ Cross-language schema sharing │ @ottochain/sdk/generated │
└─────────────────────────────────────────────────────────┘
```

#### 4b. Migration note for state machine JSON templates

**⚠️ Time-bomb warning:** Files in `src/apps/*/state-machines/*.json` (e.g., `agent-identity.json`, `oracle.json`, `contract.json`) currently use the **Scala Circe pre-migration format** with wrapped field objects:

```json
// CURRENT (pre-migration format — matches current Scala Circe output):
{
  "initialState": { "value": "REGISTERED" },
  "states": {
    "REGISTERED": { "id": { "value": "REGISTERED" }, "isFinal": false }
  }
}
```

After PR #89 merges and the Scala side migrates to proto-generated types, the wire format will change to plain strings:

```json
// FUTURE (post-PR #89 — plain string proto wire format):
{
  "initialState": "REGISTERED",
  "states": {
    "REGISTERED": { "id": "REGISTERED", "isFinal": false }
  }
}
```

**Phase 2 of this card** is to update all `src/apps/*/state-machines/*.json` files to the plain-string format AFTER PR #89 merges and the cluster confirms the new format. Do NOT do this as part of Phase 1.

Add a `// TODO: post-PR#89 migration` comment in `src/apps/index.ts` or `src/ottochain/types.ts` to track this.

---

### Task 5: CI check — `buf generate` idempotency

Add a CI step (or expand the existing test suite) to verify `npm run generate` is idempotent:

```yaml
# In .github/workflows/ci.yml — add after npm ci:
- name: Verify generated types are up-to-date
  run: |
    npm run generate
    git diff --exit-code src/generated/
```

This prevents the repo from having stale generated types when proto files change.

---

## API Contracts

### New Export Path Contract

```typescript
// @ottochain/sdk/generated — proto binary encoding types

// Core fiber types
export { FiberStatus } from './ottochain/v1/fiber.js';
// FiberStatus = 'FIBER_STATUS_ACTIVE' | 'FIBER_STATUS_ARCHIVED' | ...

export { StateMachineDefinition, Transition, State } from './ottochain/v1/fiber.js';
// Note: initialState may be typed differently from wire-format types

export { CreateStateMachine, TransitionStateMachine, ArchiveStateMachine } from './ottochain/v1/messages.js';

// App types
export { AgentIdentity, AgentIdentityDefinition } from './ottochain/apps/identity/v1/agent.js';
// ... (see src/generated/index.ts for complete list)
```

### Wire-Format Types (unchanged)

```typescript
// @ottochain/sdk or @ottochain/sdk/core — JSON wire-format types

export type FiberStatus = 'Active' | 'Archived' | 'Failed'; // NOT 'FIBER_STATUS_ACTIVE'
export interface StateMachineDefinition { initialState: string; ... } // NOT nested StateId
// ... (see src/ottochain/types.ts)
```

---

## Error Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Consumer imports `FiberStatus` from both `@ottochain/sdk` and `@ottochain/sdk/generated` | TypeScript sees two different types — this is correct; they're semantically different |
| `npm run generate` run after adding new `.proto` file | New types appear in `src/generated/`; CI diff check catches missing regeneration |
| `@bufbuild/protobuf` accidentally removed from dependencies | Build fails: ts-proto generated files cannot find `BinaryReader`/`BinaryWriter` |
| `_pb` file imported by external consumer | Will break after cleanup — acceptable (zero known consumers per @research audit) |
| Phase 2 migration done before PR #89 merges | Metagraph rejects submissions (format mismatch) — do NOT do Phase 2 early |

---

## Test Cases (TDD — write BEFORE implementation)

### Group 1: Dependency Cleanup (3 tests)

```
1. package.json does NOT contain @bufbuild/protoc-gen-es in devDependencies
2. package.json does NOT contain @protobuf-ts/plugin in devDependencies
3. package.json DOES contain @bufbuild/protobuf in dependencies (not devDependencies)
```

### Group 2: Dist Artifact Cleanup (2 tests)

```
4. No *_pb.js files exist anywhere under dist/
5. npm run build does not produce any *_pb.js or *_pb.d.ts files
```

### Group 3: Generated Export Path (4 tests)

```
6. package.json exports map contains "./generated" key
7. import { FiberStatus } from '@ottochain/sdk/generated' resolves without error
8. import { CreateStateMachine } from '@ottochain/sdk/generated' resolves without error
9. import { AgentIdentity } from '@ottochain/sdk/generated' resolves without error
```

### Group 4: FiberStatus Type Distinction (3 tests)

```
10. FiberStatus from '@ottochain/sdk/generated' includes 'FIBER_STATUS_ACTIVE' as a value
11. FiberStatus from '@ottochain/sdk' (wire-format) includes 'Active' as a value
12. Wire-format FiberStatus does NOT include 'FIBER_STATUS_ACTIVE'
```

### Group 5: CI Idempotency (2 tests)

```
13. npm run generate produces no git diff (generated files are up-to-date)
14. buf lint reports zero errors on proto/
```

### Group 6: Documentation Presence (2 tests)

```
15. CONTRIBUTING.md or docs/type-architecture.md contains the dual-type explanation
16. src/apps/ or src/ottochain/types.ts contains a TODO comment referencing post-PR#89 migration
```

---

## Implementation Order

1. **Branch:** create `feat/ts-proto-cleanup` from `develop`
2. **Task 1:** Delete `_pb` artifacts from `dist/` — `git rm dist/**/*_pb.{js,d.ts}`
3. **Task 2:** Remove 4 devDeps — `npm uninstall @bufbuild/protoc-gen-es @protobuf-ts/plugin @protobuf-ts/runtime grpc-tools`
4. **Task 3:** Add `./generated` to `exports` in package.json
5. **Task 4:** Add dual-type documentation (CONTRIBUTING.md section or new file)
6. **Task 5:** Add `buf generate` CI check to `.github/workflows/ci.yml`
7. **Tests:** Write and commit failing tests (Groups 1-6, 16 total) BEFORE fixing
8. **Verify:** `npm ci && npm run generate && npm run build && npm test` all pass
9. **PR:** Target `develop`, reviewer `@scasplte2`

---

## Out of Scope (Phase 2 — post-PR #89)

- Migrating `src/apps/*/state-machines/*.json` from Circe wrapped format to plain-string proto format
- Updating `src/ottochain/types.ts` to alias generated types  
- Removing the dual-type pattern (keep both until migration verified on live cluster)
