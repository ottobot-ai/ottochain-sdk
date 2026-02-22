/**
 * Token Application - State Machine Factory
 *
 * Generates wire-format StateMachineDefinition JSON for any of the 16 TDEG
 * token behavior types.  The output is accepted directly by OttoChain ML0.
 *
 * State layout
 * ─────────────
 *   ACTIVE   → initial state (always present)
 *   BURNED   → terminal, always reachable via `burn`
 *   EXPIRED  → terminal, present only when E=1
 *
 * Transitions
 * ───────────
 *   burn     — always (ACTIVE → BURNED, no guard)
 *   transfer — when T=1 (ACTIVE → ACTIVE)
 *              guard: governance check if G=1, ordinal-expiry check if E=1
 *   split    — when D=1 (ACTIVE → ACTIVE)
 *              guard: event.amount ≤ state.balance
 *   merge    — when D=1 (ACTIVE → ACTIVE, source fiber burns externally)
 *   expire   — when E=1 (ACTIVE → EXPIRED, no guard — guard logic in ML0)
 *
 * All state IDs and transition from/to use proto wire format: { value: "..." }.
 */

import { isDivisible, isExpirable, isGovernable, isTransferable } from "./predicates";
import {
  TOKEN_BEHAVIOR_NAMES,
  TokenBehavior,
  TokenStateMachineDefinition,
  WireState,
  WireTransition,
} from "./types";

// ── Wire-format helpers ────────────────────────────────────────────────────

function stateId(name: string): { value: string } {
  return { value: name };
}

function makeState(name: string, isFinal: boolean): WireState {
  return {
    id: stateId(name),
    isFinal,
    metadata: null,
  };
}

// ── Guard builders ────────────────────────────────────────────────────────

/** Governance guard: delegation.isAuthorized must be truthy in JLVM context. */
const GOVERNANCE_GUARD = { var: "delegation.isAuthorized" };

/** Ordinal-expiry guard: current ordinal < state.expiresAtOrdinal */
const EXPIRY_GUARD = {
  "<": [{ var: "$ordinal" }, { var: "state.expiresAtOrdinal" }],
};

/** Combined governance + expiry guard (G=1, E=1). */
const GOVERNANCE_AND_EXPIRY_GUARD = {
  and: [GOVERNANCE_GUARD, EXPIRY_GUARD],
};

/** Split guard: event.amount ≤ state.balance */
const SPLIT_GUARD = {
  "<=": [{ var: "event.amount" }, { var: "state.balance" }],
};

/** Select the transfer guard based on governance and expiry flags. */
function transferGuard(
  governable: boolean,
  expirable: boolean
): unknown | null {
  if (governable && expirable) return GOVERNANCE_AND_EXPIRY_GUARD;
  if (governable) return GOVERNANCE_GUARD;
  if (expirable) return EXPIRY_GUARD;
  return null;
}

// ── Transition builders ───────────────────────────────────────────────────

function burnTransition(): WireTransition {
  return {
    from: stateId("ACTIVE"),
    to: stateId("BURNED"),
    eventName: "burn",
    guard: null,
    effect: null,
  };
}

function transferTransition(governable: boolean, expirable: boolean): WireTransition {
  return {
    from: stateId("ACTIVE"),
    to: stateId("ACTIVE"),
    eventName: "transfer",
    guard: transferGuard(governable, expirable),
    effect: null,
  };
}

function splitTransition(): WireTransition {
  return {
    from: stateId("ACTIVE"),
    to: stateId("ACTIVE"),
    eventName: "split",
    guard: SPLIT_GUARD,
    effect: null,
  };
}

function mergeTransition(): WireTransition {
  return {
    from: stateId("ACTIVE"),
    to: stateId("ACTIVE"),
    eventName: "merge",
    guard: null,
    effect: null,
  };
}

function expireTransition(): WireTransition {
  return {
    from: stateId("ACTIVE"),
    to: stateId("EXPIRED"),
    eventName: "expire",
    guard: null,
    effect: null,
  };
}

// ── Main factory ──────────────────────────────────────────────────────────

/**
 * Generates a wire-format `StateMachineDefinition` for the given
 * 4-bit TDEG token behavior integer.
 *
 * @param behavior - Integer 0–15 encoding TDEG flags.  Use `TOKEN_BEHAVIOR_TYPES`
 *                   for named constants or `makeTokenBehavior()` for custom flags.
 */
export function createTokenStateMachine(
  behavior: TokenBehavior | number
): TokenStateMachineDefinition {
  const t = isTransferable(behavior);
  const d = isDivisible(behavior);
  const e = isExpirable(behavior);
  const g = isGovernable(behavior);

  // ── States ───────────────────────────────────────────────────────────────
  const states: Record<string, WireState> = {
    ACTIVE: makeState("ACTIVE", false),
    BURNED: makeState("BURNED", true),
  };

  if (e) {
    states.EXPIRED = makeState("EXPIRED", true);
  }

  // ── Transitions ──────────────────────────────────────────────────────────
  const transitions: WireTransition[] = [burnTransition()];

  if (t) transitions.push(transferTransition(g, e));
  if (d) {
    transitions.push(splitTransition());
    transitions.push(mergeTransition());
  }
  if (e) transitions.push(expireTransition());

  // ── Metadata ─────────────────────────────────────────────────────────────
  const behaviorName = TOKEN_BEHAVIOR_NAMES[behavior] ?? `CUSTOM_${behavior}`;

  return {
    metadata: {
      name: `Token_${behaviorName}`,
      description: `OttoChain token state machine for ${behaviorName.toLowerCase().replace(/_/g, " ")}`,
      version: "1.0.0",
      category: "token",
      tokenBehavior: behavior,
    },
    states,
    initialState: stateId("ACTIVE"),
    transitions,
  };
}

// ── Named preset factories ────────────────────────────────────────────────

/** Non-fungible token (T=1, D=0, E=0, G=0) — behavior 8 */
export function getNFTDefinition(): TokenStateMachineDefinition {
  return createTokenStateMachine(8);
}

/** Fungible token (T=1, D=1, E=0, G=0) — behavior 12 */
export function getFungibleTokenDefinition(): TokenStateMachineDefinition {
  return createTokenStateMachine(12);
}

/**
 * Governed fungible token / stablecoin (T=1, D=1, E=0, G=1) — behavior 13.
 * Transfer requires delegation.isAuthorized (governance approval).
 */
export function getStablecoinDefinition(): TokenStateMachineDefinition {
  return createTokenStateMachine(13);
}

/**
 * Governed licence (T=0, D=0, E=1, G=1) — behavior 3.
 * Soulbound, expirable, governed — typical for time-limited access credentials.
 */
export function getLicenseDefinition(): TokenStateMachineDefinition {
  return createTokenStateMachine(3);
}

/**
 * Soulbound badge (T=0, D=0, E=0, G=0) — behavior 0.
 * Non-transferable, indivisible, permanent, autonomous.
 */
export function getSoulboundBadgeDefinition(): TokenStateMachineDefinition {
  return createTokenStateMachine(0);
}
