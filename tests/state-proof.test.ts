/**
 * Light-client state-proof verification — golden test against a REAL committed proof.
 *
 * The fixture is a live `/state-machines/{id}/state-proof?field=fills` response captured
 * from a local GL0+ML0+3xDL1 cluster (the riverdale-health dispensing-log fiber), so the
 * fold is validated against exactly what the chain serves — not a synthetic tree. Tamper
 * cases flip one element at a time and must each fail on the MATCHING binding.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  verifyStateProof,
  verifyMptInclusion,
  commitKeyPath,
  type MptInclusionProof,
  type StateProof,
} from '../src/ottochain/index.js';

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'state-proof-committed.json'), 'utf8'),
) as StateProof;
const KEY = fixture.key; // fiber/<uuid>
const proofOf = (r: StateProof): MptInclusionProof => JSON.parse(JSON.stringify(r.proof)) as MptInclusionProof;

describe('verifyStateProof (golden, captured from a live cluster)', () => {
  it('accepts the untampered response', () => {
    expect(verifyStateProof(fixture, KEY)).toEqual({ ok: true });
  });

  it('rejects a response claiming a different key', () => {
    const res = verifyStateProof(fixture, 'fiber/00000000-0000-0000-0000-000000000000');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('expected');
  });

  it('rejects a tampered record (leaf dataDigest binding)', () => {
    const tampered = { ...fixture, record: { ...(fixture.record as object), forged: true } };
    const res = verifyStateProof(tampered as StateProof, KEY);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('dataDigest');
  });

  it('rejects a tampered root (first commitment binding)', () => {
    const res = verifyMptInclusion('ff' + String(fixture.mptRoot).slice(2), KEY, fixture.record, proofOf(fixture));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('depth 0');
  });

  it('rejects a tampered mid-witness digest', () => {
    const proof = proofOf(fixture);
    // flip one nibble inside a branch child digest (witness is leaf-first; pick a middle node)
    const mid = proof.witness.find((n) => n.type === 'Branch' && n.contents.pathsDigest);
    const key0 = Object.keys(mid!.contents.pathsDigest!)[0];
    const v = mid!.contents.pathsDigest![key0];
    mid!.contents.pathsDigest![key0] = (v[0] === 'a' ? 'b' : 'a') + v.slice(1);
    const res = verifyMptInclusion(String(fixture.mptRoot), KEY, fixture.record, proof);
    expect(res.ok).toBe(false);
  });

  it('rejects a truncated witness', () => {
    const proof = proofOf(fixture);
    proof.witness = proof.witness.slice(1); // drop the leaf
    const res = verifyMptInclusion(String(fixture.mptRoot), KEY, fixture.record, proof);
    expect(res.ok).toBe(false);
  });

  it('rejects a path/key mismatch', () => {
    const proof = proofOf(fixture);
    proof.path = proof.path.slice(0, -2) + '00';
    const res = verifyMptInclusion(String(fixture.mptRoot), KEY, fixture.record, proof);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('trie path');
  });

  it('commitKeyPath matches the chain (CommitKey.toHex)', () => {
    expect(commitKeyPath(KEY)).toBe((fixture.proof as MptInclusionProof).path.toLowerCase());
    expect(commitKeyPath('fiber/x')).toBe('66696265722f78');
  });

  it('never throws on malformed proofs', () => {
    expect(verifyMptInclusion('00', KEY, {}, {} as MptInclusionProof).ok).toBe(false);
    expect(
      verifyMptInclusion(
        '00',
        KEY,
        {},
        { path: commitKeyPath(KEY), witness: [{ type: 'Bogus', contents: {} } as never] },
      ).ok,
    ).toBe(false);
  });
});
