# Token Behavior Matrix TDD Implementation Plan

## Overview

This document defines the Test-Driven Development (TDD) approach for implementing the 16-type token behavior matrix in the OttoChain SDK.

## Test Files Created

### 1. `token-behavior-matrix.test.ts` (Core Functionality)
- **Tests:** 25+ tests covering all 16 token types
- **Coverage:** Token type classification, operation authorization, complex behaviors
- **Key Features:**
  - All 16 boolean combinations (TDEG dimensions)
  - Operation legality (transfer, divide, expire, govern, mint, burn)
  - Edge cases and error handling
  - JSON Logic integration hooks

### 2. `token-type-validation.test.ts` (Validation System)  
- **Tests:** 30+ tests for operation validation
- **Coverage:** Token creation validation, operation validation, rule enforcement
- **Key Features:**
  - Token creation parameter validation
  - Real-time operation validation with context
  - Multi-error handling and warnings
  - Performance optimization with caching

### 3. `token-type-json-logic.test.ts` (External Integration)
- **Tests:** 25+ tests for JSON Logic integration
- **Coverage:** Rule generation, evaluation, import/export
- **Key Features:**
  - Dynamic rule generation for each token type
  - JSON Logic expression evaluation
  - Rule set import/export for external systems
  - Complex conditional logic patterns

## Token Type Matrix (16 Types)

| Code | T | D | E | G | Name | Primary Use Case |
|------|---|---|---|---|------|------------------|
| `----` | ❌ | ❌ | ❌ | ❌ | Static Asset | Certificates, badges |
| `---G` | ❌ | ❌ | ❌ | ✅ | Non-Transferable Governance Token | Membership voting rights |
| `--E-` | ❌ | ❌ | ✅ | ❌ | Expiring Certificate | Time-limited credentials |
| `--EG` | ❌ | ❌ | ✅ | ✅ | Expiring Governance Certificate | Time-limited voting rights |
| `-D--` | ❌ | ✅ | ❌ | ❌ | Divisible Credential | Fractional certificates |
| `-D-G` | ❌ | ✅ | ❌ | ✅ | Divisible Governance Credential | Weighted voting rights |
| `-DE-` | ❌ | ✅ | ✅ | ❌ | Expiring Divisible Credential | Time-limited fractional assets |
| `-DEG` | ❌ | ✅ | ✅ | ✅ | Full Non-Transferable Token | Complete non-transferable utility |
| `T---` | ✅ | ❌ | ❌ | ❌ | Simple Currency | Basic payments |
| `T--G` | ✅ | ❌ | ❌ | ✅ | Governance Currency | Voting + payment token |
| `T-E-` | ✅ | ❌ | ✅ | ❌ | Expiring Currency | Gift cards, coupons |
| `T-EG` | ✅ | ❌ | ✅ | ✅ | Expiring Governance Currency | Time-limited governance token |
| `TD--` | ✅ | ✅ | ❌ | ❌ | Divisible Currency | Standard cryptocurrency |
| `TD-G` | ✅ | ✅ | ❌ | ✅ | Standard Utility Token | DeFi tokens |
| `TDE-` | ✅ | ✅ | ✅ | ❌ | Expiring Utility Token | Seasonal utility tokens |
| `TDEG` | ✅ | ✅ | ✅ | ✅ | Full Feature Token | Maximum functionality |

**Legend:** T=Transferable, D=Divisible, E=Expirable, G=Governable

## Operation Matrix

| Operation | Allowed For | Validation Rules |
|-----------|-------------|------------------|
| **Transfer** | T*** types only | Transferable=true, valid from/to, requester=owner |
| **Divide** | *D** types only | Divisible=true, fractional amounts allowed |
| **Expire** | **E* types only | Expirable=true, past expiration time |
| **Govern** | ***G types only | Governable=true, valid proposal, sufficient balance |
| **Mint** | All types | Always allowed (system operation) |
| **Burn** | All types | Always allowed (system operation) |

## TDD Implementation Strategy

### Phase 1: Red Phase (CURRENT ✅)
- **Status:** All tests FAIL as expected
- **Goal:** Define complete interface and behavior specification
- **Files:** 3 comprehensive test files created

### Phase 2: Green Phase (NEXT)
1. **Implement Core Classes**
   ```typescript
   class TokenBehaviorMatrix { ... }
   class TokenTypeValidator { ... }
   class TokenTypeJsonLogic { ... }
   ```

2. **Make Tests Pass Incrementally**
   - Start with simplest token type (`----` Static Asset)
   - Add one dimension at a time (T, then D, then E, then G)
   - Build up to complex types (`TDEG` Full Feature)

3. **Implementation Order**
   ```
   Static Asset (----) → Simple Currency (T---)
   ↓
   Add Divisibility (TD--) → Add Governance (TD-G)
   ↓  
   Add Expiration (TDE-) → Full Feature (TDEG)
   ```

### Phase 3: Refactor Phase (LATER)
- Optimize performance with caching
- Enhance error messages and validation
- Add advanced JSON Logic patterns
- Integration with OttoChain fiber system

## Expected Implementation Files

### Core Implementation
- `src/token/TokenBehaviorMatrix.ts`
- `src/token/TokenTypeValidator.ts`
- `src/token/TokenTypeJsonLogic.ts`

### Type Definitions
- `src/types/TokenTypes.ts`
- `src/types/ValidationTypes.ts`
- `src/types/JsonLogicTypes.ts`

### Utilities
- `src/utils/TokenTypeUtils.ts`
- `src/utils/ValidationUtils.ts`

## Running the Tests

```bash
# Install dependencies
cd ottochain-sdk
npm install

# Run TDD tests (should FAIL initially)
npm test token-behavior-matrix
npm test token-type-validation
npm test token-type-json-logic

# Run all token-related tests
npm test -- --testPathPattern="token.*test.ts"
```

## Success Criteria

### All Tests Pass ✅
- 80+ tests covering all 16 token types
- 100% operation coverage for each type
- Edge cases and error conditions handled
- JSON Logic integration working

### Performance Targets
- Token type classification: <1ms
- Operation validation: <5ms
- Rule generation: <10ms
- Cache hit rate: >90% for repeated validations

### Integration Requirements
- Compatible with existing OttoChain fiber system
- Exportable rules for external validation
- Import/export for custom rule sets
- Backward compatible with existing token implementations

## Reference Materials

- **Source Analysis:** `memory/2026-02-08-tokenized-streams-analysis.md` (referenced in card)
- **Deliverable Target:** `docs/design/token-behavior-matrix.md` (documentation)
- **Related Cards:** Asset Model Exploration Epic
- **JSON Logic:** https://jsonlogic.com/ for rule format reference

## Next Steps

1. **Run Tests:** Verify all tests fail (TDD Red phase) ✅
2. **Start Implementation:** Begin with `TokenBehaviorMatrix` class
3. **Incremental Development:** Make tests pass one by one
4. **Integration Testing:** Ensure compatibility with OttoChain
5. **Documentation:** Generate final reference document
6. **Performance Optimization:** Add caching and optimization

The tests serve as both specification and validation - when all tests pass, the token behavior matrix implementation is complete! 🎯