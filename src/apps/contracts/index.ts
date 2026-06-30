/**
 * Contracts Application
 *
 * Types and utilities for smart contracts on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   State,
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

// Re-export generated protobuf types (source of truth).
// The nested lifecycle enum dropped its app prefix in the proto; under this
// app-scoped entrypoint it is unambiguously State.
export {
  State,
  Contract,
  ProposeContractRequest,
  AcceptContractRequest,
  CompleteContractRequest,
  RejectContractRequest,
  DisputeContractRequest,
  ContractDefinition,
  stateFromJSON,
  stateToJSON,
} from '../../generated/ottochain/apps/contracts/v1/contract.js';

// Deprecated app-prefixed alias (renamed to State); kept for compat.
export {
  State as ContractState,
  stateFromJSON as contractStateFromJSON,
  stateToJSON as contractStateToJSON,
} from '../../generated/ottochain/apps/contracts/v1/contract.js';

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import { contractUniversalDef, contractAgreementDef, contractEscrowDef } from './state-machines/index.js';
import type { FiberAppDefinition } from '../../schema/fiber-app.js';

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
export function getContractDefinition(type: ContractType = 'agreement'): FiberAppDefinition {
  return CONTRACTS_DEFINITIONS[type];
}

/** @deprecated Use getContractDefinition('escrow') */
export function getEscrowDefinition(): FiberAppDefinition {
  return contractEscrowDef;
}
