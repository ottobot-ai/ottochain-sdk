/**
 * Tests for MultisigDAO state machine
 */

import { daoMultisigDef } from '../../src/apps/governance/state-machines/index';

describe('MultisigDAO State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(daoMultisigDef).toBeDefined();
      expect(typeof daoMultisigDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(daoMultisigDef.metadata.name).toBe('MultisigDAO');
      expect(daoMultisigDef.metadata.description).toBe(
        'N-of-M multisig governance. Requires threshold signatures for actions.'
      );
      expect(daoMultisigDef.metadata.version).toBe('1.0.0');
      expect(daoMultisigDef.metadata.category).toBe('governance/dao');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'PENDING', 'DISSOLVED'];
      const actualStates = Object.keys(daoMultisigDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(3);
    });

    it('should have correct initial state', () => {
      expect(daoMultisigDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(daoMultisigDef.states.ACTIVE.isFinal).toBe(false);
      expect(daoMultisigDef.states.PENDING.isFinal).toBe(false);
      expect(daoMultisigDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow propose transition from ACTIVE to PENDING', () => {
      const proposeTransition = daoMultisigDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'PENDING' && t.eventName === 'propose'
      );

      expect(proposeTransition).toBeDefined();
      expect(proposeTransition!.guard).toBeDefined();
      expect(proposeTransition!.effect).toBeDefined();
    });

    it('should allow sign transition from PENDING to PENDING', () => {
      const signTransition = daoMultisigDef.transitions.find(
        (t) => t.from === 'PENDING' && t.to === 'PENDING' && t.eventName === 'sign'
      );

      expect(signTransition).toBeDefined();
      expect(signTransition!.guard).toBeDefined();
      expect(signTransition!.effect).toBeDefined();
    });

    it('should allow execute transition from PENDING to ACTIVE', () => {
      const executeTransition = daoMultisigDef.transitions.find(
        (t) => t.from === 'PENDING' && t.to === 'ACTIVE' && t.eventName === 'execute'
      );

      expect(executeTransition).toBeDefined();
      expect(executeTransition!.guard).toBeDefined();
      expect(executeTransition!.effect).toBeDefined();
    });

    it('should allow cancel transition from PENDING to ACTIVE', () => {
      const cancelTransition = daoMultisigDef.transitions.find(
        (t) => t.from === 'PENDING' && t.to === 'ACTIVE' && t.eventName === 'cancel'
      );

      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toBeDefined();
    });

    it('should allow dissolve transition from ACTIVE to DISSOLVED', () => {
      const dissolveTransition = daoMultisigDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve'
      );

      expect(dissolveTransition).toBeDefined();
      expect(dissolveTransition!.guard).toBeDefined();
    });
  });

  describe('Signer Management Transitions', () => {
    it('should support propose_add_signer transition', () => {
      const transition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'propose_add_signer'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('PENDING');
    });

    it('should support propose_remove_signer transition', () => {
      const transition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'propose_remove_signer'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('PENDING');
    });

    it('should support propose_change_threshold transition', () => {
      const transition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'propose_change_threshold'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('ACTIVE');
      expect(transition!.to).toBe('PENDING');
    });

    it('should support apply_signer_change transition', () => {
      const transition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'apply_signer_change'
      );
      expect(transition).toBeDefined();
      expect(transition!.from).toBe('PENDING');
      expect(transition!.to).toBe('ACTIVE');
    });

    it('should count the signer array with the length opcode (A2), not size', () => {
      // size is not a JLVM opcode; signers is an array so length applies directly.
      for (const name of ['propose_remove_signer', 'propose_change_threshold']) {
        const transition = daoMultisigDef.transitions.find(
          (t) => t.eventName === name
        );
        const guardStr = JSON.stringify(transition!.guard);
        expect(guardStr).toContain('length');
        expect(guardStr).not.toContain('"size"');
        expect(guardStr).not.toMatch(/"size":/);
      }
    });
  });

  describe('Guard Logic', () => {
    it('should guard propose to only signers', () => {
      const proposeTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      // Membership authorization binds to the chain-verified signers (proofs),
      // not the forgeable event.agent payload field (F1 fix).
      expect(proposeTransition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(proposeTransition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).toContain('state.signers');
    });

    it('should guard sign to prevent double-signing', () => {
      const signTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'sign'
      );

      expect(signTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(signTransition!.guard);
      expect(guardStr).toContain('signatures');
    });

    it('should guard execute to require threshold signatures', () => {
      const executeTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      expect(executeTransition!.guard).toHaveProperty('>=');
    });

    it('should guard cancel to proposer or expired', () => {
      const cancelTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'cancel'
      );

      expect(cancelTransition!.guard).toHaveProperty('or');
    });

    it('should guard dissolve to verified unanimity of all signers', () => {
      const dissolveTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'dissolve'
      );

      // S2 fix: dissolution is gated on CHAIN-VERIFIED unanimity — every signer in
      // state.signers must be among proofs[].address (non-empty) — never on the
      // attacker-supplied event.signatureCount, which has been removed.
      expect(dissolveTransition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(dissolveTransition!.guard);
      expect(guardStr).toContain('all');
      expect(guardStr).toContain('proofs');
      expect(guardStr).toContain('state.signers');
      expect(guardStr).not.toContain('signatureCount');
      expect(guardStr).not.toContain('size');
    });

    it('should not declare an attacker-supplied signatureCount on dissolve', () => {
      // The forgeable count field is removed from the event schema (S2).
      const dissolveSchema = (
        daoMultisigDef.eventSchemas as Record<string, { properties?: Record<string, unknown> }>
      ).dissolve;
      expect(dissolveSchema.properties).not.toHaveProperty('signatureCount');
    });
  });

  describe('Effect Logic', () => {
    it('should create proposal with metadata on propose', () => {
      const proposeTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      const effectStr = JSON.stringify(proposeTransition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('proposer');
      expect(effectStr).toContain('proposedAt');
      expect(effectStr).toContain('expiresAt');
    });

    it('should add signature on sign', () => {
      const signTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'sign'
      );

      const effectStr = JSON.stringify(signTransition!.effect);
      expect(effectStr).toContain('signatures');
      expect(effectStr).toContain('setKey');
    });

    it('should record executed action on execute', () => {
      const executeTransition = daoMultisigDef.transitions.find(
        (t) => t.eventName === 'execute'
      );

      const effectStr = JSON.stringify(executeTransition!.effect);
      expect(effectStr).toContain('actions');
      expect(effectStr).toContain('executedAt');
    });
  });

  describe('Cross-References', () => {
    it('should have cross-references defined', () => {
      expect(daoMultisigDef.metadata.crossReferences).toBeDefined();
      expect(daoMultisigDef.metadata.crossReferences).toHaveProperty('Identity');
      expect(daoMultisigDef.metadata.crossReferences).toHaveProperty('Contract');
      expect(daoMultisigDef.metadata.crossReferences).toHaveProperty('Treasury');
      expect(daoMultisigDef.metadata.crossReferences).toHaveProperty('Escrow');
    });
  });
});
