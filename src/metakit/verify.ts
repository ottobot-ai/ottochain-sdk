/**
 * Signature verification — local wrappers for @constellation-network/metagraph-sdk.
 *
 * verify() is wrapped to preserve backward-compatible behavior: the isDataUpdate
 * parameter is always honored, even if the signed object has a `mode` field.
 * (The package's verify() ignores isDataUpdate when `mode` is present.)
 *
 * @packageDocumentation
 */

import {
  verify as _verify,
  verifyHash,
  verifySignature,
} from '@constellation-network/metagraph-sdk';
import type { Signed, VerificationResult } from '@constellation-network/metagraph-sdk';

export { verifyHash, verifySignature };

/**
 * Verify a signed object.
 *
 * The `isDataUpdate` parameter is always respected — the `mode` field on the
 * signed object (if present) is ignored to preserve backward compatibility with
 * callers that explicitly pass `isDataUpdate`.
 *
 * @param signed - Signed object with value and proofs
 * @param isDataUpdate - Whether the value was signed as a DataUpdate
 * @returns VerificationResult with valid/invalid proof lists
 */
export function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): VerificationResult {
  // Strip the mode field so the package's verify() uses the isDataUpdate param instead.
  // This preserves backward compatibility for callers that explicitly specify isDataUpdate.
  const { mode: _mode, ...rest } = signed as Signed<T> & { mode?: string };
  return _verify(rest as Signed<T>, isDataUpdate);
}
