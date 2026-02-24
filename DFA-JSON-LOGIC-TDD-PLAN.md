# DFA + JSON Logic State Machine TDD Implementation Plan

## Overview

This document defines the Test-Driven Development (TDD) approach for implementing the DFA + JSON Logic state machine system in OttoChain SDK, based on the comprehensive 1335-line specification by @think.

## Test Files Created

### 1. `dfa-state-machine.test.ts` (Core State Machine)
- **Tests:** 25+ comprehensive tests covering core DFA functionality
- **Coverage:** State machine creation, transitions, guard evaluation, multiple transitions
- **Key Features:**
  - StateMachineDefinition validation and creation
  - State transition logic with deterministic outcomes
  - JSON Logic guard evaluation with complex conditions
  - Error handling and edge cases
  - Context variable resolution (state, event, proofs, sequenceNumber)
  - Final state handling and validation

### 2. `dfa-effect-system.test.ts` (Effect System & State Updates)
- **Tests:** 20+ tests for state update effects and side effects
- **Coverage:** State merging, mathematical operations, side effect extraction
- **Key Features:**
  - State merge operations preserving existing fields
  - Complex mathematical calculations in effects
  - Side effect extraction (_oracleCall, _emit, _spawn reserved keys)
  - Delegation context effects and spend tracking
  - Effect validation and error handling
  - Nested state updates and array manipulations

### 3. `dfa-delegation-lifecycle.test.ts` (Delegation & Complex Lifecycles)
- **Tests:** 30+ tests for delegation patterns and complete lifecycle examples
- **Coverage:** Delegation guards, sports collectible lifecycle, game character management
- **Key Features:**
  - Complete delegation system (active, scope, spend limits, session keys)
  - Digital Sports Collectible lifecycle (minted→listed→owned→locked→expired→burned)
  - Game Character with leveling and equipment systems
  - Anti-patterns prevention (self-purchase, price validation)
  - Concurrent operation safety and state integrity

### 4. `DFA-JSON-LOGIC-TDD-PLAN.md` (Implementation Strategy)
- Complete architectural blueprint and implementation roadmap
- 56+ test scenarios mapped from the specification
- Success criteria and integration requirements

## Framework Architecture (Defined by Tests)

### Core State Machine Components

```typescript
interface StateMachineEngine {
  createStateMachine(definition: StateMachineDefinition, initialData?: Record<string, unknown>): Promise<StateMachineInstance>;
  transitionStateMachine(instance: StateMachineInstance, eventName: string, eventData: Record<string, unknown>, context: Partial<StateMachineContext>): Promise<StateMachineTransitionResult>;
  evaluateGuard(guard: JsonLogicExpression, context: StateMachineContext): boolean;
  applyEffect(effect: JsonLogicExpression, context: StateMachineContext): Record<string, unknown>;
}

interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: Record<string, unknown>;
}

interface TransitionDefinition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: JsonLogicExpression;
  effect?: JsonLogicExpression;
}
```

### JSON Logic Integration

**Guard Patterns Tested:**
- **Identity checks:** `{ "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] }`
- **Enum membership:** `{ "in": [{ "var": "event.currency" }, ["DAG", "USDC", "ETH"]] }`
- **Sequence expiry:** `{ ">=": [{ "var": "sequenceNumber" }, { "var": "state.expiresAtSequence" }] }`
- **Complex logic:** Nested AND, OR, NOT combinations
- **Delegation checks:** Active delegation, scope validation, spend limits

**Effect Patterns Tested:**
- **State merge:** `{ "merge": [{ "var": "state" }, { newField: { "var": "event.value" } }] }`
- **Mathematics:** `{ "+": [{ "var": "state.count" }, 1] }`, complex calculations
- **Side effects:** `_oracleCall`, `_emit`, `_spawn` extraction
- **Conditional updates:** IF-THEN-ELSE logic in state updates

### Delegation System

```typescript
interface DelegationContext {
  active: boolean;
  expiresAt: number;
  scope: string[];
  spendLimit: number;
  spendUsed: number;
  spendRemaining: number;
  delegator: string;
  relayer: string;
  sessionKey: string;
  bondedStake: number;
}
```

**Delegation Features Tested:**
- Active delegation validation
- Scope checking (including wildcard "*" support)
- Spend limit enforcement
- Session key/relayer address validation
- Delegation context integration with effects

### Complex Lifecycle Examples

**Digital Sports Collectible State Flow:**
```
minted → list → listed → purchase → owned → transfer → owned
   ↓        ↓              ↓           ↓
 burn    delist         burn       governance_lock
   ↓        ↓              ↓           ↓
burned    minted        burned    governance_locked
                                      ↓
                                   unlock
                                      ↓
                                   owned
                                      ↓
                                   expire
                                      ↓
                                  expired (final)
```

**Game Character State Flow:**
```
active → gain_experience → active (with level up logic)
   ↓                          ↓
equip_item               retire
   ↓                          ↓
active                   retired (final)
```

## TDD Implementation Strategy

### Phase 1: Red Phase (CURRENT ✅)
- **Status:** All tests FAIL as expected
- **Goal:** Complete behavioral specification for DFA + JSON Logic system
- **Coverage:** 75+ failing tests across 3 comprehensive test suites

### Phase 2: Green Phase (NEXT)
1. **Core State Machine Implementation**
   ```typescript
   class StateMachineEngine {
     async createStateMachine(definition: StateMachineDefinition, initialData?: Record<string, unknown>): Promise<StateMachineInstance>
     async transitionStateMachine(instance: StateMachineInstance, eventName: string, eventData: Record<string, unknown>, context: Partial<StateMachineContext>): Promise<StateMachineTransitionResult>
     evaluateGuard(guard: JsonLogicExpression, context: StateMachineContext): boolean
     applyEffect(effect: JsonLogicExpression, context: StateMachineContext): Record<string, unknown>
   }
   ```

2. **JSON Logic Engine Implementation**
   ```typescript
   class JsonLogicEngine {
     evaluate(expression: JsonLogicExpression, context: Record<string, unknown>): unknown
     validateExpression(expression: JsonLogicExpression): boolean
     supportedOperators(): string[]
   }
   ```

3. **Effect System Implementation**
   ```typescript
   class EffectEngine {
     applyEffect(effect: JsonLogicExpression, context: StateMachineContext): EffectResult
     mergeStateUpdates(currentState: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown>
     extractSideEffects(effectResult: Record<string, unknown>): StateMachineSideEffect[]
   }
   ```

4. **Delegation System Implementation**
   ```typescript
   class DelegationStateMachine extends StateMachineEngine {
     createDigitalSportsCollectible(initialData: CollectibleData): Promise<StateMachineInstance>
     createGameCharacter(initialData: GameCharacterData): Promise<StateMachineInstance>
     enableDelegation(instance: StateMachineInstance, delegationConfig: DelegationConfig): Promise<void>
   }
   ```

### Phase 3: Refactor Phase (LATER)
- Performance optimization with caching
- Advanced JSON Logic operators
- Enhanced delegation features
- Integration with OttoChain fiber system

## Test Scenarios Mapped from Specification

### Section 11.1: Basic StateMachine Operations (8 tests) ✅
- CreateStateMachine: fiber starts in initialState
- CreateStateMachine with isFinal states: no outgoing transitions from final state
- TransitionStateMachine: guard passes/fails scenarios
- TransitionStateMachine: wrong from-state/unknown eventName rejection
- TransitionStateMachine: multiple transitions for same (from, event) - first matching guard wins
- TransitionStateMachine: final state rejection
- TransitionStateMachine: effect applied and merged correctly
- TransitionStateMachine: target_sequence_number validation

### Section 11.2: Guard Evaluation Patterns (12 tests) ✅
- Caller identity checks (proofs.0.address validation)
- State field comparisons
- Sequence-number-based expiry checks
- Enum membership validation
- Complex logical combinations (AND, OR, NOT)
- Variable access with nested paths
- Missing context variable handling
- Mathematical operators (+, -, *, /, %)

### Section 11.3: Effect System (10 tests) ✅
- merge effect: adding new fields, preserving existing
- merge effect: overwriting existing fields
- counter increment/decrement operations
- ownership transfer in state
- sequenceNumber variable resolution in effects
- Reserved key extraction (_oracleCall, _emit, _spawn)
- Complex mathematical calculations
- Conditional effects with IF-THEN-ELSE logic

### Section 11.4: Sequence-Number Expiry Guards (5 tests) ✅
- sequenceNumber < expiresAtSequence → expiry guard fails, transition blocked
- sequenceNumber == expiresAtSequence → expiry guard passes, transition fires
- sequenceNumber > expiresAtSequence → expiry guard passes, transition fires
- expiresAtSequence = 0 → guard always passes

### Section 11.5: Delegation Guards (10 tests) ✅
- No delegation submitted → delegation.active = false → delegation guard fails
- Active delegation submitted → delegation.active = true
- Expired delegation → delegation.active = false
- Delegation scope contains operation → scope guard passes
- Delegation scope missing operation + no wildcard → scope guard fails
- Delegation scope contains "*" wildcard → any scope guard passes
- Spend-limit guard: spendRemaining >= amount validation
- Session key check: proofs.0.address == delegation.relayer validation

### Section 11.6: Digital Sports Collectible E2E (18 tests) ✅
Complete lifecycle testing using the definition from specification Section 7:
- CreateStateMachine → fiber in "minted" state
- list event from owner with askingPrice and currency → moves to "listed"
- list event from non-owner → rejected
- delist from owner → moves back to "minted"
- purchase with exact price and currency → moves to "owned", ownerAddress updated
- purchase where buyer == owner → rejected (no self-purchase)
- purchase with wrong price → rejected
- transfer from owner to recipient → stays in "owned", ownerAddress updated
- transfer from non-owner → rejected
- lock from validatorAddress → moves to "governance_locked"
- lock from non-validator → rejected
- unlock from validatorAddress → moves back to "owned"
- expire when sequenceNumber >= expiresAtSequence → moves to "expired"
- expire when sequenceNumber < expiresAtSequence → rejected
- burn from owner → moves to "burned"
- any event on "expired" (final) → rejected
- any event on "burned" (final) → rejected
- transferCount increments on each purchase and transfer

### Section 11.7: Anti-Patterns and Edge Cases (12 tests) ✅
- State explosion prevention
- Circular transition detection
- Self-purchase prevention
- Price validation in marketplace
- Concurrent operation safety
- Invalid JSON Logic expression handling
- State corruption prevention on failed transitions
- Recursion depth limiting

## Success Criteria

### All Tests Pass ✅
- 75+ tests covering complete DFA + JSON Logic functionality
- End-to-end lifecycle examples working correctly
- Delegation system fully functional
- Error handling and edge cases covered

### Performance Targets
- State machine creation: <50ms
- State transition: <100ms
- Guard evaluation: <10ms
- Effect application: <50ms
- JSON Logic expression evaluation: <5ms

### Integration Requirements
- Compatible with existing OttoChain SDK
- Integration with fiber system (StateMachineDefinition proto)
- JLVM (JSON Logic Virtual Machine) integration
- Delegation context injection from DelegationContext
- Side effect handling (oracle calls, events, spawning)

## Implementation Files (Target Structure)

### Core State Machine
- `src/state-machine/StateMachineEngine.ts`
- `src/state-machine/StateMachineDefinition.ts`
- `src/state-machine/StateMachineInstance.ts`
- `src/state-machine/TransitionEngine.ts`

### JSON Logic Engine
- `src/json-logic/JsonLogicEngine.ts`
- `src/json-logic/JsonLogicOperators.ts`
- `src/json-logic/ContextResolver.ts`
- `src/json-logic/ExpressionValidator.ts`

### Effect System
- `src/effects/EffectEngine.ts`
- `src/effects/StateManager.ts`
- `src/effects/SideEffectExtractor.ts`
- `src/effects/ReservedKeyHandler.ts`

### Delegation System
- `src/delegation/DelegationStateMachine.ts`
- `src/delegation/DelegationContext.ts`
- `src/delegation/DelegationGuards.ts`
- `src/delegation/LifecycleTemplates.ts`

### Lifecycle Templates
- `src/templates/DigitalSportsCollectible.ts`
- `src/templates/GameCharacter.ts`
- `src/templates/MarketplaceItem.ts`
- `src/templates/StandardLifecycles.ts`

### Types and Utilities
- `src/types/StateMachineTypes.ts`
- `src/types/JsonLogicTypes.ts`
- `src/types/DelegationTypes.ts`
- `src/utils/ValidationUtils.ts`
- `src/utils/StateUtils.ts`

## Running the Tests

```bash
# Install dependencies
cd ottochain-sdk
npm install

# Run TDD tests (should FAIL initially)
npm test dfa-state-machine
npm test dfa-effect-system
npm test dfa-delegation-lifecycle

# Run all DFA-related tests
npm test -- --testPathPattern="dfa.*test.ts"

# Watch mode during development
npm test -- --watch --testPathPattern="dfa"
```

## Next Steps

1. **Verify Tests Fail** - Ensure all tests fail as expected (TDD Red Phase) ✅
2. **Start Core Implementation** - Begin with `StateMachineEngine` class
3. **Implement JSON Logic Engine** - Add comprehensive operator support
4. **Build Effect System** - State updates and side effect extraction
5. **Add Delegation System** - Complete delegation context integration
6. **Create Lifecycle Templates** - Pre-built state machine definitions
7. **Integration Testing** - Ensure compatibility with OttoChain fiber system
8. **Performance Optimization** - Add caching and validation shortcuts

## Expected Timeline

- **Week 1:** Core state machine and JSON Logic engine (make core tests pass)
- **Week 2:** Effect system and basic delegation (make effect tests pass)
- **Week 3:** Complete delegation system and lifecycle templates (make all tests pass)
- **Week 4:** Performance optimization, integration testing, documentation

## Reference Implementation Source

Based on the comprehensive specification in `/home/euler/.openclaw/workspace/ottochain-sdk/docs/design/dfa-json-logic-patterns.md` (1335 lines) delivered by @think and corrected by @research.

**Key specification sections implemented:**
1. DFA Formal Model (Section 1)
2. StateMachineDefinition Mapping (Section 2)  
3. JSON Logic Guard Integration (Section 3)
4. Effect System (Section 4)
5. Standard Lifecycle Templates (Section 5)
6. Complete Example: Digital Sports Collectible (Section 7)
7. Delegation Patterns (throughout)
8. Test Scenarios (Section 11) - 56+ test cases

The tests serve as both specification and validation - when all 75+ tests pass, the DFA + JSON Logic state machine system implementation will be complete and ready for production use! 🎯