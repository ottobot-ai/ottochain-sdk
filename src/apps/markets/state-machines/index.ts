/**
 * Market State Machine Definitions
 */

export { marketUniversalDef, type UniversalMarketState, type UniversalMarketEvent } from './market-universal.js';
export { marketPredictionDef, type PredictionState, type PredictionEvent } from './market-prediction.js';
export { marketAuctionDef, type AuctionState, type AuctionEvent } from './market-auction.js';
export { marketCrowdfundDef, type CrowdfundState, type CrowdfundEvent } from './market-crowdfund.js';
export { marketGroupBuyDef, type GroupBuyState, type GroupBuyEvent } from './market-group-buy.js';

export const MARKET_DEFINITIONS = {
  universal: () => import('./market-universal.js').then(m => m.marketUniversalDef),
  prediction: () => import('./market-prediction.js').then(m => m.marketPredictionDef),
  auction: () => import('./market-auction.js').then(m => m.marketAuctionDef),
  crowdfund: () => import('./market-crowdfund.js').then(m => m.marketCrowdfundDef),
  groupBuy: () => import('./market-group-buy.js').then(m => m.marketGroupBuyDef),
} as const;

export type MarketType = keyof typeof MARKET_DEFINITIONS;
