/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — tests access guard properties dynamically
import { contractAgreementDef } from '../../src/apps/contracts/state-machines/contract-agreement.js';

describe('Contract Agreement State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(contractAgreementDef).toBeDefined();
      expect(typeof contractAgreementDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(contractAgreementDef.metadata.name).toBe('ContractAgreement');
      expect(contractAgreementDef.metadata.app).toBe('contracts');
      expect(contractAgreementDef.metadata.description).toBe(
        'Two-party agreement with mutual completion attestation and dispute resolution'
      );
      expect(contractAgreementDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'REJECTED', 'CANCELLED'];
      const actualStates = Object.keys(contractAgreementDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(contractAgreementDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(contractAgreementDef.states.COMPLETED.isFinal).toBe(true);
      expect(contractAgreementDef.states.REJECTED.isFinal).toBe(true);
      expect(contractAgreementDef.states.CANCELLED.isFinal).toBe(true);
      expect(contractAgreementDef.states.PROPOSED.isFinal).toBe(false);
      expect(contractAgreementDef.states.ACTIVE.isFinal).toBe(false);
      expect(contractAgreementDef.states.DISPUTED.isFinal).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should allow accept transition from PROPOSED to ACTIVE', () => {
      const acceptTransition = contractAgreementDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'accept'
      );
      
      expect(acceptTransition).toBeDefined();
      expect(acceptTransition!.guard).toBeDefined();
      expect(acceptTransition!.effect).toBeDefined();
    });

    it('should allow reject transition from PROPOSED to REJECTED', () => {
      const rejectTransition = contractAgreementDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'REJECTED' && t.eventName === 'reject'
      );
      
      expect(rejectTransition).toBeDefined();
      expect(rejectTransition!.guard).toBeDefined();
      expect(rejectTransition!.effect).toBeDefined();
    });

    it('should allow cancel transition from PROPOSED to CANCELLED', () => {
      const cancelTransition = contractAgreementDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toBeDefined();
    });

    it('should allow submit_completion transition in ACTIVE state', () => {
      const submitTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'submit_completion'
      );
      
      expect(submitTransition).toBeDefined();
      expect(submitTransition!.guard).toBeDefined();
      expect(submitTransition!.effect).toBeDefined();
    });

    it('should allow finalize transition from ACTIVE to COMPLETED', () => {
      const finalizeTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'COMPLETED' && t.eventName === 'finalize'
      );
      
      expect(finalizeTransition).toBeDefined();
      expect(finalizeTransition!.guard).toBeDefined();
    });

    it('should allow dispute transition from ACTIVE to DISPUTED', () => {
      const disputeTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'DISPUTED' && t.eventName === 'dispute'
      );
      
      expect(disputeTransition).toBeDefined();
      expect(disputeTransition!.guard).toBeDefined();
    });

    it('should allow resolve transition from DISPUTED to COMPLETED', () => {
      const resolveTransition = contractAgreementDef.transitions.find(
        t => t.from === 'DISPUTED' && t.to === 'COMPLETED' && t.eventName === 'resolve'
      );
      
      expect(resolveTransition).toBeDefined();
      expect(resolveTransition!.guard).toBeDefined();
    });
  });

  describe('Guard Logic Preservation', () => {
    it('should preserve agent authorization guards for accept', () => {
      const acceptTransition = contractAgreementDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'accept'
      );
      
      expect(acceptTransition!.guard).toEqual({
        '===': [
          { var: 'event.agent' },
          { var: 'state.counterparty' }
        ]
      });
    });

    it('should preserve multi-condition guard for submit_completion', () => {
      const submitTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'submit_completion'
      );
      
      // Should have complex AND logic with OR conditions and negation
      expect(submitTransition!.guard).toHaveProperty('and');
      expect(Array.isArray(submitTransition!.guard.and)).toBe(true);
    });

    it('should preserve completion count guard for finalize', () => {
      const finalizeTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'COMPLETED' && t.eventName === 'finalize'
      );
      
      expect(finalizeTransition!.guard).toEqual({
        '>=': [
          { size: { var: 'state.completions' } },
          2
        ]
      });
    });
  });

  describe('Effect Logic Preservation', () => {
    it('should preserve merge effects for accept transition', () => {
      const acceptTransition = contractAgreementDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'accept'
      );
      
      expect(acceptTransition!.effect.merge).toBeDefined();
      expect(acceptTransition!.effect.merge[0]).toEqual({ var: 'state' });
      expect(acceptTransition!.effect.merge[1]).toHaveProperty('status', 'ACTIVE');
      expect(acceptTransition!.effect.merge[1]).toHaveProperty('acceptedAt');
    });

    it('should preserve completion array updates for submit_completion', () => {
      const submitTransition = contractAgreementDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'submit_completion'
      );
      
      const mergeEffect = submitTransition!.effect.merge[1];
      expect(mergeEffect).toHaveProperty('completions');
      expect(mergeEffect.completions).toHaveProperty('cat');
    });
  });

  describe('Schema Definitions', () => {
    it('should define create schema with required fields', () => {
      expect(contractAgreementDef.createSchema).toBeDefined();
      expect(contractAgreementDef.createSchema.required).toContain('proposer');
      expect(contractAgreementDef.createSchema.required).toContain('counterparty');
    });

    it('should define state schema with proper types', () => {
      expect(contractAgreementDef.stateSchema).toBeDefined();
      expect(contractAgreementDef.stateSchema.properties).toBeDefined();
    });

    it('should define event schemas for all events', () => {
      const expectedEvents = ['accept', 'reject', 'cancel', 'submit_completion', 'finalize', 'dispute', 'resolve'];
      
      expectedEvents.forEach(eventName => {
        expect(contractAgreementDef.eventSchemas).toHaveProperty(eventName);
      });
    });
  });

  describe('Cross-References', () => {
    it('should preserve cross-reference metadata', () => {
      const crossRefs = contractAgreementDef.crossReferences;
      
      expect(crossRefs).toHaveProperty('proposerIdentityId');
      expect(crossRefs).toHaveProperty('counterpartyIdentityId');
      expect(crossRefs).toHaveProperty('escrowId');
      expect(crossRefs).toHaveProperty('arbitrationPoolId');
    });
  });
});