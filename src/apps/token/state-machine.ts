/**
 * Token Application — State Machine Factory
 *
 * Generates wire-format StateMachineDefinition JSON for any 4-bit TDEG behavior.
 *
 * States:  ACTIVE (initial) · BURNED (terminal) · EXPIRED (terminal, E=1 only)
 * Transitions:
 *   burn      — always      (ACTIVE→BURNED, no guard)
 *   transfer  — T=1         (ACTIVE→ACTIVE, governance+expiry guards per flags)
 *   split     — D=1         (ACTIVE→ACTIVE, amount≤balance guard)
 *   merge     — D=1         (ACTIVE→ACTIVE, no guard)
 *   expire    — E=1         (ACTIVE→EXPIRED, no guard)
 */

import { isDivisible, isExpirable, isGovernable, isTransferable } from './predicates';
import {
  TOKEN_BEHAVIOR_NAMES,
  TokenBehavior,
  TokenStateMachineDefinition,
  WireState,
  WireStateId,
  WireTransition,
} from './types';

// ── Helpers ────────────────────────────────────────────────────────────────

function sid(name: string): WireStateId { return { value: name }; }

function state(name: string, isFinal: boolean): WireState {
  return { id: sid(name), isFinal, metadata: null };
}

// ── Guards ─────────────────────────────────────────────────────────────────

const GOVERNANCE_GUARD = { var: 'delegation.isAuthorized' };
const EXPIRY_GUARD     = { '<': [{ var: '$ordinal' }, { var: 'state.expiresAtOrdinal' }] };
const SPLIT_GUARD      = { '<=': [{ var: 'event.amount' }, { var: 'state.balance' }] };

function transferGuard(g: boolean, e: boolean): unknown {
  if (g && e) return { and: [GOVERNANCE_GUARD, EXPIRY_GUARD] };
  if (g)      return GOVERNANCE_GUARD;
  if (e)      return EXPIRY_GUARD;
  return null;
}

// ── Transition builders ────────────────────────────────────────────────────

function tx(from: string, to: string, eventName: string, guard: unknown): WireTransition {
  return { from: sid(from), to: sid(to), eventName, guard, effect: null };
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Generate a wire-format token state machine for the given 4-bit TDEG behavior.
 */
export function createTokenStateMachine(behavior: TokenBehavior | number): TokenStateMachineDefinition {
  const t = isTransferable(behavior);
  const d = isDivisible(behavior);
  const e = isExpirable(behavior);
  const g = isGovernable(behavior);

  const states: Record<string, WireState> = {
    ACTIVE:  state('ACTIVE',  false),
    BURNED:  state('BURNED',  true),
    ...(e ? { EXPIRED: state('EXPIRED', true) } : {}),
  };

  const transitions: WireTransition[] = [
    tx('ACTIVE', 'BURNED',  'burn',     null),
    ...(t ? [tx('ACTIVE', 'ACTIVE',  'transfer', transferGuard(g, e))] : []),
    ...(d ? [tx('ACTIVE', 'ACTIVE',  'split',    SPLIT_GUARD),
             tx('ACTIVE', 'ACTIVE',  'merge',    null)]                : []),
    ...(e ? [tx('ACTIVE', 'EXPIRED', 'expire',   null)]                : []),
  ];

  const behaviorName = TOKEN_BEHAVIOR_NAMES[behavior] ?? `CUSTOM_${behavior}`;

  return {
    metadata: {
      name:          `Token_${behaviorName}`,
      description:   `OttoChain token — ${behaviorName.toLowerCase().replace(/_/g, ' ')}`,
      version:       '1.0.0',
      category:      'token',
      tokenBehavior: behavior,
    },
    states,
    initialState: sid('ACTIVE'),
    transitions,
  };
}

// ── Named presets ──────────────────────────────────────────────────────────

/** NFT: T=1, D=0, E=0, G=0 — behavior 8 */
export const getNFTDefinition = (): TokenStateMachineDefinition => createTokenStateMachine(8);

/** Fungible token: T=1, D=1, E=0, G=0 — behavior 12 */
export const getFungibleTokenDefinition = (): TokenStateMachineDefinition => createTokenStateMachine(12);

/** Governed fungible / stablecoin: T=1, D=1, E=0, G=1 — behavior 13 */
export const getStablecoinDefinition = (): TokenStateMachineDefinition => createTokenStateMachine(13);

/** Governed soulbound licence: T=0, D=0, E=1, G=1 — behavior 3 */
export const getLicenseDefinition = (): TokenStateMachineDefinition => createTokenStateMachine(3);

/** Soulbound badge: T=0, D=0, E=0, G=0 — behavior 0 */
export const getSoulboundBadgeDefinition = (): TokenStateMachineDefinition => createTokenStateMachine(0);
