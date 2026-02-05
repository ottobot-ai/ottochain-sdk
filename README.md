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
├── proto/                  # Protobuf definitions (source of truth)
│   └── ottochain/v1/
│       ├── common.proto
│       ├── fiber.proto
│       ├── messages.proto
│       └── records.proto
├── src/
│   ├── metakit/           # Signing, hashing, HTTP client
│   ├── ottochain/         # Domain types
│   ├── generated/         # Protobuf-generated code
│   └── index.ts
└── dist/                  # Compiled output
```

## License

Apache-2.0
