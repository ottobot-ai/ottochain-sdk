/**
 * Tests for GovernanceUniversal state machine
 */

import { govUniversalDef } from '../../src/apps/governance/state-machines/index';

describe('GovernanceUniversal State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(govUniversalDef).toBeDefined();
      expect(typeof govUniversalDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(govUniversalDef.metadata.name).toBe('GovernanceUniversal');
      expect(govUniversalDef.metadata.description).toBe(
        'Minimal governance state machine - extend for custom use cases'
      );
      expect(govUniversalDef.metadata.version).toBe('1.0.0');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'VOTING', 'DISSOLVED'];
      const actualStates = Object.keys(govUniversalDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(3);
    });

    it('should have correct initial state', () => {
      expect(govUniversalDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(govUniversalDef.states.ACTIVE.isFinal).toBe(false);
      expect(govUniversalDef.states.VOTING.isFinal).toBe(false);
      expect(govUniversalDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow propose transition from ACTIVE to VOTING', () => {
      const proposeTransition = govUniversalDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'VOTING' && t.eventName === 'propose'
      );

      expect(proposeTransition).toBeDefined();
      expect(proposeTransition!.guard).toBeDefined();
      expect(proposeTransition!.effect).toBeDefined();
    });

    it('should allow vote transition from VOTING to VOTING', () => {
      const voteTransition = govUniversalDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'vote'
      );

      expect(voteTransition).toBeDefined();
      expect(voteTransition!.guard).toBeDefined();
      expect(voteTransition!.effect).toBeDefined();
    });

    it('should allow finalize transition from VOTING to ACTIVE', () => {
      const finalizeTransition = govUniversalDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'finalize'
      );

      expect(finalizeTransition).toBeDefined();
      expect(finalizeTransition!.guard).toBeDefined();
      expect(finalizeTransition!.effect).toBeDefined();
    });

    it('should allow dissolve transition from ACTIVE to DISSOLVED', () => {
      const dissolveTransition = govUniversalDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve'
      );

      expect(dissolveTransition).toBeDefined();
      expect(dissolveTransition!.guard).toBeDefined();
      expect(dissolveTransition!.effect).toBeDefined();
    });

    it('should have exactly 4 transitions', () => {
      expect(govUniversalDef.transitions).toHaveLength(4);
    });
  });

  describe('Guard Logic', () => {
    it('should have permissive guards (always true)', () => {
      // Universal is minimal - guards are always-true placeholders
      const transitions = govUniversalDef.transitions;

      for (const transition of transitions) {
        // Guard should be { "==": [1, 1] } (always true)
        expect(transition.guard).toHaveProperty('==');
        const guard = transition.guard as { '==': [number, number] };
        expect(guard['==']).toEqual([1, 1]);
      }
    });
  });

  describe('Effect Logic', () => {
    it('should set proposal and status on propose', () => {
      const proposeTransition = govUniversalDef.transitions.find(
        (t) => t.eventName === 'propose'
      );

      const effectStr = JSON.stringify(proposeTransition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('status');
      expect(effectStr).toContain('VOTING');
      expect(effectStr).toContain('proposedAt');
      expect(effectStr).toContain('votes');
    });

    it('should merge votes on vote', () => {
      const voteTransition = govUniversalDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const effectStr = JSON.stringify(voteTransition!.effect);
      expect(effectStr).toContain('votes');
      expect(effectStr).toContain('merge');
    });

    it('should record last result on finalize', () => {
      const finalizeTransition = govUniversalDef.transitions.find(
        (t) => t.eventName === 'finalize'
      );

      const effectStr = JSON.stringify(finalizeTransition!.effect);
      expect(effectStr).toContain('lastProposal');
      expect(effectStr).toContain('lastResult');
      expect(effectStr).toContain('status');
      expect(effectStr).toContain('ACTIVE');
    });

    it('should set dissolved status on dissolve', () => {
      const dissolveTransition = govUniversalDef.transitions.find(
        (t) => t.eventName === 'dissolve'
      );

      const effectStr = JSON.stringify(dissolveTransition!.effect);
      expect(effectStr).toContain('status');
      expect(effectStr).toContain('DISSOLVED');
      expect(effectStr).toContain('dissolvedAt');
    });
  });

  describe('Minimal Design', () => {
    it('should be the simplest governance pattern', () => {
      // Only 3 states
      expect(Object.keys(govUniversalDef.states)).toHaveLength(3);

      // Only 4 transitions
      expect(govUniversalDef.transitions).toHaveLength(4);

      // No complex guards
      for (const transition of govUniversalDef.transitions) {
        // Should not have complex guard operators
        expect(transition.guard).not.toHaveProperty('and');
        expect(transition.guard).not.toHaveProperty('or');
        expect(transition.guard).not.toHaveProperty('>=');
        expect(transition.guard).not.toHaveProperty('<=');
        expect(transition.guard).not.toHaveProperty('in');
      }
    });

    it('should be extensible via custom guards', () => {
      // The "==" [1,1] guard is a placeholder that can be replaced
      // with custom logic when extending this state machine
      const transitions = govUniversalDef.transitions;
      for (const transition of transitions) {
        expect(transition.guard).toEqual({ '==': [1, 1] });
      }
    });
  });
});
