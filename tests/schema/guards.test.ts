import { describe, it, expect } from '@jest/globals';
import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import { signerIsParty, signerIsAnyParty, assetSignerIs } from '../../src/schema/guards';

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
});
