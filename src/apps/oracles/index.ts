/**
 * Oracle Application — Backward Compatibility Shim
 *
 * ⚠️ DEPRECATED: Oracle types have been unified into the Identity app.
 * Import from `@ottochain/sdk/apps/identity` instead.
 *
 * @deprecated Use `@ottochain/sdk/apps/identity`
 * @packageDocumentation
 */

export {
  IdentityState as OracleState,
  Reputation as OracleReputation,
  PenaltyEvent as SlashingEvent,
  Identity as Oracle,
  RegisterIdentityRequest as RegisterOracleRequest,
  ActivateIdentityRequest as ActivateOracleRequest,
  AddStakeRequest,
  WithdrawIdentityRequest as WithdrawOracleRequest,
  IdentityDefinition as OracleDefinition,
  identityStateFromJSON as oracleStateFromJSON,
  identityStateToJSON as oracleStateToJSON,
} from "../identity/index.js";

import { getIdentityDefinition } from "../identity/index.js";

/** @deprecated Use `getIdentityDefinition('oracle')` from `@ottochain/sdk/apps/identity` */
export function getOracleDefinition(_type?: string): unknown {
  return getIdentityDefinition("oracle");
}

/** @deprecated Use `DEFAULT_REPUTATION_CONFIG` from `@ottochain/sdk/apps/identity` */
export const DEFAULT_ORACLE_CONFIG = {
  minStake: 100,
  baseReputation: 10,
  reputationDecay: 0.95,
} as const;
