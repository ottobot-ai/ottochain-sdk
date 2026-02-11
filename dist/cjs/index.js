"use strict";
/**
 * Ottochain SDK
 *
 * Unified SDK combining metakit framework operations with ottochain domain types.
 *
 * Structure:
 * - `metakit` — Signing, encoding, hashing, and network clients for Constellation metagraphs
 * - `generated` — Protobuf-generated types (source of truth)
 * - `apps/identity` — Agent Identity application types
 * - `apps/contracts` — Contract application types
 * - `errors` — Custom error classes for structured error handling
 * - `validation` — Input validation with Zod schemas
 *
 * @packageDocumentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.safeParse = exports.validateKeyPair = exports.validateAddress = exports.validatePublicKey = exports.validatePrivateKey = exports.validate = exports.CompleteContractRequestSchema = exports.AcceptContractRequestSchema = exports.ProposeContractRequestSchema = exports.ContractTermsSchema = exports.PlatformLinkSchema = exports.AgentIdentityRegistrationSchema = exports.TransferParamsSchema = exports.CurrencyTransactionSchema = exports.CurrencyTransactionValueSchema = exports.TransactionReferenceSchema = exports.SignedSchema = exports.SignatureProofSchema = exports.KeyPairSchema = exports.PublicKeySchema = exports.PrivateKeySchema = exports.DagAddressSchema = exports.wrapError = exports.isErrorCode = exports.ErrorCode = exports.TransactionError = exports.SigningError = exports.ValidationError = exports.NetworkError = exports.OttoChainError = void 0;
// Type aliases for semantic clarity (matches wire format)
__exportStar(require("./types.js"), exports);
// Metakit utilities (signing, hashing, HTTP client)
__exportStar(require("./metakit/index.js"), exports);
// Generated protobuf types (canonical definitions)
__exportStar(require("./generated/index.js"), exports);
// Custom error classes
var errors_js_1 = require("./errors.js");
Object.defineProperty(exports, "OttoChainError", { enumerable: true, get: function () { return errors_js_1.OttoChainError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return errors_js_1.NetworkError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_js_1.ValidationError; } });
Object.defineProperty(exports, "SigningError", { enumerable: true, get: function () { return errors_js_1.SigningError; } });
Object.defineProperty(exports, "TransactionError", { enumerable: true, get: function () { return errors_js_1.TransactionError; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return errors_js_1.ErrorCode; } });
Object.defineProperty(exports, "isErrorCode", { enumerable: true, get: function () { return errors_js_1.isErrorCode; } });
Object.defineProperty(exports, "wrapError", { enumerable: true, get: function () { return errors_js_1.wrapError; } });
// Validation schemas and helpers
var validation_js_1 = require("./validation.js");
// Schemas
Object.defineProperty(exports, "DagAddressSchema", { enumerable: true, get: function () { return validation_js_1.DagAddressSchema; } });
Object.defineProperty(exports, "PrivateKeySchema", { enumerable: true, get: function () { return validation_js_1.PrivateKeySchema; } });
Object.defineProperty(exports, "PublicKeySchema", { enumerable: true, get: function () { return validation_js_1.PublicKeySchema; } });
Object.defineProperty(exports, "KeyPairSchema", { enumerable: true, get: function () { return validation_js_1.KeyPairSchema; } });
Object.defineProperty(exports, "SignatureProofSchema", { enumerable: true, get: function () { return validation_js_1.SignatureProofSchema; } });
Object.defineProperty(exports, "SignedSchema", { enumerable: true, get: function () { return validation_js_1.SignedSchema; } });
Object.defineProperty(exports, "TransactionReferenceSchema", { enumerable: true, get: function () { return validation_js_1.TransactionReferenceSchema; } });
Object.defineProperty(exports, "CurrencyTransactionValueSchema", { enumerable: true, get: function () { return validation_js_1.CurrencyTransactionValueSchema; } });
Object.defineProperty(exports, "CurrencyTransactionSchema", { enumerable: true, get: function () { return validation_js_1.CurrencyTransactionSchema; } });
Object.defineProperty(exports, "TransferParamsSchema", { enumerable: true, get: function () { return validation_js_1.TransferParamsSchema; } });
Object.defineProperty(exports, "AgentIdentityRegistrationSchema", { enumerable: true, get: function () { return validation_js_1.AgentIdentityRegistrationSchema; } });
Object.defineProperty(exports, "PlatformLinkSchema", { enumerable: true, get: function () { return validation_js_1.PlatformLinkSchema; } });
Object.defineProperty(exports, "ContractTermsSchema", { enumerable: true, get: function () { return validation_js_1.ContractTermsSchema; } });
Object.defineProperty(exports, "ProposeContractRequestSchema", { enumerable: true, get: function () { return validation_js_1.ProposeContractRequestSchema; } });
Object.defineProperty(exports, "AcceptContractRequestSchema", { enumerable: true, get: function () { return validation_js_1.AcceptContractRequestSchema; } });
Object.defineProperty(exports, "CompleteContractRequestSchema", { enumerable: true, get: function () { return validation_js_1.CompleteContractRequestSchema; } });
// Helpers
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validation_js_1.validate; } });
Object.defineProperty(exports, "validatePrivateKey", { enumerable: true, get: function () { return validation_js_1.validatePrivateKey; } });
Object.defineProperty(exports, "validatePublicKey", { enumerable: true, get: function () { return validation_js_1.validatePublicKey; } });
Object.defineProperty(exports, "validateAddress", { enumerable: true, get: function () { return validation_js_1.validateAddress; } });
Object.defineProperty(exports, "validateKeyPair", { enumerable: true, get: function () { return validation_js_1.validateKeyPair; } });
Object.defineProperty(exports, "safeParse", { enumerable: true, get: function () { return validation_js_1.safeParse; } });
Object.defineProperty(exports, "assert", { enumerable: true, get: function () { return validation_js_1.assert; } });
// Error classes
__exportStar(require("./errors.js"), exports);
// Validation schemas and helpers
__exportStar(require("./validation.js"), exports);
// Delegation utilities and convenience methods
__exportStar(require("./delegation.js"), exports);
