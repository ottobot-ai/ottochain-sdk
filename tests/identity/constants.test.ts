/**
 * TDD Tests for AGENT_TRANSITIONS Constants
 * 
 * These tests verify that AGENT_TRANSITIONS includes all valid events for each state.
 * Group T3.x: AGENT_TRANSITIONS completeness (6 tests)
 * 
 * @see docs/design/identity-domain-stack-fixes-spec.md
 */

import { AgentState } from '../../src/generated/ottochain/apps/identity/v1/agent.js';
import { canTransition, AGENT_TRANSITIONS } from '../../src/apps/identity/constants.js';

describe('AGENT_TRANSITIONS', () => {
  describe('ACTIVE state transitions', () => {
    it('T3.1: ACTIVE allows receive_vouch', () => {
      // This should FAIL initially because ACTIVE only has ['challenge', 'withdraw']
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_vouch')).toBe(true);
    });

    it('T3.2: ACTIVE allows receive_completion', () => {
      // This should FAIL initially because ACTIVE only has ['challenge', 'withdraw']
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_completion')).toBe(true);
    });

    it('T3.3: ACTIVE allows receive_violation', () => {
      // This should FAIL initially because ACTIVE only has ['challenge', 'withdraw']
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_violation')).toBe(true);
    });

    it('T3.4: ACTIVE allows challenge', () => {
      // This should PASS initially (challenge is already in the list)
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'challenge')).toBe(true);
    });

    it('T3.5: ACTIVE allows withdraw', () => {
      // This should PASS initially (withdraw is already in the list)
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'withdraw')).toBe(true);
    });

    it('T3.6: ACTIVE rejects invalid event', () => {
      // This tests for the OLD event name that should NOT be allowed
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'submit_attestation')).toBe(false);
    });
  });

  describe('ACTIVE transitions completeness', () => {
    it('T3.7: ACTIVE transitions array includes all required events', () => {
      const activeTransitions = AGENT_TRANSITIONS[AgentState.AGENT_STATE_ACTIVE];
      const expectedEvents = [
        'receive_vouch',
        'receive_completion', 
        'receive_violation',
        'challenge',
        'withdraw'
      ];
      
      // Check that all expected events are present
      expectedEvents.forEach(event => {
        expect(activeTransitions).toContain(event);
      });
      
      // Check that we have exactly the expected number of events
      expect(activeTransitions).toHaveLength(5);
    });
  });
});