# Adding a New App to OttoChain

**The definitive reference for building a new OttoChain domain from scratch.**

This guide walks you through every layer of the stack — from proto schema to
explorer UI — using the **Contracts** domain as a concrete worked example. By
the end you'll have a fully wired domain that other developers can contribute to
and users can interact with.

---

## Table of Contents

1. [Anatomy of an OttoChain App](#1-anatomy-of-an-ottochain-app)
2. [Step 1 — Define the Proto Schema](#2-step-1--define-the-proto-schema)
3. [Step 2 — Define the State Machine (JSON Logic)](#3-step-2--define-the-state-machine-json-logic)
4. [Step 3 — Add Bridge Routes](#4-step-3--add-bridge-routes)
5. [Step 4 — Add SDK Types and Client Methods](#5-step-4--add-sdk-types-and-client-methods)
6. [Step 5 — Build Explorer UI Components](#6-step-5--build-explorer-ui-components)
7. [Step 6 — Write Traffic Generator Scenarios](#7-step-6--write-traffic-generator-scenarios)
8. [Step 7 — Deploy and Test](#8-step-7--deploy-and-test)
9. [Checklist](#9-checklist)

---

## 1. Anatomy of an OttoChain App

An OttoChain domain (app) is a vertical slice across **four repositories**:

```
┌──────────────────────────────────────────────────────────────────┐
│  ottochain (Scala/metagraph)                                      │
│  └─ shared-data/                                                  │
│     └─ The metagraph is generic — it runs any well-formed         │
│        state machine. No Scala changes required for new apps.     │
│                                                                   │
│  ottochain-services (TypeScript)                                  │
│  └─ packages/bridge/src/routes/<app>.ts  ← new HTTP endpoints     │
│  └─ packages/traffic-generator/          ← new workflow defs      │
│                                                                   │
│  ottochain-sdk (TypeScript)                                       │
│  └─ src/apps/<app>/                      ← types + SM definitions │
│     ├─ index.ts                                                   │
│     └─ state-machines/<app>.json                                  │
│                                                                   │
│  ottochain-explorer (TypeScript/React)                            │
│  └─ src/components/<App>View.tsx         ← new UI tab             │
└──────────────────────────────────────────────────────────────────┘
```

### How data flows at runtime

```
SDK client (browser / Node)
    │  signs OttochainMessage with private key
    ▼
Bridge (Express API)
    │  POST /contract/propose  →  builds + submits Signed[DataUpdate]
    ▼
DL1 (metagraph Data L1)
    │  validates signature, applies FiberEngine
    ▼
ML0 snapshot  →  Indexer (PostgreSQL)  →  Explorer (GraphQL queries)
```

The metagraph itself is **app-agnostic** — it stores fibers (state machines)
keyed by `fiberId`. The bridge, SDK, and explorer are where domain logic lives.

---

## 2. Step 1 — Define the Proto Schema

> **Repo:** `ottochain-sdk` → `src/generated/` (generated) and `ottochain` → `modules/proto/`  
> **Status:** Optional for new apps. The core `OttochainMessage` proto (create / transition / archive) already covers all state-machine operations. A domain-specific proto is only needed when you want strongly typed request/response shapes beyond the generic `google.protobuf.Value` initial data.

### When you need a new proto

- Your domain has a large number of strongly typed fields (e.g. Markets with `MarketType`, `Commitment`, `Resolution`)
- You want SDK consumers to get compile-time type safety on state shapes
- The indexer needs to filter by domain-specific enum values

### Worked example (Contracts)

The existing `ottochain/modules/proto/src/main/protobuf/ottochain/apps/contracts/v1/contract.proto` defines:

```protobuf
syntax = "proto3";
package ottochain.apps.contracts.v1;

enum ContractState {
  CONTRACT_STATE_UNSPECIFIED = 0;
  CONTRACT_STATE_PROPOSED    = 1;
  CONTRACT_STATE_ACTIVE      = 2;
  CONTRACT_STATE_COMPLETED   = 3;
  CONTRACT_STATE_REJECTED    = 4;
  CONTRACT_STATE_DISPUTED    = 5;
  CONTRACT_STATE_CANCELLED   = 6;
}

message Contract {
  string   id             = 1;
  string   proposer       = 2;
  string   counterparty   = 3;
  ContractState status    = 4;
  // ...
}
```

### Adding a new proto

1. Create `modules/proto/src/main/protobuf/ottochain/apps/<app>/v1/<app>.proto`
2. Run `sbt proto/compile` in `ottochain` to regenerate Scala case classes
3. Copy the generated TypeScript bindings into `ottochain-sdk/src/generated/ottochain/apps/<app>/v1/`  
   (or use the SDK's code-gen script: `npm run generate-protos`)
4. Re-export the generated types from `src/apps/<app>/index.ts` (see Step 4)

### Skipping the proto (fast path)

For quick prototyping, skip the proto entirely. Store domain state as
`google.protobuf.Value` (plain JSON) in the fiber's `initialData`. The bridge
can accept a plain `z.record(z.any())` for the initial data fields and the
state machine definition handles all validation via JSON Logic guards.

You can always add a typed proto later without breaking existing fibers.

---

## 3. Step 2 — Define the State Machine (JSON Logic)

> **Repo:** `ottochain-sdk` → `src/apps/<app>/state-machines/`

This is the heart of your domain. The state machine JSON is stored on-chain
inside every fiber (inside `CreateStateMachine.definition`) and evaluated by the
FiberEngine on every transition.

### Schema

```json
{
  "metadata": {
    "name": "MyApp",
    "description": "Human-readable description",
    "version": "1.0.0",
    "crossReferences": {
      "someOtherId": "Links to another fiber type"
    }
  },
  "states": {
    "STATE_NAME": {
      "id": "STATE_NAME",
      "isFinal": false,
      "metadata": null
    }
  },
  "initialState": "INITIAL_STATE",
  "transitions": [
    {
      "from": "STATE_A",
      "to": "STATE_B",
      "eventName": "event_name",
      "guard": { "===" : [{ "var": "event.agent" }, { "var": "state.owner" }] },
      "effect": { "merge": [{ "var": "state" }, { "val": { "updatedAt": { "now": [] } } }] },
      "dependencies": []
    }
  ]
}
```

### Key concepts

| Field | Purpose |
|-------|---------|
| `states` | Declare all valid states. `isFinal: true` means the fiber cannot transition further. |
| `initialState` | State the fiber starts in when `CreateStateMachine` is processed. |
| `transitions[].guard` | JSON Logic expression evaluated against `{ state, event }`. Must return truthy for transition to proceed. |
| `transitions[].effect` | JSON Logic expression that computes the **new state** after the transition. Return the full next-state object. |
| `transitions[].dependencies` | List of other `fiberId` fields in `state` that must resolve to active fibers before this transition is allowed. |

### Worked example (Contracts)

The contract SM at `src/apps/contracts/state-machines/contract.json` has six
states (`PROPOSED → ACTIVE → COMPLETED / REJECTED / DISPUTED / CANCELLED`).

Key guard pattern — only the counterparty can accept:
```json
{
  "from": "PROPOSED",
  "to": "ACTIVE",
  "eventName": "accept",
  "guard": { "===": [{ "var": "event.agent" }, { "var": "state.counterparty" }] },
  "effect": { "merge": [{ "var": "state" }, { "val": { "status": "ACTIVE", "acceptedAt": { "now": [] } } }] }
}
```

### Tips

- Keep guards **stateless** — they can only read `state` and `event`, not external data.
- Use `crossReferences` metadata to document foreign-key relationships (other fibers). The FiberEngine uses the `dependencies` list to enforce referential integrity.
- Design for **idempotency**: the metagraph may replay transitions during snapshot recovery. Avoid side-effectful effects (e.g. incrementing counters — use set semantics instead).
- Add a `schema` field to `initialData` (e.g. `"schema": "Contract"`) — the indexer uses this to route fibers to the right GraphQL type.

### Register the definition in `index.ts`

```typescript
import myAppDef from './state-machines/my-app.json';

export function getMyAppDefinition(): unknown {
  return myAppDef;
}
```

---

## 4. Step 3 — Add Bridge Routes

> **Repo:** `ottochain-services` → `packages/bridge/src/routes/<app>.ts`

The bridge is a thin Express HTTP API. Its job is to:
1. Accept a human-friendly REST request
2. Look up sequence numbers + key material
3. Build a properly formed `OttochainMessage`
4. Submit it to DL1 via `submitTransaction()`

### File structure

```
packages/bridge/src/
├── routes/
│   ├── contract.ts    ← one file per domain
│   ├── market.ts
│   └── <app>.ts       ← your new file
└── index.ts           ← register your router here
```

### Boilerplate — new domain route file

```typescript
// packages/bridge/src/routes/<app>.ts
import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  submitTransaction,
  getStateMachine,
  keyPairFromPrivateKey,
  getFiberSequenceNumber,
  type StateMachineDefinition,
} from '../metagraph.js';
import { getMyAppDefinition } from '@ottochain/sdk/apps/my-app';

const MY_APP_DEFINITION = getMyAppDefinition() as StateMachineDefinition;

export const myAppRoutes: RouterType = Router();

// ── Input validation ──────────────────────────────────────────────────────────

const CreateRequestSchema = z.object({
  privateKey: z.string().length(64),  // hex private key
  // domain-specific fields:
  title: z.string().min(1),
  counterpartyAddress: z.string(),
});

const ActionRequestSchema = z.object({
  privateKey: z.string().length(64),
  itemId: z.string().uuid(),         // the fiberId
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /my-app/create
 * Spawn a new fiber for this domain.
 */
myAppRoutes.post('/create', async (req, res) => {
  try {
    const input = CreateRequestSchema.parse(req.body);
    const keyPair = keyPairFromPrivateKey(input.privateKey);
    const itemId = randomUUID();

    const message = {
      CreateStateMachine: {
        fiberId: itemId,
        definition: MY_APP_DEFINITION,
        initialData: {
          schema: 'MyApp',                    // ← indexer routing key
          title: input.title,
          owner: keyPair.address,
          counterparty: input.counterpartyAddress,
          status: 'INITIAL',
          createdAt: new Date().toISOString(),
        },
      },
    };

    await submitTransaction(message, keyPair);
    res.json({ itemId, status: 'INITIAL' });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors : String(err);
    res.status(400).json({ error: msg });
  }
});

/**
 * POST /my-app/action
 * Trigger a state transition.
 */
myAppRoutes.post('/action', async (req, res) => {
  try {
    const input = ActionRequestSchema.parse(req.body);
    const keyPair = keyPairFromPrivateKey(input.privateKey);
    const seq = await getFiberSequenceNumber(input.itemId);

    const message = {
      TransitionStateMachine: {
        fiberId: input.itemId,
        eventName: 'some_event',
        payload: { agent: keyPair.address },
        targetSequenceNumber: seq,
      },
    };

    await submitTransaction(message, keyPair);
    res.json({ itemId: input.itemId, event: 'some_event', seq });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /my-app/:itemId
 * Read current fiber state from the indexer.
 */
myAppRoutes.get('/:itemId', async (req, res) => {
  try {
    const sm = await getStateMachine(req.params.itemId);
    if (!sm) return res.status(404).json({ error: 'Not found' });
    res.json(sm);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
```

### Register the router in `index.ts`

```typescript
// packages/bridge/src/index.ts
import { myAppRoutes } from './routes/my-app.js';
// ...
app.use('/my-app', myAppRoutes);
```

### Key helpers from `metagraph.ts`

| Helper | Purpose |
|--------|---------|
| `submitTransaction(message, keyPair)` | Signs and POSTs to DL1. Handles the optimistic sequence cache. |
| `getFiberSequenceNumber(fiberId)` | Returns the next expected sequence (DL1 + local cache). Always call this immediately before building a `TransitionStateMachine` message. |
| `getStateMachine(fiberId)` | Reads current fiber state from the indexer. |
| `keyPairFromPrivateKey(hex)` | Derives `{ address, privateKey, publicKey }` from a 64-char hex key. |
| `waitForFiber(fiberId, timeoutMs)` | Polls until a fiber appears in the indexer (useful after create). |

### Error handling conventions

- Return `400` for invalid input (Zod validation failures, bad UUIDs)
- Return `404` for unknown fibers  
- Return `500` for metagraph / network errors
- Always include an `error` field in error responses

---

## 5. Step 4 — Add SDK Types and Client Methods

> **Repo:** `ottochain-sdk` → `src/apps/<app>/`

The SDK is what external clients (browser apps, other services, tests) use to
interact with your domain. Keep it thin — state machine definitions + type
exports + a few ergonomic helpers.

### Directory layout

```
src/apps/<app>/
├── index.ts                  # public API
└── state-machines/
    └── <app>.json            # SM definition (see Step 2)
```

### Minimal `index.ts`

```typescript
/**
 * My App
 *
 * Types and utilities for MyApp on OttoChain.
 *
 * @example
 * ```typescript
 * import { MyAppState, getMyAppDefinition } from '@ottochain/sdk/apps/my-app';
 *
 * const def = getMyAppDefinition();
 * ```
 */

// Re-export generated protobuf types (if you added a proto in Step 1)
export {
  MyAppState,
  MyApp,
  myAppStateFromJSON,
  myAppStateToJSON,
} from '../../generated/ottochain/apps/my-app/v1/my-app.js';

// SM definition
import myAppDef from './state-machines/my-app.json';

export function getMyAppDefinition(): unknown {
  return myAppDef;
}

// Ergonomic helpers (optional but useful)
export const MY_APP_STATES = ['INITIAL', 'ACTIVE', 'DONE', 'CANCELLED'] as const;
export type MyAppStateString = (typeof MY_APP_STATES)[number];
```

### Re-export from the root apps index

```typescript
// src/apps/index.ts
export * from './my-app/index.js';
```

### What belongs in the SDK vs the bridge?

| Concern | SDK | Bridge |
|---------|-----|--------|
| State machine JSON | ✅ | imports from SDK |
| TypeScript types | ✅ | imports from SDK |
| HTTP request schemas (Zod) | ❌ | ✅ |
| Key derivation / signing | In `metakit/` | imports from SDK |
| Business logic / guards | In SM JSON | ❌ |
| Side effects (DB, email) | ❌ | ✅ |

---

## 6. Step 5 — Build Explorer UI Components

> **Repo:** `ottochain-explorer` → `src/components/<App>View.tsx`

The explorer is a React + Apollo (GraphQL) app. Adding a new domain means:

1. Creating a `<App>View.tsx` component
2. Adding a nav tab
3. Adding a GraphQL query

### Component template

```tsx
// src/components/MyAppView.tsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { MY_APP_LIST, MY_APP_DETAILS } from '../lib/queries';

interface MyAppViewProps {
  onAgentClick: (address: string) => void;
}

export function MyAppView({ onAgentClick }: MyAppViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const { data, loading } = useQuery(MY_APP_LIST, {
    variables: { limit: 50, state: stateFilter },
    pollInterval: 5000,
  });

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      ACTIVE:    'bg-[var(--accent)] text-white',
      DONE:      'bg-[var(--green)] text-white',
      CANCELLED: 'bg-[var(--red)] text-white',
    };
    return colors[state] ?? 'bg-[var(--text-muted)] text-white';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* List panel */}
      <div className="lg:col-span-1 card">
        <h2 className="text-xl font-semibold mb-4">🗂️ My App</h2>
        {/* State filter buttons */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['INITIAL', 'ACTIVE', 'DONE'].map(s => (
            <button
              key={s}
              className={`btn-secondary text-xs ${stateFilter === s ? 'ring-2 ring-[var(--accent)]' : ''}`}
              onClick={() => setStateFilter(prev => prev === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
        {loading && <p className="text-[var(--text-muted)]">Loading…</p>}
        <ul className="space-y-2 overflow-y-auto max-h-[60vh]">
          {data?.myApps?.map((item: any) => (
            <li
              key={item.id}
              className={`p-3 rounded cursor-pointer border ${selectedId === item.id ? 'border-[var(--accent)]' : 'border-transparent'} hover:border-[var(--accent)]`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm truncate">{item.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStateColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <div
                className="text-xs text-[var(--text-muted)] mt-1 cursor-pointer hover:underline"
                onClick={e => { e.stopPropagation(); onAgentClick(item.owner); }}
              >
                {item.owner.slice(0, 8)}…
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-2 card">
        {!selectedId ? (
          <p className="text-[var(--text-muted)]">Select an item to see details.</p>
        ) : (
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data?.myApps?.find((i: any) => i.id === selectedId), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
```

### Add a GraphQL query

```typescript
// src/lib/queries.ts (add alongside existing queries)
export const MY_APP_LIST = gql`
  query MyAppList($limit: Int, $state: String) {
    myApps(limit: $limit, state: $state) {
      id title status owner createdAt
    }
  }
`;

export const MY_APP_DETAILS = gql`
  query MyAppDetails($id: String!) {
    myApp(id: $id) {
      id title status owner counterparty
      transitions { event fromState toState ts }
    }
  }
`;
```

> **Note:** GraphQL queries resolve against the **indexer** (Apollo Server in
> `packages/indexer`). The indexer reads from PostgreSQL tables that are
> populated by replaying metagraph snapshots. If the indexer doesn't yet have a
> resolver for your domain, you'll need to add one (see indexer README).

### Register the new view in `App.tsx`

```tsx
// src/App.tsx
import { MyAppView } from './components/MyAppView';

// 1. Add to the view union type
type View = 'dashboard' | 'contracts' | 'my-app' | /* ... */;

// 2. Add nav item (in <Nav> or inline)
<NavItem view="my-app" label="🗂️ My App" />

// 3. Add render branch
{view === 'my-app' && <MyAppView onAgentClick={handleAgentClick} />}
```

### UI conventions

| Pattern | Convention |
|---------|-----------|
| State badges | `bg-[var(--green)]` done · `bg-[var(--accent)]` active · `bg-[var(--red)]` failed |
| Loading state | `<p className="text-[var(--text-muted)]">Loading…</p>` |
| Polling interval | `pollInterval: 5000` (5s) for live views |
| Address display | Truncate to `addr.slice(0, 8) + '…'`, clickable via `onAgentClick` |
| Card container | `className="card"` (defined in `index.css`) |

---

## 7. Step 6 — Write Traffic Generator Scenarios

> **Repo:** `ottochain-services` → `packages/traffic-generator/src/workflows.ts`

The traffic generator produces realistic on-chain activity for load testing and
demo environments. Adding a workflow definition lets your domain participate in
the automated activity stream.

### WorkflowDefinition structure

```typescript
// packages/traffic-generator/src/workflows.ts
import type { WorkflowDefinition } from './types.js';

export const MY_APP_WORKFLOW: WorkflowDefinition = {
  type: 'MyApp',                      // must match WorkflowType union
  name: 'MyApp',
  description: 'Brief description of the lifecycle',
  minParticipants: 2,                 // minimum wallets required
  maxParticipants: 2,
  states: ['INITIAL', 'ACTIVE', 'DONE', 'CANCELLED'],
  finalStates: ['DONE', 'CANCELLED'],
  transitions: [
    { from: 'INITIAL',    to: 'ACTIVE',    event: 'activate',  actor: 'counterparty', weight: 0.8 },
    { from: 'ACTIVE',     to: 'DONE',      event: 'complete',  actor: 'owner',        weight: 0.7 },
    { from: 'ACTIVE',     to: 'CANCELLED', event: 'cancel',    actor: 'owner',        weight: 0.1 },
    { from: 'INITIAL',    to: 'CANCELLED', event: 'reject',    actor: 'counterparty', weight: 0.2 },
  ],
  expectedDuration: 30,               // generations until expected completion
  frequency: 0.15,                    // relative weight vs other workflows
  stateMachineDefinition: getMyAppDefinition() as StateMachineDefinition,
  initialDataFn: (ctx) => ({
    schema: 'MyApp',
    owner: ctx.ownerAddress,
    counterparty: ctx.participants[1],
    title: `Test MyApp ${ctx.fiberId.slice(0, 6)}`,
    status: 'INITIAL',
    createdAt: new Date().toISOString(),
  }),
};
```

### Register the workflow

```typescript
// At the bottom of workflows.ts, add to the exported registry:
export const WORKFLOWS: WorkflowDefinition[] = [
  AGENT_IDENTITY_WORKFLOW,
  CONTRACT_WORKFLOW,
  MY_APP_WORKFLOW,           // ← add here
  // ...
];
```

### Actor semantics

| Actor | Who triggers the transition |
|-------|-----------------------------|
| `owner` | The wallet that created the fiber |
| `counterparty` | `ctx.participants[1]` |
| `any` | Random participant |
| `third_party` | A random wallet not in the fiber |

### Tips

- Set `frequency` relative to other workflows. `1.0` = same frequency as
  contracts. Use `< 0.5` for expensive or rare workflows.
- `expectedDuration` controls how long the simulator keeps a fiber active before
  abandoning it. Set it generously; fibers stuck in non-final states are cleaned up.
- The `weight` on each transition is a probability *weight*, not a probability.
  They're normalized per source state at runtime.

---

## 8. Step 7 — Deploy and Test

### Local testing (without cluster)

Unit-test your state machine JSON directly using the SDK test harness:

```typescript
// ottochain-sdk/src/apps/my-app/__tests__/my-app.test.ts
import { describe, it, expect } from 'vitest';
import { getMyAppDefinition } from '../index.js';
import { evaluateTransition } from '../../testing/sm-harness.js'; // if available

describe('MyApp state machine', () => {
  const def = getMyAppDefinition();

  it('owner cannot self-accept', () => {
    const state = { owner: 'ADDR_A', counterparty: 'ADDR_B', status: 'INITIAL' };
    const event = { agent: 'ADDR_A', name: 'activate' };
    const result = evaluateTransition(def, state, event);
    expect(result.allowed).toBe(false);
  });

  it('counterparty can activate', () => {
    const state = { owner: 'ADDR_A', counterparty: 'ADDR_B', status: 'INITIAL' };
    const event = { agent: 'ADDR_B', name: 'activate' };
    const result = evaluateTransition(def, state, event);
    expect(result.allowed).toBe(true);
    expect(result.newState.status).toBe('ACTIVE');
  });
});
```

Run tests:
```bash
cd ottochain-sdk && npm test
```

### Integration testing (with cluster)

The integration test suite in `ottochain-services/packages/bridge/src/__tests__/`
spins up a live bridge against a running metagraph and exercises real DL1
submissions. Add your domain's happy-path test there:

```typescript
// packages/bridge/src/__tests__/my-app.test.ts
it('full lifecycle: create → activate → complete', async () => {
  const { itemId } = await client.post('/my-app/create', {
    privateKey: OWNER_KEY,
    title: 'Integration test',
    counterpartyAddress: COUNTERPARTY_ADDR,
  });
  expect(itemId).toBeDefined();

  await waitForFiberState(itemId, 'INITIAL');

  await client.post('/my-app/action', { privateKey: COUNTERPARTY_KEY, itemId });
  await waitForFiberState(itemId, 'ACTIVE');

  await client.post('/my-app/complete', { privateKey: OWNER_KEY, itemId });
  await waitForFiberState(itemId, 'DONE');
});
```

### Pre-PR checklist

Before opening a PR, verify:

- [ ] State machine JSON is valid (all transitions reference declared states, no orphan states)
- [ ] Bridge routes have Zod input validation on every handler
- [ ] SDK `index.ts` exports all public types
- [ ] Explorer component handles `loading` and empty states
- [ ] Traffic generator workflow registered in `WORKFLOWS`
- [ ] At least one unit test for a guard that should reject (negative case)
- [ ] At least one unit test for a guard that should allow (positive case)
- [ ] `schema` field set in `initialData` for indexer routing

---

## 9. Checklist

| Step | File(s) to create/modify | Required? |
|------|--------------------------|-----------|
| Proto schema | `ottochain/modules/proto/…/<app>.proto` | Optional |
| State machine JSON | `ottochain-sdk/src/apps/<app>/state-machines/<app>.json` | **Required** |
| SDK index | `ottochain-sdk/src/apps/<app>/index.ts` | **Required** |
| SDK apps re-export | `ottochain-sdk/src/apps/index.ts` | **Required** |
| Bridge routes | `ottochain-services/packages/bridge/src/routes/<app>.ts` | **Required** |
| Bridge registration | `ottochain-services/packages/bridge/src/index.ts` | **Required** |
| Explorer component | `ottochain-explorer/src/components/<App>View.tsx` | **Required** |
| Explorer queries | `ottochain-explorer/src/lib/queries.ts` | **Required** |
| Explorer nav | `ottochain-explorer/src/App.tsx` | **Required** |
| Traffic generator | `ottochain-services/packages/traffic-generator/src/workflows.ts` | Recommended |
| Unit tests | `ottochain-sdk/src/apps/<app>/__tests__/` | **Required** |
| Integration tests | `ottochain-services/packages/bridge/src/__tests__/` | Recommended |

---

## Reference: Existing Domains

| Domain | SM states | Bridge prefix | SDK path | Explorer tab |
|--------|-----------|---------------|----------|-------------|
| Identity | REGISTERED → ACTIVE → CHALLENGED → SUSPENDED → WITHDRAWN | `/agent` | `apps/identity` | `#identity` |
| Contracts | PROPOSED → ACTIVE → COMPLETED / REJECTED / DISPUTED / CANCELLED | `/contract` | `apps/contracts` | `#contracts` |
| Markets | PROPOSED → OPEN → CLOSED → RESOLVING → SETTLED / REFUNDED / CANCELLED | `/market` | `apps/markets` | `#markets` |
| Governance (DAO) | DRAFT → ACTIVE → PASSED / FAILED / CANCELLED | `/governance` | `apps/governance` | `#governance` |
| Oracles | REGISTERED → ACTIVE → STAKED → SLASHED / RETIRED | `/oracle` | `apps/oracles` | `#oracles` |

When in doubt, copy the **Contracts** domain as your starting template — it is
the cleanest, most fully documented example in the codebase.
