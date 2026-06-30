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
        'Simple org governance: manage members, update rules, resolve disputes',
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
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'add_member',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow remove_member transition from ACTIVE to ACTIVE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'remove_member',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should guard add_member to admins only', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'add_member');

      // Membership authorization binds to the chain-verified signers (proofs),
      // not the forgeable event.agent payload field (F1 fix).
      expect(transition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).toContain('admins');
    });

    it('should guard remove_member to admins only', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'remove_member');

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
        (t) => t.from === 'ACTIVE' && t.to === 'VOTING' && t.eventName === 'propose',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow vote transition from VOTING to VOTING', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'vote',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should allow finalize transition from VOTING to ACTIVE (passed)', () => {
      const transitions = govSimpleDef.transitions.filter(
        (t) => t.from === 'VOTING' && t.to === 'ACTIVE' && t.eventName === 'finalize',
      );

      expect(transitions.length).toBeGreaterThanOrEqual(1);
    });

    it('should derive the finalize for-count from state, not event.forCount (S2)', () => {
      const transitions = govSimpleDef.transitions.filter((t) => t.eventName === 'finalize');

      // S2 fix: both finalize arms count "for" ballots out of state.votes (via
      // filter over values) and compare against members*passingThreshold — the
      // attacker-supplied event.forCount is gone (and removed from the schema).
      for (const transition of transitions) {
        const guardStr = JSON.stringify(transition.guard);
        expect(guardStr).not.toContain('forCount');
        expect(guardStr).toContain('state.votes');
        expect(guardStr).toContain('filter');
        expect(guardStr).toContain('passingThreshold');
        expect(guardStr).not.toMatch(/"size":/);
      }

      const finalizeSchema = (govSimpleDef.eventSchemas as Record<string, { properties?: Record<string, unknown> }>)
        .finalize;
      expect(finalizeSchema.properties ?? {}).not.toHaveProperty('forCount');
    });

    it('should guard propose to verified members', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'propose' && t.from === 'ACTIVE');

      // S1/A2 coupled fix: membership binds to the chain-verified signers (proofs)
      // via signerHasEntry (`some`/`has`), not the forgeable event.agent / getKey.
      expect(transition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).not.toContain('getKey');
      expect(guardStr).toContain('members');
    });

    it('should guard vote to verified members and prevent double-voting', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'vote' && t.from === 'VOTING');

      // S1/A2 coupled fix: actorHasEntry BINDS event.agent to a verified signer who is a member, and
      // the ballot is recorded + deduped under that same bound actor. event.agent now legitimately
      // appears, but only inside a proofs binding (never as bare authorization), and getKey is gone.
      expect(transition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs'); // event.agent is bound to proofs[].address
      expect(guardStr).toContain('event.agent');
      expect(guardStr).not.toContain('getKey');
      expect(guardStr).toContain('votes');
    });
  });

  describe('Dispute Transitions', () => {
    it('should allow file_dispute transition from ACTIVE to DISPUTE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISPUTE' && t.eventName === 'file_dispute',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
      expect(transition!.effect).toBeDefined();
    });

    it('should allow submit_evidence transition from DISPUTE to DISPUTE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'DISPUTE' && t.to === 'DISPUTE' && t.eventName === 'submit_evidence',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should allow vote transition in DISPUTE state', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'DISPUTE' && t.to === 'DISPUTE' && t.eventName === 'vote',
      );

      expect(transition).toBeDefined();
    });

    it('should allow resolve transition from DISPUTE to ACTIVE', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'DISPUTE' && t.to === 'ACTIVE' && t.eventName === 'resolve',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should guard file_dispute to verified members', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'file_dispute');

      // S1/A2 coupled fix: only a chain-verified member may file (signerHasEntry),
      // not the forgeable event.agent / getKey.
      expect(transition!.guard).toHaveProperty('some');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('proofs');
      expect(guardStr).not.toContain('event.agent');
      expect(guardStr).not.toContain('getKey');
      expect(guardStr).toContain('members');
    });

    it('should guard submit_evidence to plaintiff or defendant', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'submit_evidence');

      expect(transition!.guard).toHaveProperty('or');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('plaintiff');
      expect(guardStr).toContain('defendant');
    });

    it('should guard resolve to quorum (A2: length over keys, not size)', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'resolve');

      expect(transition!.guard).toHaveProperty('>=');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('disputeQuorum');
      // votes is a Map; count its keys with length (size is not a JLVM opcode).
      expect(guardStr).toContain('length');
      expect(guardStr).toContain('keys');
      expect(guardStr).not.toMatch(/"size":/);
    });
  });

  describe('Dissolution Transition', () => {
    it('should allow dissolve transition from ACTIVE to DISSOLVED', () => {
      const transition = govSimpleDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve',
      );

      expect(transition).toBeDefined();
      expect(transition!.guard).toBeDefined();
    });

    it('should guard dissolve to verified unanimity of members', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'dissolve');

      // S2 fix: dissolution is gated on CHAIN-VERIFIED unanimity — every member
      // (a key in state.members) must be among proofs[].address (non-empty) — never
      // on the attacker-supplied event.approvalCount, which has been removed.
      expect(transition!.guard).toHaveProperty('and');
      const guardStr = JSON.stringify(transition!.guard);
      expect(guardStr).toContain('all');
      expect(guardStr).toContain('proofs');
      expect(guardStr).toContain('members');
      expect(guardStr).not.toContain('approvalCount');
      expect(guardStr).not.toMatch(/"size":/);
    });

    it('should not declare an attacker-supplied approvalCount on dissolve', () => {
      const dissolveSchema = (govSimpleDef.eventSchemas as Record<string, { properties?: Record<string, unknown> }>)
        .dissolve;
      expect(dissolveSchema.properties).not.toHaveProperty('approvalCount');
    });
  });

  describe('Effect Logic', () => {
    it('should add member with role on add_member', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'add_member');

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('members');
      expect(effectStr).toContain('role');
      expect(effectStr).toContain('addedAt');
    });

    it('should remove member on remove_member', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'remove_member');

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('unset'); // rc.5 map-delete opcode (deleteKey does not exist)
      expect(effectStr).not.toContain('deleteKey');
    });

    it('should create proposal with deadline on propose', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'propose' && t.from === 'ACTIVE');

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('proposal');
      expect(effectStr).toContain('deadline');
      expect(effectStr).toContain('votingPeriodMs');
    });

    it('should create dispute record on file_dispute', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'file_dispute');

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('dispute');
      expect(effectStr).toContain('plaintiff');
      expect(effectStr).toContain('defendant');
      expect(effectStr).toContain('claim');
      expect(effectStr).toContain('evidence');
    });

    it('should record history on finalize', () => {
      const transitions = govSimpleDef.transitions.filter((t) => t.eventName === 'finalize');

      for (const transition of transitions) {
        const effectStr = JSON.stringify(transition.effect);
        expect(effectStr).toContain('history');
      }
    });

    it('should record resolution in history on resolve', () => {
      const transition = govSimpleDef.transitions.find((t) => t.eventName === 'resolve');

      const effectStr = JSON.stringify(transition!.effect);
      expect(effectStr).toContain('history');
      expect(effectStr).toContain('ruling');
      expect(effectStr).toContain('remedy');
    });
  });
});
