/**
 * Backward-compatible verify wrapper.
 *
 * The package embeds `mode: "standard"|"dataUpdate"` in signed objects and
 * its verify() ignores the `isDataUpdate` parameter when `mode` is present.
 * This wrapper strips `mode` so callers' explicit `isDataUpdate` always wins.
 */
import type { Signed, VerificationResult } from '@constellation-network/metagraph-sdk';
export declare function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): VerificationResult;
