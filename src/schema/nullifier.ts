/**
 * THE canonical nullifier-value normalizer — the byte-for-byte mirror of the chain's
 * `NullifierHex.scala` (protocol-nullifier-set.md). A nullifier is the 64-char lowercase hex
 * rendering of a Hash; clients may author it with or without a `0x` prefix and in any case.
 * Every SDK surface that accepts an nf value (the `_consumeNullifier` builder docs, the
 * definition-lint advisory, the `/v1/nullifiers` client route) normalizes through here so the
 * committed `nullifier/<domain>/<nf>` key is byte-identical to the chain's.
 *
 * Normalization: strip one optional leading `0x`/`0X`, lowercase, then require EXACTLY 64
 * chars of `[0-9a-f]`. Anything else is `null` — the caller decides its loud-rejection mode
 * (throw in `MetagraphClient.getNullifier`, advisory diagnostic in `lintFiberApp`; the chain
 * itself rejects at combine).
 */

const HEX_64 = /^[0-9a-f]{64}$/;

/** The normalized 64-hex nullifier, or `null` when the value cannot be a nullifier. */
export function normalizeNullifierHex(raw: string): string | null {
  const stripped = raw.startsWith('0x') || raw.startsWith('0X') ? raw.slice(2) : raw;
  const lowered = stripped.toLowerCase();
  return HEX_64.test(lowered) ? lowered : null;
}
