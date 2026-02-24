# OttoChain SDK Structure

This document describes the organization of the OttoChain SDK.

## Directory Layout

```
src/
├── apps/                       # Application domains
│   ├── contracts/              # Smart contract types
│   │   ├── index.ts
│   │   └── types.ts
│   ├── corporate/              # Corporate governance
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── state-machines/     # JSON state machine definitions
│   │       ├── corporate-entity.json
│   │       ├── corporate-board.json
│   │       ├── corporate-shareholders.json
│   │       └── ... (10 total)
│   ├── governance/             # DAOs and governance
│   │   ├── index.ts            # Exports + helper functions
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── state-machines/     # JSON state machine definitions
│   │       ├── dao-token.json
│   │       ├── dao-multisig.json
│   │       ├── dao-threshold.json
│   │       ├── dao-single.json
│   │       ├── governance-simple.json
│   │       ├── governance-legislature.json
│   │       ├── governance-executive.json
│   │       ├── governance-judiciary.json
│   │       └── governance-constitution.json
│   ├── identity/               # Agent identity
│   │   ├── index.ts
│   │   └── types.ts
│   ├── markets/                # Prediction markets, auctions, etc.
│   │   ├── index.ts
│   │   └── types.ts
│   ├── oracles/                # Script oracles
│   │   ├── index.ts
│   │   └── types.ts
│   └── index.ts                # Re-exports all apps
│
├── generated/                  # Protobuf-generated types (source of truth)
│   └── ottochain/
│       ├── apps/
│       │   ├── identity/v1/
│       │   ├── contracts/v1/
│       │   ├── markets/v1/
│       │   └── oracles/v1/
│       └── v1/                 # Core types (fiber, messages, etc.)
│
├── metakit/                    # Constellation metagraph utilities
│   ├── wallet.ts               # Key generation, signing
│   ├── hash.ts                 # Hashing utilities
│   ├── codec.ts                # Binary encoding/decoding
│   ├── sign.ts                 # Transaction signing
│   └── network/                # HTTP/WebSocket clients
│
├── ottochain/                  # OttoChain-specific clients
│   ├── metagraph-client.ts     # High-level metagraph client
│   ├── snapshot.ts             # Snapshot decoding
│   ├── types.ts                # Core fiber/state types
│   └── index.ts                # Re-exports
│
├── validation.ts               # Zod schemas for validation
└── index.ts                    # Main entry point
```

## App Structure Convention

Each app in `src/apps/` follows this structure:

```
<app>/
├── index.ts                    # Public API exports + helper functions
├── types.ts                    # TypeScript interfaces and types
└── state-machines/             # JSON state machine definitions (if any)
    └── <name>.json
```

### types.ts

Contains TypeScript interfaces for:
- State shapes (e.g., `DAOState`, `CorporateEntityState`)
- Configuration options
- Enums and union types
- Imports JSON definitions and re-exports them

### index.ts

Contains:
- Re-export of all types: `export * from './types.js'`
- Helper functions (e.g., `createMultisigState()`, `isThresholdMet()`)
- State machine definition accessors

### state-machines/

JSON files defining state machine logic using JSON Logic format:
- `states`: Map of state IDs to state definitions
- `initialState`: Starting state
- `transitions`: Array of valid state transitions with guards and effects
- `metadata`: Optional metadata

## Usage

```typescript
// Import specific app
import { governance, corporate } from '@ottochain/sdk/apps';

// Use DAO helpers
const dao = governance.createMultisigState({
  name: 'Treasury',
  signers: ['DAG...', 'DAG...', 'DAG...'],
  threshold: 2
});

// Access state machine definitions
const tokenDAODef = governance.DAO_DEFINITIONS.Token;
const entityDef = corporate.CORPORATE_DEFINITIONS.Entity;

// Import types directly
import type { MultisigDAOState, CorporateEntityState } from '@ottochain/sdk/apps';
```

## Adding a New App

1. Create directory: `src/apps/<app>/`
2. Create `types.ts` with TypeScript interfaces
3. Create `state-machines/` with JSON definitions (if needed)
4. Create `index.ts` that exports types and helpers
5. Add to `src/apps/index.ts`:
   ```typescript
   export * as <app> from './<app>/index.js';
   export * from './<app>/index.js';
   ```
6. Update this document

See the `ottochain-domains` skill for the full pipeline including bridge routes and traffic generator integration.
