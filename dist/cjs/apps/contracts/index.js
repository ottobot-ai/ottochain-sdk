"use strict";
/**
 * Contracts Application
 *
 * Types and utilities for smart contracts on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   ContractState,
 *   Contract,
 *   getContractDefinition,
 *   getEscrowDefinition
 * } from '@ottochain/sdk/apps/contracts';
 *
 * const contractDef = getContractDefinition();
 * ```
 *
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEscrowDefinition = exports.getContractDefinition = exports.CONTRACT_DEFINITIONS = exports.contractStateToJSON = exports.contractStateFromJSON = exports.ContractDefinition = exports.DisputeContractRequest = exports.RejectContractRequest = exports.CompleteContractRequest = exports.AcceptContractRequest = exports.ProposeContractRequest = exports.Contract = exports.ContractState = void 0;
// Re-export generated protobuf types (source of truth)
var contract_js_1 = require("../../generated/ottochain/apps/contracts/v1/contract.js");
Object.defineProperty(exports, "ContractState", { enumerable: true, get: function () { return contract_js_1.ContractState; } });
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return contract_js_1.Contract; } });
Object.defineProperty(exports, "ProposeContractRequest", { enumerable: true, get: function () { return contract_js_1.ProposeContractRequest; } });
Object.defineProperty(exports, "AcceptContractRequest", { enumerable: true, get: function () { return contract_js_1.AcceptContractRequest; } });
Object.defineProperty(exports, "CompleteContractRequest", { enumerable: true, get: function () { return contract_js_1.CompleteContractRequest; } });
Object.defineProperty(exports, "RejectContractRequest", { enumerable: true, get: function () { return contract_js_1.RejectContractRequest; } });
Object.defineProperty(exports, "DisputeContractRequest", { enumerable: true, get: function () { return contract_js_1.DisputeContractRequest; } });
Object.defineProperty(exports, "ContractDefinition", { enumerable: true, get: function () { return contract_js_1.ContractDefinition; } });
Object.defineProperty(exports, "contractStateFromJSON", { enumerable: true, get: function () { return contract_js_1.contractStateFromJSON; } });
Object.defineProperty(exports, "contractStateToJSON", { enumerable: true, get: function () { return contract_js_1.contractStateToJSON; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const contract_json_1 = __importDefault(require("./state-machines/contract.json"));
const escrow_json_1 = __importDefault(require("./state-machines/escrow.json"));
exports.CONTRACT_DEFINITIONS = {
    Contract: contract_json_1.default,
    Escrow: escrow_json_1.default,
};
/**
 * Get the contract state machine definition.
 */
function getContractDefinition() {
    return contract_json_1.default;
}
exports.getContractDefinition = getContractDefinition;
/**
 * Get the escrow state machine definition.
 */
function getEscrowDefinition() {
    return escrow_json_1.default;
}
exports.getEscrowDefinition = getEscrowDefinition;
