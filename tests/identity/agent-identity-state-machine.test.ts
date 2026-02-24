/**
 * TDD Tests for Identity Domain Stack Fixes
 * 
 * These tests are designed to FAIL before implementation and PASS after.
 * 
 * Issues tested:
 * - T1.x: $timestamp → sequenceNumber fixes (3 transitions)
 * - T2.x: receive_violation transition existence and structure (5 tests)
 * 
 * @see docs/design/identity-domain-stack-fixes-spec.md
 */

import agentIdentityStateMachine from '../../src/apps/identity/state-machines/agent-identity.json';

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

describe('AgentIdentity State Machine Definition', () => {
  // T1: $timestamp replacement
  describe('$timestamp fixes', () => {
    it('T1.1: activate effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('activate');
      const effectStr = JSON.stringify(transition.effect);
      
      // This should FAIL initially because activate still uses $timestamp
      expect(effectStr).not.toContain('$timestamp');
      expect(effectStr).toContain('sequenceNumber');
    });

    it('T1.2: uphold_challenge effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('uphold_challenge');
      const effectStr = JSON.stringify(transition.effect);
      
      // This should FAIL initially because uphold_challenge still uses $timestamp
      expect(effectStr).not.toContain('$timestamp');
      expect(effectStr).toContain('sequenceNumber');
    });

    it('T1.3: begin_probation effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('begin_probation');
      const effectStr = JSON.stringify(transition.effect);
      
      // This should FAIL initially because begin_probation still uses $timestamp
      expect(effectStr).not.toContain('$timestamp');
      expect(effectStr).toContain('sequenceNumber');
    });
  });

  // T2: receive_violation transition exists
  describe('receive_violation transition', () => {
    it('T2.1: receive_violation transition exists', () => {
      // This should FAIL initially because receive_violation doesn't exist yet
      expect(() => getTransition('receive_violation')).not.toThrow();
    });

    it('T2.2: receive_violation is ACTIVE→ACTIVE self-loop', () => {
      const transition = getTransition('receive_violation');
      expect(transition.from.value).toBe('ACTIVE');
      expect(transition.to.value).toBe('ACTIVE');
    });

    it('T2.3: receive_violation guard requires event.reporter', () => {
      const transition = getTransition('receive_violation');
      expect(transition.guard).toEqual({ '!!': [{ var: 'event.reporter' }] });
    });

    it('T2.4: receive_violation effect decrements reputation by 10', () => {
      const transition = getTransition('receive_violation');
      const effectStr = JSON.stringify(transition.effect);
      expect(effectStr).toContain('-10');
      expect(effectStr).toContain('reputation');
    });

    it('T2.5: receive_violation effect increments violations counter', () => {
      const transition = getTransition('receive_violation');
      const effectStr = JSON.stringify(transition.effect);
      expect(effectStr).toContain('violations');
      
      // Should increment violations counter (+1 with null-coalescing)
      expect(effectStr).toContain('"+":');
    });

    it('T2.6: receive_violation effect sets lastViolationAt to sequenceNumber', () => {
      const transition = getTransition('receive_violation');
      const effectStr = JSON.stringify(transition.effect);
      expect(effectStr).toContain('lastViolationAt');
      expect(effectStr).toContain('sequenceNumber');
    });
  });
});