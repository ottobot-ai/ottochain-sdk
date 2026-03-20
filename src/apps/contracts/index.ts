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

// Re-export generated protobuf types (source of truth)
export {
  ContractState,
  Contract,
  ProposeContractRequest,
  AcceptContractRequest,
  CompleteContractRequest,
  RejectContractRequest,
  DisputeContractRequest,
  ContractDefinition,
  contractStateFromJSON,
  contractStateToJSON,
} from '../../generated/ottochain/apps/contracts/v1/contract.js';

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import { contractDef, escrowDef } from './state-machines/index.js';

export type ContractDefinitionType = 'Contract' | 'Escrow';

export const CONTRACT_DEFINITIONS: Record<ContractDefinitionType, unknown> = {
  Contract: contractDef,
  Escrow: escrowDef,
};

/**
 * Get the contract state machine definition.
 */
export function getContractDefinition(): unknown {
  return contractDef;
}

/**
 * Get the escrow state machine definition.
 */
export function getEscrowDefinition(): unknown {
  return escrowDef;
}
