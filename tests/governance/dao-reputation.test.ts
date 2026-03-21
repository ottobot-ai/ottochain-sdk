/**
 * Tests for DAOReputation state machine
 */

import { daoReputationDef } from '../../src/apps/governance/state-machines/index';

describe('DAOReputation State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(daoReputationDef).toBeDefined();
      expect(typeof daoReputationDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(daoReputationDef.metadata.name).toBe('DAOReputation');
      expect(daoReputationDef.metadata.description).toBe(
        'Reputation-based governance. Minimum reputation required for participation.'
      );
      expect(daoReputationDef.metadata.version).toBe('1.0.0');
      expect(daoReputationDef.metadata.category).toBe('governance/dao');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'VOTING', 'DISSOLVED'];
      const actualStates = Object.keys(daoReputationDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(3);
    });

    it('should have correct initial state', () => {
      expect(daoReputationDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(daoReputationDef.states.ACTIVE.isFinal).toBe(false);
      expect(daoReputationDef.states.VOTING.isFinal).toBe(false);
      expect(daoReputationDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow propose transition from ACTIVE to VOTING', () => {
      const proposeTransition = daoReputationDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'VOTING' && t.eventName === 'propose'
      );

      expect(proposeTransition).toBeDefined();
      expect(proposeTransition!.guard).toBeDefined();
      expect(proposeTransition!.effect).toBeDefined();
    });

    it('should allow vote transition from VOTING to VOTING', () => {
      const voteTransition = daoReputationDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'vote'
      );

      expect(voteTransition).toBeDefined();
      expect(voteTransition!.guard).toBeDefined();
      expect(voteTransition!.effect).toBeDefined();
    });

    it('should allow execute transition from VOTING to ACTIVE', () => {
      const executeTransition = daoReputationDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'execute'
      );

      expect(executeTransition).toBeDefined();
      expect(executeTransition!.guard).toBeDefined();
      expect(executeTransition!.effect).toBeDefined();
    });

    it('should allow reject transition from VOTING to ACTIVE', () => {
      const rejectTransition = daoReputationDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'reject'
      );

      expect(rejectTransition).toBeDefined();
      expect(rejectTransition!.guard).toBeDefined();
    });
  });

  describe('Membership Transitions', () => {
    it('should support join transition', () => {
      const transition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'join'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('ACTIVE');
    });

    it('should support leave transition', () => {
      const transition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'leave'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('ACTIVE');
    });

    it('should support propose_threshold_change transition', () => {
      const transition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'propose_threshold_change'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('VOTING');
    });
  });

  describe('Guard Logic', () => {
    it('should guard propose to reputation threshold', () => {
      const proposeTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      expect(proposeTransition!.guard).toHaveProperty('>=');
      const guardStr = JSON.stringify(proposeTransition!.guard);
      expect(guardStr).toContain('agentReputation');
      expect(guardStr).toContain('proposeThreshold');
    });

    it('should guard vote to reputation and deadline', () => {
      const voteTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      expect(voteTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(voteTransition!.guard);
      expect(guardStr).toContain('voteThreshold');
      expect(guardStr).toContain('deadline');
    });

    it('should guard vote to prevent double-voting', () => {
      const voteTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const guardStr = JSON.stringify(voteTransition!.guard);
      expect(guardStr).toContain('votes.for');
      expect(guardStr).toContain('votes.against');
      expect(guardStr).toContain('votes.abstain');
    });

    it('should guard execute to deadline passed and quorum met', () => {
      const executeTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      expect(executeTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(executeTransition!.guard);
      expect(guardStr).toContain('deadline');
      expect(guardStr).toContain('quorum');
    });

    it('should guard join to membership reputation threshold', () => {
      const joinTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'join'
      );

      expect(joinTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(joinTransition!.guard);
      expect(guardStr).toContain('memberThreshold');
    });

    it('should guard leave to current members only', () => {
      const leaveTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'leave'
      );

      expect(leaveTransition!.guard).toHaveProperty('in');
      const guardStr = JSON.stringify(leaveTransition!.guard);
      expect(guardStr).toContain('members');
    });
  });

  describe('Effect Logic', () => {
    it('should create proposal with voting tracking on propose', () => {
      const proposeTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      const effectStr = JSON.stringify(proposeTransition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('votes');
      expect(effectStr).toContain('deadline');
    });

    it('should track for/against/abstain votes', () => {
      const voteTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const effectStr = JSON.stringify(voteTransition!.effect);
      expect(effectStr).toContain('votes');
      expect(effectStr).toContain('for');
      expect(effectStr).toContain('against');
    });

    it('should record history on execute', () => {
      const executeTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      const effectStr = JSON.stringify(executeTransition!.effect);
      expect(effectStr).toContain('history');
      expect(effectStr).toContain('executed');
    });

    it('should emit proposal_executed event', () => {
      const executeTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'execute'
      ) as { emits?: Array<{ event: string; to: string }> } | undefined;

      expect(executeTransition!.emits).toBeDefined();
      expect(executeTransition!.emits![0].event).toBe('proposal_executed');
      expect(executeTransition!.emits![0].to).toBe('Reputation');
    });

    it('should add member on join', () => {
      const joinTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'join'
      );

      const effectStr = JSON.stringify(joinTransition!.effect);
      expect(effectStr).toContain('members');
      expect(effectStr).toContain('memberJoinedAt');
    });

    it('should remove member on leave', () => {
      const leaveTransition = daoReputationDef.transitions.find(
        (t) => t.eventName === 'leave'
      );

      const effectStr = JSON.stringify(leaveTransition!.effect);
      expect(effectStr).toContain('filter');
    });
  });

  describe('Cross-References', () => {
    it('should have cross-references defined', () => {
      expect(daoReputationDef.metadata.crossReferences).toBeDefined();
      expect(daoReputationDef.metadata.crossReferences).toHaveProperty('Identity');
      expect(daoReputationDef.metadata.crossReferences).toHaveProperty('Reputation');
      expect(daoReputationDef.metadata.crossReferences).toHaveProperty('Contract');
    });
  });
});
