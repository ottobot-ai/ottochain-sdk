/**
 * Contract Types
 * 
 * TypeScript types for the Contract application on OttoChain.
 * These mirror the protobuf definitions in proto/ottochain/apps/contracts/v1/
 * 
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Contract lifecycle states
 */
export type ContractState =
  | 'PROPOSED'     // Awaiting counterparty acceptance
  | 'ACTIVE'       // Both parties agreed, in progress
  | 'COMPLETED'    // Successfully fulfilled (terminal)
  | 'REJECTED'     // Counterparty declined (terminal)
  | 'DISPUTED'     // Under dispute resolution
  | 'CANCELLED';   // Cancelled by proposer before acceptance (terminal)

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/**
 * Contract between two agents
 */
export interface Contract {
  id: string;
  contractId: string;            // Human-readable ID
  proposer: string;              // Proposer address
  counterparty: string;          // Counterparty address
  state: ContractState;
  terms: Record<string, unknown>;
  description?: string;
  proposedAt: string;            // ISO timestamp
  acceptedAt?: string;           // ISO timestamp
  completedAt?: string;          // ISO timestamp
  completionProof?: string;
}

// ---------------------------------------------------------------------------
// Request Types
// ---------------------------------------------------------------------------

/**
 * Propose a new contract
 */
export interface ProposeContractRequest {
  proposer: string;
  counterparty: string;
  terms: Record<string, unknown>;
  description?: string;
}

/**
 * Accept a proposed contract
 */
export interface AcceptContractRequest {
  contractId: string;
  acceptor: string;
}

/**
 * Complete a contract with proof
 */
export interface CompleteContractRequest {
  contractId: string;
  completer: string;
  proof?: string;
}

/**
 * Reject a proposed contract
 */
export interface RejectContractRequest {
  contractId: string;
  rejector: string;
  reason?: string;
}

/**
 * Dispute a contract
 */
export interface DisputeContractRequest {
  contractId: string;
  disputant: string;
  evidence: string;
  reason: string;
}

/**
 * Cancel a proposed contract (before acceptance)
 */
export interface CancelContractRequest {
  contractId: string;
  proposer: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Contract configuration
 */
export interface ContractConfig {
  requireBothSignatures: boolean;  // Both parties must sign completion
  disputeWindowEpochs: number;     // How long after completion disputes allowed
}

/**
 * Default contract configuration
 */
export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  requireBothSignatures: false,
  disputeWindowEpochs: 10,
};

// ---------------------------------------------------------------------------
// State Machine Definition
// ---------------------------------------------------------------------------

/**
 * Contract state machine transitions
 */
export const CONTRACT_TRANSITIONS = {
  PROPOSED: ['accept', 'reject', 'cancel'],
  ACTIVE: ['complete', 'dispute'],
  DISPUTED: ['resolve_for_completer', 'resolve_for_disputant'],
  COMPLETED: [],   // Terminal state
  REJECTED: [],    // Terminal state
  CANCELLED: [],   // Terminal state
} as const;
