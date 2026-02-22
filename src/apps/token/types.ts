/**
 * Token Application - Type Definitions
 *
 * Defines the 4-bit TDEG token behavior model and associated wire-format types.
 *
 * Behavior encoding (4-bit flags):
 *   Bit 3 (8): T = Transferable
 *   Bit 2 (4): D = Divisible
 *   Bit 1 (2): E = Expirable
 *   Bit 0 (1): G = Governable
 *
 * This gives 16 distinct token archetypes (0–15).
 */

/**
 * A 4-bit integer (0–15) encoding token behaviors as TDEG flags.
 *
 * Use `makeTokenBehavior(t, d, e, g)` to construct, or the
 * `TOKEN_BEHAVIOR_TYPES` named constants for common archetypes.
 */
export type TokenBehavior = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/**
 * The four binary feature flags encoded in a TokenBehavior integer.
 */
export const TOKEN_BEHAVIOR_FLAGS = {
  TRANSFERABLE: 0b1000, // 8
  DIVISIBLE: 0b0100, // 4
  EXPIRABLE: 0b0010, // 2
  GOVERNABLE: 0b0001, // 1
} as const;

/**
 * Named presets for all 16 TDEG token archetypes.
 */
export const TOKEN_BEHAVIOR_TYPES = {
  SOULBOUND_RECEIPT: 0, // T=0, D=0, E=0, G=0
  GOVERNED_BADGE: 1, // T=0, D=0, E=0, G=1
  EXPIRABLE_CREDENTIAL: 2, // T=0, D=0, E=1, G=0
  GOVERNED_LICENSE: 3, // T=0, D=0, E=1, G=1
  LOYALTY_POINTS: 4, // T=0, D=1, E=0, G=0
  GOVERNED_ALLOCATION: 5, // T=0, D=1, E=0, G=1
  EXPIRABLE_POINTS: 6, // T=0, D=1, E=1, G=0
  GOVERNED_EXPIRABLE_POINTS: 7, // T=0, D=1, E=1, G=1
  NFT: 8, // T=1, D=0, E=0, G=0
  GOVERNED_NFT: 9, // T=1, D=0, E=0, G=1
  EXPIRABLE_NFT: 10, // T=1, D=0, E=1, G=0
  GOVERNED_EXPIRABLE_NFT: 11, // T=1, D=0, E=1, G=1
  FUNGIBLE_TOKEN: 12, // T=1, D=1, E=0, G=0
  GOVERNED_FUNGIBLE_TOKEN: 13, // T=1, D=1, E=0, G=1
  EXPIRABLE_FUNGIBLE_TOKEN: 14, // T=1, D=1, E=1, G=0
  GOVERNED_EXPIRABLE_FUNGIBLE: 15, // T=1, D=1, E=1, G=1
} as const;

/**
 * Reverse lookup: integer → behavior name string.
 */
export const TOKEN_BEHAVIOR_NAMES: Record<number, string> = {
  0: "SOULBOUND_RECEIPT",
  1: "GOVERNED_BADGE",
  2: "EXPIRABLE_CREDENTIAL",
  3: "GOVERNED_LICENSE",
  4: "LOYALTY_POINTS",
  5: "GOVERNED_ALLOCATION",
  6: "EXPIRABLE_POINTS",
  7: "GOVERNED_EXPIRABLE_POINTS",
  8: "NFT",
  9: "GOVERNED_NFT",
  10: "EXPIRABLE_NFT",
  11: "GOVERNED_EXPIRABLE_NFT",
  12: "FUNGIBLE_TOKEN",
  13: "GOVERNED_FUNGIBLE_TOKEN",
  14: "EXPIRABLE_FUNGIBLE_TOKEN",
  15: "GOVERNED_EXPIRABLE_FUNGIBLE",
};

// ── Wire-format types (proto { value: string } wrappers) ────────────────────

/** Proto wire-format state ID wrapper. */
export interface WireStateId {
  value: string;
}

/** Proto wire-format state definition (key = state name). */
export interface WireState {
  id: WireStateId;
  isFinal: boolean;
  metadata?: Record<string, unknown> | null;
}

/** Proto wire-format transition. */
export interface WireTransition {
  from: WireStateId;
  to: WireStateId;
  eventName: string;
  guard: unknown | null;
  effect: unknown | null;
  dependencies?: string[];
}

/** Metadata block attached to token state machines. */
export interface TokenStateMachineMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  tokenBehavior: number;
}

/**
 * Wire-format token state machine definition.
 * Matches the JSON accepted by OttoChain ML0 (`StateMachineDefinition`).
 */
export interface TokenStateMachineDefinition {
  metadata: TokenStateMachineMetadata;
  states: Record<string, WireState>;
  initialState: WireStateId;
  transitions: WireTransition[];
}

// ── Token Event Types ────────────────────────────────────────────────────────

export interface TransferEvent {
  eventName: "transfer";
  fiberId: string;
  recipient: string;
  amount?: number;
}

export interface SplitEvent {
  eventName: "split";
  fiberId: string;
  amount: number;
  childFiberId?: string;
}

export interface MergeEvent {
  eventName: "merge";
  fiberId: string;
  sourceFiberId: string;
  amount: number;
}

export interface ExpireEvent {
  eventName: "expire";
  fiberId: string;
}

export interface BurnEvent {
  eventName: "burn";
  fiberId: string;
}

export type TokenEvent = TransferEvent | SplitEvent | MergeEvent | ExpireEvent | BurnEvent;
