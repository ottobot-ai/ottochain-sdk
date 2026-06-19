/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — tests access guard properties dynamically
import { identityOracleDef } from '../../src/apps/identity/state-machines/identity-oracle.js';
import { signerIsParty } from '../../src/schema/guards.js';

describe('Identity Oracle State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and expose the expected metadata', () => {
      expect(identityOracleDef).toBeDefined();
      expect(identityOracleDef.metadata.name).toBe('IdentityOracle');
      expect(identityOracleDef.metadata.app).toBe('identity');
      expect(identityOracleDef.metadata.type).toBe('oracle');
    });

    it('should keep the oracle lifecycle states', () => {
      ['UNREGISTERED', 'REGISTERED', 'ACTIVE', 'SLASHED', 'WITHDRAWN'].forEach(s =>
        expect(identityOracleDef.states).toHaveProperty(s)
      );
      expect(identityOracleDef.states.WITHDRAWN.isFinal).toBe(true);
    });
  });

  describe('Schema Definitions', () => {
    it('should pin a slasher authority into the create + state schema', () => {
      // missing-authority fix: slashing requires a state-pinned slasher.
      expect(identityOracleDef.createSchema.required).toContain('slasher');
      expect(identityOracleDef.createSchema.properties.slasher.type).toBe('address');
      expect(identityOracleDef.createSchema.properties.slasher.immutable).toBe(true);
      expect(identityOracleDef.stateSchema.properties.slasher).toBeDefined();
    });

    it('should remove the forgeable adminOverride field from the activate event', () => {
      expect(identityOracleDef.eventSchemas.activate.properties).not.toHaveProperty(
        'adminOverride'
      );
    });
  });

  describe('S2 / missing-authority hardening', () => {
    it('activate: gated solely on the verified owner signer (no adminOverride bypass)', () => {
      const activate = identityOracleDef.transitions.find(
        t => t.from === 'REGISTERED' && t.to === 'ACTIVE' && t.eventName === 'activate'
      );
      // The bypass disjunct is gone — activation goes through the signer path only.
      expect(activate!.guard).toEqual(signerIsParty('state.address'));
      expect(JSON.stringify(activate!.guard)).not.toContain('adminOverride');
    });

    it('slash: requires the pinned slasher signer AND keeps the amount bounds', () => {
      const slash = identityOracleDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'SLASHED' && t.eventName === 'slash'
      );
      expect(slash!.guard).toHaveProperty('and');
      // who-check: the slasher is a verified signer (was previously absent).
      expect(slash!.guard.and[0]).toEqual(signerIsParty('state.slasher'));
      // existing magnitude bounds preserved: amount > 0 and amount <= stake.
      expect(slash!.guard.and).toContainEqual({
        '>': [{ var: 'event.amount' }, 0],
      });
      expect(slash!.guard.and).toContainEqual({
        '<=': [{ var: 'event.amount' }, { var: 'state.stake' }],
      });
    });

    it('slash: still records reason/amount in the effect (data, not authorization)', () => {
      const slash = identityOracleDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'SLASHED' && t.eventName === 'slash'
      );
      const appended = slash!.effect.merge[1].slashingHistory.cat[1][0];
      expect(appended.reason).toEqual({ var: 'event.reason' });
      expect(appended.amount).toEqual({ var: 'event.amount' });
    });
  });
});
