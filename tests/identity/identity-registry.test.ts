/**
 * Tests for the IdentityRegistry state machine — the ecosystem reputation + role-attestation source.
 *
 * Beyond structure, these exercise the actual guards/effects against the metakit JLVM evaluator so the
 * set/unset map-writes and the authority gate are validated byte-for-byte against the on-chain engine.
 */

import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import { identityRegistryDef } from '../../src/apps/identity/state-machines/index';
import {
  REGISTRY_ROLES,
  REGISTRY_ROLE_MAP,
  registryRolePath,
  registryReputationPath,
} from '../../src/apps/identity/constants';

const apply = (rule: unknown, data: unknown): unknown => jsonLogic.apply(rule as object, data as object);

const tx = (eventName: string) => {
  const t = identityRegistryDef.transitions.find((x) => x.eventName === eventName);
  if (!t) throw new Error(`no transition for ${eventName}`);
  return t;
};

// A registry state with one existing reputation + arbiter, governed by 0xAUTH.
const baseState = () => ({
  authority: '0xAUTH',
  reputations: { '0xCC': 5 },
  arbiters: { '0xOLD': true },
  slashers: {},
  issuers: {},
  boardMembers: {},
});

const ctx = (signers: string[], event: Record<string, unknown>) => ({
  state: baseState(),
  proofs: signers.map((a) => ({ address: a })),
  event,
});

describe('IdentityRegistry State Machine', () => {
  describe('Definition Structure', () => {
    it('has registry metadata', () => {
      expect(identityRegistryDef.metadata.name).toBe('IdentityRegistry');
      expect(identityRegistryDef.metadata.app).toBe('identity');
      expect(identityRegistryDef.metadata.type).toBe('registry');
    });

    it('exposes reputation + the four flat per-role maps in state', () => {
      const props = Object.keys(identityRegistryDef.stateSchema!.properties!);
      expect(props).toEqual(expect.arrayContaining(['reputations', 'arbiters', 'slashers', 'issuers', 'boardMembers']));
    });

    it('has authority-write transitions', () => {
      const events = identityRegistryDef.transitions.map((t) => t.eventName);
      expect(events).toEqual(
        expect.arrayContaining(['set_reputation', 'adjust_reputation', 'grant_role', 'revoke_role']),
      );
    });

    it('role constants stay in lock-step with the state maps', () => {
      const props = Object.keys(identityRegistryDef.stateSchema!.properties!);
      for (const role of Object.keys(REGISTRY_ROLES) as (keyof typeof REGISTRY_ROLES)[]) {
        expect(props).toContain(REGISTRY_ROLE_MAP[role]);
      }
    });
  });

  describe('Authority gate', () => {
    it('every write transition is gated to the pinned authority signer', () => {
      for (const ev of ['set_reputation', 'adjust_reputation', 'grant_role', 'revoke_role']) {
        const g = tx(ev).guard;
        expect(apply(g, ctx(['0xAUTH'], { subject: '0xBB', score: 1, delta: 1, role: 'ARBITER' }))).toBe(true);
        expect(apply(g, ctx(['0xATTACKER'], { subject: '0xBB', score: 1, delta: 1, role: 'ARBITER' }))).toBe(false);
        // a forged event.agent cannot stand in for the authority
        expect(JSON.stringify(g)).not.toContain('event.agent');
      }
    });
  });

  describe('Reputation writes (set/adjust)', () => {
    it('set_reputation sets an absolute score under the subject key', () => {
      const out = apply(tx('set_reputation').effect, ctx(['0xAUTH'], { subject: '0xBB', score: 15 })) as {
        reputations: Record<string, number>;
      };
      expect(out.reputations).toEqual({ '0xCC': 5, '0xBB': 15 });
    });

    it('adjust_reputation applies a signed delta; a new subject starts from 0', () => {
      const inc = apply(tx('adjust_reputation').effect, ctx(['0xAUTH'], { subject: '0xCC', delta: 3 })) as {
        reputations: Record<string, number>;
      };
      expect(inc.reputations['0xCC']).toBe(8);
      const fresh = apply(tx('adjust_reputation').effect, ctx(['0xAUTH'], { subject: '0xNEW', delta: 7 })) as {
        reputations: Record<string, number>;
      };
      expect(fresh.reputations['0xNEW']).toBe(7);
    });
  });

  describe('Role attestation writes (grant/revoke)', () => {
    it('grant_role inserts into exactly the targeted role map', () => {
      const out = apply(tx('grant_role').effect, ctx(['0xAUTH'], { subject: '0xBB', role: 'SLASHER' })) as Record<
        string,
        Record<string, true>
      >;
      expect(out.slashers).toEqual({ '0xBB': true });
      expect(out.arbiters).toEqual({ '0xOLD': true }); // untouched
      expect(out.issuers).toEqual({});
    });

    it('revoke_role removes only the subject from the targeted role map', () => {
      const state = { ...baseState(), arbiters: { '0xOLD': true, '0xBB': true } };
      const out = apply(tx('revoke_role').effect, {
        state,
        proofs: [{ address: '0xAUTH' }],
        event: { subject: '0xBB', role: 'ARBITER' },
      }) as Record<string, Record<string, true>>;
      expect(out.arbiters).toEqual({ '0xOLD': true });
    });
  });

  describe('Consumer path helpers', () => {
    it('build the cross-fiber read paths a consumer guard uses', () => {
      expect(registryReputationPath('reg-1')).toBe('machines.reg-1.state.reputations');
      expect(registryRolePath('reg-1', 'ARBITER')).toBe('machines.reg-1.state.arbiters');
      expect(registryRolePath('reg-1', 'BOARD_MEMBER')).toBe('machines.reg-1.state.boardMembers');
    });
  });
});
