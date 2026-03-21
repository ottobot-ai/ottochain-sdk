/**
 * Tests for SingleOwnerDAO state machine
 */

import { daoSingleDef } from '../../src/apps/governance/state-machines/index';

describe('SingleOwnerDAO State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(daoSingleDef).toBeDefined();
      expect(typeof daoSingleDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(daoSingleDef.metadata.name).toBe('SingleOwnerDAO');
      expect(daoSingleDef.metadata.description).toBe(
        'Single owner controls all actions. Simplest governance model.'
      );
      expect(daoSingleDef.metadata.version).toBe('1.0.0');
      expect(daoSingleDef.metadata.category).toBe('governance/dao');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'TRANSFERRING', 'DISSOLVED'];
      const actualStates = Object.keys(daoSingleDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(3);
    });

    it('should have correct initial state', () => {
      expect(daoSingleDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(daoSingleDef.states.ACTIVE.isFinal).toBe(false);
      expect(daoSingleDef.states.TRANSFERRING.isFinal).toBe(false);
      expect(daoSingleDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow execute transition from ACTIVE to ACTIVE', () => {
      const executeTransition = daoSingleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'execute'
      );

      expect(executeTransition).toBeDefined();
      expect(executeTransition!.guard).toBeDefined();
      expect(executeTransition!.effect).toBeDefined();
    });

    it('should allow transfer_ownership transition from ACTIVE to TRANSFERRING', () => {
      const transferTransition = daoSingleDef.transitions.find(
        (t) =>
          t.from === 'ACTIVE' &&
          t.to === 'TRANSFERRING' &&
          t.eventName === 'transfer_ownership'
      );

      expect(transferTransition).toBeDefined();
      expect(transferTransition!.guard).toBeDefined();
      expect(transferTransition!.effect).toBeDefined();
    });

    it('should allow accept_ownership transition from TRANSFERRING to ACTIVE', () => {
      const acceptTransition = daoSingleDef.transitions.find(
        (t) =>
          t.from === 'TRANSFERRING' &&
          t.to === 'ACTIVE' &&
          t.eventName === 'accept_ownership'
      );

      expect(acceptTransition).toBeDefined();
      expect(acceptTransition!.guard).toBeDefined();
      expect(acceptTransition!.effect).toBeDefined();
    });

    it('should allow cancel_transfer transition from TRANSFERRING to ACTIVE', () => {
      const cancelTransition = daoSingleDef.transitions.find(
        (t) =>
          t.from === 'TRANSFERRING' &&
          t.to === 'ACTIVE' &&
          t.eventName === 'cancel_transfer'
      );

      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toBeDefined();
    });

    it('should allow dissolve transition from ACTIVE to DISSOLVED', () => {
      const dissolveTransition = daoSingleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve'
      );

      expect(dissolveTransition).toBeDefined();
      expect(dissolveTransition!.guard).toBeDefined();
    });
  });

  describe('Guard Logic', () => {
    it('should guard execute to owner only', () => {
      const executeTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      expect(executeTransition!.guard).toHaveProperty('===');
      const guardStr = JSON.stringify(executeTransition!.guard);
      expect(guardStr).toContain('event.agent');
      expect(guardStr).toContain('state.owner');
    });

    it('should guard transfer_ownership to owner only', () => {
      const transferTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'transfer_ownership'
      );

      expect(transferTransition!.guard).toHaveProperty('===');
    });

    it('should guard accept_ownership to pending owner', () => {
      const acceptTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'accept_ownership'
      );

      expect(acceptTransition!.guard).toHaveProperty('===');
      const guardStr = JSON.stringify(acceptTransition!.guard);
      expect(guardStr).toContain('pendingOwner');
    });

    it('should guard cancel_transfer to current owner', () => {
      const cancelTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'cancel_transfer'
      );

      expect(cancelTransition!.guard).toHaveProperty('===');
    });

    it('should guard dissolve to owner', () => {
      const dissolveTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'dissolve'
      );

      expect(dissolveTransition!.guard).toHaveProperty('===');
    });
  });

  describe('Effect Logic', () => {
    it('should record action on execute', () => {
      const executeTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      const effectStr = JSON.stringify(executeTransition!.effect);
      expect(effectStr).toContain('actions');
      expect(effectStr).toContain('executedAt');
    });

    it('should set pending owner on transfer_ownership', () => {
      const transferTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'transfer_ownership'
      );

      const effectStr = JSON.stringify(transferTransition!.effect);
      expect(effectStr).toContain('pendingOwner');
      expect(effectStr).toContain('transferInitiatedAt');
    });

    it('should update owner and record history on accept_ownership', () => {
      const acceptTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'accept_ownership'
      );

      const effectStr = JSON.stringify(acceptTransition!.effect);
      expect(effectStr).toContain('owner');
      expect(effectStr).toContain('ownershipHistory');
    });

    it('should emit ownership_transferred event', () => {
      const acceptTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'accept_ownership'
      ) as { emits?: Array<{ event: string }> } | undefined;

      expect(acceptTransition!.emits).toBeDefined();
      expect(acceptTransition!.emits![0].event).toBe('ownership_transferred');
    });

    it('should set dissolvedAt on dissolve', () => {
      const dissolveTransition = daoSingleDef.transitions.find(
        (t) => t.eventName === 'dissolve'
      );

      const effectStr = JSON.stringify(dissolveTransition!.effect);
      expect(effectStr).toContain('dissolvedAt');
      expect(effectStr).toContain('status');
    });
  });

  describe('Cross-References', () => {
    it('should have cross-references defined', () => {
      expect(daoSingleDef.crossReferences).toBeDefined();
      expect(daoSingleDef.crossReferences).toHaveProperty('Identity');
      expect(daoSingleDef.crossReferences).toHaveProperty('Contract');
      expect(daoSingleDef.crossReferences).toHaveProperty('Treasury');
    });
  });
});
