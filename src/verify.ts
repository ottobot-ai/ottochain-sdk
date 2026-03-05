/**
 * Backward-compatible verify wrapper.
 *
 * The package's verify() prefers the `mode` field embedded in the signed object and ignores
 * the `isDataUpdate` parameter when `mode` is present. This wrapper strips the `mode` field
 * so that the caller's explicit `isDataUpdate` argument is always honored.
 *
 * This preserves backward compatibility for callers that explicitly pass `isDataUpdate`
 * and expect it to take precedence over any embedded `mode` field.
 *
 * @packageDocumentation
 */

import {
  verify as _verify,
} from '@constellation-network/metagraph-sdk';
import type { Signed, VerificationResult } from '@constellation-network/metagraph-sdk';

/**
 * Verify a signed object.
 *
 * The `isDataUpdate` parameter is always respected — the `mode` field on the
 * signed object (if present) is stripped so that `isDataUpdate` is never ignored.
 *
 * @param signed - Signed object with value and proofs
 * @param isDataUpdate - Whether the value was signed as a DataUpdate
 * @returns VerificationResult with valid/invalid proof lists
 */
export function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): VerificationResult {
  // Strip the mode field so the package's verify() uses the isDataUpdate param instead.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mode: _mode, ...rest } = signed as Signed<T> & { mode?: string };
  return _verify(rest as Signed<T>, isDataUpdate);
}
