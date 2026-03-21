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
 *   CONTRACTS_DEFINITIONS
 * } from '@ottochain/sdk/apps/contracts';
 *
 * const agreementDef = getContractDefinition('agreement');
 * const escrowDef = getContractDefinition('escrow');
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
} from "../../generated/ottochain/apps/contracts/v1/contract.js";

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  contractUniversalDef,
  contractAgreementDef,
  contractEscrowDef,
} from "./state-machines/index.js";

export { contractUniversalDef, contractAgreementDef, contractEscrowDef };

/** All contract state machine definitions */
export const CONTRACTS_DEFINITIONS = {
  universal: contractUniversalDef,
  agreement: contractAgreementDef,
  escrow: contractEscrowDef,
} as const;

export type ContractType = keyof typeof CONTRACTS_DEFINITIONS;

/**
 * Get a contract state machine definition by type.
 * @param type - 'universal' | 'agreement' | 'escrow' (default: 'agreement')
 */
export function getContractDefinition(
  type: ContractType = "agreement",
): unknown {
  return CONTRACTS_DEFINITIONS[type];
}

/** @deprecated Use getContractDefinition('escrow') */
export function getEscrowDefinition(): unknown {
  return contractEscrowDef;
}
