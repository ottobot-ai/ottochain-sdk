import { describe, it, expect } from '@jest/globals';
import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import {
  signerIsParty,
  signerIsAnyParty,
  signerInSet,
  signerIsNotParty,
  signerHasEntry,
  assetSignerIs,
  actorIsSigner,
  actorInSet,
  actorHasEntry,
  signerHasReputation,
  signerHasRole,
  signerHasReputationVia,
  signerHasRoleVia,
} from '../../src/schema/guards';
import { addDependency, setDependencyActive } from '../../src/schema/effects';

const apply = (rule: unknown, data: unknown): unknown => jsonLogic.apply(rule as object, data as object);

// fiber-transition context: proofs = verified signers; event = raw attacker payload
const fiberCtx = (signers: string[], event: Record<string, unknown> = {}) => ({
  state: { borrower: '0xb0b', lender: '0x1ee' },
  proofs: signers.map((a) => ({ address: a, id: 'id', signature: 'sig' })),
  event,
});
// asset context: signers = verified address strings; NO event/proofs
const assetCtx = (signers: string[]) => ({ holder: { Wallet: { address: '0xb0b' } }, signers });

describe('schema/guards — authorization binds to verified signers, not event/witness', () => {
  it('signerIsParty emits a proofs[].address membership check', () => {
    expect(signerIsParty('state.borrower')).toEqual({
      in: [{ var: 'state.borrower' }, { map: [{ var: 'proofs' }, { var: 'address' }] }],
    });
  });

  it('signerIsParty passes only when the pinned party actually signed', () => {
    const g = signerIsParty('state.borrower');
    expect(apply(g, fiberCtx(['0xb0b']))).toBe(true); // borrower signed
    expect(apply(g, fiberCtx(['0x1ee']))).toBe(false); // someone else signed
    expect(apply(g, fiberCtx([]))).toBe(false); // no matching signer
  });

  it('signerIsParty IGNORES a forged event.agent (the F1 fix)', () => {
    const g = signerIsParty('state.borrower');
    // attacker signs with their own key (0xbad) but writes the borrower into event.agent
    expect(apply(g, fiberCtx(['0xbad'], { agent: '0xb0b' }))).toBe(false);
    // and the guard structure contains no reference to `event`
    expect(JSON.stringify(g)).not.toContain('event');
  });

  it('signerIsAnyParty passes if ANY pinned party signed', () => {
    const g = signerIsAnyParty(['state.borrower', 'state.lender']);
    expect(apply(g, fiberCtx(['0x1ee']))).toBe(true); // lender signed
    expect(apply(g, fiberCtx(['0xb0b']))).toBe(true); // borrower signed
    expect(apply(g, fiberCtx(['0xbad']))).toBe(false); // neither
  });

  it('assetSignerIs binds to the asset-context `signers` (no event/proofs there)', () => {
    const g = assetSignerIs('holder.Wallet.address');
    expect(g).toEqual({ in: [{ var: 'holder.Wallet.address' }, { var: 'signers' }] });
    expect(apply(g, assetCtx(['0xb0b']))).toBe(true); // holder signed the burn
    expect(apply(g, assetCtx(['0x1ee']))).toBe(false); // a non-holder cannot burn
  });

  it('signerInSet passes when a verified signer is in the pinned set, ignoring event.agent', () => {
    const g = signerInSet('state.members');
    const ctx = (signers: string[], event: Record<string, unknown> = {}) => ({
      state: { members: ['0xm1', '0xm2'] },
      proofs: signers.map((a) => ({ address: a })),
      event,
    });
    expect(apply(g, ctx(['0xm2']))).toBe(true); // a member signed
    expect(apply(g, ctx(['0xnotmember']))).toBe(false); // a non-member signed
    // a forged event.agent claiming membership is ignored
    expect(apply(g, ctx(['0xnotmember'], { agent: '0xm1' }))).toBe(false);
  });

  it('signerHasEntry passes when a verified signer is a key in the state map', () => {
    const g = signerHasEntry('state.members');
    const ctx = (signers: string[]) => ({
      state: { members: { '0xm1': { rep: 5 }, '0xm2': { rep: 3 } } },
      proofs: signers.map((a) => ({ address: a })),
    });
    expect(g).toEqual({
      some: [{ map: [{ var: 'proofs' }, { var: 'address' }] }, { has: [{ var: 'state.members' }, { var: '' }] }],
    });
    expect(apply(g, ctx(['0xm2']))).toBe(true); // a member signed
    expect(apply(g, ctx(['0xnotmember']))).toBe(false); // a non-member signed
  });

  it('signerIsNotParty blocks only when the pinned party actually signed', () => {
    const g = signerIsNotParty('state.author');
    const ctx = (signers: string[]) => ({ state: { author: '0xauthor' }, proofs: signers.map((a) => ({ address: a })) });
    expect(apply(g, ctx(['0xother']))).toBe(true); // author did not sign → allowed
    expect(apply(g, ctx(['0xauthor']))).toBe(false); // author signed → blocked (no self-action)
    expect(g).toEqual({ '!': [signerIsParty('state.author')] });
  });

  it('actorIsSigner binds event.agent to a verified signer (effect-key coupling)', () => {
    const g = actorIsSigner();
    expect(g).toEqual(signerIsParty('event.agent'));
    // attacker signs with 0xbad but claims to act as the victim 0xvictim
    expect(apply(g, fiberCtx(['0xbad'], { agent: '0xvictim' }))).toBe(false);
    // the claimed actor actually signed → safe to use event.agent as a map key
    expect(apply(g, fiberCtx(['0xvictim'], { agent: '0xvictim' }))).toBe(true);
    // a custom actor field is supported
    expect(actorIsSigner('event.delegateFrom')).toEqual(signerIsParty('event.delegateFrom'));
  });

  it('actorInSet binds event.agent to a verified signer who is in the pinned ARRAY set', () => {
    const g = actorInSet('state.signers');
    const ctx = (signers: string[], agent: string, set: string[] = ['0xA', '0xB']) => ({
      state: { signers: set },
      proofs: signers.map((a) => ({ address: a })),
      event: { agent },
    });
    expect(apply(g, ctx(['0xA'], '0xA'))).toBe(true); // agent signed and is a member
    expect(apply(g, ctx(['0xB'], '0xA'))).toBe(false); // forge: agent did not sign
    // padding: a verified co-signer who is NOT in the set cannot be the written key
    expect(apply(g, ctx(['0xA', '0xC'], '0xC'))).toBe(false);
  });

  it('actorHasEntry binds event.agent to a verified signer who is a key in the pinned MAP', () => {
    const g = actorHasEntry('state.members');
    const ctx = (signers: string[], agent: string, members: Record<string, unknown> = { '0xA': 1, '0xB': 1 }) => ({
      state: { members },
      proofs: signers.map((a) => ({ address: a })),
      event: { agent },
    });
    expect(apply(g, ctx(['0xA'], '0xA'))).toBe(true); // signer is a member key
    expect(apply(g, ctx(['0xB'], '0xA'))).toBe(false); // forge: agent did not sign
    // stuffing: a verified co-signer who is NOT a member key cannot be written
    expect(apply(g, ctx(['0xA', '0xZ'], '0xZ'))).toBe(false);
  });

  it('signerHasReputation gates on a registry-map read bound to the signer', () => {
    const g = signerHasReputation('machines.reg.state.reputations', 'state.voteThreshold');
    expect(g).toEqual({
      some: [
        { map: [{ var: 'proofs' }, { var: 'address' }] },
        { '>=': [{ get: [{ var: 'machines.reg.state.reputations' }, { var: '' }] }, { var: 'state.voteThreshold' }] },
      ],
    });
    const ctx = (signers: string[], reps: Record<string, number>) => ({
      state: { voteThreshold: 15 },
      proofs: signers.map((a) => ({ address: a })),
      machines: { reg: { state: { reputations: reps } } },
    });
    expect(apply(g, ctx(['0xBB'], { '0xBB': 20 }))).toBe(true); // signer rep 20 >= 15
    expect(apply(g, ctx(['0xBB'], { '0xBB': 10 }))).toBe(false); // signer rep 10 < 15
    expect(apply(g, ctx(['0xBB'], { '0xZZ': 99 }))).toBe(false); // signer unregistered → null→0 < 15
  });

  it('signerHasRole gates on registry per-role map membership bound to the signer', () => {
    const g = signerHasRole('machines.reg.state.arbiters');
    expect(g).toEqual(signerHasEntry('machines.reg.state.arbiters'));
    const ctx = (signers: string[], arbiters: Record<string, true>) => ({
      proofs: signers.map((a) => ({ address: a })),
      machines: { reg: { state: { arbiters } } },
    });
    expect(apply(g, ctx(['0xBB'], { '0xBB': true }))).toBe(true); // signer holds ARBITER
    expect(apply(g, ctx(['0xBB'], { '0xAA': true }))).toBe(false); // signer lacks ARBITER
    expect(apply(g, ctx(['0xBB'], {}))).toBe(false); // empty role map → fail-closed (no throw)
  });

  it('signerHasReputationVia reads a RUNTIME-bound registry id and fail-closes when unbound (#24)', () => {
    const g = signerHasReputationVia('state.registryId', 'state.bar');
    const ctx = (reps: Record<string, number> | undefined) => ({
      proofs: [{ address: '0xBB' }],
      state: { registryId: 'reg-1', bar: 10 },
      machines: reps === undefined ? {} : { 'reg-1': { state: { reputations: reps } } },
    });
    expect(apply(g, ctx({ '0xBB': 12 }))).toBe(true); // bound, 12 >= 10
    expect(apply(g, ctx({ '0xBB': 5 }))).toBe(false); // bound, 5 < 10
    expect(apply(g, ctx({ '0xZZ': 99 }))).toBe(false); // signer unregistered
    expect(apply(g, ctx(undefined))).toBe(false); // registry NOT bound → clean false, not an error
  });

  it('signerHasRoleVia reads a RUNTIME-bound registry role map, fail-closing when unbound (#24)', () => {
    const g = signerHasRoleVia('state.registryId', 'arbiters');
    const ctx = (arb: Record<string, true> | undefined) => ({
      proofs: [{ address: '0xBB' }],
      state: { registryId: 'reg-1' },
      machines: arb === undefined ? {} : { 'reg-1': { state: { arbiters: arb } } },
    });
    expect(apply(g, ctx({ '0xBB': true }))).toBe(true); // signer holds ARBITER
    expect(apply(g, ctx({ '0xAA': true }))).toBe(false); // signer lacks it
    expect(apply(g, ctx(undefined))).toBe(false); // registry NOT bound → clean false
  });

  it('addDependency / setDependencyActive build the #24 effect directives', () => {
    expect(addDependency({ var: 'event.registryId' })).toEqual({
      _addDependency: [{ fiberId: { var: 'event.registryId' } }],
    });
    expect(addDependency('reg-uuid')).toEqual({ _addDependency: [{ fiberId: 'reg-uuid' }] });
    expect(setDependencyActive({ var: 'state.registryId' }, false)).toEqual({
      _setDependencyActive: [{ fiberId: { var: 'state.registryId' }, active: false }],
    });
    // the directive merges into a state-update map; the _-key is what the engine extracts
    const effect = { merge: [{ var: 'state' }, { boundAt: 1, ...addDependency('reg-uuid') }] };
    expect(JSON.stringify(effect)).toContain('_addDependency');
  });
});
