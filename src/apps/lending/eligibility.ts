/**
 * The eligibility-proof model for the zk-loan: pin a PUBLIC lending rule, build the
 * semi-private origination guard that gates it, and construct the witness the guard reads.
 *
 * The borrower proves in zero-knowledge that their PRIVATE financials satisfy the PUBLIC
 * lending rule — without revealing them. The rule (with its literal bounds) is canonicalized
 * and keccak-hashed into a `logicHash`; the proof commits that same `exprHash`, so binding
 * `exprHash == logicHash` pins exactly WHICH rule was proven. See `src/zk` and
 * `/home/euler/repos/ottochain/docs/proposals/asset-model.md` §8 (ZkVerify-gated morphisms).
 */
import { exprHash, KECCAK_TRUE } from '../../zk/index.js';
import type { Groth16WitnessMap, Groth16Bundle } from '../../zk/index.js';

/** A JSON-Logic expression. */
export type JsonLogicRule = Record<string, unknown>;

/**
 * Parameters for the standard collateral-coverage + credit-score lending rule.
 *
 * The literal bounds are baked INTO the rule expression, so they are part of its logicHash —
 * pinning the rule pins the bounds. The numerator/denominator form expresses the LTV bound
 * `collateralValue * 100 >= loanAmount * collateralRatioPct` without floating-point.
 */
export interface LendingRuleParams {
  /** Required collateralization, as a percent of the loan (e.g. 150 = 150% over-collateralized). */
  collateralRatioPct: number;
  /** PUBLIC loan principal the rule is checked against. */
  loanAmount: number;
  /** Optional minimum credit score floor; omit to gate on collateral coverage only. */
  minCreditScore?: number;
}

/**
 * The PUBLIC lending rule, as a JSON-Logic predicate over the borrower's PRIVATE data context
 * `{ collateralValue, creditScore }`. Evaluates to `true` iff the borrower is eligible:
 *
 *   collateralValue * 100 >= loanAmount * collateralRatioPct   (collateral coverage)
 *   AND creditScore >= minCreditScore                          (if a floor is set)
 *
 * Only the predicate and its literal bounds are public; the data it is evaluated over
 * (`collateralValue`, `creditScore`) is the prover's private witness — its keccak is the
 * proof's `dataHash`, never revealed. This is the rule the zk-jlvm guest runs; its `exprHash`
 * is pinned as the loan's `lendingRuleLogicHash`.
 */
export function lendingRule(params: LendingRuleParams): JsonLogicRule {
  const coverage: JsonLogicRule = {
    '>=': [{ '*': [{ var: 'collateralValue' }, 100] }, params.loanAmount * params.collateralRatioPct],
  };
  if (params.minCreditScore === undefined) {
    return coverage;
  }
  return {
    and: [coverage, { '>=': [{ var: 'creditScore' }, params.minCreditScore] }],
  };
}

/** The pinned public constants a zk-loan create-state carries so its origination guard is closed. */
export interface PinnedLendingRule {
  /** The PUBLIC rule expression (with literal bounds). */
  rule: JsonLogicRule;
  /** keccak256(canonicalize(rule)) — pinned as `lendingRuleLogicHash`; the proof's exprHash must equal it. */
  logicHash: `0x${string}`;
  /** keccak256(canonicalize(true)) — pinned as `keccakTrue`; a "rule == true" proof's outputHash. */
  keccakTrue: `0x${string}`;
  /** The SP1 program verifying key (bytes32, 0x-hex) for the eligibility circuit. */
  vkey: `0x${string}`;
}

/**
 * Pin a lending rule: produce the public rule plus the three constants the loan's origination
 * guard binds against. `vkey` is the verifying key of the SP1 zk-jlvm program that runs the
 * rule (supplied by the lender / deployment).
 */
export function pinLendingRule(params: LendingRuleParams, vkey: `0x${string}`): PinnedLendingRule {
  const rule = lendingRule(params);
  return {
    rule,
    logicHash: exprHash(rule),
    keccakTrue: KECCAK_TRUE,
    vkey,
  };
}

/** The pinned public references the origination guard reads off the loan state. */
export interface OriginationGuardRefs {
  /** State path to the pinned vkey (default `state.lendingRuleVKey`). */
  vkeyVar?: string;
  /** State path to the pinned logicHash (default `state.lendingRuleLogicHash`). */
  logicHashVar?: string;
  /** State path to the pinned keccakTrue (default `state.keccakTrue`). */
  keccakTrueVar?: string;
}

/**
 * Build the semi-private ORIGINATION guard expression.
 *
 * It verifies the SP1-Groth16 eligibility proof AND binds its committed public values to the
 * pinned public rule. `publicValues = abi_encode(JlvmPublicValues{exprHash|dataHash|outputHash|ok})`
 * is opaque to `groth16_verify`; the guard slices the `0x`-hex form with native JLVM `substr`
 * (start, len) and re-`cat`s the `0x` prefix — there is no `jlvm_pv_decode` opcode. Clauses:
 *
 *   1. `groth16_verify(vkey, witness.publicValues, witness.proof)`  — the proof is valid
 *   2. `exprHash   == logicHash`   (word 0, hex chars [2,66))         — it proved THE pinned rule
 *   3. `outputHash == keccakTrue`  (word 2, hex chars [130,194))      — the rule evaluated to true
 *   4. `ok == "01"`                (word 3 final pair, [256,258))      — the JLVM run did not error
 *
 * This is the closed boolean an asset `mintPolicy` or a fiber-transition guard wraps. The
 * lending state machine ANDs clause 0 (`agent == lender`) in front of it; the debt asset
 * policy uses it directly as the proof-gated `mintPolicy`.
 */
export function buildOriginationGuard(refs: OriginationGuardRefs = {}): JsonLogicRule {
  const vkeyVar = refs.vkeyVar ?? 'state.lendingRuleVKey';
  const logicHashVar = refs.logicHashVar ?? 'state.lendingRuleLogicHash';
  const keccakTrueVar = refs.keccakTrueVar ?? 'state.keccakTrue';
  return {
    and: [
      {
        groth16_verify: [{ var: vkeyVar }, { var: 'witness.publicValues' }, { var: 'witness.proof' }],
      },
      {
        '===': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 2, 64] }] }, { var: logicHashVar }],
      },
      {
        '===': [{ cat: ['0x', { substr: [{ var: 'witness.publicValues' }, 130, 64] }] }, { var: keccakTrueVar }],
      },
      {
        '===': [{ substr: [{ var: 'witness.publicValues' }, 256, 2] }, '01'],
      },
    ],
  };
}

/**
 * Construct the eligibility-proof witness the origination guard reads. The `{publicValues,
 * proof}` come from the SP1 zk-jlvm prover (`--mode groth16`) run over the public rule and the
 * borrower's PRIVATE data context. Both are lowercase `0x`-hex; they are exposed to the guard
 * under the reserved `witness` key (on the loan `originate` event payload, or on a proof-gated
 * `MintAsset`).
 */
export function buildEligibilityWitness(bundle: Pick<Groth16Bundle, 'publicValues' | 'proof'>): Groth16WitnessMap {
  return {
    publicValues: bundle.publicValues,
    proof: bundle.proof,
  };
}
