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
 *   DEFAULT_MARKET_CONFIG,
 *   getMarketDefinition
 * } from '@ottochain/sdk/apps/markets';
 *
 * // Get the universal market state machine definition
 * const marketDef = getMarketDefinition();
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
export * from '../../generated/ottochain/apps/markets/v1/market_pb.js';
export * from './types.js';
/**
 * Market definition type.
 * Currently universal - handles all market types via the same state machine.
 */
export type MarketDefinitionType = 'Universal';
/**
 * Market state machine definitions mapped by type.
 */
export declare const MARKET_DEFINITIONS: Record<MarketDefinitionType, unknown>;
/**
 * Get the market state machine definition.
 *
 * @param type - Definition type (default: 'Universal')
 * @returns The state machine definition JSON
 */
export declare function getMarketDefinition(type?: MarketDefinitionType): unknown;
