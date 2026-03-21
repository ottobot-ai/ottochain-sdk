# Proposal: Fiber App Definition Schema & Build-Time Generation

**Status:** Draft  
**Author:** OttoBot  
**Date:** 2026-03-21  

## Summary

Define a comprehensive JSON schema for fiber app definitions that serves as the single source of truth for state machines, instance data, and event payloads. Build-time generation derives TypeScript types, transition maps, and validation schemas for the entire stack.

## Motivation

Currently we have:
1. **JSON state machines** — define states/transitions but no instance schemas
2. **Proto enums** — manually maintained, can drift from JSON
3. **TS constants** — hardcoded transition maps, duplicate source of truth
4. **Bridge validation** — Zod schemas written by hand, can drift
5. **Traffic-gen** — guesses at payload shapes

This creates maintenance burden and drift risk. We need one source.

## Design

### Fiber App Definition Schema

```json
{
  "$schema": "https://ottochain.ai/schemas/fiber-app-v1.json",
  
  "metadata": {
    "name": "IdentityAgent",
    "app": "identity",
    "type": "agent",
    "version": "1.0.0",
    "description": "Standard agent identity with reputation tracking"
  },

  "instanceSchema": {
    "required": ["owner", "displayName"],
    "properties": {
      "owner": {
        "type": "address",
        "description": "Agent owner DAG address",
        "immutable": true
      },
      "displayName": {
        "type": "string",
        "maxLength": 64,
        "description": "Human-readable agent name"
      },
      "bio": {
        "type": "string",
        "maxLength": 256,
        "default": ""
      },
      "avatar": {
        "type": "uri",
        "default": null
      },
      "platforms": {
        "type": "array",
        "items": { "$ref": "#/definitions/PlatformLink" },
        "default": []
      },
      "reputation": {
        "type": "integer",
        "default": 10,
        "computed": true,
        "description": "Managed by state machine effects, not user-settable"
      },
      "status": {
        "type": "string",
        "enum": ["REGISTERED", "ACTIVE", "CHALLENGED", "SUSPENDED", "PROBATION", "WITHDRAWN"],
        "computed": true
      }
    }
  },

  "eventSchemas": {
    "activate": {
      "description": "Activate a registered agent",
      "payload": {}
    },
    "challenge": {
      "description": "Challenge an active agent's behavior",
      "payload": {
        "required": ["challenger", "reason"],
        "properties": {
          "challenger": { "type": "address" },
          "reason": { "type": "string", "maxLength": 512 },
          "evidence": { "type": "array", "items": { "type": "uri" } }
        }
      }
    },
    "receive_vouch": {
      "description": "Receive a vouch from another agent",
      "payload": {
        "required": ["from"],
        "properties": {
          "from": { "type": "address" },
          "weight": { "type": "integer", "minimum": 1, "maximum": 10, "default": 1 }
        }
      }
    },
    "withdraw": {
      "description": "Permanently withdraw the agent",
      "payload": {}
    }
  },

  "definitions": {
    "PlatformLink": {
      "type": "object",
      "required": ["platform", "handle"],
      "properties": {
        "platform": { "type": "string", "enum": ["twitter", "github", "discord", "telegram"] },
        "handle": { "type": "string" },
        "verified": { "type": "boolean", "default": false }
      }
    }
  },

  "states": {
    "REGISTERED": { "id": "REGISTERED", "isFinal": false },
    "ACTIVE": { "id": "ACTIVE", "isFinal": false },
    "CHALLENGED": { "id": "CHALLENGED", "isFinal": false },
    "SUSPENDED": { "id": "SUSPENDED", "isFinal": false },
    "PROBATION": { "id": "PROBATION", "isFinal": false },
    "WITHDRAWN": { "id": "WITHDRAWN", "isFinal": true }
  },

  "initialState": "REGISTERED",

  "transitions": [
    {
      "from": "REGISTERED",
      "to": "ACTIVE",
      "eventName": "activate",
      "guard": { "==": [1, 1] },
      "effect": {
        "merge": [
          { "var": "state" },
          { "status": "ACTIVE", "activatedAt": { "var": "$timestamp" } }
        ]
      }
    }
  ]
}
```

### Schema Field Types

| Type | Description | JSON Schema Mapping |
|------|-------------|---------------------|
| `string` | UTF-8 string | `{ "type": "string" }` |
| `integer` | Signed 64-bit int | `{ "type": "integer" }` |
| `number` | Double precision | `{ "type": "number" }` |
| `boolean` | true/false | `{ "type": "boolean" }` |
| `address` | DAG address (DAG...) | `{ "type": "string", "pattern": "^DAG[a-zA-Z0-9]{37}$" }` |
| `uri` | Valid URI | `{ "type": "string", "format": "uri" }` |
| `timestamp` | ISO 8601 datetime | `{ "type": "string", "format": "date-time" }` |
| `uuid` | UUID v4 | `{ "type": "string", "format": "uuid" }` |
| `hash` | Hex-encoded hash | `{ "type": "string", "pattern": "^[a-f0-9]{64}$" }` |
| `object` | Nested object | `{ "type": "object", "properties": {...} }` |
| `array` | Array of items | `{ "type": "array", "items": {...} }` |
| `$ref` | Reference to definition | `{ "$ref": "#/definitions/Name" }` |

### Special Property Annotations

| Annotation | Description |
|------------|-------------|
| `immutable: true` | Cannot be changed after creation |
| `computed: true` | Managed by effects, not user-settable |
| `default: value` | Default value if not provided |
| `indexed: true` | Hint for indexer to create DB index |

## Build-Time Generation

### Script: `scripts/generate-app-types.mjs`

```javascript
// Reads all src/apps/*/state-machines/*.json
// Generates:
// 1. TypeScript types per app
// 2. Transition maps per app  
// 3. JSON Schema exports
// 4. Proto enum validation

async function generate() {
  const apps = await discoverApps();
  
  for (const app of apps) {
    // Generate TypeScript
    await generateTypes(app);      // → types.generated.ts
    await generateTransitions(app); // → transitions.generated.ts
    
    // Export schemas
    await exportJsonSchema(app);   // → dist/schemas/
  }
  
  // Validate protos match
  await validateProtoEnums();
}
```

### Generated Files

**`src/apps/identity/types.generated.ts`**
```typescript
// AUTO-GENERATED - DO NOT EDIT
// Source: src/apps/identity/state-machines/*.json

export interface CreateAgentInput {
  owner: string;        // DAG address (required)
  displayName: string;  // max 64 chars (required)
  bio?: string;         // max 256 chars
  avatar?: string;      // URI
  platforms?: PlatformLink[];
}

export interface PlatformLink {
  platform: 'twitter' | 'github' | 'discord' | 'telegram';
  handle: string;
  verified?: boolean;
}

export interface ChallengeEvent {
  challenger: string;   // DAG address (required)
  reason: string;       // max 512 chars (required)
  evidence?: string[];  // URIs
}

export interface ReceiveVouchEvent {
  from: string;         // DAG address (required)
  weight?: number;      // 1-10, default 1
}

export type AgentState = 'REGISTERED' | 'ACTIVE' | 'CHALLENGED' | 'SUSPENDED' | 'PROBATION' | 'WITHDRAWN';

export const AGENT_STATES: readonly AgentState[] = ['REGISTERED', 'ACTIVE', 'CHALLENGED', 'SUSPENDED', 'PROBATION', 'WITHDRAWN'];

export const AGENT_FINAL_STATES: readonly AgentState[] = ['WITHDRAWN'];
```

**`src/apps/identity/transitions.generated.ts`**
```typescript
// AUTO-GENERATED - DO NOT EDIT

export const AGENT_TRANSITIONS = {
  REGISTERED: ['activate', 'withdraw'] as const,
  ACTIVE: ['receive_vouch', 'receive_completion', 'challenge', 'withdraw'] as const,
  CHALLENGED: ['dismiss_challenge', 'uphold_challenge'] as const,
  SUSPENDED: ['begin_probation'] as const,
  PROBATION: ['complete_probation'] as const,
  WITHDRAWN: [] as const,
} as const;

export type AgentTransition = typeof AGENT_TRANSITIONS;

export function canTransition(state: AgentState, event: string): boolean {
  return (AGENT_TRANSITIONS[state] as readonly string[]).includes(event);
}
```

**`dist/schemas/identity-agent.schema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ottochain.ai/schemas/identity-agent.schema.json",
  "title": "IdentityAgent",
  "definitions": {
    "CreateInput": { ... },
    "ChallengeEvent": { ... },
    "State": { "enum": ["REGISTERED", "ACTIVE", ...] }
  }
}
```

### Consumer Integration

**Services `prebuild`:**
```bash
# Copy schemas from SDK
cp node_modules/@ottochain/sdk/dist/schemas/*.json src/generated/schemas/

# Generate Zod validators
npx json-schema-to-zod src/generated/schemas/*.json -o src/generated/validators/
```

**Explorer `prebuild`:**
```bash
# Copy schemas, generate form components
```

## Proto Validation

CI job validates proto enums match JSON states:

```javascript
// scripts/validate-proto-enums.mjs

function validateIdentityStates() {
  const jsonStates = extractStatesFromJson('identity-agent.json');
  const protoStates = extractStatesFromProto('identity.proto');
  
  // JSON: ['REGISTERED', 'ACTIVE', ...]
  // Proto: ['IDENTITY_STATE_REGISTERED', 'IDENTITY_STATE_ACTIVE', ...]
  
  for (const state of jsonStates) {
    const protoName = `IDENTITY_STATE_${state}`;
    if (!protoStates.includes(protoName)) {
      throw new Error(`Missing proto enum: ${protoName}`);
    }
  }
}
```

## Migration Path

### Phase 1: Schema Definition
1. Add `instanceSchema` and `eventSchemas` to existing JSON files
2. Create JSON Schema meta-schema for validation
3. Update one app (identity) as reference

### Phase 2: Generation Scripts
1. Implement `generate-app-types.mjs`
2. Replace handwritten `constants.ts` with generated
3. Add `prebuild` step to npm scripts

### Phase 3: Consumer Integration
1. Services: generate Zod from SDK schemas
2. Explorer: generate forms from SDK schemas
3. Traffic-gen: use schemas for payload generation

### Phase 4: Deprecation
1. Remove handwritten transition maps
2. Remove manual proto sync (now validated)
3. CI enforces schema presence for all apps

## File Structure (Final State)

```
src/apps/
├── identity/
│   ├── state-machines/
│   │   ├── identity-agent.json
│   │   ├── identity-oracle.json
│   │   └── identity-universal.json
│   ├── index.ts              # Re-exports everything
│   ├── types.generated.ts    # Generated types
│   └── transitions.generated.ts
├── contracts/
│   ├── state-machines/
│   │   ├── contract-agreement.json
│   │   ├── contract-escrow.json
│   │   └── contract-universal.json
│   ├── types.generated.ts
│   └── transitions.generated.ts
└── ...

dist/
├── schemas/
│   ├── identity-agent.schema.json
│   ├── identity-oracle.schema.json
│   ├── contract-agreement.schema.json
│   └── ...
└── ...

scripts/
├── generate-app-types.mjs
├── validate-proto-enums.mjs
└── inline-json.mjs (existing)
```

## Open Questions

1. **Should `instanceSchema` include all state fields or just creation inputs?**
   - Option A: Creation inputs only (status, timestamps computed)
   - Option B: Full state shape (useful for indexer/explorer)
   - Recommendation: Both — `createSchema` + `stateSchema`

2. **How to handle cross-fiber references (dependencies)?**
   - Current: `dependencies: Set[UUID]` in transitions
   - Need: Schema for referenced fiber types?

3. **Versioning strategy?**
   - Do we support multiple versions of same app type?
   - How do migrations work?

## Acceptance Criteria

- [ ] All apps have complete `instanceSchema` and `eventSchemas`
- [ ] `npm run prebuild` generates all type files
- [ ] No handwritten transition maps remain
- [ ] CI validates proto enums match JSON states
- [ ] Services can generate Zod from SDK schemas
- [ ] Documentation updated with schema authoring guide
