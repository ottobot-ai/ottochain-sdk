"use strict";
/**
 * Agent Identity Application
 *
 * Types and utilities for the Agent Identity system on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   AgentState,
 *   AgentIdentity,
 *   getIdentityDefinition
 * } from '@ottochain/sdk/apps/identity';
 *
 * const identityDef = getIdentityDefinition();
 * ```
 *
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdentityDefinition = exports.attestationTypeToJSON = exports.attestationTypeFromJSON = exports.ReputationConfig = exports.ChallengeRequest = exports.VouchRequest = exports.Attestation = exports.ReputationDelta = exports.AttestationType = exports.platformToJSON = exports.platformFromJSON = exports.agentStateToJSON = exports.agentStateFromJSON = exports.AgentIdentityDefinition = exports.AgentIdentity = exports.PlatformLink = exports.Platform = exports.AgentState = void 0;
// Re-export generated protobuf types (source of truth)
var agent_js_1 = require("../../generated/ottochain/apps/identity/v1/agent.js");
Object.defineProperty(exports, "AgentState", { enumerable: true, get: function () { return agent_js_1.AgentState; } });
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return agent_js_1.Platform; } });
Object.defineProperty(exports, "PlatformLink", { enumerable: true, get: function () { return agent_js_1.PlatformLink; } });
Object.defineProperty(exports, "AgentIdentity", { enumerable: true, get: function () { return agent_js_1.AgentIdentity; } });
Object.defineProperty(exports, "AgentIdentityDefinition", { enumerable: true, get: function () { return agent_js_1.AgentIdentityDefinition; } });
Object.defineProperty(exports, "agentStateFromJSON", { enumerable: true, get: function () { return agent_js_1.agentStateFromJSON; } });
Object.defineProperty(exports, "agentStateToJSON", { enumerable: true, get: function () { return agent_js_1.agentStateToJSON; } });
Object.defineProperty(exports, "platformFromJSON", { enumerable: true, get: function () { return agent_js_1.platformFromJSON; } });
Object.defineProperty(exports, "platformToJSON", { enumerable: true, get: function () { return agent_js_1.platformToJSON; } });
var attestation_js_1 = require("../../generated/ottochain/apps/identity/v1/attestation.js");
Object.defineProperty(exports, "AttestationType", { enumerable: true, get: function () { return attestation_js_1.AttestationType; } });
Object.defineProperty(exports, "ReputationDelta", { enumerable: true, get: function () { return attestation_js_1.ReputationDelta; } });
Object.defineProperty(exports, "Attestation", { enumerable: true, get: function () { return attestation_js_1.Attestation; } });
Object.defineProperty(exports, "VouchRequest", { enumerable: true, get: function () { return attestation_js_1.VouchRequest; } });
Object.defineProperty(exports, "ChallengeRequest", { enumerable: true, get: function () { return attestation_js_1.ChallengeRequest; } });
Object.defineProperty(exports, "ReputationConfig", { enumerable: true, get: function () { return attestation_js_1.ReputationConfig; } });
Object.defineProperty(exports, "attestationTypeFromJSON", { enumerable: true, get: function () { return attestation_js_1.attestationTypeFromJSON; } });
Object.defineProperty(exports, "attestationTypeToJSON", { enumerable: true, get: function () { return attestation_js_1.attestationTypeToJSON; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definition
// ---------------------------------------------------------------------------
const agent_identity_json_1 = __importDefault(require("./state-machines/agent-identity.json"));
/**
 * Get the agent identity state machine definition.
 *
 * @returns The state machine definition JSON for AgentIdentity
 */
function getIdentityDefinition() {
    return agent_identity_json_1.default;
}
exports.getIdentityDefinition = getIdentityDefinition;
