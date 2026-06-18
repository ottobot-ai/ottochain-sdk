/**
 * The ONE canonical path for the semi-private tier.
 *
 * metakit-sdk 1.8.x `canonicalize` = `serializeJcs(dropNullFields)` — it drops null object-fields
 * before RFC 8785 (server-aligned), so it is the EXACT byte string the chain signs over. Feeding
 * the zk-jlvm prover this same string makes the proof's keccak preimage equal the signature
 * preimage — the determinism binding (see docs/design/client-side-private-data.md §3.0).
 *
 * Note the two hashes differ by design: signing is sha256 over the canonical bytes (+ Constellation
 * prefix), the zk-jlvm guest is keccak256 over the canonical bytes — they bind the SAME canonical
 * string, which is the load-bearing invariant.
 */
import { canonicalize } from '@constellation-network/metagraph-sdk';
import { keccak_256 } from '@noble/hashes/sha3.js';

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/** The single canonical string both the signer and the prover-feed share (JCS ∘ dropNullFields). */
export function canonicalForSigning(x: unknown): string {
  return canonicalize(x);
}

/** keccak256 of the canonical bytes — the value the zk-jlvm guest commits as exprHash / dataHash. */
export function proverPreimage(x: unknown): `0x${string}` {
  return `0x${toHex(keccak_256(utf8(canonicalForSigning(x))))}`;
}

/** exprHash of a published JLVM rule (canonicalized + keccak'd). Equals the chain's `logicHash`. */
export const exprHash = (rule: unknown): `0x${string}` => proverPreimage(rule);

/** dataHash of a private data context — kept private; only its hash is public. */
export const dataHash = (data: unknown): `0x${string}` => proverPreimage(data);

/** `keccak256(canonicalize(true))` — the `outputHash` a guard binds for a "rule returned true" proof. */
export const KECCAK_TRUE: `0x${string}` = proverPreimage(true);
