/**
 * Contracts Application
 *
 * Types and utilities for the Contract system on OttoChain.
 *
 * @example
 * ```typescript
 * import { ContractState, ContractSchema } from '@ottochain/sdk/apps/contracts';
 * import { create } from '@bufbuild/protobuf';
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
