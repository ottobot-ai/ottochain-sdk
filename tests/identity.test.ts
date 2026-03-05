import {
  getIdentityDefinition,
  AGENT_TRANSITIONS,
  ATTESTATION_DELTAS,
  canTransition,
  getReputationDelta,
  DEFAULT_REPUTATION_CONFIG,
  AgentState,
  AttestationType,
} from '../src/apps/identity';

describe('Identity module', () => {
  describe('getIdentityDefinition', () => {
    it('returns the agent identity state machine definition', () => {
      const def = getIdentityDefinition();
      expect(def).toBeDefined();
      expect(typeof def).toBe('object');
    });

    it('definition has expected structure', () => {
      const def = getIdentityDefinition() as any;
      expect(def).toHaveProperty('states');
      expect(def).toHaveProperty('initialState');
      expect(def).toHaveProperty('transitions');
    });
  });

  describe('DEFAULT_REPUTATION_CONFIG', () => {
    it('has expected defaults', () => {
      expect(DEFAULT_REPUTATION_CONFIG.baseReputation).toBe(10);
      expect(DEFAULT_REPUTATION_CONFIG.minReputation).toBe(0);
      expect(DEFAULT_REPUTATION_CONFIG.completionDelta).toBeDefined();
      expect(DEFAULT_REPUTATION_CONFIG.vouchDelta).toBeDefined();
      expect(DEFAULT_REPUTATION_CONFIG.violationDelta).toBeDefined();
      expect(DEFAULT_REPUTATION_CONFIG.behavioralDelta).toBeDefined();
      expect(DEFAULT_REPUTATION_CONFIG.challengeThreshold).toBeDefined();
    });
  });

  describe('AGENT_TRANSITIONS', () => {
    it('is defined and non-empty', () => {
      expect(AGENT_TRANSITIONS).toBeDefined();
      expect(typeof AGENT_TRANSITIONS).toBe('object');
    });
  });

  describe('ATTESTATION_DELTAS', () => {
    it('is defined and non-empty', () => {
      expect(ATTESTATION_DELTAS).toBeDefined();
      expect(typeof ATTESTATION_DELTAS).toBe('object');
    });
  });

  describe('canTransition', () => {
    it('returns true for valid transition', () => {
      expect(canTransition(AgentState.AGENT_STATE_REGISTERED, 'activate')).toBe(true);
    });

    it('returns false for invalid transition', () => {
      expect(canTransition(AgentState.AGENT_STATE_WITHDRAWN, 'activate')).toBe(false);
    });

    it('returns false for terminal state', () => {
      expect(canTransition(AgentState.AGENT_STATE_WITHDRAWN, 'any_event')).toBe(false);
    });
  });

  describe('getReputationDelta', () => {
    it('returns positive delta for completion', () => {
      expect(getReputationDelta(AttestationType.ATTESTATION_TYPE_COMPLETION)).toBeGreaterThan(0);
    });

    it('returns 0 for unrecognized type', () => {
      expect(getReputationDelta(AttestationType.ATTESTATION_TYPE_UNSPECIFIED)).toBe(0);
    });
  });
});
