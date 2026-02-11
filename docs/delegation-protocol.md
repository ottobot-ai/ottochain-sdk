# OttoChain Delegation Protocol Specification

## Overview

The OttoChain Delegation Protocol enables gasless and automated transaction execution through two primary patterns: **Session Keys** and **Signed Intents**. This allows users to grant limited transaction authority to applications, bots, or services without compromising their primary keys.

## Protocol Architecture

### Core Components

1. **DelegationAuthority**: Core structure defining the delegation relationship
2. **DelegationScope**: Permissions and limitations for the delegation
3. **Session Keys**: Temporary signing keys with time-bound authority
4. **Signed Intents**: Pre-authorized transactions with specific conditions
5. **Relayed Transactions**: Transaction envelopes that prove delegation authority

### Delegation Approaches

#### 1. Session Key Pattern

Temporary signing keys with limited scope and lifetime:

```typescript
// Create session key delegation
const delegation = createDelegation({
  principalAddress: userAddress,
  delegateAddress: sessionServiceAddress,
  approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
  scope: combineScopes(
    actionFilter(['TransferTokens', 'UpdateProfile']),
    amountLimit(100),
    timeWindow(new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000))
  ),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});
```

**Use Cases:**
- Mobile apps requiring periodic authorization
- Trading bots with time-limited access
- Gaming applications with session-based permissions

#### 2. Signed Intent Pattern

Pre-signed transactions with specific execution conditions:

```typescript
// Create signed intent delegation
const delegation = createDelegation({
  principalAddress: userAddress,
  delegateAddress: subscriptionService,
  approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT,
  scope: combineScopes(
    actionFilter(['TransferTokens']),
    amountLimit(50),
    { policyRules: recurringPaymentConditions }
  ),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
});
```

**Use Cases:**
- Recurring subscriptions
- Scheduled payments
- Conditional transactions (price triggers, time-based execution)

## Security Model

### Trust Boundaries

1. **Principal Trust**: Users trust delegates with specific, limited actions
2. **Scope Isolation**: Delegations are restricted by fiber IDs, operations, amounts, and custom logic
3. **Time Bounds**: All delegations have expiry timestamps
4. **Revocation**: Principals can revoke delegations at any time

### Signature Verification

```typescript
// Delegation signature verification
const isValid = await verifyDelegationSignature(delegation, principalPublicKey);
```

**Signature Payload Structure:**
- Delegation ID
- Principal address
- Delegate address
- Scope definition
- Approach type
- Expiry timestamp
- Nonce for replay protection

### Scope Validation

#### Basic Scope Constraints

```protobuf
message DelegationScope {
  repeated string fiber_ids = 1;           // Specific fiber operations
  repeated string allowed_operations = 2;   // Transaction types
  optional int64 max_gas_per_tx = 3;       // Per-transaction gas limit
  optional int64 max_total_gas = 4;        // Total delegation gas limit
  optional google.protobuf.Value policy_rules = 5;  // JSON Logic policies
}
```

#### JSON Logic Policy Rules

Advanced validation using JSON Logic expressions:

```javascript
// Time-based restrictions
{
  "and": [
    { ">=": [{ "var": "current_time" }, "2024-01-01T00:00:00Z"] },
    { "<=": [{ "var": "current_time" }, "2024-12-31T23:59:59Z"] }
  ]
}

// Amount limitations
{
  "<=": [{ "var": "transaction.amount" }, 1000]
}

// Recipient restrictions
{
  "in": [
    { "var": "transaction.recipient" },
    ["DAG123...allowed1", "DAG456...allowed2"]
  ]
}

// Rate limiting
{
  "<=": [{ "var": "hourly_transaction_count" }, 10]
}
```

## Transaction Flow

### Session Key Flow

1. **Delegation Creation**: Principal creates and signs delegation
2. **Session Key Registration**: Session key registered with delegation ID
3. **Transaction Signing**: Session key signs transaction directly
4. **Validation**: Metagraph validates session key authority and scope
5. **Execution**: Transaction executed if validation passes

### Signed Intent Flow

1. **Intent Creation**: Principal pre-signs specific transaction intent
2. **Condition Monitoring**: Relayer monitors execution conditions
3. **Intent Submission**: Relayer submits intent when conditions are met
4. **Validation**: Metagraph validates intent signature and conditions
5. **Execution**: Transaction executed if all validations pass

## Implementation Details

### Nonce Management

- **Delegation Nonce**: Prevents replay of delegation creation
- **Intent Nonce**: Prevents replay of signed intents
- **Revocation Nonce**: Ensures revocation authenticity

### Gas Handling

```protobuf
enum FeePaymentMethod {
  FEE_PAYMENT_METHOD_RELAYER_PAYS = 1;     // Relayer covers all fees
  FEE_PAYMENT_METHOD_PRINCIPAL_PAYS = 2;   // Deducted from principal
  FEE_PAYMENT_METHOD_SPONSOR_PAYS = 3;     // Third-party sponsor
}
```

### State Management

- **Active Delegations**: Stored in metagraph state
- **Revoked Delegations**: Marked as revoked with timestamp
- **Usage Tracking**: Transaction counts and gas consumption per delegation

## SDK Usage

### Basic Delegation Creation

```typescript
import {
  createDelegation,
  signDelegation,
  submitDelegated,
  getDelegationStatus,
  listDelegations,
  revokeDelegation,
  signRevocation,
  submitRevocation,
  DelegationApproach,
  actionFilter,
  amountLimit,
  combineScopes,
} from '@ottochain/sdk';

// Create delegation
const delegation = createDelegation({
  principalAddress: 'DAG123...user',
  delegateAddress: 'DAG456...app',
  scope: combineScopes(
    actionFilter(['TransferTokens']),
    amountLimit(500)
  ),
  approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
  expiresAt: new Date(Date.now() + 86400000), // 24 hours
});

// Sign delegation
const signedDelegation = await signDelegation(delegation, privateKey);

// Validate before use
const validation = isDelegationValid(signedDelegation);
if (!validation.valid) {
  throw new Error(`Invalid delegation: ${validation.errors.join(', ')}`);
}
```

### Advanced Scope Configuration

```typescript
// Complex policy with multiple constraints
const advancedScope = combineScopes(
  actionFilter(['TransferTokens', 'UpdateMetadata']),
  amountLimit(1000),
  timeWindow(
    new Date('2024-06-01'),
    new Date('2024-12-31')
  ),
  {
    // Custom JSON Logic policy
    policyRules: Value.fromJson({
      and: [
        // Business hours only
        { ">=": [{ "var": "hour_of_day" }, 9] },
        { "<=": [{ "var": "hour_of_day" }, 17] },
        // Weekdays only
        { "in": [{ "var": "day_of_week" }, [1, 2, 3, 4, 5]] },
        // Maximum 5 transactions per day
        { "<=": [{ "var": "daily_transaction_count" }, 5] },
      ]
    })
  }
);
```

### Complete Delegation Workflow

The SDK provides methods for the complete delegation lifecycle including bridge integration:

```typescript
// Create and sign delegation
const delegation = createDelegation({
  principalAddress: userAddress,
  delegateAddress: relayerAddress,
  scope: combineScopes(
    actionFilter(['TransferTokens']),
    amountLimit(500)
  ),
  approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
  expiresAt: new Date(Date.now() + 86400000),
});

const signedDelegation = await signDelegation(delegation, privateKey);

// Submit delegated transaction via bridge
const transaction = {
  type: 'TransferTokens',
  recipient: 'DAG456...recipient',
  amount: 100,
};

const result = await submitDelegated(transaction, signedDelegation);
console.log('Transaction submitted:', result.txId);

// Check delegation status from bridge
const status = await getDelegationStatus(signedDelegation.delegationId);
console.log('Active:', status.active, 'Usage:', status.usageCount);

// List all delegations for user
const delegations = await listDelegations(userAddress, {
  includeExpired: false,
  includeRevoked: false,
});

// Revoke delegation via bridge
const revocation = revokeDelegation(signedDelegation.delegationId, 'No longer needed');
const signedRevocation = await signRevocation(revocation, privateKey);
await submitRevocation(signedRevocation);
```

### New SDK Methods

- **`submitDelegated(transaction, delegation, bridgeUrl?)`**: Submit delegated transaction to bridge
- **`getDelegationStatus(delegationId, bridgeUrl?)`**: Query delegation status from bridge  
- **`listDelegations(principalAddress, options?)`**: List delegations for a user
- **`signRevocation(revocation, privateKey)`**: Sign delegation revocation
- **`submitRevocation(revocation, bridgeUrl?)`**: Submit signed revocation to bridge

## Integration with Bridge

### Delegation Endpoints

- `POST /delegations` - Create delegation
- `DELETE /delegations/:id` - Revoke delegation
- `GET /delegations` - List active delegations
- `POST /delegations/submit` - Submit delegated transaction

### Bridge Validation Flow

1. Parse delegation proof from request
2. Verify delegation signature and expiry
3. Validate scope constraints
4. Check revocation status
5. Execute transaction if all checks pass

## Error Handling

### Common Error Scenarios

- **Expired Delegation**: Delegation past expiry timestamp
- **Revoked Delegation**: Delegation has been revoked by principal
- **Scope Violation**: Transaction outside delegation scope
- **Invalid Signature**: Delegation or transaction signature verification fails
- **Gas Exceeded**: Transaction would exceed gas limits

### Error Response Format

```json
{
  "error": "DELEGATION_EXPIRED",
  "message": "Delegation expired at 2024-06-01T12:00:00Z",
  "delegationId": "DAG123...abc-DEF456...def-1234567890-xyz",
  "timestamp": "2024-06-01T12:30:00Z"
}
```

## Security Considerations

### Best Practices

1. **Minimal Scope**: Grant minimum necessary permissions
2. **Short Expiry**: Use shortest practical delegation lifetime
3. **Regular Rotation**: Rotate session keys frequently
4. **Monitor Usage**: Track delegation usage for anomalies
5. **Revoke Promptly**: Revoke unused or compromised delegations

### Attack Vectors

- **Replay Attacks**: Mitigated by nonces and timestamps
- **Scope Escalation**: Prevented by strict validation
- **Key Compromise**: Limited by scope and expiry
- **DoS via Delegation**: Rate limiting and gas controls

### Audit Considerations

- All delegation operations are recorded on-chain
- Delegation usage is traceable
- Revocation events provide clear audit trail
- JSON Logic policies allow complex compliance rules

## Future Extensions

- **Multi-signature Delegations**: Require multiple approvals
- **Conditional Revocation**: Automatic revocation triggers
- **Delegation Templates**: Pre-defined delegation patterns
- **Cross-Chain Delegations**: Delegation across multiple networks

---

*This specification is part of the OttoChain SDK v0.1.0 and follows the protobuf definitions in `proto/ottochain/v1/delegation.proto`.*