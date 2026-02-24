"use strict";
/**
 * Oracles Application
 *
 * Types and utilities for oracles on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   OracleState,
 *   Oracle,
 *   getOracleDefinition,
 *   DEFAULT_ORACLE_CONFIG
 * } from '@ottochain/sdk/apps/oracles';
 *
 * const oracleDef = getOracleDefinition();
 * ```
 *
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ORACLE_CONFIG = exports.getOracleDefinition = exports.ORACLE_DEFINITIONS = exports.oracleStateToJSON = exports.oracleStateFromJSON = exports.OracleDefinition = exports.WithdrawOracleRequest = exports.SlashOracleRequest = exports.WithdrawStakeRequest = exports.AddStakeRequest = exports.ActivateOracleRequest = exports.RegisterOracleRequest = exports.Oracle = exports.SlashingEvent = exports.OracleReputation = exports.OracleState = void 0;
// Re-export generated protobuf types (source of truth)
var oracle_js_1 = require("../../generated/ottochain/apps/oracles/v1/oracle.js");
Object.defineProperty(exports, "OracleState", { enumerable: true, get: function () { return oracle_js_1.OracleState; } });
Object.defineProperty(exports, "OracleReputation", { enumerable: true, get: function () { return oracle_js_1.OracleReputation; } });
Object.defineProperty(exports, "SlashingEvent", { enumerable: true, get: function () { return oracle_js_1.SlashingEvent; } });
Object.defineProperty(exports, "Oracle", { enumerable: true, get: function () { return oracle_js_1.Oracle; } });
Object.defineProperty(exports, "RegisterOracleRequest", { enumerable: true, get: function () { return oracle_js_1.RegisterOracleRequest; } });
Object.defineProperty(exports, "ActivateOracleRequest", { enumerable: true, get: function () { return oracle_js_1.ActivateOracleRequest; } });
Object.defineProperty(exports, "AddStakeRequest", { enumerable: true, get: function () { return oracle_js_1.AddStakeRequest; } });
Object.defineProperty(exports, "WithdrawStakeRequest", { enumerable: true, get: function () { return oracle_js_1.WithdrawStakeRequest; } });
Object.defineProperty(exports, "SlashOracleRequest", { enumerable: true, get: function () { return oracle_js_1.SlashOracleRequest; } });
Object.defineProperty(exports, "WithdrawOracleRequest", { enumerable: true, get: function () { return oracle_js_1.WithdrawOracleRequest; } });
Object.defineProperty(exports, "OracleDefinition", { enumerable: true, get: function () { return oracle_js_1.OracleDefinition; } });
Object.defineProperty(exports, "oracleStateFromJSON", { enumerable: true, get: function () { return oracle_js_1.oracleStateFromJSON; } });
Object.defineProperty(exports, "oracleStateToJSON", { enumerable: true, get: function () { return oracle_js_1.oracleStateToJSON; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const oracle_json_1 = __importDefault(require("./state-machines/oracle.json"));
exports.ORACLE_DEFINITIONS = {
    Oracle: oracle_json_1.default,
};
/**
 * Get the oracle state machine definition.
 */
function getOracleDefinition(type = 'Oracle') {
    return exports.ORACLE_DEFINITIONS[type];
}
exports.getOracleDefinition = getOracleDefinition;
/**
 * Default oracle configuration.
 */
exports.DEFAULT_ORACLE_CONFIG = {
    minStake: 100,
    baseReputation: 10,
    reputationDecay: 0.95,
};
