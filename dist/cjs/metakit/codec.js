"use strict";
/**
 * Codec Utilities
 *
 * Encoding/decoding utilities for the Constellation signature protocol.
 * Re-exports from binary.ts for backwards compatibility and provides additional utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeDataUpdate = exports.CONSTELLATION_PREFIX = exports.encodeDataUpdate = exports.toBytes = void 0;
var binary_js_1 = require("./binary.js");
Object.defineProperty(exports, "toBytes", { enumerable: true, get: function () { return binary_js_1.toBytes; } });
Object.defineProperty(exports, "encodeDataUpdate", { enumerable: true, get: function () { return binary_js_1.encodeDataUpdate; } });
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "CONSTELLATION_PREFIX", { enumerable: true, get: function () { return types_js_1.CONSTELLATION_PREFIX; } });
/**
 * Decode a DataUpdate encoded message back to its original JSON
 *
 * @param bytes - DataUpdate encoded bytes
 * @returns Decoded JSON object
 * @throws Error if bytes are not valid DataUpdate encoding
 */
function decodeDataUpdate(bytes) {
    const text = new TextDecoder().decode(bytes);
    // Validate prefix
    if (!text.startsWith('\x19Constellation Signed Data:\n')) {
        throw new Error('Invalid DataUpdate encoding: missing Constellation prefix');
    }
    // Parse the format: \x19Constellation Signed Data:\n{length}\n{base64}
    const withoutPrefix = text.slice('\x19Constellation Signed Data:\n'.length);
    const newlineIndex = withoutPrefix.indexOf('\n');
    if (newlineIndex === -1) {
        throw new Error('Invalid DataUpdate encoding: missing length delimiter');
    }
    const lengthStr = withoutPrefix.slice(0, newlineIndex);
    const base64Data = withoutPrefix.slice(newlineIndex + 1);
    const expectedLength = parseInt(lengthStr, 10);
    if (isNaN(expectedLength) || base64Data.length !== expectedLength) {
        throw new Error('Invalid DataUpdate encoding: length mismatch');
    }
    // Decode base64 to UTF-8 JSON
    const jsonBytes = Buffer.from(base64Data, 'base64');
    const jsonString = new TextDecoder().decode(jsonBytes);
    return JSON.parse(jsonString);
}
exports.decodeDataUpdate = decodeDataUpdate;
