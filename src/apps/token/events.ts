/**
 * Token Application — Event Builders and Validator
 */

import { isDivisible, isTransferable } from './predicates';
import { BurnEvent, ExpireEvent, MergeEvent, SplitEvent, TokenEvent, TransferEvent } from './types';

// ── Builders ───────────────────────────────────────────────────────────────

export function createTransferEvent(fiberId: string, recipient: string, amount?: number): TransferEvent {
  if (!fiberId)   throw new Error('fiberId must not be empty');
  if (!recipient) throw new Error('recipient must not be empty');
  return { eventName: 'transfer', fiberId, recipient, ...(amount !== undefined ? { amount } : {}) };
}

export function createSplitEvent(fiberId: string, amount: number, childFiberId?: string): SplitEvent {
  if (!fiberId)   throw new Error('fiberId must not be empty');
  if (amount <= 0) throw new Error(`split amount must be > 0, got ${amount}`);
  return { eventName: 'split', fiberId, amount, ...(childFiberId !== undefined ? { childFiberId } : {}) };
}

export function createMergeEvent(fiberId: string, sourceFiberId: string, amount: number): MergeEvent {
  if (!fiberId)        throw new Error('fiberId must not be empty');
  if (!sourceFiberId)  throw new Error('sourceFiberId must not be empty');
  if (amount <= 0)     throw new Error(`merge amount must be > 0, got ${amount}`);
  return { eventName: 'merge', fiberId, sourceFiberId, amount };
}

export function createExpireEvent(fiberId: string): ExpireEvent {
  if (!fiberId) throw new Error('fiberId must not be empty');
  return { eventName: 'expire', fiberId };
}

export function createBurnEvent(fiberId: string): BurnEvent {
  if (!fiberId) throw new Error('fiberId must not be empty');
  return { eventName: 'burn', fiberId };
}

// ── Validator ──────────────────────────────────────────────────────────────

/**
 * Validates a token event against the token's behavior flags.
 * Throws if the event is illegal for the given behavior.
 * Unknown events pass through (ML0 DFA alphabet check handles them).
 */
export function validateTokenEvent(event: TokenEvent, behavior: number): void {
  switch (event.eventName) {
    case 'transfer':
      if (!isTransferable(behavior))
        throw new Error(`transfer is illegal for soulbound token (behavior=${behavior})`);
      break;
    case 'split':
      if (!isDivisible(behavior))
        throw new Error(`split is illegal for indivisible token (behavior=${behavior})`);
      break;
    case 'merge':
      if (!isDivisible(behavior))
        throw new Error(`merge is illegal for indivisible token (behavior=${behavior})`);
      break;
    case 'burn':
    case 'expire':
    default:
      break;
  }
}
