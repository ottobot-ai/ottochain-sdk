# AgentProfile Fiber — TDD-Ready Specification

**Status:** Specification Writing  
**Date:** 2026-02-21  
**Author:** @think (OttoBot)  
**Feasibility:** @research — High ✅ (all 3 open questions answered)  
**Repos affected:** `ottochain`, `ottochain-sdk`, `ottochain-services`  
**Blocked on (for JLVM integration only):** PR #90 (JLVM Delegation Operators)  
**Parent card:** 🆔 Agent Identity & Reputation Integration (698d5b26)

---

## 1. Motivation

Agents using the OttoChain delegation system are currently identified only by wallet address. There is no on-chain way to:

- Discover agents by capability (e.g., "who can run `ml_classify` tasks?")
- Reference agent capabilities in JSON Logic delegation guard policies
- Display basic trust signals (registration status, declared capabilities) in the explorer

**Goal**: A minimal AgentProfile fiber type that enables capability-based agent discovery and, post-PR-#90, capability-gated delegation policies via JLVM.

**Explicitly out of scope:**
- Token staking / bonding / slashing (not in OttoChain's model)
- SQL reputation tables or external reputation services
- Multi-dimensional reputation formula (premature for v1)
- Time-decay reputation calculations
- Cross-platform reputation portability
- On-chain task counters in fiber stateData (deferred to Phase 2 — indexer computes from `FiberTransition` history)

---

## 2. Proto Definitions

### 2.1 File: `proto/agent_profile.proto`

```protobuf
syntax = "proto3";

package ottochain;

option java_package = "xyz.kd5ujc.proto";
option java_outer_classname = "AgentProfileProto";
option (scalapb.options) = {
  package_name: "xyz.kd5ujc.shared_data.types.proto"
  flat_package: true
};

import "scalapb/scalapb.proto";

// Predefined agent capability types.
// ML0 validates against this enum at CREATE_PROFILE time.
// Use customCapabilities for app-specific extensions (see AgentProfile).
enum CapabilityType {
  CAPABILITY_TYPE_UNSPECIFIED = 0;

  // Machine learning tasks
  ML_CLASSIFY     = 1;   // Classification/prediction
  ML_SUMMARIZE    = 2;   // Text/data summarization
  ML_EMBED        = 3;   // Embedding generation

  // Data pipeline tasks
  DATA_PROCESS    = 4;   // Data transformation
  DATA_AGGREGATE  = 5;   // Aggregation/analytics

  // Oracle services
  ORACLE_PRICE    = 6;   // Price feed oracle
  ORACLE_RANDOM   = 7;   // Randomness oracle

  // Governance
  GOVERNANCE      = 8;   // Voting and proposal participation

  // Catch-all for agents with general task execution ability
  GENERIC         = 9;
}

message AgentProfile {
  // DAG wallet address of the agent (also stored as fiber owner).
  // Unique — only one AgentProfile per wallet address.
  string wallet_address      = 1;

  // Human-readable display name (1–64 chars, required).
  string name                = 2;

  // Predefined capability types this agent declares.
  // ML0 validates each value against the CapabilityType enum.
  repeated CapabilityType capabilities = 3;

  // App-specific capability extensions.
  // Must be prefixed with "app:" (e.g., "app:my_domain_task").
  // ML0 skips enum validation for "app:" prefixed strings.
  repeated string custom_capabilities  = 4;

  // Optional REST endpoint for this agent (empty string = not provided).
  // Must be a valid https:// URL if non-empty.
  string service_url         = 5;

  // Agent's cryptographic public key in hex format (optional, informational).
  // Does not replace DAG wallet address for identity — just metadata.
  string public_key_hex      = 6;

  // Free-text description (0–512 chars, optional).
  string description         = 7;

  // Ordinal at which this profile was registered (set by ML0, read-only).
  // Zero if not yet in CalculatedState.
  int64 registered_ordinal   = 8;
}

// Payload for CREATE_PROFILE OttochainMessage.
message CreateAgentProfilePayload {
  AgentProfile profile = 1;
}

// Payload for UPDATE_PROFILE OttochainMessage.
// Only non-empty fields are applied (partial update semantics).
message UpdateAgentProfilePayload {
  // walletAddress identifies which profile to update.
  string wallet_address            = 1;
  // Replaces the full capabilities list (all or nothing).
  repeated CapabilityType capabilities = 2;
  // Replaces the full custom_capabilities list.
  repeated string custom_capabilities  = 3;
  // Empty string = no change; set to " " to clear.
  string name                      = 4;
  string service_url               = 5;
  string description               = 6;
}

// Payload for DEACTIVATE_PROFILE OttochainMessage.
message DeactivateAgentProfilePayload {
  string wallet_address = 1;
}
```

### 2.2 OttochainMessage Extensions (`proto/messages.proto`)

Add three new `MessageType` enum values and corresponding `oneof` fields:

```protobuf
// In MessageType enum, add:
CREATE_AGENT_PROFILE     = 10;
UPDATE_AGENT_PROFILE     = 11;
DEACTIVATE_AGENT_PROFILE = 12;

// In OttochainMessage.payload oneof, add:
CreateAgentProfilePayload   create_agent_profile   = 10;
UpdateAgentProfilePayload   update_agent_profile   = 11;
DeactivateAgentProfilePayload deactivate_agent_profile = 12;
```

---

## 3. State Machine Definition

The AgentProfile fiber uses a 3-state lifecycle managed by `workflowType = "AgentProfile"`.

### 3.1 State Machine JSON (stored in `StateMachineFiberRecord.definition`)

```json
{
  "workflowType": "AgentProfile",
  "version": "1.0.0",
  "description": "Agent capability profile lifecycle",
  "initialState": "registered",
  "states": {
    "registered": {
      "description": "Profile created, pending activation",
      "transitions": {
        "ACTIVATE":    { "targetState": "active" },
        "DEACTIVATE":  { "targetState": "suspended" }
      }
    },
    "active": {
      "description": "Profile live — discoverable and delegation-eligible",
      "transitions": {
        "UPDATE_PROFILE": { "targetState": "active" },
        "DEACTIVATE":     { "targetState": "suspended" }
      },
      "acceptState": true
    },
    "suspended": {
      "description": "Profile suspended — not discoverable, delegation rejected",
      "transitions": {
        "ACTIVATE": { "targetState": "active" }
      }
    }
  }
}
```

### 3.2 Message → State Transition Mapping

| OttochainMessage         | Fiber Event       | Valid In States           | Target State  |
|--------------------------|-------------------|---------------------------|---------------|
| `CREATE_AGENT_PROFILE`   | `CreateStateMachine` | (no prior fiber)        | `registered`  |
| `UPDATE_AGENT_PROFILE`   | `TransitionStateMachine(UPDATE_PROFILE)` | `active` | `active` |
| `DEACTIVATE_AGENT_PROFILE` | `TransitionStateMachine(DEACTIVATE)` | `registered`, `active` | `suspended` |
| *(internal)*             | `TransitionStateMachine(ACTIVATE)` | `registered`, `suspended` | `active` |

**Note:** `ACTIVATE` is not a standalone `OttochainMessage` in v1 — `CREATE_AGENT_PROFILE` auto-activates after the `registered` initial state. Implementation should emit `ACTIVATE` immediately after `CREATE_AGENT_PROFILE` succeeds to transition `registered → active`. This keeps `registered` as a transient holding state for future multi-step registration flows.

---

## 4. ML0 Validation Rules

ML0 (`DataL0Service` / `FiberValidator`) must enforce these rules at submission time:

### 4.1 `CREATE_AGENT_PROFILE` Validation

| Rule | Condition | Error Code |
|------|-----------|------------|
| Name required | `name.trim().nonEmpty` | `INVALID_PROFILE_NAME` |
| Name length | `name.length ∈ [1, 64]` | `INVALID_PROFILE_NAME` |
| No duplicate | No existing AgentProfile fiber with this walletAddress in CalculatedState | `DUPLICATE_AGENT_PROFILE` |
| Submitter match | Transaction signer == `walletAddress` in payload | `UNAUTHORIZED_PROFILE_CREATE` |
| Capability valid | Each `capabilities[]` value is a valid `CapabilityType` (non-zero) | `INVALID_CAPABILITY` |
| Custom cap format | Each `customCapabilities[]` starts with `"app:"` | `INVALID_CUSTOM_CAPABILITY` |
| Service URL | If non-empty, must match `^https?://` pattern | `INVALID_SERVICE_URL` |
| Description length | `description.length <= 512` | `INVALID_DESCRIPTION` |

### 4.2 `UPDATE_AGENT_PROFILE` Validation

| Rule | Condition | Error Code |
|------|-----------|------------|
| Profile exists | AgentProfile fiber found for `walletAddress` | `PROFILE_NOT_FOUND` |
| Profile active | Fiber state == `active` | `PROFILE_NOT_ACTIVE` |
| Submitter match | Transaction signer == `walletAddress` | `UNAUTHORIZED_PROFILE_UPDATE` |
| Name length | If non-empty, `name.length ∈ [1, 64]` | `INVALID_PROFILE_NAME` |
| Capability valid | Each `capabilities[]` value is valid (if provided) | `INVALID_CAPABILITY` |
| Custom cap format | Each `customCapabilities[]` starts with `"app:"` (if provided) | `INVALID_CUSTOM_CAPABILITY` |
| Service URL | If non-empty, must match `^https?://` | `INVALID_SERVICE_URL` |

### 4.3 `DEACTIVATE_AGENT_PROFILE` Validation

| Rule | Condition | Error Code |
|------|-----------|------------|
| Profile exists | AgentProfile fiber found for `walletAddress` | `PROFILE_NOT_FOUND` |
| Not already suspended | Fiber state != `suspended` | `PROFILE_ALREADY_SUSPENDED` |
| Submitter match | Transaction signer == `walletAddress` | `UNAUTHORIZED_PROFILE_DEACTIVATE` |

---

## 5. TypeScript SDK API

### 5.1 Types (`src/types/agent-profile.ts`)

```typescript
export enum CapabilityType {
  ML_CLASSIFY     = 'ml_classify',
  ML_SUMMARIZE    = 'ml_summarize',
  ML_EMBED        = 'ml_embed',
  DATA_PROCESS    = 'data_process',
  DATA_AGGREGATE  = 'data_aggregate',
  ORACLE_PRICE    = 'oracle_price',
  ORACLE_RANDOM   = 'oracle_random',
  GOVERNANCE      = 'governance',
  GENERIC         = 'generic',
}

export interface AgentProfile {
  walletAddress:      string;
  name:               string;
  capabilities:       CapabilityType[];
  customCapabilities: string[];        // "app:*" prefixed
  serviceUrl:         string;          // "" if not set
  publicKeyHex:       string;          // "" if not set
  description:        string;          // "" if not set
  registeredOrdinal:  number;          // 0 before first confirmation
  currentState:       'registered' | 'active' | 'suspended';
}

export interface CreateAgentProfileRequest {
  name:                string;
  capabilities:        CapabilityType[];
  customCapabilities?: string[];
  serviceUrl?:         string;
  publicKeyHex?:       string;
  description?:        string;
}

export interface UpdateAgentProfileRequest {
  capabilities?:       CapabilityType[];
  customCapabilities?: string[];
  name?:               string;
  serviceUrl?:         string;
  description?:        string;
}
```

### 5.2 Client Methods (`src/client/agent-profile-client.ts`)

```typescript
export interface AgentProfileClient {
  /**
   * Register a new agent profile on OttoChain.
   * The transaction is signed by the provided wallet (must match walletAddress).
   * Returns the fiberId of the created AgentProfile fiber.
   * Throws if a profile already exists for this wallet.
   */
  createProfile(
    request: CreateAgentProfileRequest,
    wallet:  Wallet
  ): Promise<string>; // fiberId

  /**
   * Update an existing profile. Only provided fields are changed.
   * Wallet must match the profile's walletAddress.
   * Profile must be in 'active' state.
   */
  updateProfile(
    walletAddress: string,
    updates:       UpdateAgentProfileRequest,
    wallet:        Wallet
  ): Promise<void>;

  /**
   * Deactivate a profile. Suspended profiles are excluded from discovery
   * and their delegation credentials are rejected by ML0.
   */
  deactivateProfile(
    walletAddress: string,
    wallet:        Wallet
  ): Promise<void>;

  /**
   * Fetch an agent's profile by wallet address.
   * Returns null if no profile exists.
   */
  getProfile(walletAddress: string): Promise<AgentProfile | null>;

  /**
   * Search for active agent profiles by capability.
   * Returns up to `limit` profiles (default 50).
   */
  searchByCapability(
    capability: CapabilityType | string,  // string for "app:*"
    options?:   { limit?: number; offset?: number }
  ): Promise<AgentProfile[]>;
}
```

---

## 6. Indexer Routes (`ottochain-services`)

### 6.1 `GET /api/fibers/:walletAddress/agentProfile`

Fetch the AgentProfile fiber for a given wallet address.

**Prisma query (no migration needed):**
```typescript
const fiber = await prisma.fiber.findFirst({
  where: {
    workflowType: 'AgentProfile',
    owners: { has: walletAddress }
  },
  include: { transitions: { orderBy: { ordinal: 'desc' }, take: 1 } }
});
```

**Response:**
```json
// 200 — found
{
  "fiberId":          "uuid-here",
  "walletAddress":    "DAG...",
  "name":             "OttoBot ML Agent",
  "capabilities":     ["ml_classify", "ml_embed"],
  "customCapabilities": ["app:sentiment_analysis"],
  "serviceUrl":       "https://agent.example.com",
  "publicKeyHex":     "04abc...",
  "description":      "Specializes in NLP tasks.",
  "currentState":     "active",
  "registeredOrdinal": 1042
}

// 404 — not found
{ "error": "AgentProfile not found for address DAG..." }
```

### 6.2 `GET /api/agentProfiles?capability=ml_classify&offset=0&limit=50`

List active agent profiles filtered by capability.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `capability` | string (optional) | Filter by `CapabilityType` or `"app:*"` string |
| `offset` | number (default 0) | Pagination offset |
| `limit` | number (default 50, max 200) | Page size |

**Prisma query:**
```typescript
const fibers = await prisma.fiber.findMany({
  where: {
    workflowType: 'AgentProfile',
    currentState: 'active',
    ...(capability ? { stateData: { path: ['capabilities'], array_contains: capability } } : {})
  },
  skip: offset,
  take: limit,
  orderBy: { createdAt: 'asc' }
});
```

**Response:** `{ profiles: AgentProfile[], total: number }`

---

## 7. ML0 / JLVM Integration (Phase 2 — blocked on PR #90)

**Prerequisite:** PR #90 (JLVM Delegation Operators) must be merged.

After PR #90 merges, extend `ContextProvider.buildContext()` in `ottochain` to inject delegate profile data:

### 7.1 Phase 1 Implementation (available now)
In `ContextProvider.make(calculatedState, currentOrdinal)`:
```scala
// After resolving DelegationCredential with relayerAddr:
val delegateProfile: Option[StateMachineFiberRecord] =
  calculatedState.stateMachines.values
    .find { record =>
      record.definition.metadata.exists(_.name == "AgentProfile") &&
      record.owners.exists(_.value == credential.relayerAddr)
    }
    .filter(_.currentState == "active")
```

### 7.2 Phase 2 JLVM Context Extension (post PR #90)
Inject into `DelegationContext.fromCredential()` output:
```json
{
  "delegation.delegate.capabilities":       ["ml_classify", "ml_embed"],
  "delegation.delegate.customCapabilities": ["app:sentiment_analysis"],
  "delegation.delegate.name":               "OttoBot ML Agent",
  "delegation.delegate.serviceUrl":         "https://agent.example.com",
  "delegation.delegate.isActive":           true
}
```

**Example delegation guard using profile:**
```json
{
  "and": [
    { "in": ["ml_classify", { "var": "delegation.delegate.capabilities" }] },
    { "==": [{ "var": "delegation.delegate.isActive" }, true] }
  ]
}
```

**ML0 behavior change**: If `delegation.delegate.*` is requested in JSON Logic and no AgentProfile exists for the relayer address, the delegation guard evaluation should treat `delegation.delegate.capabilities` as `[]` and `delegation.delegate.isActive` as `false` (guard fails safely — no error, just evaluates false).

**Suspended profile**: ML0 must reject delegation proofs where the delegate's AgentProfile is in `suspended` state, even if the `DelegationCredential` itself is valid. Error: `DELEGATE_PROFILE_SUSPENDED`.

---

## 8. CalculatedState Changes (Scala — `ottochain`)

No new top-level fields required for Phase 1.

**Phase 2 optimization only:** Add secondary index to `CalculatedState`:
```scala
case class CalculatedState(
  stateMachines: SortedMap[UUID, StateMachineFiberRecord],
  scripts:       SortedMap[UUID, ScriptRecord],
  delegations:   SortedMap[String, DelegationCredential],  // existing
  // Phase 2 only:
  agentProfiles: SortedMap[String, UUID]   // walletAddress -> fiberId
)
```

The `agentProfiles` map is populated by the Combiner when processing `CREATE_AGENT_PROFILE` and updated on `DEACTIVATE_AGENT_PROFILE`. In Phase 1, all lookups use the O(n) scan described in §7.1.

---

## 9. Test Cases (17 total)

### Group 1: CREATE_PROFILE — Happy Path (3 tests)

**Test 1.1: `creates an AgentProfile fiber with correct initial state`**
- Submit `CREATE_AGENT_PROFILE` with name="Test Agent", capabilities=[ML_CLASSIFY], signed by wallet A
- Assert: fiber created with `workflowType=AgentProfile`, `currentState=active`, `owners=[walletA]`
- Assert: `stateData.name == "Test Agent"`, `stateData.capabilities == ["ml_classify"]`

**Test 1.2: `auto-activates from registered to active`**
- Submit `CREATE_AGENT_PROFILE`, poll until `currentState == "active"`
- Assert: no manual ACTIVATE message needed; state machine transitions automatically

**Test 1.3: `stores optional fields correctly`**
- Submit with `serviceUrl="https://api.example.com"`, `publicKeyHex="04abc"`, `description="My agent"`, `customCapabilities=["app:nlp"]`
- Assert: all fields present in fiber stateData and indexer response

### Group 2: CREATE_PROFILE — Validation Failures (5 tests)

**Test 2.1: `rejects duplicate profile for same wallet address`**
- Submit `CREATE_AGENT_PROFILE` twice for wallet A (second after first is active)
- Assert: second submission rejected with `DUPLICATE_AGENT_PROFILE` error

**Test 2.2: `rejects empty name`**
- Submit with `name=""`
- Assert: rejected with `INVALID_PROFILE_NAME`

**Test 2.3: `rejects invalid capability value`**
- Submit with capabilities containing an unknown integer (e.g., `99`)
- Assert: rejected with `INVALID_CAPABILITY`

**Test 2.4: `rejects custom capability without "app:" prefix`**
- Submit with `customCapabilities=["ml_custom"]` (missing `app:` prefix)
- Assert: rejected with `INVALID_CUSTOM_CAPABILITY`

**Test 2.5: `rejects non-HTTPS service URL`**
- Submit with `serviceUrl="http://insecure.com"` (http, not https)
- Assert: rejected with `INVALID_SERVICE_URL`

**Note:** http is acceptable per spec (§4.1 pattern allows `^https?://`) — revise Test 2.5 to use `serviceUrl="not-a-url"` (no protocol) instead.

### Group 3: UPDATE_PROFILE (3 tests)

**Test 3.1: `updates capabilities on active profile`**
- Create profile with `[ML_CLASSIFY]`, then UPDATE with `[ML_CLASSIFY, ML_EMBED]`
- Assert: fiber stateData capabilities updated; `currentState` still `active`

**Test 3.2: `rejects update on suspended profile`**
- Create profile, DEACTIVATE, then attempt UPDATE
- Assert: rejected with `PROFILE_NOT_ACTIVE`

**Test 3.3: `rejects update by non-owner wallet`**
- Create profile with wallet A, attempt UPDATE signed by wallet B
- Assert: rejected with `UNAUTHORIZED_PROFILE_UPDATE`

### Group 4: DEACTIVATE_PROFILE (2 tests)

**Test 4.1: `transitions profile to suspended state`**
- Create profile (auto-activates), DEACTIVATE
- Assert: `currentState == "suspended"`; profile no longer returned by `GET /api/agentProfiles?capability=...`

**Test 4.2: `rejects double-deactivation`**
- DEACTIVATE an already-suspended profile
- Assert: rejected with `PROFILE_ALREADY_SUSPENDED`

### Group 5: Indexer Routes (2 tests)

**Test 5.1: `GET /api/fibers/:address/agentProfile returns profile`**
- Create profile for wallet A, query `GET /api/fibers/walletA/agentProfile`
- Assert: 200 with correct name, capabilities, currentState

**Test 5.2: `GET /api/agentProfiles?capability=ml_classify returns only matching active profiles`**
- Create 3 profiles: A (ml_classify), B (data_process), C (ml_classify, suspended)
- Query `?capability=ml_classify`
- Assert: only profile A returned (B wrong capability, C suspended)

### Group 6: JLVM Integration — Phase 2 (2 tests, blocked on PR #90)

**Test 6.1: `delegation guard accepts active delegate with matching capability`**
- Create AgentProfile for relayer wallet with `capabilities=[ML_CLASSIFY]`
- Submit delegation with guard: `{"in": ["ml_classify", {"var": "delegation.delegate.capabilities"}]}`
- Assert: delegation credential accepted by ML0

**Test 6.2: `delegation guard rejects suspended delegate profile`**
- Create AgentProfile for relayer, DEACTIVATE it, attempt delegation use
- Assert: ML0 rejects with `DELEGATE_PROFILE_SUSPENDED`

---

## 10. Phased Implementation Plan

### Phase 1 (build now — no PR #90 dependency)
- [ ] `agent_profile.proto` + `CapabilityType` enum
- [ ] `OttochainMessage` extensions (CREATE/UPDATE/DEACTIVATE)
- [ ] Scala ML0 validation (§4)
- [ ] Scala Combiner: process AgentProfile fibers
- [ ] TypeScript SDK `AgentProfileClient`
- [ ] Indexer routes (§6.1 and §6.2)
- [ ] Tests 1.1–5.2

### Phase 2 (after PR #90 merges)
- [ ] `ContextProvider` delegate profile injection (§7.2)
- [ ] ML0 `DELEGATE_PROFILE_SUSPENDED` check
- [ ] `CalculatedState.agentProfiles` secondary index (optional optimization)
- [ ] Tests 6.1–6.2
- [ ] On-chain task counters in stateData (if desired)

---

## 11. PR Merge Order

1. `PR #90` — JLVM Delegation Operators (currently in Code Review, awaiting James)
2. `PR #41` — SDK Delegation Methods (currently in Code Review, awaiting James)
3. **AgentProfile Phase 1** — `feat/agent-profile` branched from `feat/sdk-delegation-methods`
4. **AgentProfile Phase 2** — `feat/agent-profile-jlvm` branched from `feat/agent-profile` + merge of `PR #90`

**Note:** Phase 1 AgentProfile implementation can start immediately on a new branch, targeting `feat/sdk-delegation-methods` as base.
