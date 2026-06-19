/**
 * Identity Constants
 *
 * State machine transitions and configuration constants for identity types.
 *
 * @packageDocumentation
 */

import { State } from "../../generated/ottochain/apps/identity/v1/identity.js";
import { AttestationType } from "../../generated/ottochain/apps/identity/v1/attestation.js";

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------

/**
 * Valid transitions for each identity state.
 * Maps current state to allowed event names.
 * Note: Some transitions are type-specific (agent vs oracle)
 */
export const IDENTITY_TRANSITIONS: Record<State, readonly string[]> = {
  [State.IDENTITY_STATE_UNSPECIFIED]: [],
  [State.IDENTITY_STATE_UNREGISTERED]: ["register"],
  [State.IDENTITY_STATE_REGISTERED]: ["activate", "withdraw"],
  [State.IDENTITY_STATE_ACTIVE]: [
    "challenge",
    "slash",
    "deactivate",
    "withdraw",
  ],
  [State.IDENTITY_STATE_CHALLENGED]: [
    "uphold_challenge",
    "dismiss_challenge",
  ],
  [State.IDENTITY_STATE_SUSPENDED]: ["begin_probation"],
  [State.IDENTITY_STATE_PROBATION]: ["complete_probation"],
  [State.IDENTITY_STATE_SLASHED]: ["reactivate", "withdraw"],
  [State.IDENTITY_STATE_INACTIVE]: ["activate", "withdraw"],
  [State.IDENTITY_STATE_WITHDRAWN]: [], // Terminal state
  [State.UNRECOGNIZED]: [],
};

// Legacy alias
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

// ---------------------------------------------------------------------------
// Identity Registry — role attestations
// ---------------------------------------------------------------------------

/**
 * Role-attestation types issued by the identity registry (identity-registry fiber).
 * These are the ecosystem-wide authority roles consumer apps gate on via the registry
 * dependency + `signerHasRole` (see docs/design/app-hardening-identity-integration.md §4.2).
 */
export const REGISTRY_ROLES = {
  ARBITER: "ARBITER",
  SLASHER: "SLASHER",
  ISSUER: "ISSUER",
  BOARD_MEMBER: "BOARD_MEMBER",
} as const;

export type RegistryRole = keyof typeof REGISTRY_ROLES;

/**
 * Maps each role to the registry's flat per-role state-map field. A consumer app reads
 * `machines.<registryDep>.state.<field>` (a `{ <address>: true }` map) and binds membership to a
 * verified signer with `signerHasRole`. Kept in lock-step with the identity-registry stateSchema.
 */
export const REGISTRY_ROLE_MAP: Record<RegistryRole, string> = {
  ARBITER: "arbiters",
  SLASHER: "slashers",
  ISSUER: "issuers",
  BOARD_MEMBER: "boardMembers",
} as const;

/**
 * Build the `machines.<registryDep>.state.<roleMap>` var path a consumer guard reads to check a role,
 * e.g. `registryRolePath("reg-uuid", "ARBITER")` → `"machines.reg-uuid.state.arbiters"`.
 */
export function registryRolePath(registryDep: string, role: RegistryRole): string {
  return `machines.${registryDep}.state.${REGISTRY_ROLE_MAP[role]}`;
}

/**
 * Build the `machines.<registryDep>.state.reputations` var path a consumer guard reads for a
 * reputation gate (`signerHasReputation`).
 */
export function registryReputationPath(registryDep: string): string {
  return `machines.${registryDep}.state.reputations`;
}

/**
 * Check if a transition is valid for the given state.
 */
export function canTransition(state: State, event: string): boolean {
  return IDENTITY_TRANSITIONS[state]?.includes(event) ?? false;
}

/**
 * Get reputation delta for an attestation type.
 */
export function getReputationDelta(type: AttestationType): number {
  return ATTESTATION_DELTAS[type] ?? 0;
}
