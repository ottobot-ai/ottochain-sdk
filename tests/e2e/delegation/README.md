# E2E Delegation Flow Tests

This directory contains comprehensive end-to-end tests for the OttoChain delegation system. These tests are designed to **fail initially** (TDD approach) until the full delegation infrastructure is implemented.

## Test Coverage

### 1. Happy Path (`happy-path.test.ts`)
- ✅ **Complete delegation flow**: User delegates → Relayer submits → Transaction succeeds
- ✅ **Multiple transaction handling** within scope limits
- ❌ **Concurrent transaction submissions** (not implemented)
- ❌ **Performance requirements** (not implemented)

### 2. Validation (`validation.test.ts`)
- ✅ **Invalid signature rejection**
- ✅ **Invalid address format rejection**
- ✅ **Invalid scope rejection**
- ✅ **Insufficient permissions rejection**
- ✅ **Malformed restrictions rejection**
- ❌ **Bridge validation integration** (not implemented)
- ❌ **Rate limiting** (not implemented)

### 3. Expiry & Revocation (`expiry-revocation.test.ts`)
- ✅ **Expired delegation rejection**
- ✅ **Expiry during active usage**
- ✅ **Automatic cleanup of expired delegations**
- ✅ **Delegator revocation**
- ✅ **Revoked delegation rejection**
- ✅ **Authorization checks for revocation**
- ✅ **Bulk revocation**
- ❌ **Real-time revocation monitoring** (not implemented)

### 4. Scope Enforcement (`scope-enforcement.test.ts`)
- ✅ **Action allowlist enforcement**
- ✅ **Wildcard action permissions**
- ✅ **Amount limit enforcement**
- ✅ **Cumulative amount limits**
- ✅ **Recipient whitelist enforcement**
- ❌ **Multi-token denomination limits** (not implemented)
- ❌ **Time window restrictions** (not implemented)
- ❌ **Contract-specific scopes** (not implemented)
- ❌ **Dynamic scope updates** (not implemented)

### 5. Gas & Fee Model (`gas-fee-model.test.ts`)
- ✅ **Gas estimation accuracy**
- ✅ **Different transaction type gas estimates**
- ✅ **User-pays fee model**
- ✅ **Relayer-pays fee model**
- ✅ **Detailed fee breakdown**
- ✅ **Insufficient funds handling**
- ❌ **Split fee model** (not implemented)
- ❌ **Gas limit enforcement** (not implemented)
- ❌ **Dynamic fee pricing** (not implemented)
- ❌ **Multi-token fee payments** (not implemented)
- ❌ **Relayer fee limits** (not implemented)

### 6. Error Handling (`error-handling.test.ts`)
- ✅ **Network error handling**
- ✅ **Connection timeout handling**
- ✅ **HTTP error responses** (400, 401, 404)
- ✅ **Transaction format validation**
- ✅ **Transaction execution failures**
- ✅ **Concurrency conflict handling**
- ✅ **Clear error messages**
- ✅ **Boundary condition handling**
- ❌ **Retry logic with exponential backoff** (not implemented)
- ❌ **Partial network failure handling** (not implemented)
- ❌ **Rate limiting (429)** (not implemented)
- ❌ **Server errors (500, 503)** (not implemented)
- ❌ **Error recovery mechanisms** (not implemented)

## Infrastructure Dependencies

### Mock Services
- **`MockRelayerService`** (`tests/mocks/relayer-service.ts`): Simulates a relayer service for testing
- **`TestClusterHelper`** (`tests/helpers/test-cluster.ts`): Manages local tessellation cluster

### Required Implementation
These tests assume the following components exist (they don't yet):

1. **Bridge Delegation Endpoints**:
   - `POST /delegation/create`
   - `GET /delegation/{id}/status`
   - `POST /delegation/{id}/revoke`
   - `GET /delegation/{id}/usage`

2. **SDK Delegation Client**:
   - `DelegationClient` class
   - `createDelegation()` method
   - `getDelegationStatus()` method
   - `revokeDelegation()` method
   - `estimateGas()` method
   - `calculateFees()` method

3. **Error Classes**:
   - `DelegationError`
   - `DelegationScopeError`
   - `DelegationTimeoutError`
   - `DelegationNetworkError`

4. **Local Test Infrastructure**:
   - Tessellation cluster management
   - Test account creation
   - Transaction submission

## Running Tests

```bash
# Run all E2E delegation tests
npm test -- tests/e2e/delegation/

# Run specific test file
npm test -- tests/e2e/delegation/happy-path.test.ts

# Run with coverage
npm run test:coverage -- tests/e2e/delegation/
```

## Expected Failures

**All tests are expected to fail initially** because:

1. **Missing SDK Implementation**: `DelegationClient` and related classes don't exist
2. **Missing Bridge Endpoints**: Delegation API endpoints not implemented
3. **Missing Infrastructure**: Local cluster management not implemented
4. **Missing Error Classes**: Delegation-specific error types not defined

## Implementation Priority

Recommended implementation order:

1. **Core SDK Types & Interfaces** - Define delegation types and interfaces
2. **Mock Bridge Service** - Simple in-memory delegation storage for testing
3. **Basic DelegationClient** - Core CRUD operations
4. **Error Handling** - Comprehensive error types and handling
5. **Validation Logic** - Scope and permission validation
6. **Gas & Fee System** - Gas estimation and fee calculation
7. **Advanced Features** - Time windows, dynamic scopes, monitoring

## Test Data

Tests use deterministic mock data:
- **User Address**: `DAG_USER_TEST_ADDRESS_123456789`
- **Relayer Address**: `DAG_RELAYER_TEST_ADDRESS_987654321`
- **Recipient Address**: `DAG_RECIPIENT_ADDRESS_123`
- **Token**: `USD_TOKEN`
- **Initial Balances**: 10k tokens (user), 5k tokens (relayer)

## Integration with CI

These tests should be run in CI to ensure:
- ✅ **Compilation** - All TypeScript types compile correctly
- ✅ **Test Structure** - Tests are properly organized and discoverable
- ❌ **Functionality** - Tests fail until features are implemented

Once implementation begins, tests will gradually pass as features are completed.

## Documentation Dependencies

These tests demonstrate the expected behavior documented in:
- **User Guide**: How to use delegation features
- **Developer Guide**: How to build relayer services  
- **API Reference**: Bridge delegation endpoints
- **Troubleshooting Guide**: Common delegation issues

The tests serve as executable specifications for these documentation efforts.