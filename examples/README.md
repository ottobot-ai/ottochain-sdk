# OttoChain SDK Examples

This directory contains working examples demonstrating how to use the OttoChain SDK.

## Prerequisites

```bash
# Install dependencies
npm install

# Build the SDK (examples import from source)
npm run build
```

## Running Examples

Each example can be run with `ts-node`:

```bash
npx ts-node examples/<example-name>.ts
```

Or compile first:

```bash
npx tsc examples/*.ts --outDir examples/dist --esModuleInterop
node examples/dist/<example-name>.js
```

## Examples Overview

### 1. Agent Registration (`agent-registration.ts`)

Demonstrates how to register an agent identity on the OttoChain network.

```bash
npx ts-node examples/agent-registration.ts
```

**What it covers:**
- Generating a new keypair
- Creating a registration payload
- Validating input with Zod schemas
- Signing the registration
- Submitting to the network

### 2. Contract Flow (`contract-flow.ts`)

Shows the complete lifecycle of a contract between two agents.

```bash
npx ts-node examples/contract-flow.ts
```

**What it covers:**
- Proposing a contract with terms
- Accepting a proposed contract
- Completing a contract with proof
- Multi-party signing

### 3. Batch Transactions (`batch-transactions.ts`)

Demonstrates efficient batch signing and multi-signature scenarios.

```bash
npx ts-node examples/batch-transactions.ts
```

**What it covers:**
- Multi-party signing (all parties at once)
- Sequential signing (distributed parties)
- Batch processing multiple transactions
- Threshold signing (2-of-3)
- Signature verification

### 4. Wallet Management (`wallet-management.ts`)

Comprehensive guide to key pair management.

```bash
npx ts-node examples/wallet-management.ts
```

**What it covers:**
- Generating new wallets
- Importing from private key
- Key derivation (compressed/uncompressed)
- Validation (quick checks and Zod)
- Exporting for backup
- Batch generation

### 5. Query State (`query-state.ts`)

Shows how to query data from a running metagraph.

```bash
npx ts-node examples/query-state.ts
```

**What it covers:**
- Querying Data L1 endpoints
- Querying Currency L1 endpoints
- Custom HTTP client configuration
- Expected response formats
- Error handling patterns

## Environment Variables

Some examples can connect to a real metagraph. Set these environment variables:

```bash
# Data L1 endpoint (for state queries)
export METAGRAPH_DATA_URL=http://your-node:9300

# Currency L1 endpoint (for balance/transaction queries)
export METAGRAPH_CURRENCY_URL=http://your-node:9200

# Or specify when running:
METAGRAPH_DATA_URL=http://localhost:9300 npx ts-node examples/query-state.ts
```

## Common Patterns

### Error Handling

```typescript
import { ValidationError, NetworkError, SigningError } from '@ottochain/sdk';

try {
  const signed = await createSignedObject(data, privateKey);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Invalid input:', error.field, error.message);
  } else if (error instanceof SigningError) {
    console.log('Signing failed:', error.operation);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.statusCode, error.message);
  }
}
```

### Input Validation

```typescript
import { validate, ProposeContractRequestSchema } from '@ottochain/sdk';

// Throws ValidationError if invalid
const validatedRequest = validate(ProposeContractRequestSchema, inputData);

// Or use safe parsing
import { safeParse } from '@ottochain/sdk';
const result = safeParse(ProposeContractRequestSchema, inputData);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}
```

### Network Requests

```typescript
import { DataL1Client, HttpClient } from '@ottochain/sdk';

// Use specialized clients
const dataClient = new DataL1Client('http://localhost:9300');
await dataClient.postData(signedTransaction);

// Or use generic HTTP client
const httpClient = new HttpClient('http://localhost:9300', 10000); // 10s timeout
await httpClient.get('/custom/endpoint');
```

## Tips

1. **Never log private keys** in production code
2. **Always validate** input before signing
3. **Handle errors** appropriately - network failures are common
4. **Use TypeScript** for type safety and better IDE support
5. **Check transaction status** after submission

## Further Reading

- [API Documentation](../docs/) - Full TypeDoc reference
- [README](../README.md) - Getting started guide
- [Source Code](../src/) - Implementation details
