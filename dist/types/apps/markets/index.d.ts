/**
 * Markets Application
 *
 * Types and utilities for prediction markets on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   MarketType,
 *   MarketState,
 *   Market,
 *   getMarketDefinition
 * } from '@ottochain/sdk/apps/markets';
 *
 * const marketDef = getMarketDefinition();
 * ```
 *
 * @packageDocumentation
 */
export { MarketType, MarketState, Commitment, Resolution, Market, CreateMarketRequest, CommitToMarketRequest, SubmitResolutionRequest, CancelMarketRequest, MarketDefinition, marketTypeFromJSON, marketTypeToJSON, marketStateFromJSON, marketStateToJSON, } from '../../generated/ottochain/apps/markets/v1/market.js';
export type MarketDefinitionType = 'Universal';
export declare const MARKET_DEFINITIONS: Record<MarketDefinitionType, unknown>;
/**
 * Get the market state machine definition.
 */
export declare function getMarketDefinition(type?: MarketDefinitionType): unknown;
