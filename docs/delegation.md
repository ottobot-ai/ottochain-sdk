# Delegation API Documentation

OttoChain SDK provides comprehensive delegation support through two complementary approaches:

1. **Functional API** - Simple utility functions for basic delegation operations
2. **Class-based API** - Object-oriented management for complex delegation workflows

## Overview

Delegation allows users to authorize relayers to submit transactions on their behalf, enabling gas-less transactions, automated execution, and improved UX. OttoChain supports two delegation approaches:

- **Session Keys** - Temporary signing keys with limited scope and lifetime
- **Signed Intents** - Pre-signed transaction templates executed when conditions are met

## Functional API

Import delegation utilities:

```typescript
import {
  createDelegation,
  signDelegation,
  submitDelegated,
  revokeDelegation,
  signRevocation,
  submitRevocation,
  getDelegationStatus,
  listDelegations,
  combineScopes,
  timeWindow,
  actionFilter,
  amountLimit,
  DelegationApproach,
  FeePaymentMethod
} from '@ottochain/sdk';
```

### Basic Usage

```typescript
// 1. Create delegation scope
const scope = combineScopes(
  actionFilter(['CreateFiber', 'TransitionFiber']),
  timeWindow(new Date(), new Date(Date.now() + 3600000)), // 1 hour
  amountLimit(1000) // Max 1000 tokens per transaction
);

// 2. Create delegation
const delegation = createDelegation({
  principalAddress: userAddress,
  delegateAddress: relayerAddress,
  scope,
  approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
  expiresAt: new Date(Date.now() + 3600000) // 1 hour
});

// 3. Sign delegation
const signedDelegation = await signDelegation(delegation, userPrivateKey);

// 4. Submit transaction via delegation
const result = await submitDelegated(
  {
    type: 'CreateFiber',
    fiberId: 'my-fiber-123',
    definition: { name: 'My Fiber' }
  },
  signedDelegation,
  'https://bridge.ottochain.ai'
);

// 5. Check delegation status
const status = await getDelegationStatus(delegation.delegationId);
console.log('Active:', status.active, 'Usage:', status.usageCount);

// 6. Revoke delegation
const revocation = revokeDelegation(delegation.delegationId, 'No longer needed');
const signedRevocation = await signRevocation(revocation, userPrivateKey);
await submitRevocation(signedRevocation);
```

### Pattern Helpers

```typescript
// Time-based restrictions
const businessHours = timeWindow(
  new Date('2024-01-01T09:00:00Z'),
  new Date('2024-01-01T17:00:00Z')
);

// Action restrictions
const readOnlyActions = actionFilter(['GetFiberState', 'QueryFibers']);

// Spending limits
const microTransactions = amountLimit(10);

// Combine multiple constraints
const restrictedScope = combineScopes(
  businessHours,
  readOnlyActions,
  microTransactions
);
```

## Class-based API

Import delegation classes:

```typescript
import {
  DelegationManager,
  DelegationBuilder,
  RelayerClient,
  DelegationApproach,
  FeePaymentMethod
} from '@ottochain/sdk';
```

### DelegationManager

Central management for delegation lifecycle:

```typescript
const config = {
  bridgeUrl: 'https://bridge.ottochain.ai',
  defaultGasConfig: {
    gasLimit: 500000,
    paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
  },
  timeout: 30000
};

const delegationManager = new DelegationManager(config);

// Signing function (implement with your wallet)
async function signMessage(message: string) {
  return {
    signature: await wallet.sign(message),
    publicKey: wallet.publicKey
  };
}

// Create and manage delegation
const delegation = await delegationManager.createDelegation({
  principalAddress: userAddress,
  delegateAddress: relayerAddress,
  scope: DelegationBuilder.createScope({
    allowedOperations: ['CreateFiber', 'TransitionFiber'],
    maxGasPerTx: 100000
  }),
  approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
}, signMessage);

// Submit to bridge
await delegationManager.submitDelegation(delegation);

// Check status
const status = await delegationManager.getDelegationStatus(delegation.delegationId);
```

### Session Keys

For temporary signing authority:

```typescript
// Generate session key pair
const sessionKeyPair = DelegationBuilder.generateKeyPair();

// Create session key
const sessionKey = await delegationManager.createSessionKey({
  delegationId: delegation.delegationId,
  sessionKeyPair,
  sessionExpiresAt: new Date(Date.now() + 1800000) // 30 minutes
}, signMessage);

// Submit session key
await delegationManager.submitSessionKey(sessionKey);

// Use relayer with session key
const relayerClient = new RelayerClient(
  config,
  relayerAddress,
  delegationManager
);

const result = await relayerClient.submitWithSessionKey(
  { type: 'CreateFiber', fiberId: 'new-fiber' },
  delegation.delegationId,
  sessionKeyPair.privateKey
);
```

### Signed Intents

For pre-authorized transactions:

```typescript
// Create signed intent
const signedIntent = await delegationManager.createSignedIntent({
  delegationId: delegation.delegationId,
  transaction: {
    type: 'TransitionFiber',
    fiberId: 'market-fiber-123',
    newState: 'OPEN'
  },
  intentExpiresAt: new Date(Date.now() + 600000), // 10 minutes
  executionConditions: {
    // JSON Logic conditions
    'and': [
      { '>=': [{ 'var': 'currentTime' }, 1640995200] },
      { '<=': [{ 'var': 'marketVolume' }, 5000] }
    ]
  }
}, signMessage);

// Submit intent
await delegationManager.submitSignedIntent(signedIntent);

// Execute when conditions are met
const result = await relayerClient.submitWithSignedIntent(
  delegation.delegationId,
  signedIntent.intentNonce,
  { currentTime: Date.now(), marketVolume: 3000 }
);
```

### RelayerClient

For relayer services:

```typescript
const relayerClient = new RelayerClient(
  config,
  relayerAddress
);

// Get available transactions to relay
const relayableTransactions = await relayerClient.getRelayableTransactions(delegationId);

// Estimate gas costs
const gasEstimate = await relayerClient.estimateGas(transaction, delegationId);

// Submit with custom gas config
const result = await relayerClient.submitWithSessionKey(
  transaction,
  delegationId,
  sessionPrivateKey,
  {
    gasLimit: 200000,
    gasPrice: 20000000000,
    paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_PRINCIPAL_PAYS
  }
);
```

## Security Considerations

### Scope Limitations

Always use the principle of least privilege:

```typescript
// ❌ Overly broad scope
const broadScope = DelegationBuilder.createScope({
  allowedOperations: ['*'], // Allows everything
  fiberIds: [] // No fiber restrictions
});

// ✅ Specific scope
const specificScope = DelegationBuilder.createScope({
  allowedOperations: ['CreateFiber'], // Only fiber creation
  fiberIds: ['specific-fiber-123'], // Only this fiber
  maxGasPerTx: 50000, // Limited gas per transaction
  maxTotalGas: 500000 // Limited total gas
});
```

### Time Limits

Set appropriate expiration times:

```typescript
// ✅ Short-lived delegation
const delegation = await delegationManager.createDelegation({
  // ...
  expiresAt: new Date(Date.now() + 3600000) // 1 hour
}, signMessage);

// ✅ Session key with even shorter expiry
const sessionKey = await delegationManager.createSessionKey({
  delegationId: delegation.delegationId,
  sessionKeyPair,
  sessionExpiresAt: new Date(Date.now() + 900000) // 15 minutes
}, signMessage);
```

### Revocation

Always provide revocation capability:

```typescript
// Monitor delegation usage
const status = await delegationManager.getDelegationStatus(delegationId);
if (status.usageCount > expectedUsage) {
  // Revoke if suspicious activity
  const revocation = await delegationManager.revokeDelegation(
    delegationId,
    'Suspicious activity detected',
    signMessage
  );
  await delegationManager.submitRevocation(revocation);
}
```

## Error Handling

```typescript
import { OttoChainError, ErrorCode } from '@ottochain/sdk';

try {
  const result = await relayerClient.submitWithSessionKey(
    transaction,
    delegationId,
    sessionPrivateKey
  );
} catch (error) {
  if (error instanceof OttoChainError) {
    switch (error.code) {
      case ErrorCode.DELEGATION_EXPIRED:
        console.log('Delegation has expired, create a new one');
        break;
      case ErrorCode.DELEGATION_REVOKED:
        console.log('Delegation was revoked');
        break;
      case ErrorCode.INSUFFICIENT_PERMISSIONS:
        console.log('Transaction not allowed by delegation scope');
        break;
      default:
        console.log('Unknown delegation error:', error.message);
    }
  } else {
    console.log('Network or other error:', error.message);
  }
}
```

## Advanced Patterns

### Conditional Execution

Use JSON Logic for complex conditions:

```typescript
const marketCloseIntent = await delegationManager.createSignedIntent({
  delegationId: delegation.delegationId,
  transaction: {
    type: 'TransitionFiber',
    fiberId: 'market-123',
    newState: 'CLOSED'
  },
  executionConditions: {
    'or': [
      // Close if time reached
      { '>=': [{ 'var': 'currentTime' }, marketEndTime] },
      // Close if volume threshold reached
      { '>=': [{ 'var': 'marketVolume' }, maxVolume] },
      // Close if emergency signal
      { '===': [{ 'var': 'emergencyStop' }, true] }
    ]
  }
}, signMessage);
```

### Multi-step Workflows

Chain multiple delegations:

```typescript
// Step 1: Create market
const createIntent = await delegationManager.createSignedIntent({
  delegationId: delegation.delegationId,
  transaction: { type: 'CreateMarket', /* ... */ },
  executionConditions: { '>=': [{ 'var': 'currentTime' }, startTime] }
}, signMessage);

// Step 2: Open market (depends on step 1)
const openIntent = await delegationManager.createSignedIntent({
  delegationId: delegation.delegationId,
  transaction: { type: 'OpenMarket', /* ... */ },
  executionConditions: {
    'and': [
      { '>=': [{ 'var': 'currentTime' }, startTime + 60000] }, // 1 minute later
      { '===': [{ 'var': 'marketExists' }, true] } // After creation
    ]
  }
}, signMessage);
```

## Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { DelegationManager, DelegationBuilder } from '@ottochain/sdk';

describe('Delegation', () => {
  it('should create and validate delegation', async () => {
    const manager = new DelegationManager(testConfig);
    
    const delegation = await manager.createDelegation({
      principalAddress: '0x1234...',
      delegateAddress: '0x5678...',
      scope: DelegationBuilder.createScope({
        allowedOperations: ['CreateFiber']
      }),
      approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
    }, mockSigningFunction);
    
    expect(delegation.delegationId).toBeTruthy();
    expect(delegation.principalSignature).toBeTruthy();
    
    const errors = DelegationBuilder.validateDelegation(delegation);
    expect(errors).toHaveLength(0);
  });
});
```

## API Reference

### DelegationManager

- `createDelegation(options, signingFunction)` - Create and sign delegation
- `createSessionKey(options, signingFunction)` - Create session key
- `createSignedIntent(options, signingFunction)` - Create signed intent
- `revokeDelegation(delegationId, reason, signingFunction)` - Revoke delegation
- `submitDelegation(delegation)` - Submit to bridge
- `submitSessionKey(sessionKey)` - Submit session key
- `submitSignedIntent(signedIntent)` - Submit signed intent
- `submitRevocation(revocation)` - Submit revocation
- `getDelegationStatus(delegationId)` - Query delegation status
- `getActiveDelegations()` - List active delegations
- `cleanup()` - Remove expired delegations

### RelayerClient

- `submitWithSessionKey(transaction, delegationId, sessionPrivateKey, gasConfig?, signingFunction?)` - Submit using session key
- `submitWithSignedIntent(delegationId, intentNonce, conditionProof?, gasConfig?)` - Submit using signed intent
- `estimateGas(transaction, delegationId)` - Estimate gas costs
- `getRelayableTransactions(delegationId)` - Get available transactions
- `getDelegationStatus(delegationId)` - Query delegation status

### DelegationBuilder

- `createDelegation(options)` - Create delegation structure
- `createSessionKey(options)` - Create session key structure
- `createSignedIntent(options)` - Create signed intent structure
- `createScope(options)` - Create delegation scope
- `generateKeyPair()` - Generate key pair for session keys
- `validateDelegation(delegation)` - Validate delegation structure

For complete type definitions, see the generated TypeScript interfaces from the protobuf definitions.