# Delegation Protocol Integration Guide

## Overview

This document explains how the delegation protocol integrates with existing OttoChain systems and types.

## Integration with OttoChain Types

### Message Integration

The delegation protocol extends the existing OttoChain message system by adding new transaction types to the core fiber transaction definitions.

#### Core Fiber Updates

The existing `ottochain/v1/messages.proto` should be extended to include delegation operations:

```protobuf
// Addition to existing UpdateMessage oneof
message UpdateMessage {
  oneof update {
    // ... existing update types ...
    
    // Delegation operations
    ottochain.apps.delegation.v1.CreateDelegationRequest create_delegation = 20;
    ottochain.apps.delegation.v1.RevokeDelegationRequest revoke_delegation = 21;
    ottochain.apps.delegation.v1.DelegatedTransaction delegated_transaction = 22;
  }
}
```

### State Integration

Delegation state integrates with the OttoChain metagraph state system:

```scala
// Addition to existing metagraph state
case class MetagraphState(
  // ... existing state fields ...
  delegationState: DelegationState
)

case class DelegationState(
  activeDelegations: Map[String, Delegation],
  delegationNonces: Map[String, Long],
  usageTracking: Map[String, DelegationUsage],
  revokedDelegations: Set[String]
)
```

## Fiber Transaction Validation

### Existing Validation Pipeline

The delegation system integrates with OttoChain's existing validation pipeline:

1. **Bridge Validation** - Quick scope checks for performance
2. **Consensus Validation** - Full delegation verification during consensus
3. **State Updates** - Delegation usage tracking and state transitions

### Validation Integration Points

```scala
// Integration with existing DataUpdate validation
trait DelegatedUpdateValidator extends DataUpdateValidator {
  
  def validateDelegatedTransaction(
    delegatedTx: DelegatedTransaction,
    currentState: MetagraphState
  ): ValidationResult = {
    
    for {
      delegation <- getDelegation(delegatedTx.delegationId, currentState)
      _ <- validateDelegationActive(delegation)
      _ <- validateRelayerSignature(delegatedTx, delegation.relayerPublicKey)
      _ <- validateScope(delegatedTx, delegation.scope)
      _ <- validateNonce(delegatedTx, currentState.delegationState.delegationNonces)
    } yield ValidationSuccess
  }
  
  def updateDelegationUsage(
    delegatedTx: DelegatedTransaction,
    state: MetagraphState
  ): MetagraphState = {
    // Update spending limits, transaction counts, etc.
    state.copy(
      delegationState = state.delegationState.copy(
        usageTracking = updateUsageTracking(delegatedTx, state.delegationState.usageTracking)
      )
    )
  }
}
```

## JSON Logic Virtual Machine Integration

### Delegation Operators

The delegation system can integrate with OttoChain's JLVM for complex policy evaluation:

```scala
// New JLVM operators for delegation
object DelegationOperators {
  
  val ValidateDelegation = JsonLogicOperator(
    name = "validate_delegation",
    arity = 2, // (delegation_id, context)
    evaluator = (args: List[JsonLogicValue], context: JsonLogicContext) => {
      // Validate delegation exists and is active
    }
  )
  
  val CheckDelegationScope = JsonLogicOperator(
    name = "check_delegation_scope", 
    arity = 3, // (delegation_id, transaction, operation_type)
    evaluator = (args: List[JsonLogicValue], context: JsonLogicContext) => {
      // Check if operation is within delegation scope
    }
  )
  
  val GetDelegationUsage = JsonLogicOperator(
    name = "get_delegation_usage",
    arity = 2, // (delegation_id, asset_type)
    evaluator = (args: List[JsonLogicValue], context: JsonLogicContext) => {
      // Return current usage for spending limit checks
    }
  )
}
```

### Policy Examples

Complex delegation policies using JSON Logic:

```json
{
  "comment": "Trading bot policy - only allow market operations during business hours",
  "and": [
    {"validate_delegation": ["delegation_123", {"var": "context"}]},
    {"in": [{"var": "transaction.type"}, ["market_commit", "market_claim"]]},
    {">=": [{"var": "context.hour"}, 9]},
    {"<=": [{"var": "context.hour"}, 17]},
    {"<=": [
      {"+": [
        {"get_delegation_usage": ["delegation_123", "DAG"]},
        {"var": "transaction.amount"}
      ]},
      1000
    ]}
  ]
}
```

## Bridge API Integration

### Route Structure

The delegation endpoints integrate with the existing bridge route structure:

```typescript
// Addition to existing bridge routes
// packages/bridge/src/routes/index.ts

import { delegationRouter } from './delegation';

app.use('/api/delegations', delegationRouter);
```

### Delegation Router

```typescript
// packages/bridge/src/routes/delegation.ts

import { Router } from 'express';
import { validateDelegationRequest, submitDelegatedTransaction } from '../middleware/delegation';

const router = Router();

// Create delegation
router.post('/', validateDelegationRequest, async (req, res) => {
  const { delegation } = req.body;
  
  try {
    const result = await createDelegation(delegation);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit delegated transaction
router.post('/submit', async (req, res) => {
  const { delegatedTransaction } = req.body;
  
  try {
    const result = await submitDelegatedTransaction(delegatedTransaction);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Query delegations
router.get('/', async (req, res) => {
  const { delegatorAddress, relayerPublicKey, status } = req.query;
  
  const delegations = await queryDelegations({
    delegatorAddress: delegatorAddress as string,
    relayerPublicKey: relayerPublicKey as string,
    statusFilter: status as DelegationStatus
  });
  
  res.json(delegations);
});

// Revoke delegation
router.delete('/:delegationId', async (req, res) => {
  const { delegationId } = req.params;
  const { signature, nonce } = req.body;
  
  try {
    const result = await revokeDelegation(delegationId, signature, nonce);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as delegationRouter };
```

## SDK Integration

### TypeScript Types

The delegation protocol generates TypeScript types that integrate with existing SDK patterns:

```typescript
// Generated from protobuf
export interface Delegation {
  delegationId: string;
  delegatorAddress: string;
  relayerPublicKey: string;
  scope: DelegationScope;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  delegatorSignature: string;
  nonce: number;
  status: DelegationStatus;
}

// SDK helper methods
export class DelegationManager {
  
  async createDelegation(
    scope: DelegationScope,
    expiresAt: Date,
    delegatorPrivateKey: string
  ): Promise<CreateDelegationResponse> {
    // Implementation
  }
  
  async submitDelegatedTransaction(
    transaction: FiberTransaction,
    delegationId: string,
    relayerPrivateKey: string
  ): Promise<SubmitDelegatedTransactionResponse> {
    // Implementation
  }
  
  async revokeDelegation(
    delegationId: string,
    delegatorPrivateKey: string
  ): Promise<RevokeDelegationResponse> {
    // Implementation  
  }
  
  async queryDelegations(
    filters: GetDelegationsRequest
  ): Promise<GetDelegationsResponse> {
    // Implementation
  }
}
```

### Integration with Existing SDK Patterns

```typescript
// Integration with existing OttoChain SDK
import { OttoChainClient } from '@ottochain/sdk';
import { DelegationManager } from '@ottochain/sdk/delegation';

const client = new OttoChainClient({
  bridgeUrl: 'https://bridge.ottochain.ai',
  privateKey: userPrivateKey
});

const delegationManager = new DelegationManager(client);

// Create delegation for mobile app
const delegation = await delegationManager.createDelegation(
  {
    timeWindow: {
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    spendingLimits: [
      { assetType: 'DAG', maxAmount: '100.0', currentUsed: '0' }
    ],
    allowedTransactionTypes: ['transfer', 'fiber_transition']
  },
  new Date(Date.now() + 24 * 60 * 60 * 1000),
  userPrivateKey
);
```

## Database Schema Integration

### PostgreSQL Integration

The delegation system integrates with the existing indexer database:

```sql
-- Addition to existing database schema
-- packages/indexer/migrations/

CREATE TABLE delegations (
    delegation_id VARCHAR(64) PRIMARY KEY,
    delegator_address VARCHAR(128) NOT NULL,
    relayer_public_key VARCHAR(130) NOT NULL,
    scope JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    delegator_signature TEXT NOT NULL,
    nonce BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_block BIGINT,
    revoked_block BIGINT,
    CONSTRAINT delegations_status_check CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED', 'EXHAUSTED'))
);

CREATE INDEX idx_delegations_delegator ON delegations(delegator_address);
CREATE INDEX idx_delegations_relayer ON delegations(relayer_public_key);
CREATE INDEX idx_delegations_status ON delegations(status);
CREATE INDEX idx_delegations_expires ON delegations(expires_at);

CREATE TABLE delegation_usage (
    delegation_id VARCHAR(64) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    amount_used DECIMAL(38,18) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (delegation_id, asset_type),
    FOREIGN KEY (delegation_id) REFERENCES delegations(delegation_id) ON DELETE CASCADE
);

CREATE TABLE delegated_transactions (
    transaction_hash VARCHAR(64) PRIMARY KEY,
    delegation_id VARCHAR(64) NOT NULL,
    relayer_signature TEXT NOT NULL,
    nonce BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    block_ordinal BIGINT,
    success BOOLEAN,
    error_message TEXT,
    FOREIGN KEY (delegation_id) REFERENCES delegations(delegation_id)
);

CREATE INDEX idx_delegated_transactions_delegation ON delegated_transactions(delegation_id);
CREATE INDEX idx_delegated_transactions_block ON delegated_transactions(block_ordinal);
```

## Explorer Integration

### GraphQL Schema Extension

```graphql
# Addition to existing explorer GraphQL schema

type Delegation {
  delegationId: String!
  delegatorAddress: String!
  relayerPublicKey: String!
  scope: DelegationScope!
  expiresAt: DateTime!
  createdAt: DateTime!
  status: DelegationStatus!
  usage: [DelegationUsage!]!
  transactions: [DelegatedTransaction!]!
}

type DelegationScope {
  timeWindow: TimeWindow!
  allowedTransactionTypes: [String!]!
  spendingLimits: [SpendingLimit!]!
  allowedFiberIds: [String!]!
  maxTransactionCount: Int
}

type DelegatedTransaction {
  transactionHash: String!
  delegationId: String!
  createdAt: DateTime!
  blockOrdinal: String!
  success: Boolean!
  errorMessage: String
}

enum DelegationStatus {
  ACTIVE
  REVOKED  
  EXPIRED
  EXHAUSTED
}

extend type Query {
  delegation(delegationId: String!): Delegation
  delegations(
    delegatorAddress: String
    relayerPublicKey: String
    status: DelegationStatus
    limit: Int = 20
    offset: Int = 0
  ): [Delegation!]!
}
```

## Migration Path

### Phase 1: Protocol Definition ✅
- [x] Protobuf schema definition
- [x] Protocol specification documentation  
- [x] Integration documentation

### Phase 2: Core Implementation
- [ ] JSON Logic operators for delegation validation
- [ ] Metagraph state integration and validation
- [ ] Database schema migration

### Phase 3: API Implementation  
- [ ] Bridge route implementation
- [ ] SDK delegation manager
- [ ] Error handling and validation middleware

### Phase 4: Frontend Integration
- [ ] Explorer UI for delegation visibility
- [ ] GraphQL resolvers for delegation queries
- [ ] Admin tools for delegation management

### Phase 5: Testing & Documentation
- [ ] End-to-end testing suite
- [ ] Integration testing with real delegations
- [ ] Developer documentation and examples

## Security Considerations

### Scope Enforcement Layers

1. **Bridge Layer**: Fast validation for API performance
2. **Consensus Layer**: Authoritative validation during transaction processing  
3. **State Layer**: Usage tracking and limit enforcement
4. **JLVM Layer**: Complex policy evaluation for advanced use cases

### Signature Verification

All delegation operations use standard OttoChain cryptographic primitives:

- ECDSA signatures on secp256k1 curve
- Keccak-256 message hashing  
- Standard message formatting for signature verification
- Public key recovery for signature validation

### Nonce Management  

- Monotonic nonces prevent replay attacks
- Per-delegation nonce tracking  
- Nonce validation at both bridge and consensus layers
- Expired delegations invalidate all associated nonces

This integration approach ensures the delegation protocol works seamlessly with existing OttoChain systems while maintaining security and performance requirements.