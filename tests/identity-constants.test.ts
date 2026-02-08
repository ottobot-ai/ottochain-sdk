import {
  AgentState,
  AttestationType,
  AGENT_TRANSITIONS,
  ATTESTATION_DELTAS,
  canTransition,
  getReputationDelta,
} from '../src/apps/identity/index.js';

describe('Identity Constants', () => {
  describe('AGENT_TRANSITIONS', () => {
    it('should define transitions for all states', () => {
      expect(AGENT_TRANSITIONS[AgentState.AGENT_STATE_REGISTERED]).toContain('activate');
      expect(AGENT_TRANSITIONS[AgentState.AGENT_STATE_REGISTERED]).toContain('withdraw');
      expect(AGENT_TRANSITIONS[AgentState.AGENT_STATE_ACTIVE]).toContain('challenge');
      expect(AGENT_TRANSITIONS[AgentState.AGENT_STATE_WITHDRAWN]).toEqual([]);
    });

    it('should not allow transitions from terminal state', () => {
      expect(AGENT_TRANSITIONS[AgentState.AGENT_STATE_WITHDRAWN]).toHaveLength(0);
    });
  });

  describe('ATTESTATION_DELTAS', () => {
    it('should define correct deltas', () => {
      expect(ATTESTATION_DELTAS[AttestationType.ATTESTATION_TYPE_COMPLETION]).toBe(5);
      expect(ATTESTATION_DELTAS[AttestationType.ATTESTATION_TYPE_VOUCH]).toBe(2);
      expect(ATTESTATION_DELTAS[AttestationType.ATTESTATION_TYPE_VIOLATION]).toBe(-10);
      expect(ATTESTATION_DELTAS[AttestationType.ATTESTATION_TYPE_BEHAVIORAL]).toBe(3);
    });

    it('should return 0 for unspecified', () => {
      expect(ATTESTATION_DELTAS[AttestationType.ATTESTATION_TYPE_UNSPECIFIED]).toBe(0);
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(canTransition(AgentState.AGENT_STATE_REGISTERED, 'activate')).toBe(true);
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'challenge')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransition(AgentState.AGENT_STATE_WITHDRAWN, 'activate')).toBe(false);
      expect(canTransition(AgentState.AGENT_STATE_REGISTERED, 'suspend')).toBe(false);
    });
  });

  describe('getReputationDelta', () => {
    it('should return correct delta for type', () => {
      expect(getReputationDelta(AttestationType.ATTESTATION_TYPE_COMPLETION)).toBe(5);
      expect(getReputationDelta(AttestationType.ATTESTATION_TYPE_VIOLATION)).toBe(-10);
    });

    it('should return 0 for unrecognized', () => {
      expect(getReputationDelta(AttestationType.UNRECOGNIZED)).toBe(0);
    });
  });
});
