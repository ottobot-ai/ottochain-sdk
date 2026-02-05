"use strict";
/**
 * Signature Verification
 *
 * Verify ECDSA signatures using secp256k1 curve via dag4js.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = verify;
exports.verifyHash = verifyHash;
exports.verifySignature = verifySignature;
exports.normalizeSignatureToLowS = normalizeSignatureToLowS;
const dag4_1 = require("@stardust-collective/dag4");
const js_sha256_1 = require("js-sha256");
const binary_js_1 = require("./binary.js");
// secp256k1 curve order (n) for signature normalization
const SECP256K1_N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const SECP256K1_HALF_N = SECP256K1_N / 2n;
/**
 * Verify a signed object
 *
 * @param signed - Signed object with value and proofs
 * @param isDataUpdate - Whether the value was signed as a DataUpdate
 * @returns VerificationResult with valid/invalid proof lists
 *
 * @example
 * ```typescript
 * const result = await verify(signedObject);
 * if (result.isValid) {
 *   console.log('All signatures valid');
 * }
 * ```
 */
async function verify(signed, isDataUpdate = false) {
    // Compute the hash that should have been signed
    const bytes = (0, binary_js_1.toBytes)(signed.value, isDataUpdate);
    const hashHex = js_sha256_1.sha256.hex(bytes);
    const validProofs = [];
    const invalidProofs = [];
    for (const proof of signed.proofs) {
        try {
            const isValid = await verifyHash(hashHex, proof.signature, proof.id);
            if (isValid) {
                validProofs.push(proof);
            }
            else {
                invalidProofs.push(proof);
            }
        }
        catch {
            // Verification error = invalid
            invalidProofs.push(proof);
        }
    }
    return {
        isValid: invalidProofs.length === 0 && validProofs.length > 0,
        validProofs,
        invalidProofs,
    };
}
/**
 * Verify a signature against a SHA-256 hash
 *
 * Protocol:
 * 1. Treat hash hex as UTF-8 bytes (NOT hex decode)
 * 2. SHA-512 hash
 * 3. Truncate to 32 bytes (handled internally by dag4)
 * 4. Verify ECDSA signature
 *
 * @param hashHex - SHA-256 hash as 64-character hex string
 * @param signature - DER-encoded signature in hex format
 * @param publicKeyId - Public key in hex (with or without 04 prefix)
 * @returns true if signature is valid
 */
async function verifyHash(hashHex, signature, publicKeyId) {
    try {
        // Normalize public key (add 04 prefix if needed)
        const fullPublicKey = normalizePublicKey(publicKeyId);
        // Normalize signature to low-S form for BIP 62/146 compatibility
        // Some signing implementations produce high-S signatures which are
        // mathematically valid but rejected by strict implementations
        const normalizedSignature = normalizeSignatureToLowS(signature);
        // Use dag4's verify which handles:
        // 1. SHA-512 of hashHex (treating as UTF-8)
        // 2. Internal truncation to 32 bytes
        // 3. ECDSA verification
        return dag4_1.dag4.keyStore.verify(fullPublicKey, hashHex, normalizedSignature);
    }
    catch {
        return false;
    }
}
/**
 * Verify a single signature proof against data
 *
 * @param data - The original data that was signed
 * @param proof - The signature proof to verify
 * @param isDataUpdate - Whether data was signed as DataUpdate
 * @returns true if signature is valid
 */
async function verifySignature(data, proof, isDataUpdate = false) {
    const bytes = (0, binary_js_1.toBytes)(data, isDataUpdate);
    const hashHex = js_sha256_1.sha256.hex(bytes);
    return verifyHash(hashHex, proof.signature, proof.id);
}
/**
 * Normalize public key to full format (with 04 prefix)
 */
function normalizePublicKey(publicKey) {
    // If 128 chars (without 04 prefix), add prefix
    if (publicKey.length === 128) {
        return '04' + publicKey;
    }
    // If 130 chars (with 04 prefix), return as-is
    if (publicKey.length === 130 && publicKey.startsWith('04')) {
        return publicKey;
    }
    // Otherwise return as-is
    return publicKey;
}
/**
 * Normalize a DER-encoded signature to use low-S value.
 *
 * BIP 62/146 requires S values to be in the lower half of the curve order.
 * Some signing implementations produce high-S signatures which are mathematically
 * valid but rejected by strict verifiers. This normalizes high-S to low-S by
 * computing S' = N - S where N is the curve order.
 */
function normalizeSignatureToLowS(signatureHex) {
    const bytes = hexToBytes(signatureHex);
    // Parse DER signature: 0x30 <total_len> 0x02 <r_len> <r> 0x02 <s_len> <s>
    if (bytes[0] !== 0x30) {
        return signatureHex; // Not a valid DER signature
    }
    let offset = 2; // Skip 0x30 and total length
    // Parse R
    if (bytes[offset] !== 0x02) {
        return signatureHex;
    }
    const rLen = bytes[offset + 1];
    const rStart = offset + 2;
    const rEnd = rStart + rLen;
    offset = rEnd;
    // Parse S
    if (bytes[offset] !== 0x02) {
        return signatureHex;
    }
    const sLen = bytes[offset + 1];
    const sStart = offset + 2;
    const sEnd = sStart + sLen;
    // Extract S value
    const sBytes = bytes.slice(sStart, sEnd);
    const s = bytesToBigInt(sBytes);
    // Check if S is high (> N/2)
    if (s <= SECP256K1_HALF_N) {
        return signatureHex; // Already low-S
    }
    // Compute low-S: S' = N - S
    const lowS = SECP256K1_N - s;
    const lowSBytes = bigIntToBytes(lowS);
    // Ensure proper DER encoding (no leading zeros unless needed for sign bit)
    const normalizedSBytes = normalizeDerInteger(lowSBytes);
    // Build new signature
    const rBytes = bytes.slice(rStart, rEnd);
    const normalizedRBytes = normalizeDerInteger(rBytes);
    const newSigContent = new Uint8Array([
        0x02,
        normalizedRBytes.length,
        ...normalizedRBytes,
        0x02,
        normalizedSBytes.length,
        ...normalizedSBytes,
    ]);
    const newSig = new Uint8Array([0x30, newSigContent.length, ...newSigContent]);
    return bytesToHex(newSig);
}
/**
 * Normalize a byte array for DER integer encoding
 */
function normalizeDerInteger(bytes) {
    // Remove leading zeros, but keep one if the high bit is set
    let start = 0;
    while (start < bytes.length - 1 && bytes[start] === 0 && (bytes[start + 1] & 0x80) === 0) {
        start++;
    }
    // Add leading zero if high bit is set (to indicate positive number)
    if (bytes[start] & 0x80) {
        const result = new Uint8Array(bytes.length - start + 1);
        result[0] = 0;
        result.set(bytes.slice(start), 1);
        return result;
    }
    return bytes.slice(start);
}
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
function bytesToBigInt(bytes) {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
    }
    return result;
}
function bigIntToBytes(n) {
    const hex = n.toString(16).padStart(64, '0'); // 32 bytes = 64 hex chars
    return hexToBytes(hex);
}
