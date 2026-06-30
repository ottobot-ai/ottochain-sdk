import { contractUniversalDef } from '../../src/apps/contracts/state-machines/contract-universal.js';

describe('Contract Universal State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(contractUniversalDef).toBeDefined();
      expect(typeof contractUniversalDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(contractUniversalDef.metadata.name).toBe('ContractUniversal');
      expect(contractUniversalDef.metadata.app).toBe('contracts');
      expect(contractUniversalDef.metadata.description).toBe(
        'Minimal contract state machine - extend for custom use cases',
      );
      expect(contractUniversalDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      const actualStates = Object.keys(contractUniversalDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(contractUniversalDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(contractUniversalDef.states.COMPLETED.isFinal).toBe(true);
      expect(contractUniversalDef.states.CANCELLED.isFinal).toBe(true);
      expect(contractUniversalDef.states.PROPOSED.isFinal).toBe(false);
      expect(contractUniversalDef.states.ACTIVE.isFinal).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should allow accept transition from PROPOSED to ACTIVE', () => {
      const acceptTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'accept',
      );

      expect(acceptTransition).toBeDefined();
      expect(acceptTransition!.guard).toEqual({ '==': [1, 1] });
      expect(acceptTransition!.effect).toBeDefined();
    });

    it('should allow cancel transition from PROPOSED to CANCELLED', () => {
      const cancelTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel',
      );

      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toEqual({ '==': [1, 1] });
    });

    it('should allow complete transition from ACTIVE to COMPLETED', () => {
      const completeTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'COMPLETED' && t.eventName === 'complete',
      );

      expect(completeTransition).toBeDefined();
      expect(completeTransition!.guard).toEqual({ '==': [1, 1] });
    });

    it('should allow cancel transition from ACTIVE to CANCELLED', () => {
      const cancelTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'CANCELLED' && t.eventName === 'cancel',
      );

      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toEqual({ '==': [1, 1] });
    });
  });

  describe('Guard Logic Preservation', () => {
    it('should preserve simple true guards as equality checks', () => {
      contractUniversalDef.transitions.forEach((transition) => {
        expect(transition.guard).toEqual({ '==': [1, 1] });
      });
    });
  });

  describe('Effect Logic Preservation', () => {
    it('should preserve merge effects for accept transition', () => {
      const acceptTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'accept',
      );

      expect(acceptTransition!.effect.merge).toBeDefined();
      expect(acceptTransition!.effect.merge[0]).toEqual({ var: 'state' });
      expect(acceptTransition!.effect.merge[1]).toEqual({
        status: 'ACTIVE',
        acceptedAt: { var: '$ordinal' },
      });
    });

    it('should preserve merge effects for cancel transition', () => {
      const cancelTransitions = contractUniversalDef.transitions.filter((t) => t.eventName === 'cancel');

      cancelTransitions.forEach((transition) => {
        expect(transition.effect.merge).toBeDefined();
        expect(transition.effect.merge[0]).toEqual({ var: 'state' });
        expect(transition.effect.merge[1]).toEqual({
          status: 'CANCELLED',
          cancelledAt: { var: '$ordinal' },
        });
      });
    });

    it('should preserve merge effects for complete transition', () => {
      const completeTransition = contractUniversalDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'COMPLETED' && t.eventName === 'complete',
      );

      expect(completeTransition!.effect.merge).toBeDefined();
      expect(completeTransition!.effect.merge[0]).toEqual({ var: 'state' });
      expect(completeTransition!.effect.merge[1]).toEqual({
        status: 'COMPLETED',
        completedAt: { var: '$ordinal' },
      });
    });
  });

  describe('Schema Definitions', () => {
    it('should define create schema with basic fields', () => {
      expect(contractUniversalDef.createSchema).toBeDefined();
      expect(contractUniversalDef.createSchema.properties).toBeDefined();
    });

    it('should define state schema with computed status', () => {
      expect(contractUniversalDef.stateSchema).toBeDefined();
      expect(contractUniversalDef.stateSchema.properties).toBeDefined();
      expect(contractUniversalDef.stateSchema.properties.status).toBeDefined();
    });

    it('should define event schemas for all events', () => {
      const expectedEvents = ['accept', 'cancel', 'complete'];

      expectedEvents.forEach((eventName) => {
        expect(contractUniversalDef.eventSchemas).toHaveProperty(eventName);
      });
    });
  });

  describe('Type Exports', () => {
    it('should export state and event types', () => {
      // These imports would be available after implementation
      const module = require('../../src/apps/contracts/state-machines/contract-universal.js');

      // The types should be exported (this will fail until implemented)
      expect(() => {
        // TypeScript types are compile-time only, but we test the runtime module exists
        expect(module.contractUniversalDef).toBeDefined();
      }).not.toThrow();
    });
  });
});
