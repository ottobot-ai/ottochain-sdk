# @ottochain/sdk

TypeScript SDK for OttoChain metagraph on Constellation Network.

## Features

- **Transaction Signing** — Sign and batch-sign metagraph transactions
- **Key Management** — Generate and manage DAG keypairs
- **HTTP Client** — Interact with metagraph L0/L1 APIs
- **Type Definitions** — Full TypeScript types for OttoChain domain model

## Installation

```bash
# From npm (when published)
npm install @ottochain/sdk

# From GitHub (for development)
npm install github:ottobot-ai/ottochain-sdk#main
```

## Usage

```typescript
import { generateKeyPair, batchSign, HttpClient } from '@ottochain/sdk';

// Generate a new keypair
const keyPair = await generateKeyPair();
console.log('Address:', keyPair.address);

// Create HTTP client for metagraph
const client = new HttpClient('http://localhost:9200');

// Sign and submit a transaction
const payload = { /* your transaction data */ };
const signed = await batchSign(keyPair, [payload]);
await client.postDataTransaction(signed);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Generate protobuf types
npm run proto:generate
```

## Structure

```
ottochain-sdk/
├── proto/                           # Protobuf definitions (source of truth)
│   └── ottochain/
│       ├── v1/                      # Core metagraph types
│       │   ├── common.proto
│       │   ├── fiber.proto
│       │   ├── messages.proto
│       │   └── records.proto
│       └── apps/                    # Application-specific types
│           ├── identity/v1/
│           │   ├── agent.proto
│           │   └── attestation.proto
│           └── contracts/v1/
│               └── contract.proto
├── src/
│   ├── metakit/                     # Signing, hashing, HTTP client
│   ├── ottochain/                   # Core domain types
│   ├── apps/                        # Application modules
│   │   ├── identity/                # Agent Identity types
│   │   └── contracts/               # Contract types
│   ├── generated/                   # Protobuf-generated code
│   └── index.ts
└── dist/                            # Compiled output
```

## Imports

```typescript
// Core SDK (signing, HTTP client)
import { generateKeyPair, batchSign, HttpClient } from '@ottochain/sdk';

// Core types (fiber, state machine)
import { Fiber, StateMachineDefinition } from '@ottochain/sdk/core';

// Agent Identity application
import { AgentState, AttestationType, AgentIdentity } from '@ottochain/sdk/apps/identity';

// Contracts application
import { ContractState, Contract } from '@ottochain/sdk/apps/contracts';
```

## License

Apache-2.0
