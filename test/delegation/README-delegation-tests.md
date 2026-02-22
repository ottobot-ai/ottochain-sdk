# SDK Delegation Methods - TDD Test Suite

## Overview

This directory contains comprehensive TDD tests for the SDK delegation methods that enable users to authorize relayers to submit transactions on their behalf. The tests cover both functional and class-based APIs as specified in `docs/delegation.md`.

**Card:** 📦 SDK: Methods for creating and signing delegations (#699621c0d648e9fa7c3f1420)  
**Epic:** Delegated Signing / Relayer Pattern  
**Status:** TDD Red Phase - All tests currently FAIL awaiting implementation

## Test Files

### 1. `functional-api.test.ts` - Functional API Tests
- **Core Functions:** createDelegation, signDelegation, submitDelegated, revokeDelegation
- **Scope Management:** combineScopes, timeWindow, actionFilter, amountLimit  
- **Status Operations:** getDelegationStatus, listDelegations
- **Error Handling:** Comprehensive error scenarios and validation
- **Coverage:** 45+ test scenarios across delegation lifecycle

### 2. `delegation-manager.test.ts` - DelegationManager Class Tests
- **Lifecycle Management:** Create, submit, revoke, cleanup delegations
- **Session Keys:** Generate and manage temporary signing keys
- **Signed Intents:** Create conditional execution transactions  
- **Event Handling:** Delegation lifecycle events
- **Coverage:** 40+ test scenarios across class methods

### 3. `relayer-client.test.ts` - RelayerClient Class Tests
- **Transaction Submission:** submitWithSessionKey, submitWithSignedIntent
- **Gas Estimation:** estimateGas, estimateOptimalGas
- **Transaction Discovery:** getRelayableTransactions with filtering
- **Batch Operations:** Efficient multi-transaction submission
- **Coverage:** 35+ test scenarios for relayer operations

### 4. `delegation-builder.test.ts` - DelegationBuilder Utility Tests
- **Structure Creation:** createDelegation, createScope, createSessionKey, createSignedIntent
- **Cryptography:** generateKeyPair, key validation, signature verification
- **Validation:** comprehensive delegation validation with detailed error reporting
- **JSON Logic:** Integration with conditional execution expressions
- **Coverage:** 30+ test scenarios for utility functions

## Implementation Requirements

Based on the failing tests, the following components need to be implemented:

### Directory Structure
```
src/delegation/
├── functional.ts          # Functional API exports
├── manager.ts             # DelegationManager class
├── relayer-client.ts      # RelayerClient class
├── builder.ts             # DelegationBuilder utilities
├── types.ts               # TypeScript interfaces
└── index.ts               # Main exports
```

### Key Interfaces

```typescript
// Core delegation structure
interface Delegation {
  delegationId: string;
  principalAddress: string;
  delegateAddress: string;
  principalSignature?: string;
  scope: DelegationScope;
  approach: DelegationApproach;
  expiresAt: Date;
  createdAt: Date;
  version: string;
  isActive: boolean;
}

// Delegation scope constraints
interface DelegationScope {
  allowedOperations: string[];
  maxGasPerTx?: number;
  maxTotalGas?: number;
  fiberIds?: string[];
  timeRestrictions?: TimeRestriction;
  wildcardSupported?: boolean;
}

// Session key for temporary signing
interface SessionKey {
  sessionId: string;
  delegationId: string;
  sessionPublicKey: string;
  sessionExpiresAt: Date;
  permissions: SessionPermissions;
  usageCount: number;
  isActive: boolean;
}

// Signed intent for conditional execution
interface SignedIntent {
  intentId: string;
  delegationId: string;
  transaction: any;
  intentExpiresAt: Date;
  executionConditions: JSONLogicExpression;
  intentNonce: string;
  executionStatus: 'pending' | 'executed' | 'expired' | 'failed';
}

// Delegation approaches
enum DelegationApproach {
  DELEGATION_APPROACH_SESSION_KEY = 'session_key',
  DELEGATION_APPROACH_SIGNED_INTENT = 'signed_intent'
}

// Fee payment methods
enum FeePaymentMethod {
  FEE_PAYMENT_METHOD_RELAYER_PAYS = 'relayer_pays',
  FEE_PAYMENT_METHOD_PRINCIPAL_PAYS = 'principal_pays'
}
```

### Functional API

```typescript
// Core delegation functions
export function createDelegation(options: CreateDelegationOptions): Delegation;
export function signDelegation(delegation: Delegation, privateKeyOrSigner: string | SigningFunction): Promise<Delegation>;
export function submitDelegated(transaction: any, delegation: Delegation, bridgeUrl: string): Promise<SubmissionResult>;
export function revokeDelegation(delegationId: string, reason?: string): Revocation;
export function signRevocation(revocation: Revocation, privateKeyOrSigner: string | SigningFunction): Promise<Revocation>;
export function submitRevocation(signedRevocation: Revocation): Promise<void>;

// Status and management
export function getDelegationStatus(delegationId: string): Promise<DelegationStatus>;
export function listDelegations(filters?: DelegationFilters): Promise<Delegation[]>;

// Scope management utilities
export function combineScopes(...scopes: PartialScope[]): DelegationScope;
export function timeWindow(start: Date, end: Date): TimeRestriction;
export function actionFilter(operations: string[]): OperationRestriction;
export function amountLimit(maxAmount: number): AmountRestriction;
```

### Class-based API

```typescript
// Central delegation management
export class DelegationManager {
  constructor(config: DelegationManagerConfig);
  
  async createDelegation(options: CreateDelegationOptions, signingFunction: SigningFunction): Promise<Delegation>;
  async createSessionKey(options: CreateSessionKeyOptions, signingFunction: SigningFunction): Promise<SessionKey>;
  async createSignedIntent(options: CreateSignedIntentOptions, signingFunction: SigningFunction): Promise<SignedIntent>;
  
  async submitDelegation(delegation: Delegation): Promise<SubmissionResult>;
  async submitSessionKey(sessionKey: SessionKey): Promise<SubmissionResult>;
  async submitSignedIntent(signedIntent: SignedIntent): Promise<SubmissionResult>;
  
  async getDelegationStatus(delegationId: string): Promise<DelegationStatus>;
  async revokeDelegation(delegationId: string, reason: string, signingFunction: SigningFunction): Promise<Revocation>;
  async submitRevocation(revocation: Revocation): Promise<void>;
  
  getActiveDelegations(): Delegation[];
  async cleanup(): Promise<CleanupResult>;
  
  // Event emitter for delegation lifecycle
  on(event: string, listener: Function): void;
}

// Relayer-side operations
export class RelayerClient {
  constructor(config: RelayerClientConfig, relayerAddress: string, delegationManager?: DelegationManager);
  
  async submitWithSessionKey(transaction: any, delegationId: string, sessionPrivateKey: string, gasConfig?: GasConfig, signingFunction?: SigningFunction, options?: SubmissionOptions): Promise<SubmissionResult>;
  async submitWithSignedIntent(delegationId: string, intentNonce: string, conditionProof?: any, gasConfig?: GasConfig): Promise<SubmissionResult>;
  async submitBatchWithSessionKey(transactions: any[], delegationId: string, sessionPrivateKey: string, gasConfig?: GasConfig): Promise<SubmissionResult[]>;
  
  async estimateGas(transaction: any, delegationId: string): Promise<GasEstimate>;
  async estimateOptimalGas(transaction: any, delegationId: string): Promise<OptimalGasEstimate>;
  
  async getRelayableTransactions(delegationId: string, capabilities?: RelayerCapabilities): Promise<RelayableTransaction[]>;
  async getDelegationStatus(delegationId: string): Promise<DelegationStatus>;
}

// Utility builder class
export class DelegationBuilder {
  static createDelegation(options: any): Delegation;
  static createSessionKey(options: any): SessionKey;
  static createSignedIntent(options: any): SignedIntent;
  static createScope(options: any): DelegationScope;
  
  static generateKeyPair(keyType?: string): KeyPair;
  static derivePublicKey(privateKey: string): string;
  
  static validateDelegation(delegation: any): ValidationError[];
  static validateJSONLogic(expression: any): void;
  static extractJSONLogicVariables(expression: any): Set<string>;
  
  static isOperationAllowed(operation: string, scope: DelegationScope): boolean;
  static isTimeAllowed(scope: DelegationScope, time?: Date): boolean;
  static getRemainingGasAllowance(scope: DelegationScope, currentUsage: number): GasAllowance;
  
  static serialize(delegation: Delegation): string;
  static deserialize(serialized: string): Delegation;
}
```

## API Integration

### Bridge Endpoints Expected

The tests expect these bridge endpoints to be available:

- `POST /delegation/register` - Register new delegation
- `POST /delegation/submit` - Submit delegated transaction  
- `POST /delegation/submit-batch` - Submit multiple transactions
- `POST /delegation/execute-intent` - Execute signed intent
- `POST /delegation/estimate-gas` - Estimate gas costs
- `GET /delegation/:id/status` - Get delegation status
- `GET /delegation/:id/relayable-transactions` - Get available transactions
- `POST /delegation/:id/revoke` - Revoke delegation

### Network Module

Tests expect a network module at `../src/network` with:
```typescript
export function post(url: string, data: any): Promise<any>;
export function get(url: string, params?: any): Promise<any>;
```

## Security Features Tested

1. **Signature Verification:** Both principal and relayer signatures
2. **Scope Validation:** Operation, gas, time, and fiber restrictions  
3. **Expiration Handling:** Time-based delegation and session key expiry
4. **Replay Protection:** Unique IDs and nonces for all operations
5. **Access Control:** Proper authorization checks for revocation
6. **Input Validation:** Address formats, gas limits, JSON Logic expressions

## Advanced Patterns Tested

1. **Conditional Execution:** JSON Logic integration for signed intents
2. **Multi-step Workflows:** Chained delegation operations
3. **Batch Operations:** Efficient multi-transaction submission
4. **Gas Optimization:** Dynamic gas pricing based on network conditions  
5. **Event Handling:** Delegation lifecycle event emission
6. **Error Recovery:** Retry logic and graceful failure handling

## Error Handling

Tests validate these error codes and scenarios:

| Error Code | Scenario | Expected Behavior |
|------------|----------|-------------------|
| `DELEGATION_EXPIRED` | Past expiration time | Reject with clear message |
| `DELEGATION_REVOKED` | Revoked delegation use | Reject immediately |
| `INSUFFICIENT_PERMISSIONS` | Operation outside scope | Detailed scope violation |
| `SESSION_EXPIRED` | Expired session key | Session-specific error |
| `CONDITIONS_NOT_MET` | Failed JSON Logic | List failed conditions |
| `INVALID_SIGNATURE` | Bad cryptographic signature | Signature validation error |
| `GAS_LIMIT_EXCEEDED` | Over gas allowance | Gas constraint violation |

## Test Execution

```bash
# Run all delegation tests
npm test test/delegation/

# Run specific test file
npm test test/delegation/functional-api.test.ts
npm test test/delegation/delegation-manager.test.ts
npm test test/delegation/relayer-client.test.ts
npm test test/delegation/delegation-builder.test.ts

# Watch mode for development
npm test -- --watch test/delegation/

# Coverage report
npm test -- --coverage test/delegation/
```

## Integration Dependencies

The tests mock external dependencies but expect integration with:

- **Bridge Service:** For delegation registration and transaction submission
- **Cryptography:** For key generation and signature operations  
- **JSON Logic Engine:** For conditional execution evaluation
- **Network Layer:** For HTTP communication with bridge
- **Event System:** For delegation lifecycle notifications

## Test Coverage Summary

**Total Test Scenarios:** 150+ across 4 test files

- **Functional API:** 45 scenarios (basic operations, scope management, error handling)
- **DelegationManager:** 40 scenarios (lifecycle management, session keys, events)
- **RelayerClient:** 35 scenarios (submission, estimation, batch operations)  
- **DelegationBuilder:** 30 scenarios (utilities, validation, JSON Logic)

**Categories Covered:**
- ✅ Happy path operations and workflows
- ✅ Comprehensive error scenarios and edge cases
- ✅ Security validation and access control
- ✅ Performance and optimization features
- ✅ Integration patterns and advanced usage
- ✅ Cryptographic operations and validation

---

**Next Steps:** Implement the components to make these failing tests pass! 🚀

All tests currently **FAIL** (TDD Red phase) - awaiting implementation to achieve the Green phase, followed by refactoring for clean, maintainable code.