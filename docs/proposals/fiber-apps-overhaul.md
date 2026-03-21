# Fiber Apps Overhaul Proposal

**Author:** OttoBot  
**Date:** 2026-03-20  
**Status:** Draft - Awaiting Review

## Problem Statement

The current SDK fiber apps are inconsistent:
- Markets has 1 "universal" state machine trying to do everything
- Governance has 9 fragmented state machines (including overengineered constitutional stuff)
- Corporate has 10 state machines (too granular)
- Contracts has 2 (reasonable)
- Identity has 1 (reasonable)
- Oracles is separate but should be an identity specialization

Traffic-gen, bridge, indexer, and explorer are all misaligned because the SDK itself is a mess.

## Design Principles

### 1. Universal + Specialized Pattern
Every app has:
- **One universal state machine** — minimal, flexible, extend as needed
- **Multiple specialized state machines** — opinionated, useful defaults, "just works"

### 2. Specialized Means Complete
A specialized state machine must be:
- Self-contained with proper states, guards, effects
- Immediately usable without modification
- Well-documented with clear use cases

### 3. Composition Over Fragmentation
Don't create separate state machines for things that are:
- Configuration (bylaws, parameters)
- Data (compliance records, filing history)
- Composition patterns (legislative + executive + judicial = recipe, not 3 SMs)

### 4. Clear Naming Convention
```
{app}-universal.json     # Generic base
{app}-{variant}.json     # Specialized variant
```

## Governance Organization

### Key Question: How to organize DAO vs Corporate vs Future types?

**Analysis of governance patterns:**

| Pattern | DAO | Corporate | Coop | Consortium |
|---------|-----|-----------|------|------------|
| Membership | token/reputation | shares | equal | org-based |
| Voting | weighted/threshold | share-weighted | 1-member-1-vote | org-weighted |
| Proposals | permissionless/gated | board/shareholder | member | delegate |
| Execution | automatic/multisig | officer | committee | unanimous |
| Compliance | minimal | legal reqs | bylaws | charter |

**Conclusion:** They share mechanics (proposals, voting, quorum, delegation) but differ in:
- Membership model
- Compliance requirements
- Legal structure expectations

### Proposed Organization

```
governance/
├── state-machines/
│   ├── governance-universal.json    # Bare minimum governance
│   │
│   ├── # DAO variants (crypto-native, minimal compliance)
│   ├── dao-single.json              # 1-of-1 owner
│   ├── dao-multisig.json            # N-of-M signers
│   ├── dao-token.json               # Token-weighted + delegation
│   ├── dao-reputation.json          # Reputation threshold-based
│   │
│   ├── # Corporate variants (legal compliance, traditional structure)
│   ├── corp-entity.json             # Formation, status, dissolution
│   ├── corp-board.json              # Directors, meetings, resolutions
│   ├── corp-equity.json             # Shareholders + securities + cap table
│   │
│   └── # Future variants (placeholder, not implementing now)
│   #   ├── coop-member.json         # Cooperative governance
│   #   ├── consortium-delegate.json # Multi-org consortium
│   #   ├── network-parameter.json   # Protocol governance
│   #   └── trust-fiduciary.json     # Trust/estate governance
│
└── index.ts                         # Exports all definitions
```

**Archived (return to later):**
- governance-legislature.json
- governance-executive.json
- governance-judiciary.json
- governance-constitution.json

These represent a "checks and balances" composition pattern. Document as a recipe/tutorial, not separate state machines.

## Complete App Structure

### Identity
```
identity/
├── state-machines/
│   ├── identity-universal.json      # Bare minimum identity
│   ├── identity-agent.json          # Standard agent (current)
│   ├── identity-oracle.json         # Agent + attestation + reputation (absorb oracles/)
│   └── identity-service.json        # Bot/automated service identity
└── index.ts
```

### Contracts
```
contracts/
├── state-machines/
│   ├── contract-universal.json      # Bare minimum contract
│   ├── contract-agreement.json      # Rename from contract.json - two-party agreement
│   ├── contract-escrow.json         # Asset custody (current)
│   ├── contract-service.json        # Milestone-based delivery
│   └── contract-subscription.json   # Recurring payments
└── index.ts
```

### Markets
```
markets/
├── state-machines/
│   ├── market-universal.json        # Bare minimum market
│   ├── market-prediction.json       # Binary/multi-outcome + oracle resolution
│   ├── market-auction.json          # English/Dutch/sealed-bid
│   ├── market-crowdfund.json        # Threshold funding, all-or-nothing
│   ├── market-group-buy.json        # Collective purchasing
│   └── market-exchange.json         # Order book / swap
└── index.ts
```

### Governance (see above)

### Treasury (new)
```
treasury/
├── state-machines/
│   ├── treasury-universal.json      # Bare minimum treasury
│   ├── treasury-vault.json          # Simple asset storage + withdrawal rules
│   ├── treasury-streaming.json      # Streaming payments (Sablier-style)
│   └── treasury-budget.json         # Periodic budgets + spending limits
└── index.ts
```

### Registry (new)
```
registry/
├── state-machines/
│   ├── registry-universal.json      # Bare minimum registry
│   ├── registry-names.json          # Name registration (ENS-style)
│   ├── registry-credentials.json    # Credential issuance + revocation
│   └── registry-assets.json         # Asset registration + provenance
└── index.ts
```

## Refactoring Scope

### Phase 1: Refactor Existing (DO NOW)

**Identity:**
- Keep identity-agent.json as-is
- Create identity-universal.json (minimal)
- Create identity-oracle.json (absorb oracles/)
- Delete oracles/ app

**Contracts:**
- Keep escrow.json as contract-escrow.json
- Rename contract.json → contract-agreement.json
- Create contract-universal.json (minimal)

**Markets:**
- Keep market-universal.json but make it actually minimal
- Create market-prediction.json
- Create market-auction.json
- Create market-crowdfund.json
- Create market-group-buy.json

**Governance:**
- Keep dao-single.json, dao-multisig.json, dao-token.json
- Rename dao-threshold.json → dao-reputation.json
- Keep governance-simple.json
- Archive legislature/executive/judiciary/constitution (move to docs/archive/)
- Create governance-universal.json (minimal)

**Corporate:**
- Consolidate 10 → 3:
  - corp-entity.json (from corporate-entity.json)
  - corp-board.json (merge board + officers + meetings)
  - corp-equity.json (merge shareholders + securities + resolution)
- Archive the rest (move to docs/archive/)

### Phase 2: Align Stack (DO AFTER PHASE 1)

After SDK is clean:
1. **Bridge** — update routes to match new structure
2. **Indexer** — update schema/handlers for new types
3. **Gateway** — update GraphQL schema
4. **Explorer** — update UI components
5. **Traffic-gen** — import from SDK, no local definitions

### Phase 3: New Apps (TRELLO WORK)

- Treasury app
- Registry app
- Additional specialized variants as needed

## Acceptance Criteria

### For Phase 1 (SDK Refactor)

✅ **Structure:**
- Every app has exactly one `*-universal.json`
- All specialized variants follow `{app}-{variant}.json` naming
- No more than 5-6 state machines per app
- Archived SMs in `docs/archive/` with explanation

✅ **Quality:**
- Each state machine has complete states, transitions, guards, effects
- Each has metadata with name, description, version
- Each has JSDoc comments in index.ts explaining use case
- Unit tests pass for all state machines

✅ **Exports:**
- `get{App}Definition(type)` returns the right SM
- `{APP}_DEFINITIONS` constant maps all types
- Proto types re-exported from index.ts

### For Phase 2 (Stack Alignment)

✅ **Bridge:**
- Routes exist for all SDK fiber types
- No hardcoded state machine definitions
- Imports from SDK

✅ **Indexer:**
- Handles all SDK fiber types
- Schema matches SDK structure
- No unknown fiber type errors

✅ **Explorer:**
- UI for all indexed fiber types
- Filtering by app and variant
- State visualization works

✅ **Traffic-gen:**
- Zero local state machine definitions
- All workflows import from SDK
- Only adds simulation metadata (frequency, actors, payloads)

## Migration Notes

### Breaking Changes
- `contract.json` → `contract-agreement.json`
- `dao-threshold.json` → `dao-reputation.json`
- `oracles/` deleted, use `identity-oracle.json`
- Corporate consolidation changes field names

### Backward Compatibility
- Keep old names as aliases for one release cycle
- Deprecation warnings in console
- Migration guide in docs

## Open Questions

1. **Oracle pools:** Should `identity-oracle.json` handle oracle pools, or do we need a separate `oracle-pool.json` for consensus among multiple oracles?

2. **Cross-app references:** How do specialized SMs reference each other? (e.g., market-prediction needs identity-oracle for resolution)

3. **Versioning:** How do we version individual state machines vs the SDK as a whole?

---

## Sign-off

- [ ] James reviewed structure
- [ ] James approved Phase 1 scope
- [ ] Explicit agreement on what "done" looks like before implementation
## Future Work - Oracle Pools

Research Emurgo's Oracle pool proposal for decentralized oracle networks:
- Pool formation and stake-weighted selection
- Aggregation strategies (median, threshold signatures)
- Slashing conditions for misbehavior
- Fee distribution models

Reference: identity-oracle.json as base, extend with pool mechanics.

Added: 2026-03-20T20:28:25-05:00
