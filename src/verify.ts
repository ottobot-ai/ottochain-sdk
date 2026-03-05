/**
 * Backward-compatible verify wrapper.
 *
 * The package embeds `mode: "standard"|"dataUpdate"` in signed objects and
 * its verify() ignores the `isDataUpdate` parameter when `mode` is present.
 * This wrapper strips `mode` so callers' explicit `isDataUpdate` always wins.
 */

import { verify as _verify } from '@constellation-network/metagraph-sdk';
import type { Signed, VerificationResult } from '@constellation-network/metagraph-sdk';

export function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): VerificationResult {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mode, ...rest } = signed as Signed<T> & { mode?: string };
  return _verify(rest as Signed<T>, isDataUpdate);
}
