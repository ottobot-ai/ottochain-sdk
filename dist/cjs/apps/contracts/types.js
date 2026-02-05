"use strict";
/**
 * Contract Utilities
 *
 * Constants and utilities for the Contract application.
 * Core types are generated from protobuf - see the generated exports.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTRACT_TRANSITIONS = exports.DEFAULT_CONTRACT_CONFIG = void 0;
exports.isTerminalState = isTerminalState;
const contract_pb_js_1 = require("../../generated/ottochain/apps/contracts/v1/contract_pb.js");
// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------
/**
 * Default contract configuration
 */
exports.DEFAULT_CONTRACT_CONFIG = {
    requireBothSignatures: false,
    disputeWindowEpochs: 10,
};
// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each contract state
 */
exports.CONTRACT_TRANSITIONS = {
    [contract_pb_js_1.ContractState.UNSPECIFIED]: [],
    [contract_pb_js_1.ContractState.PROPOSED]: ['accept', 'reject', 'cancel'],
    [contract_pb_js_1.ContractState.ACTIVE]: ['complete', 'dispute'],
    [contract_pb_js_1.ContractState.DISPUTED]: ['resolve_for_completer', 'resolve_for_disputant'],
    [contract_pb_js_1.ContractState.COMPLETED]: [], // Terminal state
    [contract_pb_js_1.ContractState.REJECTED]: [], // Terminal state
    [contract_pb_js_1.ContractState.CANCELLED]: [], // Terminal state
};
/**
 * Check if a contract state is terminal (no further transitions allowed)
 */
function isTerminalState(state) {
    return [
        contract_pb_js_1.ContractState.COMPLETED,
        contract_pb_js_1.ContractState.REJECTED,
        contract_pb_js_1.ContractState.CANCELLED,
    ].includes(state);
}
