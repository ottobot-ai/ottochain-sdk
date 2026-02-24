/**
 * Contract Utilities
 *
 * Constants and utilities for the Contract application.
 * Core types are generated from protobuf - see the generated exports.
 *
 * @packageDocumentation
 */
import { ContractState } from '../../generated/ottochain/apps/contracts/v1/contract_pb.js';
/**
 * Default contract configuration
 */
export declare const DEFAULT_CONTRACT_CONFIG: {
    readonly requireBothSignatures: false;
    readonly disputeWindowEpochs: 10;
};
/**
 * Valid transitions for each contract state
 */
export declare const CONTRACT_TRANSITIONS: Record<ContractState, readonly string[]>;
/**
 * Check if a contract state is terminal (no further transitions allowed)
 */
export declare function isTerminalState(state: ContractState): boolean;
