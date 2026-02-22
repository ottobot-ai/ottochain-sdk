/**
 * Token Application - Behavior Predicates
 *
 * Utilities for constructing and interrogating 4-bit TDEG TokenBehavior integers.
 */

import {
  TOKEN_BEHAVIOR_FLAGS,
  TOKEN_BEHAVIOR_NAMES,
  TokenBehavior,
} from "./types";

/**
 * Encodes four boolean feature flags into a 4-bit TokenBehavior integer.
 *
 * @param t - Transferable (can change ownership)
 * @param d - Divisible (can be split/merged)
 * @param e - Expirable (has a finite lifetime)
 * @param g - Governable (requires delegation/governance approval)
 */
export function makeTokenBehavior(
  t: boolean,
  d: boolean,
  e: boolean,
  g: boolean
): TokenBehavior {
  const value =
    (t ? TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE : 0) |
    (d ? TOKEN_BEHAVIOR_FLAGS.DIVISIBLE : 0) |
    (e ? TOKEN_BEHAVIOR_FLAGS.EXPIRABLE : 0) |
    (g ? TOKEN_BEHAVIOR_FLAGS.GOVERNABLE : 0);
  return value as TokenBehavior;
}

/** Returns true if the token can be transferred to a new owner. */
export function isTransferable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE) !== 0;
}

/** Returns true if the token can be split or merged. */
export function isDivisible(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.DIVISIBLE) !== 0;
}

/** Returns true if the token has an expiry mechanism. */
export function isExpirable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.EXPIRABLE) !== 0;
}

/** Returns true if the token requires governance / delegation approval. */
export function isGovernable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.GOVERNABLE) !== 0;
}

/**
 * Returns a human-readable description of the token behavior flags.
 *
 * @example
 * describeTokenBehavior(8)
 * // → "transferable, indivisible, permanent, autonomous (NFT)"
 */
export function describeTokenBehavior(b: TokenBehavior | number): string {
  const parts: string[] = [];

  parts.push(isTransferable(b) ? "transferable" : "soulbound");
  parts.push(isDivisible(b) ? "divisible" : "indivisible");
  parts.push(isExpirable(b) ? "expirable" : "permanent");
  parts.push(isGovernable(b) ? "governable" : "autonomous");

  const name = TOKEN_BEHAVIOR_NAMES[b];
  return name ? `${parts.join(", ")} (${name})` : parts.join(", ");
}
