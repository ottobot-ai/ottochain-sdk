# @ottochain/sdk

[![CI](https://github.com/ottobot-ai/ottochain-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/ottobot-ai/ottochain-sdk/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/ottobot-ai/ottochain-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/ottobot-ai/ottochain-sdk)
[![npm version](https://img.shields.io/npm/v/@ottochain/sdk.svg)](https://www.npmjs.com/package/@ottochain/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

TypeScript SDK for OttoChain metagraph on Constellation Network.

## Features

- **Transaction Signing** — Sign and batch-sign metagraph transactions
- **Key Management** — Generate and manage DAG keypairs  
- **HTTP Client** — Interact with metagraph L0/L1 APIs
- **Delegation Management** — Session key delegation, intent signing, and validation
- **Type Definitions** — Full TypeScript types for OttoChain domain model
- **Input Validation** — Runtime validation with Zod schemas
- **Custom Errors** — Structured error handling with error codes

## Installation

```bash
# From npm (when published)
npm install @ottochain/sdk

# From GitHub (for development)
npm install github:ottobot-ai/ottochain-sdk#main
```

## Quick Start

```typescript
import { 
  generateKeyPair, 
  createSignedObject, 
  DataL1Client 
} from '@ottochain/sdk';

// Generate a new keypair
const keyPair = generateKeyPair();
console.log('Address:', keyPair.address);

// Create and sign a transaction
const payload = { action: 'RegisterAgent', data: { displayName: 'MyAgent' } };
const signed = await createSignedObject(payload, keyPair.privateKey, { isDataUpdate: true });

// Submit to network
const client = new DataL1Client('http://localhost:9300');
await client.postData(signed);
```

## API Documentation

### Key Management

```typescript
import { 
  generateKeyPair,
  keyPairFromPrivateKey,
  isValidPrivateKey,
  isValidPublicKey,
  getAddress
} from '@ottochain/sdk';

// Generate new keypair
const keyPair = generateKeyPair();
// { privateKey: '...', publicKey: '...', address: 'DAG...' }

// Import from existing private key
const imported = keyPairFromPrivateKey(privateKeyHex);

// Validation
if (isValidPrivateKey(key)) {
  // Key is valid
}
```

### Signing Operations

```typescript
import {
  createSignedObject,
  batchSign,
  addSignature,
  sign,
  signDataUpdate
} from '@ottochain/sdk';

// Sign a single object
const signed = await createSignedObject(data, privateKey);

// Sign for DataUpdate (metagraph L1 submission)
const signedUpdate = await createSignedObject(data, privateKey, { isDataUpdate: true });

// Multi-party signing
const multiSig = await batchSign(data, [key1, key2, key3]);

// Add signature to existing signed object
const withMoreSigs = await addSignature(signed, anotherPrivateKey);
```

### Network Clients

```typescript
import { DataL1Client, CurrencyL1Client, HttpClient } from '@ottochain/sdk';

// Data L1 client (for metagraph state)
const dataClient = new DataL1Client('http://localhost:9300');
await dataClient.postData(signedTransaction);
const state = await dataClient.get('/state');

// Currency L1 client (for token transfers)
const currencyClient = new CurrencyL1Client('http://localhost:9200');
const balance = await currencyClient.getBalance(address);
const lastRef = await currencyClient.getLastReference(address);

// Generic HTTP client with custom timeout
const httpClient = new HttpClient('http://localhost:9000', 30000);
```

### Input Validation

The SDK uses [Zod](https://zod.dev) for runtime validation.

```typescript
import {
  validate,
  validatePrivateKey,
  validateAddress,
  safeParse,
  KeyPairSchema,
  ProposeContractRequestSchema
} from '@ottochain/sdk';

// Validate and throw on error
const validKey = validatePrivateKey(input);
const validAddress = validateAddress(input);

// Validate complex objects
const keyPair = validate(KeyPairSchema, inputData);
const request = validate(ProposeContractRequestSchema, requestData);

// Safe parsing (returns result object)
const result = safeParse(KeyPairSchema, input);
if (result.success) {
  console.log(result.data.address);
} else {
  console.log(result.error.message);
}
```

Available schemas:
- `KeyPairSchema` - Private/public key and address
- `SignatureProofSchema` - Signature proof format
- `CurrencyTransactionSchema` - Currency transfer transactions
- `AgentIdentityRegistrationSchema` - Agent registration
- `ProposeContractRequestSchema` - Contract proposals
- `AcceptContractRequestSchema` - Contract acceptance
- `CompleteContractRequestSchema` - Contract completion

### Delegation Management

The SDK provides comprehensive delegation management for agent-to-agent interactions:

```typescript
import { 
  DelegationClient, 
  DelegationHelpers,
  DELEGATION_CONSTANTS 
} from '@ottochain/sdk';

// Initialize delegation client
const client = new DelegationClient({
  bridgeUrl: 'https://bridge.ottochain.xyz',
  enableValidation: true,
  enableRevocationMonitoring: true,
});

// Create delegation scope for transfers
const scope = DelegationHelpers.createTransferScope(
  '100.0', // Max per transaction: 100 DAG
  '500.0'  // Max total: 500 DAG
);

// Create session key delegation
const delegation = await client.createSessionKey(
  userAddress,
  {
    delegateAddress: agentAddress,
    scope,
    expiryHours: 2,
    autoRevoke: true,
  },
  userSignature,
  nonce
);

// Sign an intent using the delegation
const intent = await client.signIntent(
  userAddress,
  {
    delegationId: delegation.delegationId,
    intent: myIntent,
    validateBeforeSign: true,
  },
  sessionKeyPrivateKey
);

// Check delegation status
const status = await client.checkDelegationStatus(delegation.delegationId);
console.log('Valid:', status.isValid);
console.log('Time remaining:', status.timeRemaining, 'seconds');

// Revoke when done
await client.revokeDelegation(
  delegation.delegationId,
  userAddress,
  'Task completed',
  revocationSignature,
  newNonce
);
```

**Delegation Helpers:**

```typescript
// Pre-configured scopes for common use cases
const transferScope = DelegationHelpers.createTransferScope('100', '500');
const marketScope = DelegationHelpers.createMarketScope('50', '200', 75);
const governanceScope = DelegationHelpers.createGovernanceScope(80);

// Validate custom scopes
const validation = DelegationHelpers.validateScope(customScope);
if (!validation.isValid) {
  console.log('Scope errors:', validation.errors);
}
```

**Delegation Constants:**

```typescript
// Available operations
DELEGATION_CONSTANTS.OPERATIONS.TRANSFER        // 'transfer'
DELEGATION_CONSTANTS.OPERATIONS.CREATE_MARKET   // 'create_market'
DELEGATION_CONSTANTS.OPERATIONS.VOTE            // 'vote'

// Time limits
DELEGATION_CONSTANTS.MAX_DELEGATION_DURATION_MS  // 24 hours
DELEGATION_CONSTANTS.DEFAULT_DELEGATION_DURATION_MS // 1 hour
```

## Error Handling

The SDK provides custom error classes for structured error handling.

```typescript
import {
  OttoChainError,
  NetworkError,
  ValidationError,
  SigningError,
  TransactionError,
  ErrorCode,
  isErrorCode
} from '@ottochain/sdk';

try {
  await client.postData(signed);
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Network failed:', error.statusCode, error.message);
    if (error.responseBody) {
      console.log('Response:', error.responseBody);
    }
  } else if (error instanceof ValidationError) {
    console.log('Invalid input:', error.field, error.message);
    console.log('Details:', error.details);
  } else if (error instanceof SigningError) {
    console.log('Signing failed:', error.operation);
  } else if (error instanceof TransactionError) {
    console.log('Transaction failed:', error.rejectionReason);
  }
  
  // Check specific error codes
  if (isErrorCode(error, ErrorCode.NETWORK_TIMEOUT)) {
    // Implement retry logic
  }
}
```

Error codes:
- `NETWORK_ERROR` - HTTP/connection failures
- `NETWORK_TIMEOUT` - Request timeout
- `VALIDATION_ERROR` - Input validation failed
- `SIGNING_ERROR` - Signature creation failed
- `TRANSACTION_REJECTED` - Transaction rejected by network
- `TRANSACTION_NOT_FOUND` - Transaction not found

## Examples

See the [examples/](./examples/) directory for complete working examples:

| Example | Description |
|---------|-------------|
| [agent-registration.ts](./examples/agent-registration.ts) | Register an agent identity |
| [contract-flow.ts](./examples/contract-flow.ts) | Full contract lifecycle (propose → accept → complete) |
| [batch-transactions.ts](./examples/batch-transactions.ts) | Multi-party signing and batch operations |
| [wallet-management.ts](./examples/wallet-management.ts) | Key generation, import, export, validation |
| [query-state.ts](./examples/query-state.ts) | Query network state and handle errors |
| [delegation-flow.ts](./examples/delegation-flow.ts) | Complete delegation workflow with session keys, intents, and validation |

Run an example:
```bash
npx ts-node examples/wallet-management.ts
```

## Module Imports

```typescript
// Core SDK (signing, HTTP client, validation, errors)
import { 
  generateKeyPair, 
  batchSign, 
  HttpClient,
  validate,
  ValidationError 
} from '@ottochain/sdk';

// Core types (fiber, state machine)
import { Fiber, StateMachineDefinition } from '@ottochain/sdk/core';

// Agent Identity application
import { AgentState, AttestationType, AgentIdentity } from '@ottochain/sdk/apps/identity';

// Contracts application
import { ContractState, Contract } from '@ottochain/sdk/apps/contracts';
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Lint
pnpm run lint

# Generate documentation
pnpm run docs

# Generate protobuf types
pnpm run generate
```

## Project Structure

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
│   ├── errors.ts                    # Custom error classes
│   ├── validation.ts                # Zod validation schemas
│   └── index.ts                     # Main exports
├── examples/                        # Working code examples
├── tests/                           # Test suites
└── dist/                            # Compiled output
```

## License

Apache-2.0

