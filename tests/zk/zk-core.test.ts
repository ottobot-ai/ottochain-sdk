import { describe, it, expect } from '@jest/globals';
import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import { keccak_256 } from '@noble/hashes/sha3.js';

import {
  canonicalForSigning,
  proverPreimage,
  exprHash,
  dataHash,
  KECCAK_TRUE,
  frToHex,
  toFr,
  R,
  poseidonCommit,
  poseidonCommitN,
  openCommitment,
  decodeJlvmPublicValues,
  groth16Witness,
  pmtWitness,
  ExprRegistry,
  boundRule,
  atLeast,
  atMost,
  semiPrivateGuard,
  wordOffset,
  verifyGroth16Bundle,
  checkSemiPrivateBinding,
  verifySemiPrivate,
  parseGroth16Stdout,
  type Groth16Bundle,
} from '../../src/zk/index';

// ── synthetic public-values helpers (mirrors abi_encode(JlvmPublicValues)) ──────────────────────
const word = (hex32: string): string => hex32.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const makePV = (
  exprH: string,
  dataH: string,
  outH: string,
  ok: boolean,
): `0x${string}` =>
  `0x${word(exprH)}${word(dataH)}${word(outH)}${ok ? '00'.repeat(31) + '01' : '00'.repeat(32)}`;

const POSEIDON_1_2 = '0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a';

describe('zk/preimage — the one canonical path', () => {
  it('canonicalForSigning drops null fields and sorts keys (server-aligned)', () => {
    expect(canonicalForSigning({ b: 1, a: null })).toBe('{"b":1}');
    expect(canonicalForSigning({ z: 1, a: 2 })).toBe('{"a":2,"z":1}');
    expect(canonicalForSigning(true)).toBe('true');
  });

  it('proverPreimage is deterministic keccak256 of the canonical bytes', () => {
    const rule = { '>=': [{ var: 'score' }, 700] };
    expect(proverPreimage(rule)).toBe(proverPreimage(rule));
    // independent keccak256(canonical) cross-check
    const expected = `0x${Buffer.from(keccak_256(new TextEncoder().encode(canonicalForSigning(rule)))).toString('hex')}`;
    expect(proverPreimage(rule)).toBe(expected);
  });

  it('exprHash == dataHash == proverPreimage for the same canonical value', () => {
    const v = { a: 1 };
    expect(exprHash(v)).toBe(proverPreimage(v));
    expect(dataHash(v)).toBe(proverPreimage(v));
  });

  it('KECCAK_TRUE == keccak256("true")', () => {
    const expected = `0x${Buffer.from(keccak_256(new TextEncoder().encode('true'))).toString('hex')}`;
    expect(KECCAK_TRUE).toBe(expected);
    expect(KECCAK_TRUE).toBe(proverPreimage(true));
  });
});

describe('zk/commit — Poseidon via the VM opcode (byte-exact)', () => {
  it('frToHex encodes a 32-byte big-endian Fr and reduces mod R', () => {
    expect(frToHex(1n)).toBe(`0x${'0'.repeat(63)}1`);
    expect(frToHex(R)).toBe(`0x${'0'.repeat(64)}`); // R ≡ 0
    expect(toFr(-1n)).toBe(R - 1n);
  });

  it('poseidonCommit reproduces the circomlib hard vector poseidon([1,2])', () => {
    expect(poseidonCommit(1n, 2n)).toBe(POSEIDON_1_2);
  });

  it('openCommitment round-trips its opening to the same commitment', () => {
    const c = openCommitment([42n], 7n);
    expect(c.cm).toBe(poseidonCommit(42n, 7n));
    expect(c.fields).toEqual([42n]);
    expect(c.salt).toBe(7n);
    // a fresh salt yields a different commitment for the same field
    expect(openCommitment([42n]).cm).not.toBe(openCommitment([42n]).cm);
  });

  it('poseidonCommitN rejects more inputs than the bundled width allows', () => {
    // 4 fields + salt = 5 inputs > MAX (width t ≤ 5 ⇒ ≤ 4 inputs incl. salt)
    expect(() => poseidonCommitN([1n, 2n, 3n, 4n], 5n)).toThrow();
  });
});

describe('zk/types — public-values decode', () => {
  it('decodes the four words and the ok bit', () => {
    const eH = `0x${'11'.repeat(32)}`;
    const dH = `0x${'22'.repeat(32)}`;
    const oH = `0x${'33'.repeat(32)}`;
    const okTrue = decodeJlvmPublicValues(makePV(eH, dH, oH, true));
    expect(okTrue).toEqual({ exprHash: eH, dataHash: dH, outputHash: oH, ok: true });
    expect(decodeJlvmPublicValues(makePV(eH, dH, oH, false)).ok).toBe(false);
  });

  it('throws on a too-short blob', () => {
    expect(() => decodeJlvmPublicValues('0xdeadbeef')).toThrow(/too short/);
  });
});

describe('zk/witness — on-op witness shapers', () => {
  const bundle: Groth16Bundle = {
    vkey: `0x${'ab'.repeat(32)}`,
    publicValues: makePV(`0x${'11'.repeat(32)}`, `0x${'22'.repeat(32)}`, KECCAK_TRUE, true),
    proof: `0x${'cd'.repeat(8)}`,
  };

  it('groth16Witness drops the vkey and surfaces decoded public values', () => {
    const w = groth16Witness(bundle);
    expect(w.witness).toEqual({ publicValues: bundle.publicValues, proof: bundle.proof });
    expect(w.witness).not.toHaveProperty('vkey');
    expect(w.decoded).toEqual(decodeJlvmPublicValues(bundle.publicValues));
    expect(w.decoded.outputHash).toBe(KECCAK_TRUE);
  });

  it('pmtWitness shapes leaf/index/siblings straight through', () => {
    const leaf = `0x${'01'.repeat(32)}` as const;
    const sib = [`0x${'02'.repeat(32)}`, `0x${'03'.repeat(32)}`] as `0x${string}`[];
    expect(pmtWitness(leaf, 5, sib)).toEqual({ leaf, index: 5, siblings: sib });
  });
});

describe('zk/registry — pin the bound into the rule', () => {
  it('bound-rule builders emit {[op]:[{var},bound]}', () => {
    expect(atLeast('score', 700)).toEqual({ '>=': [{ var: 'score' }, 700] });
    expect(atMost('ltv', 80)).toEqual({ '<=': [{ var: 'ltv' }, 80] });
    expect(boundRule('age', '>', 18)).toEqual({ '>': [{ var: 'age' }, 18] });
  });

  it('registers rules and binds name → logicHash == exprHash(rule)', () => {
    const reg = new ExprRegistry();
    const rule = atLeast('score', 700);
    const entry = reg.register('credit-floor', rule);
    expect(entry.logicHash).toBe(exprHash(rule));
    expect(reg.logicHashOf('credit-floor')).toBe(exprHash(rule));
    expect(reg.ruleOf('credit-floor')).toEqual(rule);
    expect(reg.has('credit-floor')).toBe(true);
    expect(reg.names()).toEqual(['credit-floor']);
    expect(() => reg.logicHashOf('nope')).toThrow(/no rule registered/);
  });
});

describe('zk/guard — builder + client-side mirror', () => {
  const vkey = `0x${'00'.repeat(32)}` as const;
  const reg = new ExprRegistry();
  const logicHash = reg.register('floor', atLeast('score', 700)).logicHash;

  it('wordOffset matches the ABI word layout (2,66,130,194)', () => {
    expect([0, 1, 2, 3].map(wordOffset)).toEqual([2, 66, 130, 194]);
  });

  it('semiPrivateGuard pins groth16 + exprHash + outputHash, droppable via requireTrue', () => {
    const g = semiPrivateGuard(vkey, logicHash) as { and: unknown[] };
    expect(g.and).toHaveLength(3);
    expect(g.and[0]).toEqual({
      groth16_verify: [vkey, { var: 'witness.publicValues' }, { var: 'witness.proof' }],
    });
    expect(g.and[1]).toEqual({
      '==': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 2, 64] }] }, logicHash],
    });
    expect(g.and[2]).toEqual({
      '==': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 130, 64] }] }, KECCAK_TRUE],
    });
    expect((semiPrivateGuard(vkey, logicHash, { requireTrue: false }) as { and: unknown[] }).and).toHaveLength(2);
  });

  // PARITY: the SDK's substr/cat offsets must agree with the actual VM. Evaluate the two binding
  // clauses against a synthetic witness whose words ARE logicHash / KECCAK_TRUE and expect true.
  it('binding clauses evaluate TRUE in the real VM over a matching witness', () => {
    const pv = makePV(logicHash, `0x${'22'.repeat(32)}`, KECCAK_TRUE, true);
    const ctx = { witness: { publicValues: pv } };
    const exprClause = { '==': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 2, 64] }] }, logicHash] };
    const outClause = { '==': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 130, 64] }] }, KECCAK_TRUE] };
    expect(jsonLogic.apply(exprClause, ctx)).toBe(true);
    expect(jsonLogic.apply(outClause, ctx)).toBe(true);
    // a non-matching rule hash makes the exprHash clause false
    const wrong = { '==': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 2, 64] }] }, `0x${'99'.repeat(32)}`] };
    expect(jsonLogic.apply(wrong, ctx)).toBe(false);
  });

  it('verifyGroth16Bundle returns false (not throws) on a garbage proof', () => {
    expect(
      verifyGroth16Bundle({ vkey, publicValues: '0x', proof: `0x${'00'.repeat(8)}` }),
    ).toBe(false);
  });

  it('checkSemiPrivateBinding accepts a bound witness and reports each failure', () => {
    const good: Groth16Bundle = {
      vkey,
      publicValues: makePV(logicHash, `0x${'22'.repeat(32)}`, KECCAK_TRUE, true),
      proof: '0x00',
    };
    expect(checkSemiPrivateBinding(good, logicHash).ok).toBe(true);

    const wrongRule = checkSemiPrivateBinding(good, `0x${'99'.repeat(32)}`);
    expect(wrongRule.ok).toBe(false);
    expect(wrongRule.reasons.join(' ')).toMatch(/exprHash/);

    const notTrue: Groth16Bundle = {
      vkey,
      publicValues: makePV(logicHash, `0x${'22'.repeat(32)}`, `0x${'44'.repeat(32)}`, false),
      proof: '0x00',
    };
    const r = checkSemiPrivateBinding(notTrue, logicHash);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/ok bit/);
    expect(r.reasons.join(' ')).toMatch(/outputHash/);
  });

  it('verifySemiPrivate fails closed when the proof does not verify', () => {
    const bundle: Groth16Bundle = {
      vkey,
      publicValues: makePV(logicHash, `0x${'22'.repeat(32)}`, KECCAK_TRUE, true),
      proof: `0x${'00'.repeat(8)}`,
    };
    const r = verifySemiPrivate(bundle, logicHash);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/groth16_verify failed/);
  });
});

describe('zk/prover — host stdout parsing', () => {
  it('parses vkey / public values / proof bytes from the host output', () => {
    const stdout = [
      'expr: {">=":[{"var":"score"},700]}',
      'data: {"score":740}',
      'native canonical output: true',
      'groth16 proof generated AND verified (output matches native).',
      `vkey:          0x${'AB'.repeat(32)}`,
      `public values: 0x${'11'.repeat(32)}${'22'.repeat(32)}${'33'.repeat(32)}${'00'.repeat(31)}01`,
      `proof bytes:   0x${'cd'.repeat(16)}`,
    ].join('\n');
    const bundle = parseGroth16Stdout(stdout);
    expect(bundle.vkey).toBe(`0x${'ab'.repeat(32)}`); // lowercased
    expect(bundle.proof).toBe(`0x${'cd'.repeat(16)}`);
    expect(decodeJlvmPublicValues(bundle.publicValues).ok).toBe(true);
  });

  it('throws a clear error when a required line is absent', () => {
    expect(() => parseGroth16Stdout('vkey: 0xabcd\n')).toThrow(/public values/);
  });
});
