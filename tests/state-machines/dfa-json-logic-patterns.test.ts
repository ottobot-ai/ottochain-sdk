/**
 * TDD Tests for DFA + JSON Logic State Machine Patterns
 * 
 * Tests for guarded transition systems, effect computation, and standard lifecycle templates.
 * Based on specification: docs/design/dfa-json-logic-patterns.md
 * 
 * These tests should FAIL initially since the implementation doesn't exist yet.
 * Implementation should make these tests pass.
 * 
 * Total: 56 test cases across 7 groups
 */

// Types that should be exported but don't exist yet
export interface StateDefinition {
  id: { value: string };
  isFinal: boolean;
  metadata: Record<string, unknown> | null;
}

export interface TransitionDefinition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: JsonLogicExpression;
  effect: JsonLogicExpression;
  dependencies: string[];
}

export interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: { name: string; description: string; [key: string]: unknown };
}

export interface JsonLogicExpression {
  [key: string]: any;
}

export interface TransitionContext {
  currentState: string;
  sequenceNumber: number;
  event: {
    eventName: string;
    eventData: Record<string, any>;
    proofs: Array<{ address: string }>;
  };
  state: Record<string, any>;
  delegation?: {
    active: boolean;
    relayer?: string;
    scope?: string[];
    spendRemaining?: number;
    expiresAt?: number;
  };
  $ordinal?: number;
}

export interface EffectResult {
  newState: Record<string, any>;
  sideEffects: {
    oracleCall?: any;
    emit?: any;
    spawn?: any;
  };
}

export interface AntiPatternReport {
  isValid: boolean;
  errors: Array<{
    type: string;
    message: string;
    transitions?: string[];
  }>;
}

// Mock implementations that should exist in the actual implementation
const validateStateMachine = (_definition: StateMachineDefinition): AntiPatternReport => {
  throw new Error('validateStateMachine not implemented yet - TDD failing test');
};

const evaluateGuard = (_guard: JsonLogicExpression, _context: TransitionContext): boolean => {
  throw new Error('evaluateGuard not implemented yet - TDD failing test');
};

const findTransition = (
  _definition: StateMachineDefinition,
  _currentState: string,
  _eventName: string,
  _context: TransitionContext
): TransitionDefinition | null => {
  throw new Error('findTransition not implemented yet - TDD failing test');
};

const evaluateEffect = (_effect: JsonLogicExpression, _context: TransitionContext): EffectResult => {
  throw new Error('evaluateEffect not implemented yet - TDD failing test');
};

const getStandardTemplate = (_templateName: string): StateMachineDefinition => {
  throw new Error('getStandardTemplate not implemented yet - TDD failing test');
};

// createDigitalCollectibleDefinition is defined in the integration test file

describe('DFA + JSON Logic State Machine Patterns', () => {

  describe('Group 11.1: Guarded Transition Evaluation (ML0 integration tests)', () => {
    const mockDefinition: StateMachineDefinition = {
      states: {
        pending: { id: { value: 'pending' }, isFinal: false, metadata: null },
        approved: { id: { value: 'approved' }, isFinal: true, metadata: null },
        rejected: { id: { value: 'rejected' }, isFinal: true, metadata: null }
      },
      initialState: { value: 'pending' },
      transitions: [
        {
          from: { value: 'pending' },
          to: { value: 'approved' },
          eventName: 'approve',
          guard: { '>': [{ var: 'event.eventData.amount' }, 1000] },
          effect: { merge: [{ var: 'state' }, { approved: true }] },
          dependencies: []
        },
        {
          from: { value: 'pending' },
          to: { value: 'rejected' },
          eventName: 'approve',
          guard: { '<=': [{ var: 'event.eventData.amount' }, 1000] },
          effect: { merge: [{ var: 'state' }, { rejected: true }] },
          dependencies: []
        }
      ]
    };

    test('pending + approve (amount=2000) → transition to approved', () => {
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'approve',
          eventData: { amount: 2000 },
          proofs: [{ address: 'test-address' }]
        },
        state: { amount: 2000 }
      };

      const transition = findTransition(mockDefinition, 'pending', 'approve', context);
      
      expect(transition).toBeDefined();
      expect(transition?.to.value).toBe('approved');
    });

    test('pending + approve (amount=500) → transition to rejected', () => {
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'approve',
          eventData: { amount: 500 },
          proofs: [{ address: 'test-address' }]
        },
        state: { amount: 500 }
      };

      const transition = findTransition(mockDefinition, 'pending', 'approve', context);
      
      expect(transition).toBeDefined();
      expect(transition?.to.value).toBe('rejected');
    });

    test('approved + any event → no valid transition (final state)', () => {
      const context: TransitionContext = {
        currentState: 'approved',
        sequenceNumber: 2,
        event: {
          eventName: 'modify',
          eventData: {},
          proofs: [{ address: 'test-address' }]
        },
        state: { approved: true }
      };

      const transition = findTransition(mockDefinition, 'approved', 'modify', context);
      
      expect(transition).toBeNull();
    });

    test('guard evaluation: amount > 1000 with amount=2000 → true', () => {
      const guard: JsonLogicExpression = { '>': [{ var: 'event.eventData.amount' }, 1000] };
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'approve',
          eventData: { amount: 2000 },
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const result = evaluateGuard(guard, context);
      
      expect(result).toBe(true);
    });

    test('guard evaluation: amount > 1000 with amount=500 → false', () => {
      const guard: JsonLogicExpression = { '>': [{ var: 'event.eventData.amount' }, 1000] };
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'approve',
          eventData: { amount: 500 },
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const result = evaluateGuard(guard, context);
      
      expect(result).toBe(false);
    });

    test('complex guard: ownership + amount check', () => {
      const guard: JsonLogicExpression = {
        and: [
          { '==': [{ var: 'event.proofs.0.address' }, { var: 'state.ownerAddress' }] },
          { '>': [{ var: 'event.eventData.amount' }, 0] }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'owned',
        sequenceNumber: 1,
        event: {
          eventName: 'transfer',
          eventData: { amount: 100 },
          proofs: [{ address: 'owner123' }]
        },
        state: { ownerAddress: 'owner123' }
      };

      const result = evaluateGuard(guard, context);
      
      expect(result).toBe(true);
    });

    test('missing eventName → no transition found', () => {
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'unknown',
          eventData: {},
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const transition = findTransition(mockDefinition, 'pending', 'unknown', context);
      
      expect(transition).toBeNull();
    });

    test('wrong from state → no transition found', () => {
      const context: TransitionContext = {
        currentState: 'approved',
        sequenceNumber: 2,
        event: {
          eventName: 'approve',
          eventData: { amount: 2000 },
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const transition = findTransition(mockDefinition, 'approved', 'approve', context);
      
      expect(transition).toBeNull();
    });

    test('determinism: first matching guard wins', () => {
      // This tests that when multiple transitions have the same (from, eventName),
      // the first one with a passing guard is selected
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'approve',
          eventData: { amount: 2000 },
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const transition = findTransition(mockDefinition, 'pending', 'approve', context);
      
      // Should get the first transition (to approved) since amount > 1000
      expect(transition?.to.value).toBe('approved');
    });

    test('null/undefined guard → always true (unconditional transition)', () => {
      const alwaysTrueDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          end: { id: { value: 'end' }, isFinal: true, metadata: null }
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'end' },
            eventName: 'finish',
            guard: null as any, // Unconditional
            effect: { merge: [{ var: 'state' }, { finished: true }] },
            dependencies: []
          }
        ]
      };

      const context: TransitionContext = {
        currentState: 'start',
        sequenceNumber: 1,
        event: {
          eventName: 'finish',
          eventData: {},
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const transition = findTransition(alwaysTrueDefinition, 'start', 'finish', context);
      
      expect(transition).toBeDefined();
      expect(transition?.to.value).toBe('end');
    });

    test('guard with missing context variables → evaluates to false/null safely', () => {
      const guard: JsonLogicExpression = { '==': [{ var: 'event.eventData.nonExistentField' }, 'value'] };
      
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 1,
        event: {
          eventName: 'test',
          eventData: {},
          proofs: [{ address: 'test-address' }]
        },
        state: {}
      };

      const result = evaluateGuard(guard, context);
      
      expect(result).toBe(false);
    });
  });

  describe('Group 11.2: Effect Computation (unit tests)', () => {
    test('merge effect: combines state with event data', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          { approved: true, approvedAt: { var: 'sequenceNumber' } }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'pending',
        sequenceNumber: 5,
        event: {
          eventName: 'approve',
          eventData: { reason: 'looks good' },
          proofs: [{ address: 'approver' }]
        },
        state: { id: 'item123', status: 'pending' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        id: 'item123',
        status: 'pending',
        approved: true,
        approvedAt: 5
      });
      expect(result.sideEffects).toEqual({});
    });

    test('conditional effect: different merges based on guard', () => {
      const effect: JsonLogicExpression = {
        if: [
          { '>': [{ var: 'event.eventData.amount' }, 1000] },
          { merge: [{ var: 'state' }, { tier: 'premium' }] },
          { merge: [{ var: 'state' }, { tier: 'standard' }] }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'processing',
        sequenceNumber: 3,
        event: {
          eventName: 'categorize',
          eventData: { amount: 2000 },
          proofs: [{ address: 'processor' }]
        },
        state: { id: 'order456' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        id: 'order456',
        tier: 'premium'
      });
    });

    test('arithmetic effect: increment counter', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          { count: { '+': [{ var: 'state.count' }, 1] } }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 10,
        event: {
          eventName: 'increment',
          eventData: {},
          proofs: [{ address: 'user' }]
        },
        state: { count: 5 }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState.count).toBe(6);
    });

    test('event data extraction: pull fields from event into state', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          {
            recipientAddress: { var: 'event.eventData.recipient' },
            transferAmount: { var: 'event.eventData.amount' },
            transferredBy: { var: 'event.proofs.0.address' }
          }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'owned',
        sequenceNumber: 7,
        event: {
          eventName: 'transfer',
          eventData: { recipient: 'buyer123', amount: 500 },
          proofs: [{ address: 'seller456' }]
        },
        state: { ownerAddress: 'seller456' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        ownerAddress: 'seller456',
        recipientAddress: 'buyer123',
        transferAmount: 500,
        transferredBy: 'seller456'
      });
    });

    test('sequenceNumber in effect: access current sequence', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          { lastUpdated: { var: 'sequenceNumber' } }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 42,
        event: {
          eventName: 'update',
          eventData: {},
          proofs: [{ address: 'updater' }]
        },
        state: { version: 1 }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState.lastUpdated).toBe(42);
    });

    test('_oracleCall reserved key is NOT merged into state (extracted as side effect)', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          {
            status: 'pending_oracle',
            _oracleCall: {
              scriptId: 'price-feed-123',
              method: 'getLatestPrice',
              args: ['BTC/USD']
            }
          }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 15,
        event: {
          eventName: 'requestPrice',
          eventData: {},
          proofs: [{ address: 'requester' }]
        },
        state: { id: 'order789' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        id: 'order789',
        status: 'pending_oracle'
      });
      expect(result.sideEffects.oracleCall).toEqual({
        scriptId: 'price-feed-123',
        method: 'getLatestPrice',
        args: ['BTC/USD']
      });
    });

    test('_emit reserved key is NOT merged into state (extracted as side effect)', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          {
            completed: true,
            _emit: {
              eventType: 'orderCompleted',
              data: { orderId: { var: 'state.id' }, completedAt: { var: 'sequenceNumber' } }
            }
          }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'processing',
        sequenceNumber: 20,
        event: {
          eventName: 'complete',
          eventData: {},
          proofs: [{ address: 'processor' }]
        },
        state: { id: 'order999' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        id: 'order999',
        completed: true
      });
      expect(result.sideEffects.emit).toBeDefined();
      expect(result.sideEffects.emit.eventType).toBe('orderCompleted');
    });

    test('_spawn reserved key is NOT merged into state (extracted as side effect)', () => {
      const effect: JsonLogicExpression = {
        merge: [
          { var: 'state' },
          {
            spawningChild: true,
            _spawn: {
              workflowType: 'PaymentProcessor',
              initialState: { amount: { var: 'event.eventData.amount' } }
            }
          }
        ]
      };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 25,
        event: {
          eventName: 'initPayment',
          eventData: { amount: 1500 },
          proofs: [{ address: 'payer' }]
        },
        state: { id: 'parent123' }
      };

      const result = evaluateEffect(effect, context);
      
      expect(result.newState).toEqual({
        id: 'parent123',
        spawningChild: true
      });
      expect(result.sideEffects.spawn).toBeDefined();
      expect(result.sideEffects.spawn.workflowType).toBe('PaymentProcessor');
    });
  });

  describe('Group 11.3: Anti-Pattern Detection (unit tests)', () => {
    test('Non-deterministic transitions → validation error', () => {
      const invalidDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          end1: { id: { value: 'end1' }, isFinal: true, metadata: null },
          end2: { id: { value: 'end2' }, isFinal: true, metadata: null }
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'end1' },
            eventName: 'finish',
            guard: { '==': [{ var: 'event.eventData.choice' }, 'A'] },
            effect: { var: 'state' },
            dependencies: []
          },
          {
            from: { value: 'start' },
            to: { value: 'end2' },
            eventName: 'finish',
            guard: { '==': [{ var: 'event.eventData.choice' }, 'A'] }, // Same guard!
            effect: { var: 'state' },
            dependencies: []
          }
        ]
      };

      const report = validateStateMachine(invalidDefinition);
      
      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.type === 'NON_DETERMINISTIC')).toBe(true);
    });

    test('Unreachable state → validation warning', () => {
      const invalidDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          reachable: { id: { value: 'reachable' }, isFinal: false, metadata: null },
          unreachable: { id: { value: 'unreachable' }, isFinal: true, metadata: null } // No transitions to this
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'reachable' },
            eventName: 'move',
            guard: { var: true },
            effect: { var: 'state' },
            dependencies: []
          }
        ]
      };

      const report = validateStateMachine(invalidDefinition);
      
      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.type === 'UNREACHABLE_STATE')).toBe(true);
      expect(report.errors.find(e => e.type === 'UNREACHABLE_STATE')?.message).toContain('unreachable');
    });

    test('Circular dependency in dependencies array → validation error', () => {
      const invalidDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          end: { id: { value: 'end' }, isFinal: true, metadata: null }
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'end' },
            eventName: 'finish',
            guard: { var: true },
            effect: { var: 'state' },
            dependencies: ['scriptA', 'scriptB', 'scriptC', 'scriptA'] // Circular reference
          }
        ]
      };

      const report = validateStateMachine(invalidDefinition);
      
      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.type === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });

    test('Final state with outgoing transitions → validation error', () => {
      const invalidDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          final: { id: { value: 'final' }, isFinal: true, metadata: null }, // Marked as final
          afterFinal: { id: { value: 'afterFinal' }, isFinal: true, metadata: null }
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'final' },
            eventName: 'finish',
            guard: { var: true },
            effect: { var: 'state' },
            dependencies: []
          },
          {
            from: { value: 'final' }, // This violates the final state constraint
            to: { value: 'afterFinal' },
            eventName: 'continue',
            guard: { var: true },
            effect: { var: 'state' },
            dependencies: []
          }
        ]
      };

      const report = validateStateMachine(invalidDefinition);
      
      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.type === 'FINAL_STATE_VIOLATION')).toBe(true);
    });

    test('Reserved effect key collision → validation error', () => {
      const invalidDefinition: StateMachineDefinition = {
        states: {
          start: { id: { value: 'start' }, isFinal: false, metadata: null },
          end: { id: { value: 'end' }, isFinal: true, metadata: null }
        },
        initialState: { value: 'start' },
        transitions: [
          {
            from: { value: 'start' },
            to: { value: 'end' },
            eventName: 'finish',
            guard: { var: true },
            effect: {
              merge: [
                { var: 'state' },
                {
                  normalField: 'ok',
                  _oracleCall: 'should be object',
                  _invalidReserved: 'this should fail' // Invalid reserved key
                }
              ]
            },
            dependencies: []
          }
        ]
      };

      const report = validateStateMachine(invalidDefinition);
      
      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.type === 'RESERVED_KEY_COLLISION')).toBe(true);
    });
  });

  describe('Group 11.4: JSON Logic Context Variables (unit tests)', () => {
    test('event.eventName resolves correctly', () => {
      const expression: JsonLogicExpression = { '==': [{ var: 'event.eventName' }, 'purchase'] };
      
      const context: TransitionContext = {
        currentState: 'listed',
        sequenceNumber: 10,
        event: {
          eventName: 'purchase',
          eventData: { amount: 500 },
          proofs: [{ address: 'buyer' }]
        },
        state: {}
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('event.eventData.field resolves to nested data', () => {
      const expression: JsonLogicExpression = { '>': [{ var: 'event.eventData.price.amount' }, 100] };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 5,
        event: {
          eventName: 'bid',
          eventData: { 
            price: { amount: 250, currency: 'USD' },
            bidder: 'user123'
          },
          proofs: [{ address: 'bidder-address' }]
        },
        state: {}
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('event.proofs.0.address resolves to first signer', () => {
      const expression: JsonLogicExpression = { '==': [{ var: 'event.proofs.0.address' }, 'owner-address'] };
      
      const context: TransitionContext = {
        currentState: 'owned',
        sequenceNumber: 3,
        event: {
          eventName: 'transfer',
          eventData: { recipient: 'new-owner' },
          proofs: [
            { address: 'owner-address' },
            { address: 'witness-address' }
          ]
        },
        state: { ownerAddress: 'owner-address' }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('state.field resolves to current state field', () => {
      const expression: JsonLogicExpression = { '>=': [{ var: 'state.balance' }, { var: 'event.eventData.amount' }] };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 8,
        event: {
          eventName: 'withdraw',
          eventData: { amount: 300 },
          proofs: [{ address: 'user' }]
        },
        state: { balance: 500, ownerAddress: 'user' }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('$ordinal resolves to current metagraph ordinal', () => {
      const expression: JsonLogicExpression = { '<': [{ var: '$ordinal' }, { var: 'state.expiresAtOrdinal' }] };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 12,
        event: {
          eventName: 'extend',
          eventData: {},
          proofs: [{ address: 'extender' }]
        },
        state: { expiresAtOrdinal: 1000 },
        $ordinal: 800
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('delegation.active resolves correctly', () => {
      const expression: JsonLogicExpression = { '==': [{ var: 'delegation.active' }, true] };
      
      const context: TransitionContext = {
        currentState: 'managed',
        sequenceNumber: 6,
        event: {
          eventName: 'delegate_action',
          eventData: { operation: 'transfer' },
          proofs: [{ address: 'relayer-address' }]
        },
        state: {},
        delegation: {
          active: true,
          relayer: 'relayer-address',
          scope: ['transfer', 'approve']
        }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('delegation.relayer matches event signer', () => {
      const expression: JsonLogicExpression = { '==': [{ var: 'event.proofs.0.address' }, { var: 'delegation.relayer' }] };
      
      const context: TransitionContext = {
        currentState: 'managed',
        sequenceNumber: 9,
        event: {
          eventName: 'delegated_transfer',
          eventData: { recipient: 'receiver' },
          proofs: [{ address: 'trusted-relayer' }]
        },
        state: {},
        delegation: {
          active: true,
          relayer: 'trusted-relayer',
          scope: ['*']
        }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('delegation.scope contains operation', () => {
      const expression: JsonLogicExpression = { 'in': [{ var: 'event.eventData.operation' }, { var: 'delegation.scope' }] };
      
      const context: TransitionContext = {
        currentState: 'managed',
        sequenceNumber: 7,
        event: {
          eventName: 'execute',
          eventData: { operation: 'approve' },
          proofs: [{ address: 'relayer' }]
        },
        state: {},
        delegation: {
          active: true,
          relayer: 'relayer',
          scope: ['transfer', 'approve', 'burn']
        }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('delegation.spendRemaining >= requested amount', () => {
      const expression: JsonLogicExpression = { '>=': [{ var: 'delegation.spendRemaining' }, { var: 'event.eventData.amount' }] };
      
      const context: TransitionContext = {
        currentState: 'managed',
        sequenceNumber: 11,
        event: {
          eventName: 'spend',
          eventData: { amount: 200 },
          proofs: [{ address: 'spender' }]
        },
        state: {},
        delegation: {
          active: true,
          relayer: 'spender',
          scope: ['*'],
          spendRemaining: 500
        }
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('sequenceNumber in guard context', () => {
      const expression: JsonLogicExpression = { '>': [{ var: 'sequenceNumber' }, 5] };
      
      const context: TransitionContext = {
        currentState: 'active',
        sequenceNumber: 10,
        event: {
          eventName: 'check_sequence',
          eventData: {},
          proofs: [{ address: 'checker' }]
        },
        state: {}
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });

    test('nested object access: event.eventData.metadata.tags', () => {
      const expression: JsonLogicExpression = { 'in': ['urgent', { var: 'event.eventData.metadata.tags' }] };
      
      const context: TransitionContext = {
        currentState: 'processing',
        sequenceNumber: 4,
        event: {
          eventName: 'update',
          eventData: {
            metadata: {
              tags: ['urgent', 'priority', 'customer-facing']
            }
          },
          proofs: [{ address: 'updater' }]
        },
        state: {}
      };

      const result = evaluateGuard(expression, context);
      
      expect(result).toBe(true);
    });
  });

  describe('Group 11.5: Standard Lifecycle Templates', () => {
    test('getStandardTemplate("approval") returns 3-state approval workflow', () => {
      const template = getStandardTemplate('approval');
      
      expect(template.states).toHaveProperty('pending');
      expect(template.states).toHaveProperty('approved');
      expect(template.states).toHaveProperty('rejected');
      expect(template.initialState.value).toBe('pending');
      expect(template.transitions.length).toBeGreaterThanOrEqual(2);
    });

    test('getStandardTemplate("linear") returns sequential pipeline', () => {
      const template = getStandardTemplate('linear');
      
      expect(template.states).toHaveProperty('step1');
      expect(template.states).toHaveProperty('step2');
      expect(template.states).toHaveProperty('complete');
      expect(template.initialState.value).toBe('step1');
      
      // Should have sequential transitions: step1 -> step2 -> complete
      const step1ToStep2 = template.transitions.find(t => 
        t.from.value === 'step1' && t.to.value === 'step2'
      );
      const step2ToComplete = template.transitions.find(t => 
        t.from.value === 'step2' && t.to.value === 'complete'
      );
      
      expect(step1ToStep2).toBeDefined();
      expect(step2ToComplete).toBeDefined();
    });

    test('getStandardTemplate("marketplace") returns buy/sell lifecycle', () => {
      const template = getStandardTemplate('marketplace');
      
      expect(template.states).toHaveProperty('draft');
      expect(template.states).toHaveProperty('listed');
      expect(template.states).toHaveProperty('sold');
      expect(template.initialState.value).toBe('draft');
      
      // Should have marketplace-specific transitions
      const listTransition = template.transitions.find(t => 
        t.from.value === 'draft' && t.to.value === 'listed'
      );
      const purchaseTransition = template.transitions.find(t => 
        t.from.value === 'listed' && t.to.value === 'sold'
      );
      
      expect(listTransition).toBeDefined();
      expect(purchaseTransition).toBeDefined();
    });

    test('getStandardTemplate("expirable") includes expiry transitions', () => {
      const template = getStandardTemplate('expirable');
      
      expect(template.states).toHaveProperty('active');
      expect(template.states).toHaveProperty('expired');
      
      // Should have expiry transition with sequenceNumber guard
      const expireTransition = template.transitions.find(t => 
        t.to.value === 'expired'
      );
      
      expect(expireTransition).toBeDefined();
      expect(JSON.stringify(expireTransition?.guard)).toContain('sequenceNumber');
    });
  });
});