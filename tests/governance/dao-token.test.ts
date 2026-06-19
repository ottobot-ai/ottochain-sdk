/**
 * Tests for TokenDAO state machine
 */

import { daoTokenDef } from '../../src/apps/governance/state-machines/index';

describe('TokenDAO State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(daoTokenDef).toBeDefined();
      expect(typeof daoTokenDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(daoTokenDef.metadata.name).toBe('TokenDAO');
      expect(daoTokenDef.metadata.description).toBe(
        'Token-weighted voting. Voting power proportional to token holdings.'
      );
      expect(daoTokenDef.metadata.version).toBe('1.0.0');
      expect(daoTokenDef.metadata.category).toBe('governance/dao');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'VOTING', 'QUEUED', 'DISSOLVED'];
      const actualStates = Object.keys(daoTokenDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(4);
    });

    it('should have correct initial state', () => {
      expect(daoTokenDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(daoTokenDef.states.ACTIVE.isFinal).toBe(false);
      expect(daoTokenDef.states.VOTING.isFinal).toBe(false);
      expect(daoTokenDef.states.QUEUED.isFinal).toBe(false);
      expect(daoTokenDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow propose transition from ACTIVE to VOTING', () => {
      const proposeTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'VOTING' && t.eventName === 'propose'
      );

      expect(proposeTransition).toBeDefined();
      expect(proposeTransition!.guard).toBeDefined();
      expect(proposeTransition!.effect).toBeDefined();
    });

    it('should allow vote transition from VOTING to VOTING', () => {
      const voteTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'vote'
      );

      expect(voteTransition).toBeDefined();
      expect(voteTransition!.guard).toBeDefined();
      expect(voteTransition!.effect).toBeDefined();
    });

    it('should allow queue transition from VOTING to QUEUED', () => {
      const queueTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'QUEUED' && t.eventName === 'queue'
      );

      expect(queueTransition).toBeDefined();
      expect(queueTransition!.guard).toBeDefined();
      expect(queueTransition!.effect).toBeDefined();
    });

    it('should allow execute transition from QUEUED to ACTIVE', () => {
      const executeTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'QUEUED' && t.to === 'ACTIVE' && t.eventName === 'execute'
      );

      expect(executeTransition).toBeDefined();
      expect(executeTransition!.guard).toBeDefined();
      expect(executeTransition!.effect).toBeDefined();
    });

    it('should allow reject transition from VOTING to ACTIVE', () => {
      const rejectTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'reject'
      );

      expect(rejectTransition).toBeDefined();
      expect(rejectTransition!.guard).toBeDefined();
    });

    it('should allow cancel transition from QUEUED to ACTIVE', () => {
      const cancelTransition = daoTokenDef.transitions.find(
        (t) => t.from === 'QUEUED' && t.to === 'ACTIVE' && t.eventName === 'cancel'
      );

      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toBeDefined();
    });
  });

  describe('Delegation Transitions', () => {
    it('should support delegate transition', () => {
      const transition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'delegate'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('ACTIVE');
    });

    it('should support undelegate transition', () => {
      const transition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'undelegate'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('ACTIVE');
    });
  });

  describe('Guard Logic', () => {
    it('should guard propose to token holders meeting threshold', () => {
      const proposeTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'propose'
      );

      // S1/A2 coupled fix: a chain-verified signer (proofs[].address) must hold
      // >= proposalThreshold. The per-signer balance is read with the `get` opcode
      // (getKey is not a JLVM opcode) and never from the forgeable event.agent.
      expect(proposeTransition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(proposeTransition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).not.toContain('getKey');
      expect(guardStr).toContain('get');
      expect(guardStr).toContain('balances');
      expect(guardStr).toContain('proposalThreshold');
    });

    it('should guard vote to token holders with balance > 0', () => {
      const voteTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      expect(voteTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(voteTransition!.guard);
      expect(guardStr).toContain('balances');
    });

    it('should guard vote to prevent double-voting', () => {
      const voteTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const guardStr = JSON.stringify(voteTransition!.guard);
      expect(guardStr).toContain('voters');
    });

    it('should guard vote to check voting deadline', () => {
      const voteTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const guardStr = JSON.stringify(voteTransition!.guard);
      expect(guardStr).toContain('votingEndsAt');
    });

    it('should guard queue to require passing vote', () => {
      const queueTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'queue'
      );

      expect(queueTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(queueTransition!.guard);
      expect(guardStr).toContain('votes');
      expect(guardStr).toContain('quorum');
    });

    it('should guard execute to check timelock', () => {
      const executeTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      expect(executeTransition!.guard).toHaveProperty('>=');
      const guardStr = JSON.stringify(executeTransition!.guard);
      expect(guardStr).toContain('executableAt');
    });

    it('should guard delegate to token holders', () => {
      const delegateTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'delegate'
      );

      expect(delegateTransition!.guard).toHaveProperty('>');
    });
  });

  describe('Effect Logic', () => {
    it('should create proposal with vote tracking on propose', () => {
      const proposeTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'propose'
      );

      const effectStr = JSON.stringify(proposeTransition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('votes');
      expect(effectStr).toContain('snapshotBlock');
    });

    it('should record weighted vote on vote', () => {
      const voteTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'vote'
      );

      const effectStr = JSON.stringify(voteTransition!.effect);
      expect(effectStr).toContain('votes');
      expect(effectStr).toContain('voters');
      expect(effectStr).toContain('weight');
    });

    it('should set executableAt on queue', () => {
      const queueTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'queue'
      );

      const effectStr = JSON.stringify(queueTransition!.effect);
      expect(effectStr).toContain('queuedAt');
      expect(effectStr).toContain('executableAt');
      expect(effectStr).toContain('timelockMs');
    });

    it('should record to executedProposals on execute', () => {
      const executeTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      const effectStr = JSON.stringify(executeTransition!.effect);
      expect(effectStr).toContain('executedProposals');
      expect(effectStr).toContain('executedAt');
    });

    it('should update delegations on delegate', () => {
      const delegateTransition = daoTokenDef.transitions.find(
        (t) => t.eventName === 'delegate'
      );

      const effectStr = JSON.stringify(delegateTransition!.effect);
      expect(effectStr).toContain('delegations');
      expect(effectStr).toContain('delegateTo');
    });
  });

  describe('Cross-References', () => {
    it('should have cross-references defined', () => {
      expect(daoTokenDef.metadata.crossReferences).toBeDefined();
      expect(daoTokenDef.metadata.crossReferences).toHaveProperty('Identity');
      expect(daoTokenDef.metadata.crossReferences).toHaveProperty('Token');
      expect(daoTokenDef.metadata.crossReferences).toHaveProperty('Contract');
      expect(daoTokenDef.metadata.crossReferences).toHaveProperty('Treasury');
    });
  });
});
