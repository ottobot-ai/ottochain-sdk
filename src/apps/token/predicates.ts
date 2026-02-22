/**
 * Token Application — Behavior Predicates
 */

import { TOKEN_BEHAVIOR_FLAGS, TOKEN_BEHAVIOR_NAMES, TokenBehavior } from './types';

export function makeTokenBehavior(t: boolean, d: boolean, e: boolean, g: boolean): TokenBehavior {
  return (
    (t ? TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE : 0) |
    (d ? TOKEN_BEHAVIOR_FLAGS.DIVISIBLE    : 0) |
    (e ? TOKEN_BEHAVIOR_FLAGS.EXPIRABLE    : 0) |
    (g ? TOKEN_BEHAVIOR_FLAGS.GOVERNABLE   : 0)
  ) as TokenBehavior;
}

export function isTransferable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE) !== 0;
}

export function isDivisible(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.DIVISIBLE) !== 0;
}

export function isExpirable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.EXPIRABLE) !== 0;
}

export function isGovernable(b: TokenBehavior | number): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.GOVERNABLE) !== 0;
}

/**
 * Returns a human-readable description of all four TDEG flags.
 */
export function describeTokenBehavior(b: TokenBehavior | number): string {
  const parts = [
    isTransferable(b) ? 'transferable' : 'soulbound',
    isDivisible(b)    ? 'divisible'    : 'indivisible',
    isExpirable(b)    ? 'expirable'    : 'permanent',
    isGovernable(b)   ? 'governable'   : 'autonomous',
  ];
  const name = TOKEN_BEHAVIOR_NAMES[b];
  return name ? `${parts.join(', ')} (${name})` : parts.join(', ');
}
