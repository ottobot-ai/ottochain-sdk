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
export * from '../../generated/ottochain/apps/contracts/v1/contract_pb.js';
export * from './types.js';
/**
 * Contract definition types.
 */
export type ContractDefinitionType = 'Contract' | 'Escrow';
/**
 * Contract state machine definitions mapped by type.
 */
export declare const CONTRACT_DEFINITIONS: Record<ContractDefinitionType, unknown>;
/**
 * Get the Contract state machine definition.
 *
 * @returns The state machine definition JSON for Contract
 */
export declare function getContractDefinition(): unknown;
/**
 * Get the Escrow state machine definition.
 *
 * @returns The state machine definition JSON for Escrow
 */
export declare function getEscrowDefinition(): unknown;
