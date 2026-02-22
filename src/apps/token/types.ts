/**
 * Token Application — Type Definitions
 *
 * 4-bit TDEG model:
 *   Bit 3 (8): T = Transferable
 *   Bit 2 (4): D = Divisible
 *   Bit 1 (2): E = Expirable
 *   Bit 0 (1): G = Governable
 */

/** 4-bit integer 0–15 encoding TDEG token behaviors. */
export type TokenBehavior = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const TOKEN_BEHAVIOR_FLAGS = {
  TRANSFERABLE: 0b1000,
  DIVISIBLE:    0b0100,
  EXPIRABLE:    0b0010,
  GOVERNABLE:   0b0001,
} as const;

export const TOKEN_BEHAVIOR_TYPES = {
  SOULBOUND_RECEIPT:           0,
  GOVERNED_BADGE:              1,
  EXPIRABLE_CREDENTIAL:        2,
  GOVERNED_LICENSE:            3,
  LOYALTY_POINTS:              4,
  GOVERNED_ALLOCATION:         5,
  EXPIRABLE_POINTS:            6,
  GOVERNED_EXPIRABLE_POINTS:   7,
  NFT:                         8,
  GOVERNED_NFT:                9,
  EXPIRABLE_NFT:               10,
  GOVERNED_EXPIRABLE_NFT:      11,
  FUNGIBLE_TOKEN:              12,
  GOVERNED_FUNGIBLE_TOKEN:     13,
  EXPIRABLE_FUNGIBLE_TOKEN:    14,
  GOVERNED_EXPIRABLE_FUNGIBLE: 15,
} as const;

export const TOKEN_BEHAVIOR_NAMES: Record<number, string> = {
  0:  'SOULBOUND_RECEIPT',
  1:  'GOVERNED_BADGE',
  2:  'EXPIRABLE_CREDENTIAL',
  3:  'GOVERNED_LICENSE',
  4:  'LOYALTY_POINTS',
  5:  'GOVERNED_ALLOCATION',
  6:  'EXPIRABLE_POINTS',
  7:  'GOVERNED_EXPIRABLE_POINTS',
  8:  'NFT',
  9:  'GOVERNED_NFT',
  10: 'EXPIRABLE_NFT',
  11: 'GOVERNED_EXPIRABLE_NFT',
  12: 'FUNGIBLE_TOKEN',
  13: 'GOVERNED_FUNGIBLE_TOKEN',
  14: 'EXPIRABLE_FUNGIBLE_TOKEN',
  15: 'GOVERNED_EXPIRABLE_FUNGIBLE',
};

// ── Wire-format types ──────────────────────────────────────────────────────

export interface WireStateId { value: string; }

export interface WireState {
  id: WireStateId;
  isFinal: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface WireTransition {
  from: WireStateId;
  to: WireStateId;
  eventName: string;
  guard: unknown | null;
  effect: unknown | null;
  dependencies?: string[];
}

export interface TokenStateMachineMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  tokenBehavior: number;
}

export interface TokenStateMachineDefinition {
  metadata: TokenStateMachineMetadata;
  states: Record<string, WireState>;
  initialState: WireStateId;
  transitions: WireTransition[];
}

// ── Token Event Types ────────────────────────────────────────────────────────

export interface TransferEvent {
  eventName: 'transfer';
  fiberId: string;
  recipient: string;
  amount?: number;
}

export interface SplitEvent {
  eventName: 'split';
  fiberId: string;
  amount: number;
  childFiberId?: string;
}

export interface MergeEvent {
  eventName: 'merge';
  fiberId: string;
  sourceFiberId: string;
  amount: number;
}

export interface ExpireEvent {
  eventName: 'expire';
  fiberId: string;
}

export interface BurnEvent {
  eventName: 'burn';
  fiberId: string;
}

export type TokenEvent = TransferEvent | SplitEvent | MergeEvent | ExpireEvent | BurnEvent;
