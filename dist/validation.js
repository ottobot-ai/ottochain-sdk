"use strict";
/**
 * Input Validation with Zod Schemas
 *
 * Provides runtime validation for SDK types using Zod.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.safeParse = exports.validateKeyPair = exports.validateAddress = exports.validatePublicKey = exports.validatePrivateKey = exports.validate = exports.CompleteContractRequestSchema = exports.AcceptContractRequestSchema = exports.ProposeContractRequestSchema = exports.ContractTermsSchema = exports.PlatformLinkSchema = exports.AgentIdentityRegistrationSchema = exports.TransferParamsSchema = exports.CurrencyTransactionSchema = exports.CurrencyTransactionValueSchema = exports.TransactionReferenceSchema = exports.SignedSchema = exports.SignatureProofSchema = exports.KeyPairSchema = exports.PublicKeySchema = exports.PrivateKeySchema = exports.DagAddressSchema = void 0;
const zod_1 = require("zod");
const errors_js_1 = require("./errors.js");
// ============================================================================
// Primitive Schemas
// ============================================================================
/**
 * Schema for a hex string of specific length
 */
const hexString = (length) => {
    let schema = zod_1.z.string().regex(/^[0-9a-fA-F]+$/, 'Must be a valid hex string');
    if (length !== undefined) {
        schema = schema.length(length, `Must be exactly ${length} characters`);
    }
    return schema;
};
/**
 * Schema for a DAG address
 */
exports.DagAddressSchema = zod_1.z
    .string()
    .regex(/^DAG[0-9][a-zA-Z0-9]{36}$/, 'Must be a valid DAG address');
// ============================================================================
// Core Type Schemas
// ============================================================================
/**
 * Schema for a private key (64-character hex string)
 */
exports.PrivateKeySchema = hexString(64).describe('Private key in hex format (64 characters)');
/**
 * Schema for a public key (128 or 130 character hex string)
 */
exports.PublicKeySchema = zod_1.z
    .string()
    .regex(/^(04)?[0-9a-fA-F]{128}$/, 'Must be a valid public key (128 or 130 hex chars)')
    .describe('Public key in hex format (with optional 04 prefix)');
/**
 * Schema for a KeyPair
 */
exports.KeyPairSchema = zod_1.z.object({
    /** Private key in hex format */
    privateKey: exports.PrivateKeySchema,
    /** Public key in hex format (uncompressed, with 04 prefix) */
    publicKey: exports.PublicKeySchema,
    /** DAG address derived from the public key */
    address: exports.DagAddressSchema,
});
/**
 * Schema for a SignatureProof
 */
exports.SignatureProofSchema = zod_1.z.object({
    /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
    id: hexString(128),
    /** DER-encoded ECDSA signature in hex format */
    signature: hexString(),
});
/**
 * Schema for a Signed object (generic)
 */
const SignedSchema = (valueSchema) => zod_1.z.object({
    value: valueSchema,
    proofs: zod_1.z.array(exports.SignatureProofSchema).min(1, 'At least one proof is required'),
});
exports.SignedSchema = SignedSchema;
// ============================================================================
// Transaction Schemas
// ============================================================================
/**
 * Schema for TransactionReference
 */
exports.TransactionReferenceSchema = zod_1.z.object({
    ordinal: zod_1.z.number().int().min(0),
    hash: zod_1.z.string().min(1),
});
/**
 * Schema for CurrencyTransactionValue
 */
exports.CurrencyTransactionValueSchema = zod_1.z.object({
    source: exports.DagAddressSchema,
    destination: exports.DagAddressSchema,
    amount: zod_1.z.number().int().positive('Amount must be positive'),
    fee: zod_1.z.number().int().min(0).default(0),
});
/**
 * Schema for CurrencyTransaction
 */
exports.CurrencyTransactionSchema = zod_1.z.object({
    value: exports.CurrencyTransactionValueSchema,
    parent: exports.TransactionReferenceSchema,
});
/**
 * Schema for TransferParams
 */
exports.TransferParamsSchema = zod_1.z.object({
    from: exports.DagAddressSchema,
    to: exports.DagAddressSchema,
    amount: zod_1.z.number().positive('Amount must be positive'),
    fee: zod_1.z.number().min(0).optional().default(0),
});
// ============================================================================
// Identity Schemas
// ============================================================================
/**
 * Schema for AgentIdentity registration
 */
exports.AgentIdentityRegistrationSchema = zod_1.z.object({
    /** Public key in hex format */
    publicKey: exports.PublicKeySchema,
    /** Display name for the agent */
    displayName: zod_1.z.string().min(1).max(64),
    /** Initial reputation (default: 10) */
    reputation: zod_1.z.number().int().min(0).optional().default(10),
});
/**
 * Schema for PlatformLink
 */
exports.PlatformLinkSchema = zod_1.z.object({
    platform: zod_1.z.enum(['DISCORD', 'TELEGRAM', 'TWITTER', 'GITHUB', 'CUSTOM']),
    platformUserId: zod_1.z.string().min(1),
    platformUsername: zod_1.z.string().min(1),
    verified: zod_1.z.boolean().optional().default(false),
});
// ============================================================================
// Contract Schemas
// ============================================================================
/**
 * Schema for contract terms (flexible structure)
 */
exports.ContractTermsSchema = zod_1.z.record(zod_1.z.unknown());
/**
 * Schema for ProposeContractRequest
 */
exports.ProposeContractRequestSchema = zod_1.z.object({
    /** Proposer's DAG address */
    proposer: exports.DagAddressSchema,
    /** Counterparty's DAG address */
    counterparty: exports.DagAddressSchema,
    /** Contract terms */
    terms: exports.ContractTermsSchema,
    /** Human-readable description */
    description: zod_1.z.string().min(1).max(1000),
});
/**
 * Schema for AcceptContractRequest
 */
exports.AcceptContractRequestSchema = zod_1.z.object({
    /** Contract ID to accept */
    contractId: zod_1.z.string().min(1),
    /** Acceptor's DAG address */
    acceptor: exports.DagAddressSchema,
});
/**
 * Schema for CompleteContractRequest
 */
exports.CompleteContractRequestSchema = zod_1.z.object({
    /** Contract ID to complete */
    contractId: zod_1.z.string().min(1),
    /** Completer's DAG address */
    completer: exports.DagAddressSchema,
    /** Proof of completion */
    proof: zod_1.z.string().min(1),
});
// ============================================================================
// Validation Helpers
// ============================================================================
/**
 * Validate data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param fieldName - Optional field name for error context
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const keyPair = validate(KeyPairSchema, inputData, 'keyPair');
 * // keyPair is now typed as ValidatedKeyPair
 * ```
 */
function validate(schema, data, fieldName) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const issues = result.error.issues;
        const firstIssue = issues[0];
        // Build a helpful error message
        const path = firstIssue.path.length > 0 ? firstIssue.path.join('.') : fieldName || 'input';
        const message = `Validation failed for '${path}': ${firstIssue.message}`;
        throw new errors_js_1.ValidationError(message, {
            field: path,
            value: data,
            details: {
                issues: issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            },
        });
    }
    return result.data;
}
exports.validate = validate;
/**
 * Validate a private key
 *
 * @param privateKey - Private key to validate
 * @returns Validated private key
 * @throws {ValidationError} If validation fails
 */
function validatePrivateKey(privateKey) {
    return validate(exports.PrivateKeySchema, privateKey, 'privateKey');
}
exports.validatePrivateKey = validatePrivateKey;
/**
 * Validate a public key
 *
 * @param publicKey - Public key to validate
 * @returns Validated public key
 * @throws {ValidationError} If validation fails
 */
function validatePublicKey(publicKey) {
    return validate(exports.PublicKeySchema, publicKey, 'publicKey');
}
exports.validatePublicKey = validatePublicKey;
/**
 * Validate a DAG address
 *
 * @param address - Address to validate
 * @returns Validated address
 * @throws {ValidationError} If validation fails
 */
function validateAddress(address) {
    return validate(exports.DagAddressSchema, address, 'address');
}
exports.validateAddress = validateAddress;
/**
 * Validate a KeyPair
 *
 * @param keyPair - KeyPair to validate
 * @returns Validated KeyPair
 * @throws {ValidationError} If validation fails
 */
function validateKeyPair(keyPair) {
    return validate(exports.KeyPairSchema, keyPair, 'keyPair');
}
exports.validateKeyPair = validateKeyPair;
/**
 * Safe validation that returns a result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and data or error
 *
 * @example
 * ```typescript
 * const result = safeParse(KeyPairSchema, inputData);
 * if (result.success) {
 *   console.log(result.data.address);
 * } else {
 *   console.log(result.error.message);
 * }
 * ```
 */
function safeParse(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const issues = result.error.issues;
    const firstIssue = issues[0];
    const path = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'input';
    const message = `Validation failed for '${path}': ${firstIssue.message}`;
    return {
        success: false,
        error: new errors_js_1.ValidationError(message, {
            field: path,
            value: data,
            details: {
                issues: issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            },
        }),
    };
}
exports.safeParse = safeParse;
/**
 * Assert that a condition is true, throwing ValidationError if not
 *
 * @param condition - Condition to check
 * @param message - Error message if condition is false
 * @param field - Optional field name for context
 * @throws {ValidationError} If condition is false
 */
function assert(condition, message, field) {
    if (!condition) {
        throw new errors_js_1.ValidationError(message, { field });
    }
}
exports.assert = assert;
