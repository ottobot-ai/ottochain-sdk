"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketDefinition = exports.MARKET_DEFINITIONS = exports.marketStateToJSON = exports.marketStateFromJSON = exports.marketTypeToJSON = exports.marketTypeFromJSON = exports.MarketDefinition = exports.CancelMarketRequest = exports.SubmitResolutionRequest = exports.CommitToMarketRequest = exports.CreateMarketRequest = exports.Market = exports.Resolution = exports.Commitment = exports.MarketState = exports.MarketType = void 0;
// Re-export generated protobuf types (source of truth)
var market_js_1 = require("../../generated/ottochain/apps/markets/v1/market.js");
Object.defineProperty(exports, "MarketType", { enumerable: true, get: function () { return market_js_1.MarketType; } });
Object.defineProperty(exports, "MarketState", { enumerable: true, get: function () { return market_js_1.MarketState; } });
Object.defineProperty(exports, "Commitment", { enumerable: true, get: function () { return market_js_1.Commitment; } });
Object.defineProperty(exports, "Resolution", { enumerable: true, get: function () { return market_js_1.Resolution; } });
Object.defineProperty(exports, "Market", { enumerable: true, get: function () { return market_js_1.Market; } });
Object.defineProperty(exports, "CreateMarketRequest", { enumerable: true, get: function () { return market_js_1.CreateMarketRequest; } });
Object.defineProperty(exports, "CommitToMarketRequest", { enumerable: true, get: function () { return market_js_1.CommitToMarketRequest; } });
Object.defineProperty(exports, "SubmitResolutionRequest", { enumerable: true, get: function () { return market_js_1.SubmitResolutionRequest; } });
Object.defineProperty(exports, "CancelMarketRequest", { enumerable: true, get: function () { return market_js_1.CancelMarketRequest; } });
Object.defineProperty(exports, "MarketDefinition", { enumerable: true, get: function () { return market_js_1.MarketDefinition; } });
Object.defineProperty(exports, "marketTypeFromJSON", { enumerable: true, get: function () { return market_js_1.marketTypeFromJSON; } });
Object.defineProperty(exports, "marketTypeToJSON", { enumerable: true, get: function () { return market_js_1.marketTypeToJSON; } });
Object.defineProperty(exports, "marketStateFromJSON", { enumerable: true, get: function () { return market_js_1.marketStateFromJSON; } });
Object.defineProperty(exports, "marketStateToJSON", { enumerable: true, get: function () { return market_js_1.marketStateToJSON; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const market_universal_json_1 = __importDefault(require("./state-machines/market-universal.json"));
exports.MARKET_DEFINITIONS = {
    Universal: market_universal_json_1.default,
};
/**
 * Get the market state machine definition.
 */
function getMarketDefinition(type = 'Universal') {
    return exports.MARKET_DEFINITIONS[type];
}
exports.getMarketDefinition = getMarketDefinition;
