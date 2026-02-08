"use strict";
/**
 * Contracts Application
 *
 * Types and utilities for the Contract system on OttoChain.
 * Contracts build on Identity - completions credit agent reputation.
 *
 * @example
 * ```typescript
 * import {
 *   ContractState,
 *   ContractSchema,
 *   getContractDefinition,
 *   getEscrowDefinition
 * } from '@ottochain/sdk/apps/contracts';
 * import { create } from '@bufbuild/protobuf';
 *
 * // Get state machine definitions
 * const contractDef = getContractDefinition();
 * const escrowDef = getEscrowDefinition();
 *
 * const contract = create(ContractSchema, {
 *   id: 'fiber-123',
 *   contractId: 'contract-001',
 *   state: ContractState.PROPOSED,
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
exports.getEscrowDefinition = exports.getContractDefinition = exports.CONTRACT_DEFINITIONS = void 0;
// Re-export generated protobuf types
__exportStar(require("../../generated/ottochain/apps/contracts/v1/contract_pb.js"), exports);
// Re-export convenience types and constants
__exportStar(require("./types.js"), exports);
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const contract_json_1 = __importDefault(require("./state-machines/contract.json"));
const escrow_json_1 = __importDefault(require("./state-machines/escrow.json"));
/**
 * Contract state machine definitions mapped by type.
 */
exports.CONTRACT_DEFINITIONS = {
    Contract: contract_json_1.default,
    Escrow: escrow_json_1.default,
};
/**
 * Get the Contract state machine definition.
 *
 * @returns The state machine definition JSON for Contract
 */
function getContractDefinition() {
    return contract_json_1.default;
}
exports.getContractDefinition = getContractDefinition;
/**
 * Get the Escrow state machine definition.
 *
 * @returns The state machine definition JSON for Escrow
 */
function getEscrowDefinition() {
    return escrow_json_1.default;
}
exports.getEscrowDefinition = getEscrowDefinition;
