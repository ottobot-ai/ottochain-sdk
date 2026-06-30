/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — tests access guard properties dynamically
import { contractEscrowDef } from '../../src/apps/contracts/state-machines/contract-escrow.js';
import { signerIsParty } from '../../src/schema/guards.js';

describe('Contract Escrow State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(contractEscrowDef).toBeDefined();
      expect(typeof contractEscrowDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(contractEscrowDef.metadata.name).toBe('ContractEscrow');
      expect(contractEscrowDef.metadata.app).toBe('contracts');
      expect(contractEscrowDef.metadata.description).toBe(
        'Asset custody with conditional release, dispute resolution, and split payments',
      );
      expect(contractEscrowDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['CREATED', 'FUNDED', 'ACTIVE', 'RELEASING', 'DISPUTED', 'RELEASED', 'REFUNDED', 'SPLIT'];
      const actualStates = Object.keys(contractEscrowDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(contractEscrowDef.initialState).toBe('CREATED');
    });

    it('should mark final states correctly', () => {
      expect(contractEscrowDef.states.RELEASED.isFinal).toBe(true);
      expect(contractEscrowDef.states.REFUNDED.isFinal).toBe(true);
      expect(contractEscrowDef.states.SPLIT.isFinal).toBe(true);
      expect(contractEscrowDef.states.CREATED.isFinal).toBe(false);
      expect(contractEscrowDef.states.FUNDED.isFinal).toBe(false);
      expect(contractEscrowDef.states.ACTIVE.isFinal).toBe(false);
      expect(contractEscrowDef.states.RELEASING.isFinal).toBe(false);
      expect(contractEscrowDef.states.DISPUTED.isFinal).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should allow deposit transition from CREATED to FUNDED', () => {
      const depositTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'CREATED' && t.to === 'FUNDED' && t.eventName === 'deposit',
      );

      expect(depositTransition).toBeDefined();
      expect(depositTransition!.guard).toBeDefined();
      expect(depositTransition!.effect).toBeDefined();
    });

    it('should allow activate transition from FUNDED to ACTIVE', () => {
      const activateTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'FUNDED' && t.to === 'ACTIVE' && t.eventName === 'activate',
      );

      expect(activateTransition).toBeDefined();
      expect(activateTransition!.guard).toBeDefined();
    });

    it('should allow request_release transition from ACTIVE to RELEASING', () => {
      const requestTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'RELEASING' && t.eventName === 'request_release',
      );

      expect(requestTransition).toBeDefined();
      expect(requestTransition!.guard).toBeDefined();
    });

    it('should allow approve_release transition from RELEASING to RELEASED', () => {
      const approveTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'RELEASING' && t.to === 'RELEASED' && t.eventName === 'approve_release',
      );

      expect(approveTransition).toBeDefined();
      expect(approveTransition!.guard).toBeDefined();
    });

    it('should allow dispute transition from RELEASING to DISPUTED', () => {
      const disputeTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'RELEASING' && t.to === 'DISPUTED' && t.eventName === 'dispute',
      );

      expect(disputeTransition).toBeDefined();
      expect(disputeTransition!.guard).toBeDefined();
      // A3 fix: the dropped transition-level `spawns` is now a `_emit` dispute_opened notification
      expect(JSON.stringify(disputeTransition!.effect)).toContain('dispute_opened');
    });

    it('should allow ruling transition from DISPUTED to SPLIT', () => {
      const rulingTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'DISPUTED' && t.to === 'SPLIT' && t.eventName === 'ruling',
      );

      expect(rulingTransition).toBeDefined();
      expect(rulingTransition!.guard).toBeDefined();
    });

    it('should allow refund transition from ACTIVE to REFUNDED', () => {
      const refundTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'REFUNDED' && t.eventName === 'refund',
      );

      expect(refundTransition).toBeDefined();
      expect(refundTransition!.guard).toBeDefined();
    });
  });

  describe('Guard Logic Preservation', () => {
    it('should preserve deposit authorization and amount validation guards', () => {
      const depositTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'CREATED' && t.to === 'FUNDED' && t.eventName === 'deposit',
      );

      expect(depositTransition!.guard).toHaveProperty('and');
      expect(Array.isArray(depositTransition!.guard.and)).toBe(true);
      expect(depositTransition!.guard.and).toHaveLength(2);
    });

    it('should preserve beneficiary authorization for activate', () => {
      const activateTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'FUNDED' && t.to === 'ACTIVE' && t.eventName === 'activate',
      );

      expect(activateTransition!.guard).toHaveProperty('or');
      expect(Array.isArray(activateTransition!.guard.or)).toBe(true);
    });

    it('should preserve beneficiary authorization for request_release', () => {
      const requestTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'RELEASING' && t.eventName === 'request_release',
      );

      expect(requestTransition!.guard).toEqual(signerIsParty('state.beneficiary'));
    });

    it('should preserve time-based approval logic for approve_release', () => {
      const approveTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'RELEASING' && t.to === 'RELEASED' && t.eventName === 'approve_release',
      );

      expect(approveTransition!.guard).toHaveProperty('or');
      expect(Array.isArray(approveTransition!.guard.or)).toBe(true);
      expect(approveTransition!.guard.or).toHaveLength(2);
    });

    it('should preserve time-constraint logic for dispute', () => {
      const disputeTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'RELEASING' && t.to === 'DISPUTED' && t.eventName === 'dispute',
      );

      expect(disputeTransition!.guard).toHaveProperty('and');
      expect(Array.isArray(disputeTransition!.guard.and)).toBe(true);
      expect(disputeTransition!.guard.and).toHaveLength(2);
    });
  });

  describe('Effect Logic Preservation', () => {
    it('should preserve balance updates for deposit', () => {
      const depositTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'CREATED' && t.to === 'FUNDED' && t.eventName === 'deposit',
      );

      const mergeEffect = depositTransition!.effect.merge[1];
      expect(mergeEffect).toHaveProperty('balance');
      expect(mergeEffect.balance).toEqual({ var: 'event.amount' });
      expect(mergeEffect).toHaveProperty('fundedAt');
    });

    it('should preserve release request data for request_release', () => {
      const requestTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'RELEASING' && t.eventName === 'request_release',
      );

      const mergeEffect = requestTransition!.effect.merge[1];
      expect(mergeEffect).toHaveProperty('releaseRequest');
      expect(mergeEffect).toHaveProperty('releaseDeadline');
      expect(mergeEffect.releaseDeadline).toHaveProperty('+');
    });

    it('should preserve split data for ruling', () => {
      const rulingTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'DISPUTED' && t.to === 'SPLIT' && t.eventName === 'ruling',
      );

      const mergeEffect = rulingTransition!.effect.merge[1];
      expect(mergeEffect).toHaveProperty('splits');
      expect(mergeEffect).toHaveProperty('rulingId');
      expect(mergeEffect.splits).toEqual({ var: 'event.splits' });
      expect(mergeEffect.rulingId).toEqual({ var: 'event.rulingId' });
    });
  });

  describe('Spawn Logic Preservation', () => {
    it('should surface the judiciary dispute case via the _emit effect directive (A3)', () => {
      const disputeTransition = contractEscrowDef.transitions.find(
        (t) => t.from === 'RELEASING' && t.to === 'DISPUTED' && t.eventName === 'dispute',
      );

      // transition-level `spawns` is dropped by the chain; the case rides as a _emit to "Judiciary"
      expect(disputeTransition!.spawns).toBeUndefined();
      const effectStr = JSON.stringify(disputeTransition!.effect);
      expect(effectStr).toContain('_emit');
      expect(effectStr).toContain('dispute_opened');
      expect(effectStr).toContain('escrow_dispute');
      expect(effectStr).toContain('Judiciary');
    });
  });

  describe('Schema Definitions', () => {
    it('should define create schema with required escrow fields', () => {
      expect(contractEscrowDef.createSchema).toBeDefined();
      expect(contractEscrowDef.createSchema.required).toContain('depositor');
      expect(contractEscrowDef.createSchema.required).toContain('beneficiary');
      expect(contractEscrowDef.createSchema.required).toContain('requiredAmount');
      // S2 settlement-bypass fix: the arbiter is a state-pinned authority.
      expect(contractEscrowDef.createSchema.required).toContain('arbiter');
      expect(contractEscrowDef.createSchema.properties.arbiter.type).toBe('address');
    });

    it('should define state schema with escrow-specific types', () => {
      expect(contractEscrowDef.stateSchema).toBeDefined();
      expect(contractEscrowDef.stateSchema.properties).toBeDefined();
      expect(contractEscrowDef.stateSchema.properties.balance).toBeDefined();
      expect(contractEscrowDef.stateSchema.properties.releaseRequest).toBeDefined();
    });

    it('should define event schemas for all escrow events', () => {
      const expectedEvents = [
        'deposit',
        'activate',
        'request_release',
        'approve_release',
        'dispute',
        'ruling',
        'refund',
      ];

      expectedEvents.forEach((eventName) => {
        expect(contractEscrowDef.eventSchemas).toHaveProperty(eventName);
      });
    });
  });

  describe('Cross-References', () => {
    it('should preserve cross-reference metadata', () => {
      const crossRefs = contractEscrowDef.metadata.crossReferences;

      expect(crossRefs).toHaveProperty('contractId');
      expect(crossRefs).toHaveProperty('marketId');
      expect(crossRefs).toHaveProperty('insuranceId');
      expect(crossRefs).toHaveProperty('arbitrationPoolId');
      expect(crossRefs).toHaveProperty('treasuryId');
    });
  });

  describe('S2 settlement-bypass hardening', () => {
    const sigParty = (v: string) => ({
      in: [{ var: v }, { map: [{ var: 'proofs' }, { var: 'address' }] }],
    });

    it('ruling: signer must be the pinned arbiter AND splits must conserve the balance', () => {
      const ruling = contractEscrowDef.transitions.find(
        (t) => t.from === 'DISPUTED' && t.to === 'SPLIT' && t.eventName === 'ruling',
      );
      expect(ruling!.guard).toHaveProperty('and');
      // disjunct 1: the arbiter is a verified signer (no bare event.judicialRuling)
      expect(ruling!.guard.and[0]).toEqual(sigParty('state.arbiter'));
      // disjunct 2: Σ event.splits[].amount === state.balance (conservation)
      expect(ruling!.guard.and[1]).toEqual({
        '===': [
          {
            reduce: [{ var: 'event.splits' }, { '+': [{ var: 'accumulator' }, { var: 'current.amount' }] }, 0],
          },
          { var: 'state.balance' },
        ],
      });
      // forgeable field removed from the guard and the event schema
      expect(JSON.stringify(ruling!.guard)).not.toContain('judicialRuling');
      expect(contractEscrowDef.eventSchemas.ruling.properties).not.toHaveProperty('judicialRuling');
    });

    it('refund: requires true mutual consent (both parties sign) OR expiry', () => {
      const refund = contractEscrowDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'REFUNDED' && t.eventName === 'refund',
      );
      expect(refund!.guard).toHaveProperty('or');
      expect(refund!.guard.or[0]).toEqual({
        and: [sigParty('state.depositor'), sigParty('state.beneficiary')],
      });
      expect(refund!.guard.or[1]).toEqual({
        '>=': [{ var: '$ordinal' }, { var: 'state.expiresAt' }],
      });
      // the forgeable consent boolean is removed from the guard and the schema
      expect(JSON.stringify(refund!.guard)).not.toContain('mutualConsent');
      expect(contractEscrowDef.eventSchemas.refund).toEqual({});
    });
  });
});
