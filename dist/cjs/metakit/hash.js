"use strict";
/**
 * Hashing Utilities
 *
 * SHA-256 and SHA-512 hashing for the Constellation signature protocol.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = hash;
exports.hashBytes = hashBytes;
exports.computeDigest = computeDigest;
exports.hashData = hashData;
const js_sha256_1 = require("js-sha256");
const js_sha512_1 = require("js-sha512");
const binary_js_1 = require("./binary.js");
/**
 * Compute SHA-256 hash of canonical JSON data
 *
 * @param data - Any JSON-serializable object
 * @returns Hash object with hex string and raw bytes
 *
 * @example
 * ```typescript
 * const hashResult = hash({ action: 'test' });
 * console.log(hashResult.value); // 64-char hex string
 * ```
 */
function hash(data) {
    const bytes = (0, binary_js_1.toBytes)(data, false);
    return hashBytes(bytes);
}
/**
 * Compute SHA-256 hash of raw bytes
 *
 * @param bytes - Input bytes
 * @returns Hash object with hex string and raw bytes
 */
function hashBytes(bytes) {
    const hashArray = js_sha256_1.sha256.array(bytes);
    const hashUint8 = new Uint8Array(hashArray);
    const hashHex = js_sha256_1.sha256.hex(bytes);
    return {
        value: hashHex,
        bytes: hashUint8,
    };
}
/**
 * Compute the full signing digest according to Constellation protocol
 *
 * Protocol:
 * 1. Serialize data to binary (with optional DataUpdate prefix)
 * 2. Compute SHA-256 hash
 * 3. Convert hash to hex string
 * 4. Treat hex string as UTF-8 bytes (NOT hex decode)
 * 5. Compute SHA-512 of those bytes
 * 6. Truncate to 32 bytes for secp256k1 signing
 *
 * @param data - Any JSON-serializable object
 * @param isDataUpdate - Whether to apply DataUpdate encoding
 * @returns 32-byte digest ready for ECDSA signing
 */
function computeDigest(data, isDataUpdate = false) {
    // Step 1: Serialize to binary
    const dataBytes = (0, binary_js_1.toBytes)(data, isDataUpdate);
    // Step 2: SHA-256 hash
    const sha256Hash = hashBytes(dataBytes);
    // Step 3-4: Hex string as UTF-8 bytes (critical: NOT hex decode)
    const hexAsUtf8 = new TextEncoder().encode(sha256Hash.value);
    // Step 5: SHA-512
    const sha512Hash = js_sha512_1.sha512.array(hexAsUtf8);
    // Step 6: Truncate to 32 bytes
    return new Uint8Array(sha512Hash.slice(0, 32));
}
/**
 * Compute SHA-256 hash of data with optional DataUpdate encoding
 *
 * @param data - Any JSON-serializable object
 * @param isDataUpdate - Whether to apply DataUpdate encoding
 * @returns Hash object
 */
function hashData(data, isDataUpdate = false) {
    const bytes = (0, binary_js_1.toBytes)(data, isDataUpdate);
    return hashBytes(bytes);
}
