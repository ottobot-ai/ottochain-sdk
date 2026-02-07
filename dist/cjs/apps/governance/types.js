"use strict";
/**
 * Governance & DAO Types
 *
 * TypeScript types matching the JSON Logic state machine definitions
 * in ottochain/docs/trust-graph/state-machines/dao/
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isThresholdDAO = exports.isTokenDAO = exports.isMultisigDAO = exports.isSingleOwnerDAO = void 0;
// =============================================================================
// Helpers
// =============================================================================
/**
 * Type guard for SingleOwnerDAO
 */
function isSingleOwnerDAO(state) {
    return state.schema === 'SingleOwnerDAO';
}
exports.isSingleOwnerDAO = isSingleOwnerDAO;
/**
 * Type guard for MultisigDAO
 */
function isMultisigDAO(state) {
    return state.schema === 'MultisigDAO';
}
exports.isMultisigDAO = isMultisigDAO;
/**
 * Type guard for TokenDAO
 */
function isTokenDAO(state) {
    return state.schema === 'TokenDAO';
}
exports.isTokenDAO = isTokenDAO;
/**
 * Type guard for ThresholdDAO
 */
function isThresholdDAO(state) {
    return state.schema === 'ThresholdDAO';
}
exports.isThresholdDAO = isThresholdDAO;
