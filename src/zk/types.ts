/**
 * SP1 zk-jlvm public-values types + decode.
 *
 * The guest commits `abi_encode(JlvmPublicValues{ bytes32 exprHash, bytes32 dataHash,
 * bytes32 outputHash, bool ok })` — four 32-byte words, the bool right-aligned in its word.
 * There is no on-chain `jlvm_pv_decode` opcode: the chain guard parses the same blob with the
 * native JLVM `cat`/`substr` ops. This decode mirrors that for client-side binding/inspection.
 */

/** The decoded zk-jlvm public values: the keccak triple + the ok bit. */
export interface DecodedPublicValues {
  /** keccak256(canonicalize(expr)) — pins WHICH JLVM rule ran (equals the registry logicHash). */
  exprHash: `0x${string}`;
  /** keccak256(canonicalize(data)) — the (private) data context's hash. */
  dataHash: `0x${string}`;
  /** keccak256(canonicalize(output)) — for a guarded "rule == true" proof, equals KECCAK_TRUE. */
  outputHash: `0x${string}`;
  /** Whether the JLVM evaluation succeeded (false ⇒ the guest aborted / errored). */
  ok: boolean;
}

/** A produced SP1-Groth16 bundle from the zk-jlvm prover (`--mode groth16`). */
export interface Groth16Bundle {
  /** `abi_encode(JlvmPublicValues)` as a `0x` hex string. */
  publicValues: `0x${string}`;
  /** SP1 Groth16 proof bytes as a `0x` hex string. */
  proof: `0x${string}`;
  /** The program verification key (`bytes32`) as a `0x` hex string. */
  vkey: `0x${string}`;
}

/**
 * Decode `abi_encode(JlvmPublicValues)`: four 32-byte words `[exprHash | dataHash | outputHash | ok]`.
 * The bool is right-aligned in its word (final byte `0x00`/`0x01`).
 */
export function decodeJlvmPublicValues(pv: `0x${string}`): DecodedPublicValues {
  const b = pv.startsWith('0x') ? pv.slice(2) : pv;
  if (b.length < 4 * 64) {
    throw new Error(`publicValues too short: ${b.length} hex chars (need >= 256)`);
  }
  const word = (i: number): `0x${string}` => `0x${b.slice(i * 64, i * 64 + 64)}`;
  return {
    exprHash: word(0),
    dataHash: word(1),
    outputHash: word(2),
    ok: b.slice(3 * 64 + 62, 3 * 64 + 64) !== '00',
  };
}
