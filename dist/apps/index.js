"use strict";
/**
 * OttoChain Applications
 *
 * Application-specific types and utilities for OttoChain SDK.
 *
 * @example
 * ```typescript
 * import { identity, contracts, markets, oracles } from '@ottochain/sdk/apps';
 *
 * // Use identity types
 * const { AgentState, AGENT_TRANSITIONS } = identity;
 *
 * // Use market calculations
 * const payout = markets.calculatePayout(shares);
 *
 * // Check oracle reputation
 * const newRep = oracles.calculateReputation(current, delta);
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oracles = exports.markets = exports.contracts = exports.identity = void 0;
// Re-export as namespaces for organized access
exports.identity = __importStar(require("./identity/index.js"));
exports.contracts = __importStar(require("./contracts/index.js"));
exports.markets = __importStar(require("./markets/index.js"));
exports.oracles = __importStar(require("./oracles/index.js"));
// Also allow direct imports
__exportStar(require("./identity/index.js"), exports);
__exportStar(require("./contracts/index.js"), exports);
__exportStar(require("./markets/index.js"), exports);
__exportStar(require("./oracles/index.js"), exports);
