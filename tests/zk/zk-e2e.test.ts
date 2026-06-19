import { describe, it, expect } from '@jest/globals';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  exprHash,
  KECCAK_TRUE,
  groth16Witness,
  verifyGroth16Bundle,
  checkSemiPrivateBinding,
  verifySemiPrivate,
  SubprocessProver,
  type Groth16Bundle,
} from '../../src/zk/index';

/**
 * END-TO-END over a REAL SP1-Groth16 proof from rust/zk-jlvm (`--mode groth16`). Proving is heavy, so
 * the default path verifies a COMMITTED fixture (verification is cheap — the same BN254 pairing the
 * chain runs), proving that a real proof flows through the SDK's client-side guard mirror exactly as a
 * semi-private guard would gate it on-chain. The live regeneration path is opt-in via ZK_JLVM_MANIFEST.
 *
 * The fixture is captured by:
 *   cargo run --release --manifest-path rust/zk-jlvm/script/Cargo.toml -- \
 *     --mode groth16 --expr '{">=":[{"var":"score"},700]}' --data '{"score":740}'
 * then recording {vkey, publicValues, proof} — see tests/zk/fixtures/README if regenerating.
 */

interface E2eFixture {
  rule: unknown;
  data: unknown;
  expectTrue: boolean;
  bundle: Groth16Bundle;
}

const fixturesDir = join(__dirname, 'fixtures');
const loadFixture = (name: string): E2eFixture | null => {
  const path = join(fixturesDir, name);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as E2eFixture) : null;
};

const tamper = (hex: `0x${string}`): `0x${string}` => {
  // flip the final nibble so the proof is well-formed but cryptographically invalid
  const last = hex.slice(-1);
  const flipped = (parseInt(last, 16) ^ 0x1).toString(16);
  return (hex.slice(0, -1) + flipped) as `0x${string}`;
};

const trueFx = loadFixture('groth16-score-ge-700.json');
const falseFx = loadFixture('groth16-score-lt-700.json');

(trueFx ? describe : describe.skip)('zk/e2e — real proof, rule TRUE (accept)', () => {
  const fx = trueFx as E2eFixture;
  const logicHash = exprHash(fx.rule);

  it('the proof verifies through the SDK groth16_verify opcode', () => {
    expect(verifyGroth16Bundle(fx.bundle)).toBe(true);
  });

  it('public values bind to the pinned rule and a true result', () => {
    const { decoded } = groth16Witness(fx.bundle);
    expect(decoded.exprHash).toBe(logicHash); // proof ran THIS rule
    expect(decoded.outputHash).toBe(KECCAK_TRUE); // rule evaluated true
    expect(decoded.ok).toBe(true);
  });

  it('verifySemiPrivate accepts (the full on-chain guard mirror passes)', () => {
    expect(verifySemiPrivate(fx.bundle, logicHash).ok).toBe(true);
  });

  it('a tampered proof is rejected (fails closed)', () => {
    const bad = { ...fx.bundle, proof: tamper(fx.bundle.proof) };
    expect(verifyGroth16Bundle(bad)).toBe(false);
    expect(verifySemiPrivate(bad, logicHash).ok).toBe(false);
  });

  it('binding to the WRONG rule is rejected even though the proof verifies', () => {
    const wrong = checkSemiPrivateBinding(fx.bundle, `0x${'99'.repeat(32)}`);
    expect(wrong.ok).toBe(false);
    expect(wrong.reasons.join(' ')).toMatch(/exprHash/);
  });
});

(falseFx ? describe : describe.skip)('zk/e2e — real proof, rule FALSE (reject)', () => {
  const fx = falseFx as E2eFixture;
  const logicHash = exprHash(fx.rule);

  it('the proof itself verifies, but the result is not true', () => {
    expect(verifyGroth16Bundle(fx.bundle)).toBe(true); // a valid proof OF a false evaluation
    expect(groth16Witness(fx.bundle).decoded.outputHash).not.toBe(KECCAK_TRUE);
  });

  it('verifySemiPrivate REJECTS (rule ran, but did not return true)', () => {
    const r = verifySemiPrivate(fx.bundle, logicHash);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/outputHash/);
  });

  it('requireTrue:false accepts it (binds WHICH rule ran, not its outcome)', () => {
    expect(verifySemiPrivate(fx.bundle, logicHash, { requireTrue: false }).ok).toBe(true);
  });
});

// Opt-in: regenerate a proof live and re-run acceptance. Needs the SP1 toolchain + the crate.
const manifest = process.env.ZK_JLVM_MANIFEST;
(manifest ? describe : describe.skip)('zk/e2e — live prover (gated by ZK_JLVM_MANIFEST)', () => {
  it(
    'prove → verify accept → tampered reject',
    async () => {
      const prover = new SubprocessProver({ cargoManifestPath: manifest, env: { SP1_PROVER: 'cpu' } });
      const rule = { '>=': [{ var: 'score' }, 700] };
      const bundle = await prover.proveGroth16({ expr: rule, data: { score: 740 } });
      expect(verifySemiPrivate(bundle, exprHash(rule)).ok).toBe(true);
      expect(verifyGroth16Bundle({ ...bundle, proof: tamper(bundle.proof) })).toBe(false);
    },
    30 * 60 * 1000,
  );
});
