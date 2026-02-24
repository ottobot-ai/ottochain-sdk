"use strict";
/**
 * OttoChain Applications
 *
 * Application-specific types and utilities for OttoChain SDK.
 *
 * @example
 * ```typescript
 * import { identity, contracts, markets, oracles, governance } from '@ottochain/sdk/apps';
 *
 * // Use identity types
 * const { AgentState } = identity;
 *
 * // Check oracle reputation
 * const state = oracles.OracleState.ACTIVE;
 *
 * // Create a multisig DAO
 * const dao = governance.createMultisigState({
 *   name: 'Treasury',
 *   signers: ['DAG...', 'DAG...', 'DAG...'],
 *   threshold: 2
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.corporate = exports.governance = exports.oracles = exports.markets = exports.contracts = exports.identity = void 0;
// Re-export as namespaces for organized access
exports.identity = __importStar(require("./identity/index.js"));
exports.contracts = __importStar(require("./contracts/index.js"));
exports.markets = __importStar(require("./markets/index.js"));
exports.oracles = __importStar(require("./oracles/index.js"));
exports.governance = __importStar(require("./governance/index.js"));
exports.corporate = __importStar(require("./corporate/index.js"));
