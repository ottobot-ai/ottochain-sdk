/**
 * Markets Application
 *
 * Types and utilities for markets on OttoChain: predictions, auctions, crowdfunding, group buys.
 *
 * @example
 * ```typescript
 * import {
 *   MarketType,
 *   MarketState,
 *   Market,
 *   getMarketDefinition,
 *   MARKETS_DEFINITIONS
 * } from '@ottochain/sdk/apps/markets';
 *
 * const predictionDef = getMarketDefinition('prediction');
 * const auctionDef = getMarketDefinition('auction');
 * ```
 *
 * @packageDocumentation
 */

// Re-export generated protobuf types (source of truth)
export {
  MarketType,
  MarketState,
  Commitment,
  Resolution,
  Market,
  CreateMarketRequest,
  CommitToMarketRequest,
  SubmitResolutionRequest,
  CancelMarketRequest,
  MarketDefinition,
  marketTypeFromJSON,
  marketTypeToJSON,
  marketStateFromJSON,
  marketStateToJSON,
} from '../../generated/ottochain/apps/markets/v1/market.js';

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef,
} from './state-machines/index.js';

export {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef,
};

/** All market state machine definitions */
export const MARKETS_DEFINITIONS = {
  universal: marketUniversalDef,
  prediction: marketPredictionDef,
  auction: marketAuctionDef,
  crowdfund: marketCrowdfundDef,
  groupBuy: marketGroupBuyDef,
} as const;

export type MarketDefType = keyof typeof MARKETS_DEFINITIONS;

/**
 * Get a market state machine definition by type.
 * @param type - 'universal' | 'prediction' | 'auction' | 'crowdfund' | 'groupBuy' (default: 'universal')
 */
export function getMarketDefinition(type: MarketDefType = 'universal'): unknown {
  return MARKETS_DEFINITIONS[type];
}
