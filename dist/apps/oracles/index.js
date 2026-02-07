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
 *   DEFAULT_ORACLE_CONFIG
 * } from '@ottochain/sdk/apps/oracles';
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
Object.defineProperty(exports, "__esModule", { value: true });
// Note: Once proto files are generated, uncomment these exports:
// export * from '../../generated/ottochain/apps/oracles/v1/oracle_pb.js';
// export * from '../../generated/ottochain/apps/oracles/v1/resolution_pb.js';
// Export convenience types, constants, and helpers
__exportStar(require("./types.js"), exports);
