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

// Re-export generated protobuf types
export * from '../../generated/ottochain/apps/markets/v1/market_pb.js';

// Export convenience types, constants, and helpers
export * from './types.js';

// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import marketUniversalDef from './state-machines/market-universal.json';

/**
 * Market definition type.
 * Currently universal - handles all market types via the same state machine.
 */
export type MarketDefinitionType = 'Universal';

/**
 * Market state machine definitions mapped by type.
 */
export const MARKET_DEFINITIONS: Record<MarketDefinitionType, unknown> = {
  Universal: marketUniversalDef,
};

/**
 * Get the market state machine definition.
 * 
 * @param type - Definition type (default: 'Universal')
 * @returns The state machine definition JSON
 */
export function getMarketDefinition(type: MarketDefinitionType = 'Universal'): unknown {
  const def = MARKET_DEFINITIONS[type];
  if (!def) {
    throw new Error(`Unknown market definition type: ${type}`);
  }
  return def;
}
