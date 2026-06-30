/**
 * `@ottochain/sdk/zk` — the client-side semi-private tier.
 *
 * Public-by-default, private-by-opt-in: a holder proves (off-chain, via SP1 zk-jlvm) that some
 * PRIVATE data satisfies a PUBLIC, pinned JLVM rule, and carries only `{publicValues, proof}` on a
 * signed op. A policy's {@link semiPrivateGuard} re-verifies the proof and binds it to the pinned
 * rule on-chain — the value stays hidden, the predicate stays legible.
 *
 * The ONE canonical invariant tying it together: the prover is fed `canonicalForSigning(expr)` /
 * `canonicalForSigning(data)`, so a proof's `exprHash` word equals {@link exprHash}`(rule)` equals a
 * policy's `logicHash` — see {@link proverPreimage} and docs/design/client-side-private-data.md §3.0.
 */
export { canonicalForSigning, proverPreimage, exprHash, dataHash, KECCAK_TRUE } from './preimage';

export {
  type FrHex,
  R,
  toFr,
  frToHex,
  randomSalt,
  poseidonCommit,
  poseidonCommitN,
  type Commitment,
  openCommitment,
} from './commit';

export { type DecodedPublicValues, type Groth16Bundle, decodeJlvmPublicValues } from './types';

export { type Groth16WitnessMap, type Groth16Witness, groth16Witness, type PmtWitnessMap, pmtWitness } from './witness';

export { type RegisteredRule, ExprRegistry, type Comparator, boundRule, atLeast, atMost } from './registry';

export {
  type SemiPrivateGuardOptions,
  wordOffset,
  semiPrivateGuard,
  type BindingResult,
  verifyGroth16Bundle,
  checkSemiPrivateBinding,
  verifySemiPrivate,
} from './guard';

export {
  type ZkProver,
  type Groth16ProveRequest,
  SubprocessProver,
  type SubprocessProverOptions,
  parseGroth16Stdout,
} from './prover';
