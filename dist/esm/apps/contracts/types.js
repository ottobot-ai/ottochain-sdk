/**
 * Contract Utilities
 *
 * Constants and utilities for the Contract application.
 * Core types are generated from protobuf - see the generated exports.
 *
 * @packageDocumentation
 */
import { ContractState } from '../../generated/ottochain/apps/contracts/v1/contract_pb.js';
// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------
/**
 * Default contract configuration
 */
export const DEFAULT_CONTRACT_CONFIG = {
    requireBothSignatures: false,
    disputeWindowEpochs: 10,
};
// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each contract state
 */
export const CONTRACT_TRANSITIONS = {
    [ContractState.UNSPECIFIED]: [],
    [ContractState.PROPOSED]: ['accept', 'reject', 'cancel'],
    [ContractState.ACTIVE]: ['complete', 'dispute'],
    [ContractState.DISPUTED]: ['resolve_for_completer', 'resolve_for_disputant'],
    [ContractState.COMPLETED]: [], // Terminal state
    [ContractState.REJECTED]: [], // Terminal state
    [ContractState.CANCELLED]: [], // Terminal state
};
/**
 * Check if a contract state is terminal (no further transitions allowed)
 */
export function isTerminalState(state) {
    return [
        ContractState.COMPLETED,
        ContractState.REJECTED,
        ContractState.CANCELLED,
    ].includes(state);
}
