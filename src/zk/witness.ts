/**
 * Witness shapers: turn a produced proof bundle (or a Merkle inclusion path) into the exact
 * `JsonLogicValue` map a holder carries on a signed op's `witness` field. The combiner injects that
 * map under the `witness` context key, and the policy guard reads `witness.publicValues` /
 * `witness.proof` (groth16) or `witness.leaf` / `witness.index` / `witness.siblings` (pmt) — the
 * shapes are fixed by metakit's guard opcodes (see ottochain ZkGatedMorphismSuite).
 */
import type { FrHex } from './commit';
import { decodeJlvmPublicValues, type DecodedPublicValues, type Groth16Bundle } from './types';

/** The on-op map a `groth16_verify` guard reads. The vkey is NOT here — it is a literal in the guard. */
export interface Groth16WitnessMap {
  /** `abi_encode(JlvmPublicValues)` as `0x` hex — the guard's `witness.publicValues`. */
  publicValues: `0x${string}`;
  /** SP1-Groth16 proof bytes as `0x` hex — the guard's `witness.proof`. */
  proof: `0x${string}`;
}

/** A groth16 witness ready to attach to an op, plus its decoded public values for client binding. */
export interface Groth16Witness {
  /** Attach this to the op's `witness` field (it is a plain `JsonLogicValue` map). */
  witness: Groth16WitnessMap;
  /** The decoded `{exprHash, dataHash, outputHash, ok}` — inspect/bind BEFORE submitting. */
  decoded: DecodedPublicValues;
}

/**
 * Shape a produced {@link Groth16Bundle} into the on-op witness map (`{publicValues, proof}`) and
 * surface its decoded public values. The vkey rides in the guard, not the witness, so it is dropped.
 */
export function groth16Witness(bundle: Groth16Bundle): Groth16Witness {
  return {
    witness: { publicValues: bundle.publicValues, proof: bundle.proof },
    decoded: decodeJlvmPublicValues(bundle.publicValues),
  };
}

/**
 * The on-op map a `pmt_verify` guard reads. `siblings` is the authentication path in the order the
 * `pmt_verify` opcode folds it (ROOT-FIRST / top-down, as produced by metakit's PoseidonMerkleTree);
 * `index` is the leaf position. Pass values straight through from the tree builder — do not reorder.
 */
export interface PmtWitnessMap {
  leaf: FrHex;
  index: number;
  siblings: FrHex[];
}

/** Shape a Poseidon-Merkle inclusion path into the on-op `pmt_verify` witness map. */
export function pmtWitness(leaf: FrHex, index: number, siblings: FrHex[]): PmtWitnessMap {
  return { leaf, index, siblings };
}
