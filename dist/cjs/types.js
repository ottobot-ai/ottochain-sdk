"use strict";
/**
 * OttoChain Type Aliases
 *
 * Semantic type aliases for common primitive types.
 * These match the wire format used by the metagraph's JSON Logic engine.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidFiberId = exports.isValidAddress = void 0;
/**
 * Validate a DAG address format.
 */
function isValidAddress(value) {
    return /^DAG[0-9a-zA-Z]+$/.test(value);
}
exports.isValidAddress = isValidAddress;
/**
 * Validate a UUID format.
 */
function isValidFiberId(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
exports.isValidFiberId = isValidFiberId;
