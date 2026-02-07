/**
 * Governance & DAO Types
 *
 * TypeScript types matching the JSON Logic state machine definitions
 * in ottochain/docs/trust-graph/state-machines/dao/
 *
 * @packageDocumentation
 */
// =============================================================================
// Helpers
// =============================================================================
/**
 * Type guard for SingleOwnerDAO
 */
export function isSingleOwnerDAO(state) {
    return state.schema === 'SingleOwnerDAO';
}
/**
 * Type guard for MultisigDAO
 */
export function isMultisigDAO(state) {
    return state.schema === 'MultisigDAO';
}
/**
 * Type guard for TokenDAO
 */
export function isTokenDAO(state) {
    return state.schema === 'TokenDAO';
}
/**
 * Type guard for ThresholdDAO
 */
export function isThresholdDAO(state) {
    return state.schema === 'ThresholdDAO';
}
