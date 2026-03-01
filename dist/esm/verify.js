/**
 * Backward-compatible verify wrapper.
 *
 * The package embeds `mode: "standard"|"dataUpdate"` in signed objects and
 * its verify() ignores the `isDataUpdate` parameter when `mode` is present.
 * This wrapper strips `mode` so callers' explicit `isDataUpdate` always wins.
 */
import { verify as _verify } from '@constellation-network/metagraph-sdk';
export function verify(signed, isDataUpdate) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mode, ...rest } = signed;
    return _verify(rest, isDataUpdate);
}
