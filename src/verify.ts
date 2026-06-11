/**
 * Backward-compatible verify wrapper.
 *
 * The package embeds `mode: "standard"|"dataUpdate"` in signed objects and
 * its verify() ignores the `isDataUpdate` parameter when `mode` is present.
 * This wrapper strips `mode` so callers' explicit `isDataUpdate` always wins.
 *
 * In dataUpdate mode, verification happens over the null-dropped canonical
 * bytes (drop null object fields, preserve array nulls, then RFC 8785) —
 * mirroring the SDK's dataUpdate signers and metakit's content-hash rule.
 */

import { verify as _verify } from '@constellation-network/metagraph-sdk';
import type { Signed, VerificationResult } from '@constellation-network/metagraph-sdk';
import { dropNulls } from './ottochain/drop-nulls.js';

export function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): VerificationResult {
  const { mode, ...rest } = signed as Signed<T> & { mode?: string };
  const isDU = isDataUpdate ?? mode === 'dataUpdate';
  const target = isDU ? { ...rest, value: dropNulls(signed.value) } : rest;
  return _verify(target as Signed<T>, isDU);
}
