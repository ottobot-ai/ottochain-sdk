/**
 * The semi-private guard: the JLVM predicate a policy embeds, and its client-side mirror.
 *
 * The guard pins THREE facts about the witness the holder carries, using only opcodes metakit
 * already gas-meters — no new `jlvm_pv_decode`, the public-values blob is parsed with native
 * `substr`/`cat`:
 *   1. `groth16_verify[vkey, witness.publicValues, witness.proof]` — the SP1 proof is valid.
 *   2. the `exprHash` word of the public values == the policy's `logicHash` — the proof ran the
 *      INTENDED rule (the pinned, legible predicate).
 *   3. the `outputHash` word == `keccak256("true")` — that rule evaluated to TRUE on the hidden data.
 *
 * `publicValues` rides as a `0x` + 256-hex-char string (`0x` | exprHash | dataHash | outputHash | ok),
 * so word w begins at char `2 + 64*w` and is 64 chars wide. `cat("0x", substr(pv, off, 64))` lifts a
 * word back to a `0x`-hex value comparable with a `bytes32` literal. These offsets are the on-chain
 * guard's contract; the Scala policy mirrors this exact shape.
 */
import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import { KECCAK_TRUE } from './preimage';
import { decodeJlvmPublicValues, type DecodedPublicValues, type Groth16Bundle } from './types';

const HEX_PREFIX = 2; // "0x"
const WORD_HEX = 64; // 32-byte ABI word as hex chars
/** Char offset of public-values word `w` (0=exprHash, 1=dataHash, 2=outputHash, 3=ok) in the `0x` string. */
export const wordOffset = (w: number): number => HEX_PREFIX + WORD_HEX * w;

/** Lift public-values word `w` back to a `0x`-hex value (`cat("0x", substr(pv, off, 64))`). */
const pvWord = (w: number): Record<string, unknown> => ({
  cat: ['0x', { substr: [{ var: 'witness.publicValues' }, wordOffset(w), WORD_HEX] }],
});

/** Options for {@link semiPrivateGuard} / {@link checkSemiPrivateBinding}. */
export interface SemiPrivateGuardOptions {
  /** Require the rule to have evaluated to `true` (`outputHash == keccak256("true")`). Default true. */
  requireTrue?: boolean;
}

/**
 * Build the JLVM guard a `Governed` morphism / mint policy embeds. `vkey` is the zk-jlvm program
 * verification key (a `bytes32` `0x`-hex literal); `logicHash` is the pinned rule's hash (from
 * {@link ExprRegistry.logicHashOf}). Returns plain JSON — feed it into an ASSET policy's guard/mintPolicy
 * (the asset combiner injects the reserved `witness`). In a fiber TRANSITION there is no `witness` key —
 * the proof rides in the event payload, so read `event.witness.*` instead.
 *
 * REPLAY (audit zk-guards): the proven public values commit only {exprHash, dataHash, outputHash, ok} —
 * nothing situational (no fiber / asset / `$ordinal` / nonce). A valid `{publicValues, proof}` is therefore
 * a reusable bearer token, replayable across any action pinning the same vkey + logicHash. Bind the action
 * INSIDE the proven rule (pin a spender/asset/subject, as `reputationCreditRule` pins `subject`) and/or gate
 * with a one-time nonce ledger until the public values carry action context.
 */
export function semiPrivateGuard(
  vkey: `0x${string}`,
  logicHash: `0x${string}`,
  opts: SemiPrivateGuardOptions = {},
): Record<string, unknown> {
  const { requireTrue = true } = opts;
  const clauses: unknown[] = [
    { groth16_verify: [vkey, { var: 'witness.publicValues' }, { var: 'witness.proof' }] },
    { '==': [pvWord(0), logicHash] },
  ];
  if (requireTrue) {
    clauses.push({ '==': [pvWord(2), KECCAK_TRUE] });
    // ok bit: the final hex pair of word 3 (offset 256) must be "01" — the JLVM run did not error.
    clauses.push({ '==': [{ substr: [{ var: 'witness.publicValues' }, wordOffset(3) + 62, 2] }, '01'] });
  }
  return { and: clauses };
}

/** The outcome of {@link verifyGroth16Bundle} + binding checks: `ok`, with `reasons` when it is not. */
export interface BindingResult {
  ok: boolean;
  /** Empty when `ok`; otherwise one human-readable reason per failed check. */
  reasons: string[];
  decoded: DecodedPublicValues;
}

/**
 * Locally run the SAME `groth16_verify` pairing the chain runs (the verifier opcode, not the prover).
 * Returns `false` — never throws — on an invalid/garbage bundle, mirroring the guard's graceful deny.
 */
export function verifyGroth16Bundle(bundle: Groth16Bundle): boolean {
  try {
    return jsonLogic.apply({ groth16_verify: [bundle.vkey, bundle.publicValues, bundle.proof] }, {}) === true;
  } catch {
    return false;
  }
}

/**
 * Check the binding words WITHOUT the pairing: `exprHash == expectedLogicHash`, `ok` set, and
 * (when `requireTrue`) `outputHash == keccak256("true")`. Pair with {@link verifyGroth16Bundle} for
 * the full client-side mirror of the on-chain guard (see {@link verifySemiPrivate}).
 */
export function checkSemiPrivateBinding(
  bundle: Groth16Bundle,
  expectedLogicHash: `0x${string}`,
  opts: SemiPrivateGuardOptions = {},
): BindingResult {
  const { requireTrue = true } = opts;
  const decoded = decodeJlvmPublicValues(bundle.publicValues);
  const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const reasons: string[] = [];
  if (!eq(decoded.exprHash, expectedLogicHash))
    reasons.push(`exprHash ${decoded.exprHash} != expected logicHash ${expectedLogicHash}`);
  if (!decoded.ok) reasons.push('ok bit is false (guest evaluation errored)');
  if (requireTrue && !eq(decoded.outputHash, KECCAK_TRUE))
    reasons.push(`outputHash ${decoded.outputHash} != keccak256("true") ${KECCAK_TRUE}`);
  return { ok: reasons.length === 0, reasons, decoded };
}

/**
 * The full client-side mirror of the on-chain guard: the proof verifies AND its words bind to the
 * pinned rule (and, by default, to a `true` result). Run this before submitting to fail fast instead
 * of paying for an on-chain rejection.
 */
export function verifySemiPrivate(
  bundle: Groth16Bundle,
  expectedLogicHash: `0x${string}`,
  opts: SemiPrivateGuardOptions = {},
): BindingResult {
  const binding = checkSemiPrivateBinding(bundle, expectedLogicHash, opts);
  if (!verifyGroth16Bundle(bundle)) {
    return {
      ok: false,
      reasons: ['groth16_verify failed (invalid proof for this vkey/publicValues)', ...binding.reasons],
      decoded: binding.decoded,
    };
  }
  return binding;
}
