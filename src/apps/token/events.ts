/**
 * Token Application - Event Builders and Validators
 *
 * Type-safe builders for token lifecycle events, and a compile-time +
 * runtime validator to catch illegal event/behavior combinations early.
 *
 * OttoChain ML0 enforces the state machine alphabet at consensus time;
 * these helpers surface mismatches before submission.
 */

import { isDivisible, isTransferable } from "./predicates";
import {
  BurnEvent,
  ExpireEvent,
  MergeEvent,
  SplitEvent,
  TokenEvent,
  TransferEvent,
} from "./types";

// ── Event Builders ─────────────────────────────────────────────────────────

/**
 * Constructs a `transfer` event payload.
 *
 * @param fiberId   - ID of the fiber (token instance) to transfer.
 * @param recipient - Address of the new owner.
 * @param amount    - Optional amount (only meaningful for divisible tokens).
 */
export function createTransferEvent(
  fiberId: string,
  recipient: string,
  amount?: number
): TransferEvent {
  if (!fiberId) throw new Error("fiberId must not be empty");
  if (!recipient) throw new Error("recipient must not be empty");
  return { eventName: "transfer", fiberId, recipient, ...(amount !== undefined ? { amount } : {}) };
}

/**
 * Constructs a `split` event payload — for divisible tokens only.
 *
 * @param fiberId      - ID of the fiber to split.
 * @param amount       - Amount to split off (must be > 0).
 * @param childFiberId - Optional pre-assigned ID for the child fiber.
 */
export function createSplitEvent(
  fiberId: string,
  amount: number,
  childFiberId?: string
): SplitEvent {
  if (!fiberId) throw new Error("fiberId must not be empty");
  if (amount <= 0) throw new Error(`split amount must be > 0, got ${amount}`);
  return {
    eventName: "split",
    fiberId,
    amount,
    ...(childFiberId !== undefined ? { childFiberId } : {}),
  };
}

/**
 * Constructs a `merge` event payload — for divisible tokens only.
 *
 * @param fiberId       - ID of the target fiber (receives the merged amount).
 * @param sourceFiberId - ID of the source fiber (will be burned by ML0).
 * @param amount        - Amount to merge from source into target.
 */
export function createMergeEvent(
  fiberId: string,
  sourceFiberId: string,
  amount: number
): MergeEvent {
  if (!fiberId) throw new Error("fiberId must not be empty");
  if (!sourceFiberId) throw new Error("sourceFiberId must not be empty");
  if (amount <= 0) throw new Error(`merge amount must be > 0, got ${amount}`);
  return { eventName: "merge", fiberId, sourceFiberId, amount };
}

/**
 * Constructs an `expire` event payload.
 * The ML0 state machine guard enforces expiry window enforcement.
 */
export function createExpireEvent(fiberId: string): ExpireEvent {
  if (!fiberId) throw new Error("fiberId must not be empty");
  return { eventName: "expire", fiberId };
}

/**
 * Constructs a `burn` event payload.
 * Burn is universally allowed on all token types.
 */
export function createBurnEvent(fiberId: string): BurnEvent {
  if (!fiberId) throw new Error("fiberId must not be empty");
  return { eventName: "burn", fiberId };
}

// ── Event Validator ────────────────────────────────────────────────────────

/**
 * Validates that a token event is legal for the given behavior.
 *
 * Throws with a descriptive message if the event is illegal.
 * Unknown events (not in the TDEG transition set) are passed through —
 * ML0 DFA enforcement handles alphabet checking at consensus time.
 *
 * @param event    - The token event to validate.
 * @param behavior - The token's 4-bit TDEG behavior integer.
 */
export function validateTokenEvent(
  event: TokenEvent,
  behavior: number
): void {
  switch (event.eventName) {
    case "transfer":
      if (!isTransferable(behavior)) {
        throw new Error(
          `transfer is illegal for soulbound token (behavior=${behavior})`
        );
      }
      break;

    case "split":
      if (!isDivisible(behavior)) {
        throw new Error(
          `split is illegal for indivisible token (behavior=${behavior})`
        );
      }
      break;

    case "merge":
      if (!isDivisible(behavior)) {
        throw new Error(
          `merge is illegal for indivisible token (behavior=${behavior})`
        );
      }
      break;

    // burn and expire are universally legal (ML0 guard handles E=0 expire)
    case "burn":
    case "expire":
      break;

    // Unknown event names are allowed — ML0 DFA alphabet check handles them
    default:
      break;
  }
}
