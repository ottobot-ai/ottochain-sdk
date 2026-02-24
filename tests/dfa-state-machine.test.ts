/**
 * DFA State Machine TDD Tests
 * 
 * Tests for the Deterministic Finite Automaton state machine implementation
 * with JSON Logic guard conditions as specified in dfa-json-logic-patterns.md.
 * 
 * These tests will FAIL until the state machine system is implemented.
 */

import { describe, it, expect } from '@jest/globals';

// Core state machine types that should be implemented
interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: { name: string; description: string; [key: string]: unknown };
}

interface StateDefinition {
  id: { value: string };
  isFinal: boolean;
  metadata: Record<string, unknown> | null;
}

interface TransitionDefinition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: JsonLogicExpression;
  effect?: JsonLogicExpression;
}

interface JsonLogicExpression {
  [operator: string]: unknown;
}

interface StateMachineContext {
  state: Record<string, unknown>;
  event: Record<string, unknown>;
  proofs: Array<{ address: string; [key: string]: unknown }>;
  sequenceNumber: number;
  delegation?: DelegationContext;
}

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

interface StateMachineEngine {
  createStateMachine(definition: StateMachineDefinition, initialData?: Record<string, unknown>): Promise<StateMachineInstance>;
  transitionStateMachine(
    instance: StateMachineInstance, 
    eventName: string, 
    eventData: Record<string, unknown>,
    context: Partial<StateMachineContext>
  ): Promise<StateMachineTransitionResult>;
  evaluateGuard(guard: JsonLogicExpression, context: StateMachineContext): boolean;
  applyEffect(effect: JsonLogicExpression, context: StateMachineContext): Record<string, unknown>;
}

interface StateMachineInstance {
  id: string;
  definition: StateMachineDefinition;
  currentState: string;
  stateData: Record<string, unknown>;
  sequenceNumber: number;
  created: number;
  lastUpdated: number;
}

interface StateMachineTransitionResult {
  success: boolean;
  previousState: string;
  newState: string;
  newStateData: Record<string, unknown>;
  newSequenceNumber: number;
  reason?: string;
  appliedTransition?: TransitionDefinition;
  sideEffects?: StateMachineSideEffect[];
}

interface StateMachineSideEffect {
  type: 'oracle_call' | 'emit' | 'spawn';
  data: Record<string, unknown>;
}

describe('DFA State Machine Core TDD Tests', () => {
  
  describe('StateMachine Creation and Initialization', () => {
    
    it('SHOULD FAIL: should create state machine from valid definition', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          minted: {
            id: { value: 'minted' },
            isFinal: false,
            metadata: {}
          },
          listed: {
            id: { value: 'listed' },
            isFinal: false,
            metadata: {}
          },
          burned: {
            id: { value: 'burned' },
            isFinal: true,
            metadata: {}
          }
        },
        initialState: { value: 'minted' },
        transitions: [
          {
            from: { value: 'minted' },
            to: { value: 'listed' },
            eventName: 'list',
            guard: { '===': [{ var: 'proofs.0.address' }, { var: 'state.ownerAddress' }] }
          },
          {
            from: { value: 'listed' },
            to: { value: 'burned' },
            eventName: 'burn',
            guard: { '===': [{ var: 'proofs.0.address' }, { var: 'state.ownerAddress' }] }
          }
        ],
        metadata: { name: 'Simple NFT', description: 'Basic NFT lifecycle' }
      };
      
      const initialData = {
        ownerAddress: '0x1234567890123456789012345678901234567890',
        tokenId: 'token-123',
        metadata: { name: 'Test NFT' }
      };
      
      const instance = await engine.createStateMachine(definition, initialData);
      
      expect(instance.id).toBeDefined();
      expect(instance.currentState).toBe('minted');
      expect(instance.stateData).toEqual(initialData);
      expect(instance.sequenceNumber).toBe(0);
      expect(instance.definition).toEqual(definition);
    });

    it('SHOULD FAIL: should reject state machine with invalid initial state', async () => {
      const engine = new StateMachineEngine();
      
      const invalidDefinition: StateMachineDefinition = {
        states: {
          minted: {
            id: { value: 'minted' },
            isFinal: false,
            metadata: {}
          }
        },
        initialState: { value: 'nonexistent_state' },
        transitions: [],
        metadata: {}
      };
      
      await expect(engine.createStateMachine(invalidDefinition))
        .rejects
        .toThrow('Initial state "nonexistent_state" not found in states definition');
    });

    it('SHOULD FAIL: should reject state machine with inconsistent state IDs', async () => {
      const engine = new StateMachineEngine();
      
      const inconsistentDefinition: StateMachineDefinition = {
        states: {
          minted: {
            id: { value: 'different_id' }, // ID doesn't match key
            isFinal: false,
            metadata: {}
          }
        },
        initialState: { value: 'minted' },
        transitions: [],
        metadata: {}
      };
      
      await expect(engine.createStateMachine(inconsistentDefinition))
        .rejects
        .toThrow('State key "minted" does not match state.id.value "different_id"');
    });

    it('SHOULD FAIL: should reject transitions from final states', async () => {
      const engine = new StateMachineEngine();
      
      const invalidTransitionDefinition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} },
          final: { id: { value: 'final' }, isFinal: true, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'final' }, // Final state should not have outgoing transitions
            to: { value: 'active' },
            eventName: 'reactivate',
            guard: { '===': [true, true] }
          }
        ],
        metadata: {}
      };
      
      await expect(engine.createStateMachine(invalidTransitionDefinition))
        .rejects
        .toThrow('Final state "final" cannot have outgoing transitions');
    });
  });

  describe('State Transitions and Guard Evaluation', () => {
    
    it('SHOULD FAIL: should transition when guard evaluates to true', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          minted: { id: { value: 'minted' }, isFinal: false, metadata: {} },
          listed: { id: { value: 'listed' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'minted' },
        transitions: [
          {
            from: { value: 'minted' },
            to: { value: 'listed' },
            eventName: 'list',
            guard: { '===': [{ var: 'proofs.0.address' }, { var: 'state.ownerAddress' }] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        ownerAddress: '0xowner123'
      });
      
      const context = {
        state: instance.stateData,
        event: { askingPrice: 1000, currency: 'DAG' },
        proofs: [{ address: '0xowner123' }],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 1000, currency: 'DAG' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.previousState).toBe('minted');
      expect(result.newState).toBe('listed');
      expect(result.newSequenceNumber).toBe(1);
    });

    it('SHOULD FAIL: should reject transition when guard evaluates to false', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          minted: { id: { value: 'minted' }, isFinal: false, metadata: {} },
          listed: { id: { value: 'listed' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'minted' },
        transitions: [
          {
            from: { value: 'minted' },
            to: { value: 'listed' },
            eventName: 'list',
            guard: { '===': [{ var: 'proofs.0.address' }, { var: 'state.ownerAddress' }] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        ownerAddress: '0xowner123'
      });
      
      const context = {
        state: instance.stateData,
        event: { askingPrice: 1000 },
        proofs: [{ address: '0xunauthorized' }], // Different address - guard should fail
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 1000 },
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.previousState).toBe('minted');
      expect(result.newState).toBe('minted'); // Should stay in same state
      expect(result.reason).toContain('Guard condition failed');
    });

    it('SHOULD FAIL: should reject transition from wrong state', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          minted: { id: { value: 'minted' }, isFinal: false, metadata: {} },
          listed: { id: { value: 'listed' }, isFinal: false, metadata: {} },
          sold: { id: { value: 'sold' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'minted' },
        transitions: [
          {
            from: { value: 'listed' }, // Only from listed state
            to: { value: 'sold' },
            eventName: 'purchase',
            guard: { '===': [true, true] } // Always true
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const context = {
        state: instance.stateData,
        event: { amount: 1000 },
        proofs: [{ address: '0xbuyer' }],
        sequenceNumber: 1
      };
      
      // Try to purchase from minted state (should fail)
      const result = await engine.transitionStateMachine(
        instance,
        'purchase',
        { amount: 1000 },
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No valid transition found for state "minted" and event "purchase"');
    });

    it('SHOULD FAIL: should reject unknown event', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          minted: { id: { value: 'minted' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'minted' },
        transitions: [
          {
            from: { value: 'minted' },
            to: { value: 'minted' },
            eventName: 'update',
            guard: { '===': [true, true] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const context = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'unknown_event', // Event not in transitions
        {},
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No valid transition found');
    });

    it('SHOULD FAIL: should reject all transitions on final state', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} },
          final: { id: { value: 'final' }, isFinal: true, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'final' },
            eventName: 'finalize',
            guard: { '===': [true, true] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      // First transition to final state
      const context1 = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 1
      };
      
      const result1 = await engine.transitionStateMachine(instance, 'finalize', {}, context1);
      expect(result1.success).toBe(true);
      expect(result1.newState).toBe('final');
      
      // Update instance state
      instance.currentState = result1.newState;
      instance.sequenceNumber = result1.newSequenceNumber;
      
      // Try another transition from final state (should fail)
      const context2 = {
        state: result1.newStateData,
        event: {},
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 2
      };
      
      const result2 = await engine.transitionStateMachine(instance, 'finalize', {}, context2);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('State "final" is final - no transitions allowed');
    });
  });

  describe('Multiple Transitions and Guard Priority', () => {
    
    it('SHOULD FAIL: should handle multiple transitions with same (from, event) - first matching guard wins', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          pending: { id: { value: 'pending' }, isFinal: false, metadata: {} },
          approved: { id: { value: 'approved' }, isFinal: false, metadata: {} },
          rejected: { id: { value: 'rejected' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'pending' },
        transitions: [
          {
            from: { value: 'pending' },
            to: { value: 'approved' },
            eventName: 'review',
            guard: { '===': [{ var: 'event.decision' }, 'approve'] } // First transition
          },
          {
            from: { value: 'pending' },
            to: { value: 'rejected' },
            eventName: 'review',
            guard: { '===': [{ var: 'event.decision' }, 'reject'] } // Second transition
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const approveContext = {
        state: instance.stateData,
        event: { decision: 'approve' },
        proofs: [{ address: '0xreviewer' }],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'review',
        { decision: 'approve' },
        approveContext
      );
      
      expect(result.success).toBe(true);
      expect(result.newState).toBe('approved');
      expect(result.appliedTransition?.to.value).toBe('approved');
    });

    it('SHOULD FAIL: should fail when no guards match for same (from, event) pair', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          pending: { id: { value: 'pending' }, isFinal: false, metadata: {} },
          approved: { id: { value: 'approved' }, isFinal: false, metadata: {} },
          rejected: { id: { value: 'rejected' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'pending' },
        transitions: [
          {
            from: { value: 'pending' },
            to: { value: 'approved' },
            eventName: 'review',
            guard: { '===': [{ var: 'event.decision' }, 'approve'] }
          },
          {
            from: { value: 'pending' },
            to: { value: 'rejected' },
            eventName: 'review',
            guard: { '===': [{ var: 'event.decision' }, 'reject'] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const invalidContext = {
        state: instance.stateData,
        event: { decision: 'invalid_decision' }, // No guard will match
        proofs: [{ address: '0xreviewer' }],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'review',
        { decision: 'invalid_decision' },
        invalidContext
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No matching guard condition');
    });
  });

  describe('Complex Guard Patterns', () => {
    
    it('SHOULD FAIL: should evaluate enum membership guards correctly', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          draft: { id: { value: 'draft' }, isFinal: false, metadata: {} },
          published: { id: { value: 'published' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'draft' },
        transitions: [
          {
            from: { value: 'draft' },
            to: { value: 'published' },
            eventName: 'publish',
            guard: { 'in': [{ var: 'event.currency' }, ['DAG', 'USDC', 'ETH']] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      // Valid currency
      const validContext = {
        state: instance.stateData,
        event: { currency: 'DAG' },
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 1
      };
      
      const validResult = await engine.transitionStateMachine(
        instance,
        'publish',
        { currency: 'DAG' },
        validContext
      );
      
      expect(validResult.success).toBe(true);
      
      // Reset instance for next test
      const instance2 = await engine.createStateMachine(definition, {});
      
      // Invalid currency
      const invalidContext = {
        state: instance2.stateData,
        event: { currency: 'INVALID' },
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 1
      };
      
      const invalidResult = await engine.transitionStateMachine(
        instance2,
        'publish',
        { currency: 'INVALID' },
        invalidContext
      );
      
      expect(invalidResult.success).toBe(false);
    });

    it('SHOULD FAIL: should evaluate sequence number-based expiry guards', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} },
          expired: { id: { value: 'expired' }, isFinal: true, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'expired' },
            eventName: 'expire',
            guard: { '>=': [{ var: 'sequenceNumber' }, { var: 'state.expiresAtSequence' }] }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        expiresAtSequence: 5
      });
      
      // Before expiry (sequence 3 < 5)
      const beforeExpiryContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 3
      };
      
      const beforeResult = await engine.transitionStateMachine(
        instance,
        'expire',
        {},
        beforeExpiryContext
      );
      
      expect(beforeResult.success).toBe(false);
      
      // At expiry (sequence 5 >= 5)
      const atExpiryContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xuser' }],
        sequenceNumber: 5
      };
      
      const atExpiryResult = await engine.transitionStateMachine(
        instance,
        'expire',
        {},
        atExpiryContext
      );
      
      expect(atExpiryResult.success).toBe(true);
    });

    it('SHOULD FAIL: should evaluate complex logical combinations (AND, OR, NOT)', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          restricted: { id: { value: 'restricted' }, isFinal: false, metadata: {} },
          unrestricted: { id: { value: 'unrestricted' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'restricted' },
        transitions: [
          {
            from: { value: 'restricted' },
            to: { value: 'unrestricted' },
            eventName: 'unlock',
            guard: {
              'and': [
                { '===': [{ var: 'proofs.0.address' }, { var: 'state.ownerAddress' }] },
                { '>=': [{ var: 'event.amount' }, 1000] },
                { 'in': [{ var: 'event.currency' }, ['DAG', 'USDC']] },
                {
                  'or': [
                    { '===': [{ var: 'state.verified' }, true] },
                    { '>=': [{ var: 'state.trustScore' }, 80] }
                  ]
                }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        ownerAddress: '0xowner',
        verified: false,
        trustScore: 85
      });
      
      const context = {
        state: instance.stateData,
        event: { amount: 1500, currency: 'DAG' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'unlock',
        { amount: 1500, currency: 'DAG' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.newState).toBe('unrestricted');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    it('SHOULD FAIL: should handle missing context variables gracefully', async () => {
      const engine = new StateMachineEngine();
      
      const guard = { '===': [{ var: 'nonexistent.field' }, 'value'] };
      const context = {
        state: {},
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      // Should not throw, but should evaluate to false/null
      const result = engine.evaluateGuard(guard, context);
      expect(result).toBe(false);
    });

    it('SHOULD FAIL: should validate state machine definition structure', async () => {
      const engine = new StateMachineEngine();
      
      const malformedDefinition = {
        states: {}, // No states defined
        initialState: { value: 'missing' },
        transitions: [],
        metadata: {}
      } as StateMachineDefinition;
      
      await expect(engine.createStateMachine(malformedDefinition))
        .rejects
        .toThrow('No states defined in state machine');
    });

    it('SHOULD FAIL: should handle invalid JSON Logic expressions', async () => {
      const engine = new StateMachineEngine();
      
      const invalidGuard = { 'nonexistent_operator': [1, 2] };
      const context = {
        state: {},
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      expect(() => engine.evaluateGuard(invalidGuard, context))
        .toThrow('Unknown JSON Logic operator: nonexistent_operator');
    });

    it('SHOULD FAIL: should prevent state machine corruption on failed transitions', async () => {
      const engine = new StateMachineEngine();
      
      const definition: StateMachineDefinition = {
        states: {
          stable: { id: { value: 'stable' }, isFinal: false, metadata: {} },
          unstable: { id: { value: 'unstable' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'stable' },
        transitions: [
          {
            from: { value: 'stable' },
            to: { value: 'unstable' },
            eventName: 'change',
            guard: { 'throw_error': true } // Intentional error in guard
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, { value: 'initial' });
      const originalState = { ...instance.stateData };
      const originalSequence = instance.sequenceNumber;
      
      const context = {
        state: instance.stateData,
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(instance, 'change', {}, context);
      
      expect(result.success).toBe(false);
      expect(instance.stateData).toEqual(originalState); // State should be unchanged
      expect(instance.sequenceNumber).toBe(originalSequence); // Sequence should be unchanged
    });
  });
});

describe('State Machine Guard Evaluation Engine TDD Tests', () => {
  
  describe('JSON Logic Operator Support', () => {
    
    it('SHOULD FAIL: should support comparison operators (===, !==, >, <, >=, <=)', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: { value: 10, name: 'test' },
        event: { amount: 15 },
        proofs: [],
        sequenceNumber: 5
      };
      
      // Equality
      expect(engine.evaluateGuard({ '===': [10, 10] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '===': [{ var: 'state.value' }, 10] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '===': [{ var: 'state.name' }, 'test'] }, context)).toBe(true);
      
      // Inequality
      expect(engine.evaluateGuard({ '!==': [10, 5] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '!==': [{ var: 'state.value' }, 5] }, context)).toBe(true);
      
      // Comparisons
      expect(engine.evaluateGuard({ '>': [{ var: 'event.amount' }, { var: 'state.value' }] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '>=': [{ var: 'sequenceNumber' }, 5] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '<': [{ var: 'state.value' }, { var: 'event.amount' }] }, context)).toBe(true);
      expect(engine.evaluateGuard({ '<=': [5, { var: 'sequenceNumber' }] }, context)).toBe(true);
    });

    it('SHOULD FAIL: should support logical operators (and, or, not)', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: { isActive: true, balance: 100 },
        event: { amount: 50 },
        proofs: [],
        sequenceNumber: 1
      };
      
      // AND
      expect(engine.evaluateGuard({
        'and': [
          { var: 'state.isActive' },
          { '>=': [{ var: 'state.balance' }, { var: 'event.amount' }] }
        ]
      }, context)).toBe(true);
      
      // OR
      expect(engine.evaluateGuard({
        'or': [
          { '===': [{ var: 'state.balance' }, 0] },
          { '>': [{ var: 'state.balance' }, 50] }
        ]
      }, context)).toBe(true);
      
      // NOT
      expect(engine.evaluateGuard({
        'not': [{ '===': [{ var: 'state.isActive' }, false] }]
      }, context)).toBe(true);
    });

    it('SHOULD FAIL: should support array operators (in, map, filter)', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: { 
          allowedCurrencies: ['DAG', 'USDC', 'ETH'],
          transactions: [
            { amount: 100, type: 'deposit' },
            { amount: 50, type: 'withdrawal' }
          ]
        },
        event: { currency: 'DAG' },
        proofs: [],
        sequenceNumber: 1
      };
      
      // IN
      expect(engine.evaluateGuard({
        'in': [{ var: 'event.currency' }, { var: 'state.allowedCurrencies' }]
      }, context)).toBe(true);
      
      // MAP
      const mapResult = engine.evaluateGuard({
        'map': [
          { var: 'state.transactions' },
          { var: 'amount' }
        ]
      }, context);
      expect(mapResult).toEqual([100, 50]);
      
      // Array length check
      expect(engine.evaluateGuard({
        '>': [
          { 'count': [{ var: 'state.transactions' }] },
          0
        ]
      }, context)).toBe(true);
    });

    it('SHOULD FAIL: should support mathematical operators (+, -, *, /, %)', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: { balance: 1000, fee: 25 },
        event: { amount: 100 },
        proofs: [],
        sequenceNumber: 1
      };
      
      // Addition
      expect(engine.evaluateGuard({
        '===': [
          { '+': [{ var: 'event.amount' }, { var: 'state.fee' }] },
          125
        ]
      }, context)).toBe(true);
      
      // Subtraction
      expect(engine.evaluateGuard({
        '>': [
          { '-': [{ var: 'state.balance' }, { var: 'event.amount' }] },
          800
        ]
      }, context)).toBe(true);
      
      // Modulo
      expect(engine.evaluateGuard({
        '===': [
          { '%': [{ var: 'state.balance' }, 100] },
          0
        ]
      }, context)).toBe(true);
    });

    it('SHOULD FAIL: should support variable access with nested paths', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: {
          nested: {
            deep: {
              value: 'found'
            }
          },
          array: [
            { id: 1, name: 'first' },
            { id: 2, name: 'second' }
          ]
        },
        event: {},
        proofs: [
          { address: '0x123', metadata: { type: 'owner' } }
        ],
        sequenceNumber: 1
      };
      
      // Deep nested access
      expect(engine.evaluateGuard({
        '===': [{ var: 'state.nested.deep.value' }, 'found']
      }, context)).toBe(true);
      
      // Array index access
      expect(engine.evaluateGuard({
        '===': [{ var: 'state.array.0.name' }, 'first']
      }, context)).toBe(true);
      
      // Proof array access
      expect(engine.evaluateGuard({
        '===': [{ var: 'proofs.0.address' }, '0x123']
      }, context)).toBe(true);
      
      expect(engine.evaluateGuard({
        '===': [{ var: 'proofs.0.metadata.type' }, 'owner']
      }, context)).toBe(true);
    });
  });

  describe('Context Variable Resolution', () => {
    
    it('SHOULD FAIL: should resolve all standard context variables', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: { balance: 1000 },
        event: { type: 'transfer', amount: 100 },
        proofs: [{ address: '0xuser123' }],
        sequenceNumber: 42
      };
      
      // State variables
      expect(engine.evaluateGuard({
        '===': [{ var: 'state.balance' }, 1000]
      }, context)).toBe(true);
      
      // Event variables
      expect(engine.evaluateGuard({
        '===': [{ var: 'event.type' }, 'transfer']
      }, context)).toBe(true);
      
      expect(engine.evaluateGuard({
        '===': [{ var: 'event.amount' }, 100]
      }, context)).toBe(true);
      
      // Proof variables
      expect(engine.evaluateGuard({
        '===': [{ var: 'proofs.0.address' }, '0xuser123']
      }, context)).toBe(true);
      
      // Sequence number
      expect(engine.evaluateGuard({
        '===': [{ var: 'sequenceNumber' }, 42]
      }, context)).toBe(true);
    });

    it('SHOULD FAIL: should handle missing context variables with default values', async () => {
      const engine = new StateMachineEngine();
      
      const context = {
        state: {},
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      // Missing state field should return null/undefined
      expect(engine.evaluateGuard({
        '===': [{ var: 'state.nonexistent' }, null]
      }, context)).toBe(true);
      
      // Default value handling
      expect(engine.evaluateGuard({
        '===': [{ var: 'state.nonexistent' }, { var: 'default' }]
      }, context)).toBe(true);
    });
  });
});