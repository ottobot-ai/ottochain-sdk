"use strict";
/**
 * Governance and DAO type definitions
 *
 * TypeScript interfaces for governance state machines and DAO configurations.
 * These types represent the on-chain governance primitives: voting, proposals,
 * delegations, and multi-branch governance structures.
 *
 * @see governance/*.json for JSON state machine definitions
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStateMachineDefinition = exports.getGovernanceDefinition = exports.getDAODefinition = exports.GOVERNANCE_DEFINITIONS = exports.DAO_DEFINITIONS = void 0;
// ---------------------------------------------------------------------------
// State Machine Definitions (imported from JSON)
// ---------------------------------------------------------------------------
// Import governance state machine definitions
// Using standard imports (resolveJsonModule enabled in tsconfig)
const dao_multisig_json_1 = __importDefault(require("./governance/dao-multisig.json"));
const dao_single_json_1 = __importDefault(require("./governance/dao-single.json"));
const dao_threshold_json_1 = __importDefault(require("./governance/dao-threshold.json"));
const dao_token_json_1 = __importDefault(require("./governance/dao-token.json"));
const governance_constitution_json_1 = __importDefault(require("./governance/governance-constitution.json"));
const governance_executive_json_1 = __importDefault(require("./governance/governance-executive.json"));
const governance_judiciary_json_1 = __importDefault(require("./governance/governance-judiciary.json"));
const governance_legislature_json_1 = __importDefault(require("./governance/governance-legislature.json"));
const governance_simple_json_1 = __importDefault(require("./governance/governance-simple.json"));
/**
 * DAO state machine definitions by type.
 */
exports.DAO_DEFINITIONS = {
    Single: dao_single_json_1.default,
    Multisig: dao_multisig_json_1.default,
    Threshold: dao_threshold_json_1.default,
    Token: dao_token_json_1.default,
};
/**
 * Governance state machine definitions by type.
 */
exports.GOVERNANCE_DEFINITIONS = {
    Legislature: governance_legislature_json_1.default,
    Executive: governance_executive_json_1.default,
    Judiciary: governance_judiciary_json_1.default,
    Constitution: governance_constitution_json_1.default,
    Simple: governance_simple_json_1.default,
};
/**
 * Get the state machine definition for a DAO type.
 */
function getDAODefinition(daoType) {
    const def = exports.DAO_DEFINITIONS[daoType];
    if (!def) {
        throw new Error(`Unknown DAO type: ${daoType}`);
    }
    return def;
}
exports.getDAODefinition = getDAODefinition;
/**
 * Get the state machine definition for a governance type.
 */
function getGovernanceDefinition(governanceType) {
    const def = exports.GOVERNANCE_DEFINITIONS[governanceType];
    if (!def) {
        throw new Error(`Unknown governance type: ${governanceType}`);
    }
    return def;
}
exports.getGovernanceDefinition = getGovernanceDefinition;
/**
 * Extract state machine definition from JSON governance file.
 * Returns just the states, initialState, and transitions needed for CreateStateMachine.
 */
function extractStateMachineDefinition(jsonDef) {
    const def = jsonDef;
    return {
        states: def.states,
        initialState: def.initialState,
        transitions: def.transitions,
        metadata: def.metadata,
    };
}
exports.extractStateMachineDefinition = extractStateMachineDefinition;
