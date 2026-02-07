/**
 * Markets Application
 *
 * Types and utilities for the Markets system on OttoChain.
 * Supports prediction markets, auctions, crowdfunding, and group buys.
 *
 * @example
 * ```typescript
 * import {
 *   MarketState,
 *   MarketType,
 *   calculatePayout,
 *   DEFAULT_MARKET_CONFIG
 * } from '@ottochain/sdk/apps/markets';
 *
 * // Calculate payout for a winning prediction
 * const payout = calculatePayout({
 *   winningPool: 1000n,
 *   losingPool: 500n,
 *   userCommitment: 100n,
 * });
 * ```
 *
 * @packageDocumentation
 */
export * from './types.js';
