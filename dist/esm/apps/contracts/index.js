/**
 * Contracts Application
 *
 * Types and utilities for the Contract system on OttoChain.
 * Contracts build on Identity - completions credit agent reputation.
 *
 * @example
 * ```typescript
 * import {
 *   ContractState,
 *   ContractSchema,
 *   getContractDefinition,
 *   getEscrowDefinition
 * } from '@ottochain/sdk/apps/contracts';
 * import { create } from '@bufbuild/protobuf';
 *
 * // Get state machine definitions
 * const contractDef = getContractDefinition();
 * const escrowDef = getEscrowDefinition();
 *
 * const contract = create(ContractSchema, {
 *   id: 'fiber-123',
 *   contractId: 'contract-001',
 *   state: ContractState.PROPOSED,
 * });
 * ```
 *
 * @packageDocumentation
 */
// Re-export generated protobuf types
export * from '../../generated/ottochain/apps/contracts/v1/contract_pb.js';
// Re-export convenience types and constants
export * from './types.js';
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
import contractDef from './state-machines/contract.json';
import escrowDef from './state-machines/escrow.json';
/**
 * Contract state machine definitions mapped by type.
 */
export const CONTRACT_DEFINITIONS = {
    Contract: contractDef,
    Escrow: escrowDef,
};
/**
 * Get the Contract state machine definition.
 *
 * @returns The state machine definition JSON for Contract
 */
export function getContractDefinition() {
    return contractDef;
}
/**
 * Get the Escrow state machine definition.
 *
 * @returns The state machine definition JSON for Escrow
 */
export function getEscrowDefinition() {
    return escrowDef;
}
