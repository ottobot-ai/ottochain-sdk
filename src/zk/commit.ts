/**
 * Poseidon commitments over BN254 Fr, computed through the JLVM `poseidon` opcode — the SAME
 * byte-for-byte implementation the chain and the Rust/Scala circuits use. We deliberately route
 * through `jsonLogic.apply` rather than reimplementing Poseidon: the opcode locks the field order,
 * the circomlib round constants, and the `0x` 32-byte big-endian Fr encoding every crypto opcode
 * expects (hard acceptance vector: `poseidon([1,2]) == 0x115cc0f5…189a`).
 *
 * (The standalone `poseidonHash`/`encodeFr` functions exist inside `-jlvm` but are NOT part of its
 * public export surface — only the VM opcodes are — so the opcode path is also the only stable one.)
 */
import { jsonLogic } from '@constellation-network/metagraph-sdk-jlvm';
import { randomBytes } from 'node:crypto';

/** Lowercase `0x` 32-byte big-endian hex — the JLVM-opcode Fr encoding. */
export type FrHex = `0x${string}`;

/**
 * BN254 (alt_bn128) scalar field modulus R. A public field constant (not a secret / not Poseidon
 * itself); the `poseidon` opcode re-validates canonicity, so this only drives reduction + sampling.
 */
export const R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** Reduce an arbitrary bigint into a canonical BN254 Fr element `[0, R)`. */
export const toFr = (x: bigint): bigint => ((x % R) + R) % R;

/** Encode a field element as the lowercase `0x` 32-byte big-endian hex the crypto opcodes expect. */
export const frToHex = (x: bigint): FrHex => `0x${toFr(x).toString(16).padStart(64, '0')}`;

const bytesToBig = (b: Uint8Array): bigint => b.reduce((a, x) => (a << 8n) | BigInt(x), 0n);

/** A fresh random salt as a canonical Fr (rejection-sampled to avoid modulo bias near R). */
export function randomSalt(): bigint {
  for (;;) {
    const v = bytesToBig(randomBytes(32));
    if (v < R) return v;
  }
}

/** `cm = Poseidon([...fields, salt])` via the VM's own opcode. Returns the `0x` 32-byte commitment. */
export function poseidonCommitN(fields: bigint[], saltFr: bigint): FrHex {
  const inputs = [...fields.map(frToHex), frToHex(saltFr)];
  // The bundled poseidon supports width t ≤ 5 (≤ 4 inputs incl. the salt); the opcode throws past it.
  return jsonLogic.apply({ poseidon: inputs }, {}) as FrHex;
}

/** `cm = Poseidon([fieldFr, saltFr])` — the commitment for one value field (a bid, a score). */
export function poseidonCommit(fieldFr: bigint, saltFr: bigint): FrHex {
  return poseidonCommitN([fieldFr], saltFr);
}

/** A client-held commitment + its opening. The opening is SECRET; only `cm` is published. */
export interface Commitment {
  /** The 32-byte commitment published on-chain. */
  cm: FrHex;
  /** The committed field values (client-held). */
  fields: bigint[];
  /** The blinding salt (client-held). */
  salt: bigint;
}

/** Commit `fields` under a fresh (or supplied) salt; returns the commitment + opening. */
export function openCommitment(fields: bigint[], salt: bigint = randomSalt()): Commitment {
  return { cm: poseidonCommitN(fields, salt), fields, salt };
}
