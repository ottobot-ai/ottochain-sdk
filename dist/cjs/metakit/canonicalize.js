"use strict";
/**
 * RFC 8785 JSON Canonicalization
 *
 * Provides deterministic JSON serialization according to RFC 8785.
 * This ensures identical JSON objects always produce identical strings.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalize = canonicalize;
const canonicalize_1 = __importDefault(require("canonicalize"));
/**
 * Canonicalize JSON data according to RFC 8785
 *
 * Key features:
 * - Object keys sorted by UTF-16BE binary comparison
 * - Numbers serialized in shortest decimal representation
 * - No whitespace
 * - Proper Unicode escaping
 *
 * @param data - Any JSON-serializable object
 * @returns Canonical JSON string
 * @throws Error if data cannot be serialized to JSON
 *
 * @example
 * ```typescript
 * const canonical = canonicalize({ b: 2, a: 1 });
 * // Returns: '{"a":1,"b":2}'
 * ```
 */
function canonicalize(data) {
    const result = (0, canonicalize_1.default)(data);
    if (result === undefined) {
        throw new Error('Failed to canonicalize data: data cannot be serialized to JSON');
    }
    return result;
}
