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
Object.defineProperty(exports, "__esModule", { value: true });
// Note: Once proto files are generated, uncomment these exports:
// export * from '../../generated/ottochain/apps/markets/v1/market_pb.js';
// export * from '../../generated/ottochain/apps/markets/v1/commitment_pb.js';
// Export convenience types, constants, and helpers
__exportStar(require("./types.js"), exports);
