# Producer-Validator Framework TDD Implementation Plan

## Overview

This document defines the Test-Driven Development (TDD) approach for implementing the Producer-Validator framework in OttoChain SDK. The framework separates data production from validation, enabling cryptographic binding and attestation between producers and validators.

## Test Files Created

### 1. `producer-validator-framework.test.ts` (Core Framework)
- **Tests:** 40+ comprehensive tests covering all core functionality
- **Coverage:** Identity management, agreement lifecycle, data proofs, validation, security
- **Key Features:**
  - Producer and Validator identity registration and management
  - Agreement creation, activation, and termination workflows
  - Data proof submission and validation processes
  - Cryptographic binding and signature verification
  - Security features (replay attack prevention, key rotation)
  - 20 error codes with proper handling
  - Integration with OttochainMessage fields 6-7

### 2. `producer-validator-agreement-fsm.test.ts` (Finite State Machine)
- **Tests:** 35+ tests for agreement lifecycle state management
- **Coverage:** FSM configuration, state transitions, validation, timeouts
- **Key Features:**
  - Complete agreement lifecycle: DRAFT → PENDING → ACTIVE → TERMINATED/EXPIRED
  - State transition validation with guards and conditions
  - Automatic timeouts and expiration handling
  - Dispute resolution workflows (DISPUTE state)
  - Concurrent operation safety
  - State history tracking and audit trails

### 3. `producer-validator-ml0-integration.test.ts` (ML0 & Bridge Integration)
- **Tests:** 30+ tests for ML0 validation tables and bridge endpoints
- **Coverage:** ML0 validation rules, bridge API endpoints, external integration
- **Key Features:**
  - ML0 validation table management (create, update, delete)
  - Complex validation rule execution with priorities
  - 3 bridge endpoints for external system integration
  - Batch operations and pagination support
  - Rate limiting and error handling
  - Cross-reference validation and analytics

## Framework Architecture (Defined by Tests)

### Core Components

```typescript
// Identity Management
interface ProducerIdentity {
  address: string;
  attestationKey: string;
  capabilities: ProducerCapability[];
  reputation: number;
  bondAmount: bigint;
}

interface ValidatorIdentity {
  address: string;
  validationKey: string;
  supportedDataTypes: string[];
  validationFee: bigint;
  minimumStake: bigint;
}

// Agreement Management
interface ProducerValidatorAgreement {
  agreementId: string;
  status: AgreementStatus;
  validationRules: ValidationRule[];
  terms: AgreementTerms;
  // FSM integration
  stateHistory: StateTransitionRecord[];
}

// Data Flow
interface DataProof {
  producerId: string;
  dataHash: string;
  signature: string; // Cryptographic binding
  metadata: Record<string, unknown>;
}

interface ValidationProof {
  validatorId: string;
  validationResult: ValidationResult;
  attestationSignature: string; // Cryptographic attestation
  timestamp: number;
}
```

### Agreement State Machine

```
DRAFT → CREATE → PENDING_PRODUCER → PRODUCER_ACCEPT → PENDING_VALIDATOR
                                                           ↓
                                                    VALIDATOR_ACCEPT
                                                           ↓
TERMINATED ← TERMINATE ← ACTIVE ⟷ SUSPEND → SUSPENDED
              ↑          ↓
        DISPUTE_RAISED  DISPUTE → DISPUTE_RESOLVED
              ↑          ↓
           EXPIRED ← EXPIRE
```

### ML0 Validation Integration

- **Validation Tables**: Configurable rule sets per data type
- **Rule Types**: Schema, range, freshness, consensus, signature, cross-reference
- **Execution Engine**: Priority-based rule processing with scoring
- **Analytics**: Historical validation tracking and statistics

### Bridge Endpoints (External Integration)

1. **`bridgeCreateAgreement`**: External systems can create producer-validator agreements
2. **`bridgeSubmitValidation`**: External systems can submit data for validation
3. **`bridgeQueryStatus`**: External systems can query agreement and validation status

## TDD Implementation Strategy

### Phase 1: Red Phase (CURRENT ✅)
- **Status:** All tests FAIL as expected
- **Goal:** Complete behavioral specification without implementation
- **Coverage:** 105+ failing tests across 3 comprehensive test suites

### Phase 2: Green Phase (NEXT)
1. **Core Framework Implementation**
   ```typescript
   class ProducerValidatorFramework {
     // Identity management
     registerProducer(identity: ProducerIdentity): Promise<string>
     registerValidator(identity: ValidatorIdentity): Promise<string>
     
     // Agreement lifecycle
     createAgreement(terms: Partial<ProducerValidatorAgreement>): Promise<ProducerValidatorAgreement>
     activateAgreement(agreementId: string): Promise<void>
     
     // Data validation flow
     submitDataProof(proof: DataProof): Promise<string>
     validateDataProof(agreementId: string, dataProofHash: string): Promise<ValidationProof>
   }
   ```

2. **Agreement FSM Implementation**
   ```typescript
   class ProducerValidatorAgreementFSM {
     // State management
     processEvent(agreementId: string, event: AgreementEvent, triggeredBy: string): Promise<AgreementContext>
     getCurrentState(agreementId: string): Promise<AgreementState>
     getValidTransitions(agreementId: string): Promise<AgreementEvent[]>
     
     // Configuration
     addTransition(transition: StateTransition): void
     setStateTimeout(state: AgreementState, timeoutMs: number): void
   }
   ```

3. **ML0 Integration Implementation**
   ```typescript
   class ProducerValidatorML0Integration {
     // ML0 table management
     createValidationTable(dataType: string, rules: ML0ValidationRule[]): Promise<ML0ValidationTable>
     validateWithML0(dataHash: string, dataType: string, metadata: Record<string, unknown>): Promise<ML0ValidationResult>
     
     // Bridge endpoints
     bridgeCreateAgreement(request: BridgeCreateAgreementRequest): Promise<BridgeCreateAgreementResponse>
     bridgeSubmitValidation(request: BridgeSubmitValidationRequest): Promise<BridgeSubmitValidationResponse>
     bridgeQueryStatus(request: BridgeQueryStatusRequest): Promise<BridgeQueryStatusResponse>
   }
   ```

### Phase 3: Refactor Phase (LATER)
- Performance optimization with caching
- Advanced security features
- Enhanced analytics and monitoring
- Integration with existing OttoChain infrastructure

## Key Test Scenarios Covered

### Identity and Registration (15 tests)
- Producer registration with bond requirements
- Validator registration with stake requirements
- Capability and rule updates
- Invalid registration rejection
- Key rotation handling

### Agreement Lifecycle (20 tests)
- Agreement creation and terms negotiation
- Producer and validator acceptance flows
- Suspension and resumption workflows
- Dispute resolution processes
- Termination and expiration handling
- FSM state transition validation

### Data Validation Flow (25 tests)
- Data proof submission with cryptographic signatures
- ML0 validation rule execution
- Validation result generation and attestation
- Cross-reference validation
- Historical tracking and analytics

### Security and Error Handling (25 tests)
- Cryptographic signature verification
- Replay attack prevention
- Concurrent operation safety
- Malformed data handling
- Network failure recovery
- Detailed error reporting

### External Integration (20 tests)
- Bridge endpoint functionality
- External address format handling
- Rate limiting and pagination
- Batch operation support
- Status query flexibility

## Success Criteria

### All Tests Pass ✅
- 105+ tests covering complete framework functionality
- End-to-end workflows from registration to validation
- Security and error scenarios handled
- External integration working

### Performance Targets
- Identity registration: <100ms
- Agreement creation: <500ms
- Data validation: <2s (including ML0 processing)
- State transitions: <50ms
- Bridge endpoints: <1s response time

### Integration Requirements
- Compatible with existing OttoChain SDK
- ML0 validation table integration
- OttochainMessage fields 6-7 support
- Bridge API for external systems
- Backward compatibility maintained

## Implementation Files (Target Structure)

### Core Framework
- `src/producer-validator/ProducerValidatorFramework.ts`
- `src/producer-validator/ProducerIdentity.ts`
- `src/producer-validator/ValidatorIdentity.ts`
- `src/producer-validator/Agreement.ts`

### Agreement FSM
- `src/producer-validator/fsm/AgreementFSM.ts`
- `src/producer-validator/fsm/StateTransitions.ts`
- `src/producer-validator/fsm/TransitionActions.ts`

### ML0 Integration
- `src/producer-validator/ml0/ML0Integration.ts`
- `src/producer-validator/ml0/ValidationTable.ts`
- `src/producer-validator/ml0/ValidationEngine.ts`

### Bridge API
- `src/producer-validator/bridge/BridgeEndpoints.ts`
- `src/producer-validator/bridge/ExternalIntegration.ts`

### Types and Utilities
- `src/types/ProducerValidatorTypes.ts`
- `src/utils/CryptographicUtils.ts`
- `src/utils/ValidationUtils.ts`

## Running the Tests

```bash
# Install dependencies
cd ottochain-sdk
npm install

# Run TDD tests (should FAIL initially)
npm test producer-validator-framework
npm test producer-validator-agreement-fsm  
npm test producer-validator-ml0-integration

# Run all producer-validator tests
npm test -- --testPathPattern="producer-validator.*test.ts"

# Watch mode during development
npm test -- --watch --testPathPattern="producer-validator"
```

## Next Steps

1. **Verify Tests Fail** - Ensure all tests fail as expected (TDD Red Phase) ✅
2. **Start Core Implementation** - Begin with `ProducerValidatorFramework` class
3. **Implement FSM** - Add agreement state machine functionality
4. **Add ML0 Integration** - Connect with ML0 validation tables
5. **Build Bridge Endpoints** - Create external API integration
6. **Integration Testing** - Ensure all components work together
7. **Performance Optimization** - Add caching and optimization
8. **Documentation** - Generate API documentation and usage guides

## Expected Timeline

- **Week 1:** Core framework implementation (make core tests pass)
- **Week 2:** Agreement FSM and ML0 integration (make remaining tests pass)
- **Week 3:** Bridge endpoints and integration testing
- **Week 4:** Performance optimization and documentation

The tests serve as both specification and validation - when all 105+ tests pass, the Producer-Validator framework implementation will be complete and ready for production use! 🎯