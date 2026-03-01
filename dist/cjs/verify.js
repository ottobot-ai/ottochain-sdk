"use strict";
/**
 * Backward-compatible verify wrapper.
 *
 * The package embeds `mode: "standard"|"dataUpdate"` in signed objects and
 * its verify() ignores the `isDataUpdate` parameter when `mode` is present.
 * This wrapper strips `mode` so callers' explicit `isDataUpdate` always wins.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const metagraph_sdk_1 = require("@constellation-network/metagraph-sdk");
function verify(signed, isDataUpdate) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mode, ...rest } = signed;
    return (0, metagraph_sdk_1.verify)(rest, isDataUpdate);
}
exports.verify = verify;
