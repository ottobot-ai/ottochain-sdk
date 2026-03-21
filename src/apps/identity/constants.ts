/**
 * Identity Constants
 *
 * State machine transitions and configuration constants for identities.
 *
 * @packageDocumentation
 */

import { IdentityState, IdentityType } from '../../generated/ottochain/apps/identity/v1/identity.js';
import { AttestationType } from '../../generated/ottochain/apps/identity/v1/attestation.js';

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------

/**
 * Valid transitions for each identity state.
 * Maps current state to allowed event names.
 */
export const IDENTITY_TRANSITIONS: Record<IdentityState, readonly string[]> = {
  [IdentityState.IDENTITY_STATE_UNSPECIFIED]: [],
  [IdentityState.IDENTITY_STATE_UNREGISTERED]: ['register'],
  [IdentityState.IDENTITY_STATE_REGISTERED]: ['activate', 'withdraw'],
  [IdentityState.IDENTITY_STATE_ACTIVE]: ['challenge', 'deactivate', 'withdraw', 'penalize'],
  [IdentityState.IDENTITY_STATE_INACTIVE]: ['activate', 'withdraw'],
  [IdentityState.IDENTITY_STATE_CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
  [IdentityState.IDENTITY_STATE_SUSPENDED]: ['begin_probation', 'withdraw'],
  [IdentityState.IDENTITY_STATE_PROBATION]: ['complete_probation'],
  [IdentityState.IDENTITY_STATE_WITHDRAWN]: [], // Terminal state
  [IdentityState.UNRECOGNIZED]: [],
};

// Legacy alias for backward compatibility
export const AGENT_TRANSITIONS = IDENTITY_TRANSITIONS;

// ---------------------------------------------------------------------------
// Reputation Configuration
// ---------------------------------------------------------------------------

/**
 * Reputation delta by attestation type.
 * These values match the metagraph state machine defaults.
 */
export const ATTESTATION_DELTAS: Record<AttestationType, number> = {
  [AttestationType.ATTESTATION_TYPE_UNSPECIFIED]: 0,
  [AttestationType.ATTESTATION_TYPE_COMPLETION]: 5,
  [AttestationType.ATTESTATION_TYPE_VOUCH]: 2,
  [AttestationType.ATTESTATION_TYPE_VIOLATION]: -10,
  [AttestationType.ATTESTATION_TYPE_BEHAVIORAL]: 3,
  [AttestationType.UNRECOGNIZED]: 0,
};

/**
 * Check if a transition is valid for the given state.
 */
export function canTransition(state: IdentityState, event: string): boolean {
  return IDENTITY_TRANSITIONS[state]?.includes(event) ?? false;
}

/**
 * Get reputation delta for an attestation type.
 */
export function getReputationDelta(type: AttestationType): number {
  return ATTESTATION_DELTAS[type] ?? 0;
}

/**
 * Identity type display names
 */
export const IDENTITY_TYPE_NAMES: Record<IdentityType, string> = {
  [IdentityType.IDENTITY_TYPE_UNSPECIFIED]: 'Unknown',
  [IdentityType.IDENTITY_TYPE_AGENT]: 'Agent',
  [IdentityType.IDENTITY_TYPE_ORACLE]: 'Oracle',
  [IdentityType.IDENTITY_TYPE_SERVICE]: 'Service',
  [IdentityType.UNRECOGNIZED]: 'Unknown',
};
