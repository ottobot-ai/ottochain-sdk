"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketDefinition = exports.MARKET_DEFINITIONS = void 0;
// Re-export generated protobuf types
__exportStar(require("../../generated/ottochain/apps/markets/v1/market_pb.js"), exports);
// Export convenience types, constants, and helpers
__exportStar(require("./types.js"), exports);
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const market_universal_json_1 = __importDefault(require("./state-machines/market-universal.json"));
/**
 * Market state machine definitions mapped by type.
 */
exports.MARKET_DEFINITIONS = {
    Universal: market_universal_json_1.default,
};
/**
 * Get the market state machine definition.
 *
 * @param type - Definition type (default: 'Universal')
 * @returns The state machine definition JSON
 */
function getMarketDefinition(type = 'Universal') {
    const def = exports.MARKET_DEFINITIONS[type];
    if (!def) {
        throw new Error(`Unknown market definition type: ${type}`);
    }
    return def;
}
exports.getMarketDefinition = getMarketDefinition;
