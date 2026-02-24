/**
 * TDD Tests for Effect Execution
 * 
 * These tests verify that JSON Logic effects execute correctly with the right context.
 * Group T7.x: Effect execution correctness (5 tests)
 * 
 * @see docs/design/identity-domain-stack-fixes-spec.md
 */

import agentIdentityStateMachine from '../../src/apps/identity/state-machines/agent-identity.json';
import { JSONPath } from 'jsonpath-plus';

interface Transition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: any;
  effect: any;
  dependencies: any[];
}

function getTransition(eventName: string): Transition {
  const transition = agentIdentityStateMachine.transitions.find(
    (t: Transition) => t.eventName === eventName
  );
  if (!transition) {
    throw new Error(`Transition '${eventName}' not found in state machine`);
  }
  return transition;
}

/**
 * Simple JSON Logic evaluator for testing effects
 * This is a minimal implementation for our test cases
 */
function applyEffect(effect: any, context: any): any {
  if (typeof effect !== 'object' || effect === null) {
    return effect;
  }

  // Handle variable references
  if (effect.var) {
    return JSONPath({ path: `$.${effect.var}`, json: context })[0];
  }

  // Handle merge operation
  if (effect.merge && Array.isArray(effect.merge)) {
    let result = {};
    for (const item of effect.merge) {
      const evaluated = applyEffect(item, context);
      result = { ...result, ...evaluated };
    }
    return result;
  }

  // Handle addition
  if (effect['+'] && Array.isArray(effect['+'])) {
    return effect['+'].reduce((acc: number, item: any) => {
      const val = applyEffect(item, context);
      return acc + (typeof val === 'number' ? val : 0);
    }, 0);
  }

  // Handle if-else
  if (effect.if && Array.isArray(effect.if)) {
    const [condition, thenVal, elseVal] = effect.if;
    const condResult = applyEffect(condition, context);
    return condResult ? applyEffect(thenVal, context) : applyEffect(elseVal, context);
  }

  // Handle object with evaluated properties
  if (typeof effect === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(effect)) {
      result[key] = applyEffect(value, context);
    }
    return result;
  }

  return effect;
}

describe('Effect Execution', () => {
  describe('activate effect', () => {
    it('T7.1: activate sets activatedAt to sequenceNumber value', () => {
      const transition = getTransition('activate');
      const context = { 
        state: { status: 'REGISTERED' }, 
        sequenceNumber: 42 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // This should FAIL initially because activate uses $timestamp, not sequenceNumber
      expect(result.activatedAt).toBe(42);
    });
  });

  describe('receive_violation effect', () => {
    it('T7.2: receive_violation decrements reputation', () => {
      const transition = getTransition('receive_violation');
      const context = { 
        state: { reputation: 50, violations: 0 }, 
        sequenceNumber: 100 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // Should decrement reputation by 10
      expect(result.reputation).toBe(40);
    });

    it('T7.3: receive_violation increments violations counter', () => {
      const transition = getTransition('receive_violation');
      const context = { 
        state: { reputation: 50, violations: 2 }, 
        sequenceNumber: 100 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // Should increment violations counter from 2 to 3
      expect(result.violations).toBe(3);
    });

    it('T7.4: receive_violation initializes violations counter from 0', () => {
      const transition = getTransition('receive_violation');
      const context = { 
        state: { reputation: 50 }, // No violations field present
        sequenceNumber: 100 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // Should initialize violations to 1 (0 + 1)
      expect(result.violations).toBe(1);
    });

    it('T7.5: receive_violation sets lastViolationAt', () => {
      const transition = getTransition('receive_violation');
      const context = { 
        state: { reputation: 50, violations: 0 }, 
        sequenceNumber: 123 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // Should set lastViolationAt to sequenceNumber
      expect(result.lastViolationAt).toBe(123);
    });
  });

  describe('uphold_challenge effect', () => {
    it('T7.6: uphold_challenge sets suspendedAt to sequenceNumber value', () => {
      const transition = getTransition('uphold_challenge');
      const context = { 
        state: { status: 'CHALLENGED' }, 
        sequenceNumber: 55 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // This should FAIL initially because uphold_challenge uses $timestamp, not sequenceNumber
      expect(result.suspendedAt).toBe(55);
    });
  });

  describe('begin_probation effect', () => {
    it('T7.7: begin_probation sets probationStartedAt to sequenceNumber value', () => {
      const transition = getTransition('begin_probation');
      const context = { 
        state: { status: 'SUSPENDED' }, 
        sequenceNumber: 77 
      };
      
      const result = applyEffect(transition.effect, context);
      
      // This should FAIL initially because begin_probation uses $timestamp, not sequenceNumber
      expect(result.probationStartedAt).toBe(77);
    });
  });
});