"use strict";
/**
 * Oracles Application
 *
 * Types and utilities for the Oracle system on OttoChain.
 * Oracles provide truth resolution for markets, disputes, and attestations.
 *
 * @example
 * ```typescript
 * import {
 *   OracleState,
 *   SlashingReason,
 *   calculateReputation,
 *   calculateSlashAmount,
 *   DEFAULT_ORACLE_CONFIG,
 *   getOracleDefinition
 * } from '@ottochain/sdk/apps/oracles';
 *
 * // Get the oracle state machine definition
 * const oracleDef = getOracleDefinition();
 *
 * // Calculate new reputation after successful resolution
 * const newRep = calculateReputation(50, REPUTATION_DELTAS.successfulResolution);
 *
 * // Calculate slash for timeout
 * const slashAmount = calculateSlashAmount(10000n, SlashingReason.TIMEOUT);
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
exports.getOracleDefinition = exports.ORACLE_DEFINITIONS = void 0;
// Re-export generated protobuf types
__exportStar(require("../../generated/ottochain/apps/oracles/v1/oracle_pb.js"), exports);
// Export convenience types, constants, and helpers
__exportStar(require("./types.js"), exports);
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const oracle_json_1 = __importDefault(require("./state-machines/oracle.json"));
/**
 * Oracle state machine definitions mapped by type.
 */
exports.ORACLE_DEFINITIONS = {
    Oracle: oracle_json_1.default,
};
/**
 * Get the oracle state machine definition.
 *
 * @param type - Definition type (default: 'Oracle')
 * @returns The state machine definition JSON
 */
function getOracleDefinition(type = 'Oracle') {
    const def = exports.ORACLE_DEFINITIONS[type];
    if (!def) {
        throw new Error(`Unknown oracle definition type: ${type}`);
    }
    return def;
}
exports.getOracleDefinition = getOracleDefinition;
