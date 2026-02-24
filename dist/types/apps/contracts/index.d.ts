/**
 * Contracts Application
 *
 * Types and utilities for smart contracts on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   ContractState,
 *   Contract,
 *   getContractDefinition,
 *   getEscrowDefinition
 * } from '@ottochain/sdk/apps/contracts';
 *
 * const contractDef = getContractDefinition();
 * ```
 *
 * @packageDocumentation
 */
export { ContractState, Contract, ProposeContractRequest, AcceptContractRequest, CompleteContractRequest, RejectContractRequest, DisputeContractRequest, ContractDefinition, contractStateFromJSON, contractStateToJSON, } from '../../generated/ottochain/apps/contracts/v1/contract.js';
export type ContractDefinitionType = 'Contract' | 'Escrow';
export declare const CONTRACT_DEFINITIONS: Record<ContractDefinitionType, unknown>;
/**
 * Get the contract state machine definition.
 */
export declare function getContractDefinition(): unknown;
/**
 * Get the escrow state machine definition.
 */
export declare function getEscrowDefinition(): unknown;
