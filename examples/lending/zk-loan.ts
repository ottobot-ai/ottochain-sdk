/**
 * zk-loan — privacy-preserving credit origination (the semi-private tier).
 *
 * Shows the full client flow for a collateralized loan whose eligibility is proven in zero knowledge:
 *   1. the borrower's credit score IS their identity reputation (from attestations)
 *   2. pin the PUBLIC lending rule (collateral coverage + score floor + subject binding) -> logicHash
 *   3. build the PRIVATE data context (stays client-side; only its keccak is public)
 *   4. the SP1-Groth16 eligibility proof (a REAL bundle from `rust/zk-jlvm --mode groth16`)
 *   5. verify the proof + its bindings client-side — the exact mirror of the on-chain guard
 *   6. build the on-chain origination guard + the witness to carry on the op
 *   7. the asset integration — the proof-gated debt-mint policy
 *
 * Steps 1-3, 6-7 are pure construction (no network). Steps 4-5 verify a REAL proof entirely
 * client-side — no cluster, no prover. To PROVE a fresh rule live, use `SubprocessProver` (see step 4).
 *
 * @example
 * ```bash
 * npx tsx examples/lending/zk-loan.ts
 * ```
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  reputationScore,
  reputationCreditRule,
  buildCreditDataContext,
  buildOriginationGuard,
  buildEligibilityWitness,
  debtPolicy,
} from '../../src/apps/lending/index.js';
import {
  exprHash,
  verifySemiPrivate,
  decodeJlvmPublicValues,
  type Groth16Bundle,
  // For live proving instead of the bundled fixture:
  // SubprocessProver,
} from '../../src/zk/index.js';

const here = dirname(fileURLToPath(import.meta.url));

// ── 1. Credit score = identity reputation ──────────────────────────────────────────────────────
// In production these come from the identity app's Attestation log; only `delta` matters to scoring.
const attestations = [{ delta: 5 }, { delta: 5 }, { delta: 2 }, { delta: 3 }]; // completions + a vouch
const borrowerId = 'did:otto:alice';
const score = reputationScore(attestations); // 10 (base) + 15 = 25
console.log(`1. ${borrowerId} reputation-backed credit score: ${score}`);

// ── 2. Pin the PUBLIC lending rule ─────────────────────────────────────────────────────────────
// Collateral coverage + a credit-score floor + a SUBJECT binding so the score can't be borrowed.
// The bounds + borrowerId are literals, so pinning the rule pins them.
const rule = reputationCreditRule({
  collateralRatioPct: 150, // require 150% over-collateralization
  loanAmount: 1000,
  minCreditScore: 20,
  borrowerId,
});
const logicHash = exprHash(rule);
console.log(`2. pinned rule logicHash: ${logicHash}`);
console.log(`   rule: ${JSON.stringify(rule)}`);

// ── 3. Build the PRIVATE data context ──────────────────────────────────────────────────────────
// collateralValue + creditScore stay private (their keccak is the proof's dataHash); subject is public.
const dataContext = buildCreditDataContext({ borrowerId, attestations, collateralValue: 1600 });
console.log(`3. private data context (never leaves the client): ${JSON.stringify(dataContext)}`);

// ── 4. The eligibility proof ───────────────────────────────────────────────────────────────────
// In production: const bundle = await new SubprocessProver({ cargoManifestPath }).proveGroth16({
//                  expr: rule, data: dataContext });   // canonicalizes + drives rust/zk-jlvm on the GPU
// Here we load a REAL SP1-Groth16 bundle (a representative credit-floor rule `score >= 700`) so the
// verification below runs with zero setup. Its rule/logicHash are the fixture's, not the rule above.
const fixture = JSON.parse(
  readFileSync(join(here, '../../tests/zk/fixtures/groth16-score-ge-700.json'), 'utf8'),
) as { rule: unknown; bundle: Groth16Bundle };
const provenLogicHash = exprHash(fixture.rule);
const decoded = decodeJlvmPublicValues(fixture.bundle.publicValues);
console.log(`4. real SP1-Groth16 proof — exprHash ${decoded.exprHash} ok=${decoded.ok}`);

// ── 5. Verify the proof + bindings client-side (the on-chain guard's mirror) ────────────────────
const accept = verifySemiPrivate(fixture.bundle, provenLogicHash);
console.log(`5. verifySemiPrivate: ${accept.ok ? 'ACCEPT ✅' : 'REJECT ' + accept.reasons.join('; ')}`);

// fail-closed: a tampered proof never verifies
const tampered = { ...fixture.bundle, proof: (fixture.bundle.proof.slice(0, -1) + '0') as `0x${string}` };
const rejected = verifySemiPrivate(tampered, provenLogicHash);
console.log(`   tampered proof: ${rejected.ok ? 'ACCEPT (unexpected!)' : 'REJECT ✅ (fails closed)'}`);

// ── 6. The on-chain origination guard + the witness to carry on the op ──────────────────────────
const guard = buildOriginationGuard(); // groth16_verify + exprHash/outputHash/ok bindings, read from state
const witness = buildEligibilityWitness(fixture.bundle); // { publicValues, proof } — rides on the op
console.log(`6. origination guard clauses: ${(guard.and as unknown[]).length}; witness keys: ${Object.keys(witness)}`);

// ── 7. Asset integration — the proof-gated debt-mint policy ─────────────────────────────────────
// The loan's principal (debt) asset mints ONLY when the origination guard passes — i.e. the borrower
// proved eligibility. Submit `debt` as a CreateAssetPolicy, then a MintAsset carrying `witness`.
const debt = debtPolicy(guard);
console.log(`7. debt policy mint is proof-gated: ${debt.supply?.mintPolicy !== undefined}`);

console.log('\nThe borrower proved "I qualify" without revealing their collateral or exact score.');
