# Adding a New App to OttoChain

**Author:** @think (2026-02-19) + corrections 2026-02-20 (applied @research review)  
**Card:** [📚 Documentation: Adding a New App skill guide](https://trello.com/c/6996294c49cc619074a81ce5)  
**Related:** [DFA + JSON Logic Patterns](./design/dfa-json-logic-patterns.md) | [Architecture](../ottochain/docs/reference/architecture.md)

A step-by-step recipe for building a new OttoChain domain from scratch — from proto schema through metagraph (domain-agnostic!), bridge routes, SDK, explorer UI, traffic generation, and deployment.

> **Prior art:** An older guide exists at `ottochain/docs/guides/adding-new-app.md` (PR #86, ~600 lines). This guide is more comprehensive and better located in `ottochain-sdk/docs/`. The older guide should be cross-referenced or deprecated once this one is reviewed. Flag for James.

---

## Table of Contents

1. [Anatomy of an OttoChain App](#1-anatomy-of-an-ottochain-app)
2. [Step 1 — Define the Proto Schema](#2-step-1--define-the-proto-schema)
3. [Step 2 — Metagraph: Domain-Agnostic by Design](#3-step-2--metagraph-domain-agnostic-by-design)
4. [Step 3 — Add Bridge Routes](#4-step-3--add-bridge-routes)
5. [Step 4 — Add SDK Types and Client Methods](#5-step-4--add-sdk-types-and-client-methods)
6. [Step 5 — Build Explorer UI Components](#6-step-5--build-explorer-ui-components)
7. [Step 6 — Write Traffic Generator Scenarios](#7-step-6--write-traffic-generator-scenarios)
8. [Step 7 — Deploy and Test](#8-step-7--deploy-and-test)
9. [Checklist](#9-checklist)

---

## 1. Anatomy of an OttoChain App

An OttoChain "app" is a domain — a coherent set of on-chain behaviors, bridge APIs, and SDK helpers that implement a specific use case (e.g., Identity, Contracts, Market, Token, DAO, or your new domain).

### 1.1 The Four Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  ottochain-explorer (React)                                       │
│  UI components for viewing and interacting with your domain       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼──────────────────────────────────┐
│  ottochain-services (bridge)                                      │
│  REST API routes, GraphQL schema, webhook dispatch               │
└───────────────────────────────┬──────────────────────────────────┘
                                │ DataUpdate (protobuf over HTTP)
┌───────────────────────────────▼──────────────────────────────────┐
│  ottochain (Scala metagraph)                                      │
│  Data validators, FiberEngine, JLVM, CalculatedState             │
│  Constellation L0/L1 consensus                                    │
└──────────────────────────────────────────────────────────────────┘
          ↑ ↓ shared types
┌──────────────────────────────────────────────────────────────────┐
│  ottochain-sdk (TypeScript)                                       │
│  Proto definitions, generated types, client helpers              │
│  Used by: bridge, explorer, traffic generator, external clients  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Repositories and Their Roles

| Repo | Language | Your Domain's Files |
|------|----------|---------------------|
| `ottochain-sdk` | TypeScript/Proto | `proto/ottochain/apps/{domain}/v1/*.proto`, `src/apps/{domain}/` |
| `ottochain` | Scala | `modules/shared-data/src/.../apps/{domain}/` |
| `ottochain-services` | TypeScript | `packages/bridge/src/routes/{domain}/`, `packages/gateway/schema/{domain}.graphql` |
| `ottochain-explorer` | React/TypeScript | `src/components/{domain}/`, `src/pages/{domain}/` |

### 1.3 Existing Domains to Reference

| Domain | Proto package | Scala module | SDK app |
|--------|--------------|--------------|---------|
| Identity | `ottochain.apps.identity.v1` | `apps.identity` | `src/apps/identity/` |
| Contracts | `ottochain.apps.contracts.v1` | `apps.contracts` | `src/apps/contracts/` |
| Market | `ottochain.apps.market.v1` | `apps.market` | `src/apps/markets/` |
| Governance (DAO) | `ottochain.apps.governance.v1` | `apps.governance` | `src/apps/governance/` |
| Corporate | `ottochain.apps.corporate.v1` | `apps.corporate` | `src/apps/corporate/` |

> **Convention:** Use your domain name for directory and package names. Prefer singular for package (`market`, not `markets`), plural where it describes a collection of records (`identity.agents`).

---

## 2. Step 1 — Define the Proto Schema

The proto schema is the contract between all layers. Define it first and generate types for both TypeScript and Scala.

### 2.1 Create the Proto Directory

```bash
mkdir -p proto/ottochain/apps/{domain}/v1/
```

**Example for a `lending` domain:**
```bash
mkdir -p proto/ottochain/apps/lending/v1/
```

### 2.2 Write the Proto File

Create `proto/ottochain/apps/{domain}/v1/{domain}.proto`:

```protobuf
syntax = "proto3";

package ottochain.apps.lending.v1;

import "google/protobuf/struct.proto";
import "ottochain/v1/common.proto";

option java_package = "xyz.kd5ujc.shared_data.apps.lending.v1";
option java_outer_classname = "LendingProto";

// ─── Core domain types ────────────────────────────────────────────────────────

// Loan application and lifecycle
message LoanRecord {
  string loan_id = 1;
  string borrower_address = 2;       // DAG address
  string lender_address = 3;         // DAG address
  int64 principal_amount = 4;        // in micro-DAG
  int64 interest_rate_bps = 5;       // basis points (e.g., 500 = 5%)
  uint64 originated_at_ordinal = 6;  // snapshot ordinal at origination
  uint64 due_at_ordinal = 7;         // snapshot ordinal when payment is due
  LoanStatus status = 8;
  map<string, string> metadata = 9;
}

enum LoanStatus {
  LOAN_STATUS_UNSPECIFIED = 0;
  LOAN_STATUS_PROPOSED = 1;
  LOAN_STATUS_ACTIVE = 2;
  LOAN_STATUS_REPAID = 3;
  LOAN_STATUS_DEFAULTED = 4;
}

// ─── DataUpdate types (sent to metagraph as OttochainMessage payloads) ────────

// Propose a new loan (creates a fiber with LoanRecord as initialData)
message ProposeLoan {
  string loan_id = 1;
  string borrower_address = 2;
  int64 principal_amount = 3;
  int64 interest_rate_bps = 4;
  uint64 due_at_ordinal = 5;
}

// Lender accepts a loan proposal
message AcceptLoan {
  string loan_id = 1;
}

// Borrower repays
message RepayLoan {
  string loan_id = 1;
  int64 amount_paid = 2;
}

// Mark loan as defaulted (validator/guardian action)
message MarkDefault {
  string loan_id = 1;
  string reason = 2;
}
```

**Proto field numbering policy:**
- Fields 1–9: Core required fields
- Fields 10–49: Optional standard fields
- Fields 50–99: Reserved for future use (add `reserved 50 to 99;`)
- Never reuse field numbers once a message is deployed

### 2.3 Generate TypeScript Types

Run ts-proto codegen from the SDK root:

```bash
cd ottochain-sdk
npm run proto:gen
# Or manually:
protoc \
  --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/generated \
  --ts_proto_opt=esModuleInterop=true,outputServices=false \
  -I proto \
  proto/ottochain/apps/lending/v1/lending.proto
```

Generated output: `src/generated/ottochain/apps/lending/v1/lending.ts`

### 2.4 Configure ScalaPB

Add the proto to `build.sbt` in the Scala `ottochain` repo:

```scala
// In modules/shared-data/build.sbt or root build.sbt
Compile / PB.targets := Seq(
  scalapb.gen(flatPackage = false) -> (Compile / sourceManaged).value / "scalapb"
)

// Proto source paths — add your new proto
PB.protoSources in Compile += baseDirectory.value / "proto"
```

Then run `sbt compile` to generate `LoanRecord`, `ProposeLoan`, etc. as Scala case classes.

---

## 3. Step 2 — Metagraph: Domain-Agnostic by Design

> **Key insight:** For most new domains, **you do not need to write any new Scala code**. The OttoChain metagraph is intentionally domain-agnostic. The fiber engine (`FiberValidator` + `FiberEvaluator` + `FiberEngine`) evaluates any `CreateStateMachine` / `TransitionStateMachine` / `ArchiveStateMachine` payload generically using the JSON `StateMachineDefinition` and JLVM guards.

### 3.1 How the Metagraph Validates Your Domain

The validation pipeline (`lifecycle/Validator.scala` → `validate/FiberValidator.scala`) handles your new domain automatically:

**L1 (Data-L1) — structural checks (no Scala changes needed):**
- `fiberId` is a valid UUID not already used
- `definition` JSON is structurally valid (states, transitions, guards parseable)
- `definition` is within size and depth limits
- No reserved operator field names in the definition
- `initialData` is a valid map within size limits
- Parent fiber exists (if `parentFiberId` set)

**L0 (Metagraph-L0) — contextual checks (no Scala changes needed):**
- Fiber exists for `TransitionStateMachine`
- Signer is in `AccessControlPolicy` whitelist (if set)
- Fiber is not archived
- JLVM guard evaluation

Your new domain flows through this generic pipeline **unchanged**. There is no `DataL1.scala` dispatcher to edit, no `LendingValidator.scala` to write.

### 3.2 The Only Required Scala Work: ScalaPB Codegen

The Scala layer auto-generates types from your proto. This is handled by the build system.

**In the `ottochain` repo `build.sbt` (already configured for all protos under `proto/`):**
```scala
// This is already set up — your new proto is picked up automatically
// when placed in proto/ottochain/apps/lending/v1/lending.proto
Compile / PB.targets := Seq(
  scalapb.gen(flatPackage = false) -> (Compile / sourceManaged).value / "scalapb"
)
```

After adding your proto file, run:
```bash
sbt compile   # Generates case classes: LoanRecord, ProposeLoan, AcceptLoan, etc.
sbt test      # Verify no regressions
```

The generated Scala types (`LoanRecord`, `ProposeLoan`, etc.) are available for type-safe use in any Scala code that needs them (e.g., indexer, analytics). The metagraph itself receives these as generic `JsonLogicValue` / protobuf `Value` payloads.

### 3.3 Write the State Machine Definition (JSON)

The state machine definition for your domain is **a JSON file** (or TypeScript object matching `StateMachineDefinition`). This is what gets submitted in the `definition` field of a `CreateStateMachine` DataUpdate.

Create `e2e-test/examples/lending/definition.json` (for testing) and `src/apps/lending/definition.ts` (for SDK use):

```json
{
  "states": {
    "proposed":  { "id": { "value": "proposed" },  "isFinal": false, "metadata": null },
    "active":    { "id": { "value": "active" },    "isFinal": false, "metadata": null },
    "repaid":    { "id": { "value": "repaid" },    "isFinal": true,  "metadata": null },
    "defaulted": { "id": { "value": "defaulted" }, "isFinal": true,  "metadata": null }
  },
  "initialState": { "value": "proposed" },
  "transitions": [
    {
      "from": { "value": "proposed" },
      "to":   { "value": "active" },
      "eventName": "accept",
      "guard": { "===": [{ "var": "proofs.0.address" }, { "var": "state.lenderAddress" }] },
      "effect": { "merge": [{ "var": "state" }, { "acceptedAtSeq": { "var": "sequenceNumber" } }] },
      "dependencies": []
    },
    {
      "from": { "value": "active" },
      "to":   { "value": "repaid" },
      "eventName": "repay",
      "guard": {
        "and": [
          { "===": [{ "var": "proofs.0.address" }, { "var": "state.borrowerAddress" }] },
          { ">=":  [{ "var": "event.amountPaid" }, { "var": "state.principalAmount" }] }
        ]
      },
      "effect": { "merge": [{ "var": "state" }, {
        "repaidAtSeq": { "var": "sequenceNumber" },
        "amountPaid":  { "var": "event.amountPaid" }
      }] },
      "dependencies": []
    },
    {
      "from": { "value": "active" },
      "to":   { "value": "defaulted" },
      "eventName": "mark_default",
      "guard": { "==": [1, 1] },
      "effect": { "merge": [{ "var": "state" }, {
        "defaultedAtSeq": { "var": "sequenceNumber" },
        "defaultReason":  { "var": "event.reason" }
      }] },
      "dependencies": []
    }
  ],
  "metadata": { "name": "LoanLifecycle", "description": "Lending protocol loan lifecycle" }
}
```

> **Note:** The `definition` field in `CreateStateMachine` is typed as `google.protobuf.Value` — a generic JSON value. The fiber engine parses it at runtime. You do NOT need Scala code to describe this definition; JSON is the runtime format.

### 3.4 Optional: Domain-Specific Pre-Fiber Validation

For **most domains**, the generic `FiberValidator` is sufficient. However, if your domain requires pre-fiber business logic (e.g., "a borrower can only have 3 active loans at once"), you can add a small rule to `FiberRules`.

**When this is needed:**
- Uniqueness constraints across fibers (e.g., "loan ID must be globally unique")
- Cross-fiber state checks (e.g., "agent must be registered before creating a contract")
- Custom CID-level validation beyond structural checks

**How to add it** (advanced — only if required):
```scala
// In modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/lifecycle/validate/rules/FiberRules.scala
// Add a new rule to the existing L0Validator:

object L0 {
  // ... existing rules ...

  /** Domain-specific: borrower must not exceed active loan limit */
  def borrowerLoanLimitNotExceeded(
    update: CreateStateMachine,
    calculatedState: CalculatedState
  ): ValidationResult = {
    val activeLoanCount = calculatedState.stateMachines.values.count { fiber =>
      fiber.stateData.asJsonObject.flatMap(_.apply("borrowerAddress")).contains(
        update.initialData.asJsonObject.flatMap(_.apply("borrowerAddress")).getOrElse(Json.Null)
      ) && fiber.currentState.value != "repaid" && fiber.currentState.value != "defaulted"
    }
    if (activeLoanCount >= 3)
      ValidationResult.invalid("BORROW_LIMIT_EXCEEDED", "Borrower already has 3 active loans")
    else ValidationResult.valid
  }
}
```

Then wire it into `FiberValidator.L0Validator.createFiber(...)` alongside the existing rules. Submit a PR to `scasplte2/ottochain` with a clear description.

**For most domains: skip this step entirely.**

---

## 4. Step 3 — Add Bridge Routes

The bridge (`ottochain-services`) exposes REST endpoints and handles WebSocket/webhook dispatch.

### 4.1 Create the Route Module

```
packages/bridge/src/routes/lending/
├── index.ts              # Route registration
├── propose.ts            # POST /api/lending/loans
├── accept.ts             # POST /api/lending/loans/:id/accept
├── repay.ts              # POST /api/lending/loans/:id/repay
└── query.ts              # GET /api/lending/loans, GET /api/lending/loans/:id
```

### 4.2 POST Route Pattern

```typescript
// packages/bridge/src/routes/lending/propose.ts
import { Router } from 'express';
import { MetagraphClient } from '@ottochain/sdk';
import { ProposeLoan } from '@ottochain/sdk/generated/ottochain/apps/lending/v1/lending.js';

export function proposeLoanRoute(router: Router, client: MetagraphClient) {
  router.post('/api/lending/loans', async (req, res) => {
    try {
      const { borrowerAddress, principalAmount, interestRateBps, dueAtOrdinal } = req.body;

      // Validate input
      if (!borrowerAddress || !principalAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const loanId = crypto.randomUUID();

      // Build OttochainMessage → TransitionStateMachine or CreateStateMachine
      const message = {
        createStateMachine: {
          fiberId: loanId,
          definition: /* LendingFibers.loanLifecycle serialized */,
          initialData: { loanId, borrowerAddress, principalAmount, interestRateBps, dueAtOrdinal }
        }
      };

      // Sign and submit to Data L1
      const result = await client.submitDataUpdate(message, req.headers['x-private-key'] as string);

      res.status(201).json({ loanId, ordinal: result.ordinal });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
}
```

### 4.3 Query Route Pattern

```typescript
// packages/bridge/src/routes/lending/query.ts
export function lendingQueryRoutes(router: Router, indexer: IndexerClient) {
  // List all loans
  router.get('/api/lending/loans', async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query;
    const loans = await indexer.queryFibers({
      namespace: 'lending.*',
      status: status as string,
      limit: Number(limit),
      offset: Number(offset)
    });
    res.json({ loans, total: loans.length, hasMore: loans.length === Number(limit) });
  });

  // Get single loan
  router.get('/api/lending/loans/:loanId', async (req, res) => {
    const loan = await indexer.getFiber(req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  });
}
```

### 4.4 Register Routes in the Server

In `packages/bridge/src/server.ts`:
```typescript
import { proposeLoanRoute, lendingQueryRoutes } from './routes/lending/index.js';

// After other routes:
proposeLoanRoute(router, metagraphClient);
lendingQueryRoutes(router, indexer);
```

### 4.5 Add GraphQL Schema (for gateway)

In `packages/gateway/schema/lending.graphql`:
```graphql
type LoanRecord {
  loanId: String!
  borrowerAddress: String!
  lenderAddress: String
  principalAmount: Float!
  interestRateBps: Int!
  status: LoanStatus!
  originatedAtOrdinal: Int
  dueAtOrdinal: Int
}

enum LoanStatus {
  PROPOSED
  ACTIVE
  REPAID
  DEFAULTED
}

extend type Query {
  loan(loanId: ID!): LoanRecord
  loans(status: LoanStatus, limit: Int, offset: Int): [LoanRecord!]!
}

extend type Mutation {
  proposeLoan(borrowerAddress: String!, principalAmount: Float!, interestRateBps: Int!, dueAtOrdinal: Int!): LoanRecord!
  acceptLoan(loanId: ID!): LoanRecord!
  repayLoan(loanId: ID!, amountPaid: Float!): LoanRecord!
}
```

---

## 5. Step 4 — Add SDK Types and Client Methods

The SDK provides TypeScript types and helper functions for your domain.

### 5.1 Create the App Directory

```
src/apps/lending/
├── index.ts              # Public exports
├── types.ts              # TypeScript interfaces (re-exports + extensions)
└── client.ts             # Helper functions for building messages
```

### 5.2 Write `types.ts`

```typescript
// src/apps/lending/types.ts
import type { Address, FiberId, FiberOrdinal } from '../../types.js';

export type LoanStatus = 'PROPOSED' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';

export interface LoanRecord {
  loanId: FiberId;
  borrowerAddress: Address;
  lenderAddress?: Address;
  principalAmount: number;          // micro-DAG
  interestRateBps: number;          // basis points
  originatedAtSeq?: number;
  dueAtOrdinal?: number;
  status: LoanStatus;
  metadata?: Record<string, string>;
}

export interface ProposeLoanParams {
  borrowerAddress: Address;
  principalAmount: number;
  interestRateBps: number;
  dueAtOrdinal?: FiberOrdinal;
}

export interface LendingClientConfig {
  bridgeBaseUrl: string;
  privateKey?: string;              // For signing (optional if using external signer)
}
```

### 5.3 Write `client.ts`

```typescript
// src/apps/lending/client.ts
import type { ProposeLoanParams, LoanRecord, LoanStatus } from './types.js';
import type { FiberId } from '../../types.js';

/**
 * Propose a new loan.
 * @returns The generated loanId and the submission ordinal
 */
export async function proposeLoan(
  params: ProposeLoanParams,
  config: { bridgeBaseUrl: string }
): Promise<{ loanId: FiberId; ordinal: number }> {
  const response = await fetch(`${config.bridgeBaseUrl}/api/lending/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`ProposeLoan failed: ${err.error}`);
  }

  return response.json();
}

/**
 * Accept a loan proposal (lender action).
 */
export async function acceptLoan(
  loanId: FiberId,
  config: { bridgeBaseUrl: string }
): Promise<LoanRecord> {
  const response = await fetch(`${config.bridgeBaseUrl}/api/lending/loans/${loanId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) throw new Error(`AcceptLoan failed`);
  return response.json();
}

/**
 * Get a loan by ID.
 */
export async function getLoan(
  loanId: FiberId,
  config: { bridgeBaseUrl: string }
): Promise<LoanRecord> {
  const response = await fetch(`${config.bridgeBaseUrl}/api/lending/loans/${loanId}`);
  if (response.status === 404) throw new Error(`Loan not found: ${loanId}`);
  return response.json();
}

/**
 * List loans with optional filters.
 */
export async function listLoans(
  filters: { status?: LoanStatus; limit?: number; offset?: number },
  config: { bridgeBaseUrl: string }
): Promise<{ loans: LoanRecord[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const response = await fetch(`${config.bridgeBaseUrl}/api/lending/loans?${params}`);
  return response.json();
}
```

### 5.4 Export from `src/apps/index.ts`

```typescript
// Add to src/apps/index.ts
export * as lending from './lending/index.js';
```

---

## 6. Step 5 — Build Explorer UI Components

### 6.1 Component Structure

```
src/components/lending/
├── LoanCard.tsx          # Single loan summary card
├── LoanDetail.tsx        # Full loan detail view
├── LoanList.tsx          # Paginated list with filters
├── ProposeLoanForm.tsx   # Form for proposing a new loan
└── LoanStatusBadge.tsx   # Status pill/badge component
```

### 6.2 Domain Page

```
src/pages/lending/
├── index.tsx             # /lending — list of loans
└── [loanId].tsx          # /lending/:loanId — loan detail
```

### 6.3 Example Component Pattern

```tsx
// src/components/lending/LoanCard.tsx
import React from 'react';
import type { LoanRecord } from '@ottochain/sdk/apps/lending';
import { LoanStatusBadge } from './LoanStatusBadge';

interface Props {
  loan: LoanRecord;
  onClick?: () => void;
}

export function LoanCard({ loan, onClick }: Props) {
  return (
    <div className="loan-card" onClick={onClick}>
      <div className="loan-header">
        <span className="loan-id">{loan.loanId.slice(0, 8)}...</span>
        <LoanStatusBadge status={loan.status} />
      </div>
      <div className="loan-body">
        <div>Borrower: <code>{loan.borrowerAddress.slice(0, 12)}...</code></div>
        <div>Principal: {(loan.principalAmount / 1e8).toFixed(2)} DAG</div>
        <div>Rate: {loan.interestRateBps / 100}%</div>
      </div>
    </div>
  );
}
```

### 6.4 Connect to Bridge API

Use the SDK client functions from a React hook:

```tsx
// src/hooks/useLending.ts
import { useState, useEffect } from 'react';
import { lending } from '@ottochain/sdk/apps';

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL ?? 'http://localhost:3030';

export function useLoan(loanId: string) {
  const [loan, setLoan] = useState<lending.LoanRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lending.getLoan(loanId, { bridgeBaseUrl: BRIDGE_URL })
      .then(setLoan)
      .finally(() => setLoading(false));
  }, [loanId]);

  return { loan, loading };
}
```

---

## 7. Step 6 — Write Traffic Generator Scenarios

The traffic generator (`ottochain-services/packages/traffic-generator`) drives realistic load for testing and development. It uses the `WorkflowDefinition` type from `workflows.ts`.

### 7.1 Understand the WorkflowDefinition Shape

The real traffic generator uses `WorkflowDefinition` (from `src/workflows.ts`), not a custom `Scenario` type. Your domain adds a new entry to `src/fiber-definitions.ts`.

```typescript
// From packages/traffic-generator/src/fiber-definitions.ts
export interface FiberDefinition {
  type: string;
  name: string;
  workflowType: 'Contract' | 'AgentIdentity' | 'Custom' | 'Market' | ...;
  roles: string[];
  states: string[];
  initialState: string;
  finalStates: string[];
  transitions: TransitionDef[];
  generateStateData: (participants: Map<string, string>, ctx: FiberContext) => unknown;
}

// From packages/traffic-generator/src/workflows.ts
export interface WorkflowDefinition {
  type: WorkflowType;
  name: string;
  states: string[];
  finalStates: string[];
  transitions: WorkflowTransition[];
  expectedDuration: number;
  frequency: number;
  stateMachineDefinition: StateMachineDefinition;  // The JSON SM definition
  initialDataFn: (ctx: CreateContext) => Record<string, unknown>;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  event: string;
  actor: 'owner' | 'counterparty' | 'any' | 'third_party';
  weight: number;
  payloadFn?: (ctx: TransitionContext) => Record<string, unknown>;
}

export interface CreateContext {
  fiberId: string;
  participants: string[];
  ownerAddress: string;
  generation: number;
}

export interface TransitionContext {
  fiberId: string;
  currentState: string;
  participants: string[];
  ownerAddress: string;
  generation: number;
}
```

### 7.2 Add a WorkflowDefinition for Your Domain

```typescript
// packages/traffic-generator/src/workflows.ts (add to WORKFLOW_DEFINITIONS array)
import lendingDefinition from './definitions/lending.json' assert { type: 'json' };

export const LENDING_WORKFLOW: WorkflowDefinition = {
  type: 'Lending',           // Add 'Lending' to WorkflowType union in workflows.ts
  name: 'Lending Protocol',
  states: ['proposed', 'active', 'repaid', 'defaulted'],
  finalStates: ['repaid', 'defaulted'],
  expectedDuration: 3,       // Typical generations to completion
  frequency: 0.15,           // 15% of traffic
  stateMachineDefinition: lendingDefinition as StateMachineDefinition,

  initialDataFn: (ctx: CreateContext) => ({
    loanId:          ctx.fiberId,
    borrowerAddress: ctx.ownerAddress,
    lenderAddress:   ctx.participants[1] ?? ctx.ownerAddress,
    principalAmount: Math.floor(Math.random() * 900) + 100,  // 100–1000
    interestRateBps: 500,     // 5%
    dueAtOrdinal:    0        // No expiry in traffic gen
  }),

  transitions: [
    {
      from: 'proposed', to: 'active', event: 'accept',
      actor: 'counterparty', weight: 3,
      payloadFn: () => ({})   // No payload needed; guard checks proofs.0.address
    },
    {
      from: 'active', to: 'repaid', event: 'repay',
      actor: 'owner', weight: 4,
      payloadFn: (ctx: TransitionContext) => ({
        amountPaid: (ctx as any).stateData?.principalAmount ?? 500
      })
    },
    {
      from: 'active', to: 'defaulted', event: 'mark_default',
      actor: 'third_party', weight: 1,
      payloadFn: () => ({ reason: 'traffic-gen-simulated-default' })
    }
  ]
};
```

### 7.3 Add the Definition JSON

Save your `definition.json` (from §3.3) to:
```
packages/traffic-generator/src/definitions/lending.json
```

The simulator loads this and submits it as the `definition` field in `CreateStateMachine`.

### 7.4 Register the Workflow

```typescript
// packages/traffic-generator/src/workflows.ts
export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  // ... existing workflows
  LENDING_WORKFLOW,
];
```

---

## 8. Step 7 — Deploy and Test

### 8.1 Local Development Flow

```bash
# 1. Generate proto types
cd ottochain-sdk && npm run proto:gen

# 2. Start local metagraph (includes Tessellation + your app)
cd ottochain && sbt "data_l1/run"

# 3. Start services (bridge + indexer + gateway)
cd ottochain-services && docker-compose up

# 4. Run traffic generator to seed data
cd ottochain-services && npm run traffic-gen -- --scenario lending-full-lifecycle --count 10

# 5. Start explorer
cd ottochain-explorer && npm run dev
```

### 8.2 Test Layers

**Unit tests (TypeScript SDK):**
```bash
cd ottochain-sdk && npm test -- --grep lending
```

**Integration tests (metagraph):**
```bash
cd ottochain && sbt "shared-data/testOnly *LendingValidatorSpec*"
```

**E2E tests (full stack):**
```bash
cd ottochain && npm run e2e -- --scenario lending-full-lifecycle
```

### 8.3 E2E Test Pattern

The `ottochain` repo's E2E runner (in `e2e-test/`) uses `sendSignedUpdate` + `waitForOrdinalConfirmation` to submit updates and verify state. The indexer-based approach uses `IndexerClient.waitForState()`.

**Option A — E2E runner style** (matches existing examples in `e2e-test/examples/`):

```
e2e-test/examples/lending/
├── definition.json           # Copy of your SM definition
├── sm-initial-data.ts        # Initial data generator (called with context)
├── event-accept.ts           # Accept event payload
├── event-repay.ts            # Repay event payload
└── example.json              # Test flow definition
```

```typescript
// e2e-test/examples/lending/sm-initial-data.ts
import crypto from 'crypto';

export default (context: Record<string, unknown>) => ({
  loanId:          crypto.randomUUID(),
  borrowerAddress: (context.wallets as any)?.alice?.address ?? '',
  lenderAddress:   (context.wallets as any)?.bob?.address ?? '',
  principalAmount: 500,
  interestRateBps: 500
});
```

```typescript
// e2e-test/examples/lending/event-accept.ts
export default () => ({});  // No payload; guard checks proofs.0.address
```

```typescript
// e2e-test/examples/lending/event-repay.ts
export default (context: Record<string, unknown>) => ({
  amountPaid: (context.state as any)?.principalAmount ?? 500
});
```

```json
// e2e-test/examples/lending/example.json
{
  "name": "Lending: full lifecycle",
  "flows": [
    {
      "name": "propose → accept → repay",
      "steps": [
        {
          "type": "createStateMachine",
          "definitionFile": "definition.json",
          "initialDataFile": "sm-initial-data",
          "wallet": "alice"
        },
        {
          "type": "transitionStateMachine",
          "eventName": "accept",
          "payloadFile": "event-accept",
          "wallet": "bob",
          "expectedState": "active"
        },
        {
          "type": "transitionStateMachine",
          "eventName": "repay",
          "payloadFile": "event-repay",
          "wallet": "alice",
          "expectedState": "repaid"
        }
      ]
    }
  ]
}
```

Run with:
```bash
cd ottochain/e2e-test && npx tsx runner.ts --target local --wallets alice,bob
```

**Option B — Indexer polling** (for integration tests using `IndexerClient`):

```typescript
// packages/traffic-generator/src/__tests__/lending.test.ts
import { IndexerClient } from '../indexer-client.js';
import { BridgeClient } from '../bridge-client.js';

const indexer = new IndexerClient({ indexerUrl: 'http://localhost:3031' });
const bridge = new BridgeClient({ bridgeUrl: 'http://localhost:3030' });

it('lending full lifecycle', async () => {
  // Submit CreateStateMachine
  const loanId = crypto.randomUUID();
  await bridge.createStateMachine(loanId, definition, initialData, aliceWallet);

  // Wait for indexer to see it
  const { found } = await indexer.waitForFiber(loanId, { timeoutMs: 30000 });
  expect(found).toBe(true);

  // Submit accept event
  await bridge.transitionStateMachine(loanId, 'accept', {}, bobWallet);

  // Wait for active state
  const { found: active } = await indexer.waitForState(loanId, 'active', { timeoutMs: 30000 });
  expect(active).toBe(true);

  // Submit repay event
  await bridge.transitionStateMachine(loanId, 'repay', { amountPaid: 500 }, aliceWallet);

  // Wait for repaid state
  const { found: repaid } = await indexer.waitForState(loanId, 'repaid', { timeoutMs: 30000 });
  expect(repaid).toBe(true);
}, 120_000);
```

**`IndexerClient` polling API** (from `packages/traffic-generator/src/indexer-client.ts`):

| Method | Signature | Returns |
|--------|-----------|---------|
| `waitForFiber` | `(fiberId, { timeoutMs?, pollIntervalMs? })` | `{ found: boolean; fiber: IndexedFiber \| null }` |
| `waitForState` | `(fiberId, expectedState, { timeoutMs?, pollIntervalMs? })` | `{ found: boolean; fiber, actualState }` |
| `waitForOrdinal` | `(targetOrdinal, { timeoutMs?, pollIntervalMs? })` | `{ reached: boolean; currentOrdinal }` |
| `getFiber` | `(fiberId)` | `IndexedFiber \| null` |
| `getRejections` | `(params: RejectionQueryParams)` | `RejectedTransaction[]` |

### 8.4 Deployment Checklist

Before merging to `develop`:

**Proto & Types:**
- [ ] Proto file committed to `ottochain-sdk/proto/`
- [ ] Generated types committed to `src/generated/`
- [ ] `npm run build` passes in `ottochain-sdk`

**Metagraph (Scala):**
- [ ] `definition.json` is valid — checked by `FiberValidator.L1.validStateMachineDefinition` test
- [ ] `sbt test` passes (no regressions — generic FiberValidator handles your domain)
- [ ] JAR build succeeds: `sbt assembly`
- [ ] If custom `FiberRules` were added: unit test the new rule

**Bridge (Services):**
- [ ] All routes return correct status codes
- [ ] Error cases return typed error objects
- [ ] `npm test` passes

**E2E:**
- [ ] Full lifecycle test passes against local stack
- [ ] Rejection test passes
- [ ] Traffic generator scenario runs without errors

**Documentation:**
- [ ] Update `COMPATIBILITY.md` with new versions
- [ ] Add domain to `QUICK-REF.md` endpoints table
- [ ] PR description links to Trello card

---

## 9. Checklist

Quick reference for the complete "add a new app" workflow:

```
□ Proto
  □ Create proto/ottochain/apps/{domain}/v1/{domain}.proto
  □ Add java_package and java_outer_classname options
  □ Run proto:gen → verify src/generated/... created
  □ Verify ScalaPB compiles: sbt compile

□ Metagraph (Scala)
  □ Write StateMachineDefinition as JSON (definition.json or TypeScript object)
  □ Verify definition passes structural validation: sbt test (FiberValidator tests)
  □ Run sbt compile — ScalaPB generates types from your new proto automatically
  □ Optional: Add domain-specific FiberRules.L0 rule only if cross-fiber checks needed
  □ No per-domain validator module required — FiberEngine handles it generically

□ Bridge (Services)
  □ POST routes for all mutations
  □ GET routes for queries (list + get-by-id)
  □ GraphQL schema (if using gateway)
  □ Error handling: 400 for validation, 404 for not found, 500 for internal
  □ Register in server.ts

□ SDK (TypeScript)
  □ src/apps/{domain}/types.ts — TypeScript interfaces
  □ src/apps/{domain}/client.ts — helper functions
  □ Export from src/apps/index.ts
  □ Unit tests for helpers

□ Explorer (React)
  □ Components: List, Card, Detail, Form, StatusBadge
  □ Pages: /domain (list) + /domain/:id (detail)
  □ Hook connecting to SDK client functions
  □ Add to navigation

□ Traffic Generator
  □ Single-action scenarios (happy path each mutation)
  □ Full lifecycle scenario (end-to-end)
  □ Register in scenarios/index.ts

□ E2E Tests
  □ Full lifecycle test
  □ Rejection test (wrong signer)
  □ Edge cases (duplicate IDs, missing fields)

□ Deploy
  □ Update COMPATIBILITY.md
  □ sbt assembly → new JAR
  □ Update ottochain-deploy versions.yaml
  □ Rolling restart cluster
```

---

## References

- [DFA + JSON Logic Patterns](./design/dfa-json-logic-patterns.md) — State machine design guide
- [Producer-Validator Framework](./design/producer-validator-framework.md) — Asset model governance
- [OttoChain Architecture](../ottochain/docs/reference/architecture.md) — System overview
- [State Machine Design Guide](../ottochain/docs/guides/state-machine-design.md) — Guards & effects
- [JLVM Semantics](../ottochain/docs/reference/jlvm-semantics.md) — JSON Logic reference
- [E2E Examples](../ottochain/e2e-test/examples/) — Working state machine examples
- [Release Runbook](../ottochain-deploy/RELEASE-RUNBOOK.md) — Deployment procedures

---

*Guide by @think. Submit corrections or additions via PR to `ottochain-sdk`.*
