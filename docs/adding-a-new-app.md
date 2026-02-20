# Adding a New App to OttoChain

**Author:** @think  
**Date:** 2026-02-19  
**Card:** [📚 Documentation: Adding a New App skill guide](https://trello.com/c/6996294c49cc619074a81ce5)  
**Related:** [DFA + JSON Logic Patterns](./design/dfa-json-logic-patterns.md) | [Architecture](../ottochain/docs/reference/architecture.md)

A step-by-step recipe for building a new OttoChain domain from scratch — from proto schema through metagraph validators, bridge routes, SDK, explorer UI, traffic generation, and deployment.

---

## Table of Contents

1. [Anatomy of an OttoChain App](#1-anatomy-of-an-ottochain-app)
2. [Step 1 — Define the Proto Schema](#2-step-1--define-the-proto-schema)
3. [Step 2 — Implement Metagraph Validators (Scala)](#3-step-2--implement-metagraph-validators-scala)
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

## 3. Step 2 — Implement Metagraph Validators (Scala)

The metagraph validators define what's allowed. They gate every DataUpdate.

### 3.1 Create the App Module

```
modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/apps/lending/
├── LendingValidator.scala      # DataUpdate validation logic
├── LendingStateManager.scala   # CalculatedState updates
├── LendingFibers.scala         # StateMachineDefinition factory
└── LendingApp.scala            # Wires everything together
```

### 3.2 Write the State Machine Definition

The fiber-based approach: create a `StateMachineDefinition` for each loan lifecycle.

```scala
// LendingFibers.scala
package xyz.kd5ujc.shared_data.apps.lending

import io.constellationnetwork.metagraph_sdk.json_logic._
import xyz.kd5ujc.schema.fiber.ReservedKeys

object LendingFibers {

  /**
   * Loan lifecycle state machine.
   *
   * States: proposed → active → repaid (terminal)
   *                  → defaulted (terminal)
   *
   * Guards use:
   *   - proofs.0.address — signer identity
   *   - state.borrowerAddress, state.lenderAddress — from initialData
   *   - state.principalAmount — loan amount
   *   - event.amountPaid — repayment amount
   */
  def loanLifecycle: Map[String, Any] = Map(
    "states" -> Map(
      "proposed"  -> Map("id" -> Map("value" -> "proposed"),  "isFinal" -> false, "metadata" -> null),
      "active"    -> Map("id" -> Map("value" -> "active"),    "isFinal" -> false, "metadata" -> null),
      "repaid"    -> Map("id" -> Map("value" -> "repaid"),    "isFinal" -> true,  "metadata" -> null),
      "defaulted" -> Map("id" -> Map("value" -> "defaulted"), "isFinal" -> true,  "metadata" -> null)
    ),
    "initialState" -> Map("value" -> "proposed"),
    "transitions" -> List(
      // Lender accepts → active
      Map(
        "from"        -> Map("value" -> "proposed"),
        "to"          -> Map("value" -> "active"),
        "eventName"   -> "accept",
        "guard"       -> Map("===" -> List(Map("var" -> "proofs.0.address"), Map("var" -> "state.lenderAddress"))),
        "effect"      -> Map("merge" -> List(Map("var" -> "state"), Map("acceptedAtSeq" -> Map("var" -> "sequenceNumber")))),
        "dependencies" -> List()
      ),
      // Borrower repays in full → repaid
      Map(
        "from"        -> Map("value" -> "active"),
        "to"          -> Map("value" -> "repaid"),
        "eventName"   -> "repay",
        "guard"       -> Map("and" -> List(
          Map("===" -> List(Map("var" -> "proofs.0.address"), Map("var" -> "state.borrowerAddress"))),
          Map(">=" -> List(Map("var" -> "event.amountPaid"), Map("var" -> "state.principalAmount")))
        )),
        "effect"      -> Map("merge" -> List(Map("var" -> "state"), Map(
          "repaidAtSeq" -> Map("var" -> "sequenceNumber"),
          "amountPaid"  -> Map("var" -> "event.amountPaid")
        ))),
        "dependencies" -> List()
      ),
      // Guardian marks default → defaulted
      Map(
        "from"        -> Map("value" -> "active"),
        "to"          -> Map("value" -> "defaulted"),
        "eventName"   -> "mark_default",
        "guard"       -> Map("==" -> List(1, 1)),  // governed externally
        "effect"      -> Map("merge" -> List(Map("var" -> "state"), Map(
          "defaultedAtSeq" -> Map("var" -> "sequenceNumber"),
          "defaultReason"  -> Map("var" -> "event.reason")
        ))),
        "dependencies" -> List()
      )
    ),
    "metadata" -> Map("name" -> "LoanLifecycle", "description" -> "Lending protocol loan lifecycle")
  )
}
```

### 3.3 Write the Validator

```scala
// LendingValidator.scala
package xyz.kd5ujc.shared_data.apps.lending

import cats.data.EitherT
import cats.effect.Async
import xyz.kd5ujc.shared_data.DataUpdateRejection

trait LendingValidator[F[_]] {
  def validateProposeLoan(update: ProposeLoan, signer: Address): F[Either[DataUpdateRejection, ProposeLoan]]
  def validateAcceptLoan(update: AcceptLoan, signer: Address, state: CalculatedState): F[Either[DataUpdateRejection, AcceptLoan]]
  // ...
}

object LendingValidator {
  def make[F[_]: Async](calculatedState: CalculatedState): LendingValidator[F] =
    new LendingValidator[F] {
      def validateProposeLoan(update: ProposeLoan, signer: Address) = {
        // 1. Borrower must be the signer
        // 2. principalAmount > 0
        // 3. dueAtOrdinal > current ordinal
        // 4. loan_id must be unique in calculatedState.lendingLoans
        ???
      }
      // ...
    }
}
```

**Validation rules checklist:**
- [ ] All required fields present and valid (addresses are valid DAG format)
- [ ] Signer identity matches expected role (`proofs[0].address`)
- [ ] No duplicate IDs in calculatedState
- [ ] Numeric ranges valid (amounts > 0, ordinals in future for deadlines)
- [ ] State transitions are consistent with current fiber state

### 3.4 Register in the App Dispatcher

In `modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/DataL1.scala` (or equivalent dispatcher), add your validator to the match:

```scala
case ProposeLoan(loanId, borrower, principal, rate, dueAt) =>
  lendingValidator.validateProposeLoan(update, signer).flatMap {
    case Left(rejection) => rejection.pure[F]
    case Right(validated) =>
      // Create a fiber for this loan
      fiberEngine.createStateMachine(
        fiberId   = UUID.fromString(loanId),
        definition = LendingFibers.loanLifecycle,
        initialData = Map(
          "loanId"          -> loanId,
          "borrowerAddress" -> borrower.show,
          "lenderAddress"   -> "", // set when accepted
          "principalAmount" -> principal,
          "interestRateBps" -> rate
        )
      )
  }
```

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

The traffic generator (`ottochain-services/packages/traffic-gen`) drives realistic load for testing and development.

### 7.1 Create Scenario Directory

```
packages/traffic-gen/src/scenarios/lending/
├── index.ts              # Scenario registration
├── propose-loan.ts       # Single propose loan scenario
├── full-lifecycle.ts     # Propose → Accept → Repay full cycle
└── default-scenario.ts   # Propose → Accept → (timeout) → Default
```

### 7.2 Write a Scenario

```typescript
// packages/traffic-gen/src/scenarios/lending/full-lifecycle.ts
import type { Scenario, ScenarioContext } from '../../types.js';
import { lending } from '@ottochain/sdk/apps';

export const lendingFullLifecycle: Scenario = {
  name: 'lending-full-lifecycle',
  description: 'Borrower proposes, lender accepts, borrower repays',
  weight: 1,

  async run(ctx: ScenarioContext) {
    // Generate random actors for this scenario
    const borrower = ctx.randomWallet();
    const lender = ctx.randomWallet();

    // Step 1: Propose
    const { loanId } = await lending.proposeLoan({
      borrowerAddress: borrower.address,
      principalAmount: Math.floor(Math.random() * 1000) + 100,
      interestRateBps: 500,         // 5%
      dueAtOrdinal: undefined       // no expiry for test
    }, { bridgeBaseUrl: ctx.bridgeUrl });

    ctx.log('info', `Loan proposed: ${loanId}`);
    await ctx.waitForFiberState(loanId, 'proposed');

    // Step 2: Accept (lender action)
    await lending.acceptLoan(loanId, { bridgeBaseUrl: ctx.bridgeUrl });
    await ctx.waitForFiberState(loanId, 'active');

    // Step 3: Repay
    const loan = await lending.getLoan(loanId, { bridgeBaseUrl: ctx.bridgeUrl });
    await ctx.submitEvent(loanId, 'repay', {
      amountPaid: loan.principalAmount
    }, borrower.privateKey);

    await ctx.waitForFiberState(loanId, 'repaid');
    ctx.log('info', `Loan repaid: ${loanId}`);
  }
};
```

### 7.3 Register the Scenario

```typescript
// packages/traffic-gen/src/scenarios/index.ts
import { lendingFullLifecycle } from './lending/full-lifecycle.js';
// ... other scenarios

export const scenarios = [
  // ... existing
  lendingFullLifecycle,
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

```typescript
// e2e-test/lending/full-lifecycle.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { TestEnvironment } from '../helpers/test-env.js';
import { lending } from '@ottochain/sdk/apps';

describe('Lending: full lifecycle', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await TestEnvironment.start();
  });

  it('borrower proposes → lender accepts → borrower repays', async () => {
    const borrower = env.wallet('borrower');
    const lender = env.wallet('lender');

    // Propose
    const { loanId } = await lending.proposeLoan({
      borrowerAddress: borrower.address,
      principalAmount: 500,
      interestRateBps: 500
    }, env.config);

    await env.waitForState(loanId, 'proposed');
    expect(loanId).toBeTruthy();

    // Accept (as lender)
    await lending.acceptLoan(loanId, env.config);
    await env.waitForState(loanId, 'active');

    const loan = await lending.getLoan(loanId, env.config);
    expect(loan.status).toBe('ACTIVE');

    // Repay
    await env.submitEventAs(loanId, 'repay', { amountPaid: 500 }, borrower);
    await env.waitForState(loanId, 'repaid');

    const repaid = await lending.getLoan(loanId, env.config);
    expect(repaid.status).toBe('REPAID');
  });

  it('accept from wrong address is rejected', async () => {
    const attacker = env.wallet('attacker');

    const { loanId } = await lending.proposeLoan({ ... }, env.config);
    await env.waitForState(loanId, 'proposed');

    // Wrong signer — should be rejected by JLVM guard
    await expect(
      env.submitEventAs(loanId, 'accept', {}, attacker)
    ).rejects.toThrow('rejected');
  });
});
```

### 8.4 Deployment Checklist

Before merging to `develop`:

**Proto & Types:**
- [ ] Proto file committed to `ottochain-sdk/proto/`
- [ ] Generated types committed to `src/generated/`
- [ ] `npm run build` passes in `ottochain-sdk`

**Metagraph (Scala):**
- [ ] Validator rejects all invalid inputs (unit tests pass)
- [ ] State machine transitions tested
- [ ] `sbt test` passes (no regressions)
- [ ] JAR build succeeds: `sbt assembly`

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
  □ Create apps/{domain}/ module in shared-data
  □ Write StateMachineDefinition (states, transitions, guards, effects)
  □ Write DataUpdate validators (field validation + business rules)
  □ Register in DataUpdate dispatcher
  □ Unit tests: validator rejects invalid; accepts valid
  □ State machine tests: transitions work correctly

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
