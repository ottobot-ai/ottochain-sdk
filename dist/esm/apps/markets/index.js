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
// Re-export generated protobuf types (source of truth)
export { MarketType, MarketState, Commitment, Resolution, Market, CreateMarketRequest, CommitToMarketRequest, SubmitResolutionRequest, CancelMarketRequest, MarketDefinition, marketTypeFromJSON, marketTypeToJSON, marketStateFromJSON, marketStateToJSON, } from '../../generated/ottochain/apps/markets/v1/market.js';
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
import marketUniversalDef from './state-machines/market-universal.json';
export const MARKET_DEFINITIONS = {
    Universal: marketUniversalDef,
};
/**
 * Get the market state machine definition.
 */
export function getMarketDefinition(type = 'Universal') {
    return MARKET_DEFINITIONS[type];
}
