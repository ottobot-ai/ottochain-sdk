/**
 * Markets Application
 *
 * Types and utilities for markets on OttoChain: predictions, auctions, crowdfunding, group buys.
 *
 * @example
 * ```typescript
 * import {
 *   Type,
 *   State,
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

// Re-export generated protobuf types (source of truth).
// The nested lifecycle/kind enums dropped their app prefix in the proto; under
// this app-scoped entrypoint they are unambiguously Type / State.
export {
  Type,
  State,
  Commitment,
  Resolution,
  Market,
  CreateMarketRequest,
  CommitToMarketRequest,
  SubmitResolutionRequest,
  CancelMarketRequest,
  MarketDefinition,
  typeFromJSON,
  typeToJSON,
  stateFromJSON,
  stateToJSON,
} from '../../generated/ottochain/apps/markets/v1/market.js';

// Deprecated app-prefixed aliases (renamed to Type / State); kept for compat.
export {
  Type as MarketType,
  State as MarketState,
  typeFromJSON as marketTypeFromJSON,
  typeToJSON as marketTypeToJSON,
  stateFromJSON as marketStateFromJSON,
  stateToJSON as marketStateToJSON,
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
import type { FiberAppDefinition } from '../../schema/fiber-app.js';

export { marketUniversalDef, marketPredictionDef, marketAuctionDef, marketCrowdfundDef, marketGroupBuyDef };

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
export function getMarketDefinition(type: MarketDefType = 'universal'): FiberAppDefinition {
  return MARKETS_DEFINITIONS[type];
}
