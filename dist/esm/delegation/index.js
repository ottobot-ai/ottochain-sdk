/**
 * @fileoverview OttoChain SDK Delegation Management
 *
 * High-level API for creating, signing, and managing delegations on OttoChain.
 * Supports both session key and signed intent delegation approaches.
 */
export { DelegationManager } from './delegation-manager.js';
export { DelegationBuilder } from './delegation-builder.js';
export { RelayerClient } from './relayer-client.js';
// Re-export generated protobuf types for convenience
export { DelegationAuthority, DelegationScope, SessionKey, SignedIntent, DelegationRevocation, RelayedTransaction, DelegationApproach, FeePaymentMethod, CreateDelegation, RegisterSessionKey, SubmitSignedIntent, RevokeDelegation, SubmitRelayedTransaction } from '../generated/ottochain/v1/delegation.js';
