/**
 * Tests for Governance (Simple) state machine
 */

import { govSimpleDef } from '../../src/apps/governance/state-machines/index';

describe('Governance (Simple) State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(govSimpleDef).toBeDefined();
      expect(typeof govSimpleDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(govSimpleDef.metadata.name).toBe('Governance');
      expect(govSimpleDef.metadata.description).toBe(
        'Simple org governance: manage members, update rules, resolve disputes'
      );
      expect(govSimpleDef.metadata.version).toBe('1.0.0');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'VOTING', 'DISPUTE', 'DISSOLVED'];
      const actualStates = Object.keys(govSimpleDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(4);
    });

    it('should have correct initial state', () => {
      expect(govSimpleDef.initialState).toBe('ACTIVE');
    });

    it('should mark final states correctly', () => {
      expect(govSimpleDef.states.ACTIVE.isFinal).toBe(false);
      expect(govSimpleDef.states.VOTING.isFinal).toBe(false);
      expect(govSimpleDef.states.DISPUTE.isFinal).toBe(false);
      expect(govSimpleDef.states.DISSOLVED.isFinal).toBe(true);
    });
  });

  describe('Member Management Transitions', () => {
    it('should allow add_member transition from ACTIVE to ACTIVE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'add_member'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow remove_member transition from ACTIVE to ACTIVE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) =>
          t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'remove_member'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should guard add_member to admins only', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'add_member'
      );

      // Membership authorization binds to the chain-verified signers (proofs),
      // not the forgeable event.agent payload field (F1 fix).
      expect(transition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).toContain('admins');
    });

    it('should guard remove_member to admins only', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'remove_member'
      );

      // Membership authorization binds to the chain-verified signers (proofs),
      // not the forgeable event.agent payload field (F1 fix).
      expect(transition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).toContain('admins');
    });
  });

  describe('Proposal/Voting Transitions', () => {
    it('should allow propose transition from ACTIVE to VOTING', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'VOTING' && t.eventName === 'propose'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow vote transition from VOTING to VOTING', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'vote'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should allow finalize transition from VOTING to ACTIVE (passed)', () => {
      const transitions = govSimpleDef.transitions.filter(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'finalize'
      );

      expect(transitions.length).toBeGreaterThanOrEqual(1);
    });

    it('should guard propose to members', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      expect(transition!.guard).toHaveProperty('getKey');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('members');
    });

    it('should guard vote to prevent double-voting', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'vote' && t.from === 'VOTING'
      );

      expect(transition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('votes');
    });
  });

  describe('Dispute Transitions', () => {
    it('should allow file_dispute transition from ACTIVE to DISPUTE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISPUTE' && t.eventName === 'file_dispute'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow submit_evidence transition from DISPUTE to DISPUTE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) =>
          t.from === 'DISPUTE' && t.to === 'DISPUTE' && t.eventName === 'submit_evidence'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should allow vote transition in DISPUTE state', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'DISPUTE' && t.to === 'DISPUTE' && t.eventName === 'vote'
      );

      expect(transition).toBeDefined();
    });

    it('should allow resolve transition from DISPUTE to ACTIVE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'DISPUTE' && t.to === 'ACTIVE' && t.eventName === 'resolve'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should guard file_dispute to members', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'file_dispute'
      );

      expect(transition!.guard).toHaveProperty('getKey');
    });

    it('should guard submit_evidence to plaintiff or defendant', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'submit_evidence'
      );

      expect(transition!.guard).toHaveProperty('or');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('plaintiff');
      expect(guardStr).toContain('defendant');
    });

    it('should guard resolve to quorum', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'resolve'
      );

      expect(transition!.guard).toHaveProperty('>=');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('disputeQuorum');
    });
  });

  describe('Dissolution Transition', () => {
    it('should allow dissolve transition from ACTIVE to DISSOLVED', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve'
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should guard dissolve to 90% approval', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'dissolve'
      );

      expect(transition!.guard).toHaveProperty('>=');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('approvalCount');
      expect(guardStr).toContain('0.9');
    });
  });

  describe('Effect Logic', () => {
    it('should add member with role on add_member', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'add_member'
      );

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('members');
      expect(effectStr).toContain('role');
      expect(effectStr).toContain('addedAt');
    });

    it('should remove member on remove_member', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'remove_member'
      );

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('deleteKey');
    });

    it('should create proposal with deadline on propose', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'propose' && t.from === 'ACTIVE'
      );

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('deadline');
      expect(effectStr).toContain('votingPeriodMs');
    });

    it('should create dispute record on file_dispute', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'file_dispute'
      );

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('dispute');
      expect(effectStr).toContain('plaintiff');
      expect(effectStr).toContain('defendant');
      expect(effectStr).toContain('claim');
      expect(effectStr).toContain('evidence');
    });

    it('should record history on finalize', () => {
      const transitions = govSimpleDef.transitions.filter(
        (t) => t.eventName === 'finalize'
      );

      for (const transition of transitions) {
        const effectStr = JSON.stringify(transition.effect);
        expect(effectStr).toContain('history');
      }
    });

    it('should record resolution in history on resolve', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.eventName === 'resolve'
      );

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('history');
      expect(effectStr).toContain('ruling');
      expect(effectStr).toContain('remedy');
    });
  });
});
