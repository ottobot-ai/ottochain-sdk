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
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import contractDef from './state-machines/contract.json';
import escrowDef from './state-machines/escrow.json';

export type ContractDefinitionType = 'Contract' | 'Escrow';

export const CONTRACT_DEFINITIONS: Record<ContractDefinitionType, unknown> = {
  Contract: contractDef,
  Escrow: escrowDef,
};

/**
 * Move documentation-only fields (crossReferences, emits) into metadata
 * so they're preserved but don't conflict with the metagraph schema.
 * Metadata accepts arbitrary JSON — ideal for informational fields.
 */
function moveDocsToMetadata(def: Record<string, unknown>): Record<string, unknown> {
  const { crossReferences, metadata: existingMetadata, ...rest } = def;

  // Collect emits from transitions
  const transitionEmits: Record<string, unknown> = {};
  if (Array.isArray(rest.transitions)) {
    rest.transitions = (rest.transitions as Record<string, unknown>[]).map(t => {
      const { emits, ...transition } = t;
      if (emits) {
        const key = `${transition.from}_${transition.eventName ?? 'event'}_${transition.to}`;
        transitionEmits[key] = emits;
      }
      return transition;
    });
  }

  const metadata = {
    ...((existingMetadata as Record<string, unknown>) ?? {}),
    ...(crossReferences ? { crossReferences } : {}),
    ...(Object.keys(transitionEmits).length > 0 ? { transitionEmits } : {}),
  };

  return { ...rest, metadata };
}

/**
 * Get the contract state machine definition.
 * Moves documentation fields (crossReferences, emits) into metadata.
 */
export function getContractDefinition(): unknown {
  return moveDocsToMetadata(contractDef as Record<string, unknown>);
}

/**
 * Get the escrow state machine definition.
 * Moves documentation fields (crossReferences, emits) into metadata.
 */
export function getEscrowDefinition(): unknown {
  return moveDocsToMetadata(escrowDef as Record<string, unknown>);
}
