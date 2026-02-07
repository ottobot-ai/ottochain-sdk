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
// ---------------------------------------------------------------------------
// State Machine Definitions (imported from JSON)
// ---------------------------------------------------------------------------
// Import governance state machine definitions
// Using standard imports (resolveJsonModule enabled in tsconfig)
import daoMultisigDef from './governance/dao-multisig.json';
import daoSingleDef from './governance/dao-single.json';
import daoThresholdDef from './governance/dao-threshold.json';
import daoTokenDef from './governance/dao-token.json';
import govConstitutionDef from './governance/governance-constitution.json';
import govExecutiveDef from './governance/governance-executive.json';
import govJudiciaryDef from './governance/governance-judiciary.json';
import govLegislatureDef from './governance/governance-legislature.json';
import govSimpleDef from './governance/governance-simple.json';
/**
 * DAO state machine definitions by type.
 */
export const DAO_DEFINITIONS = {
    Single: daoSingleDef,
    Multisig: daoMultisigDef,
    Threshold: daoThresholdDef,
    Token: daoTokenDef,
};
/**
 * Governance state machine definitions by type.
 */
export const GOVERNANCE_DEFINITIONS = {
    Legislature: govLegislatureDef,
    Executive: govExecutiveDef,
    Judiciary: govJudiciaryDef,
    Constitution: govConstitutionDef,
    Simple: govSimpleDef,
};
/**
 * Get the state machine definition for a DAO type.
 */
export function getDAODefinition(daoType) {
    const def = DAO_DEFINITIONS[daoType];
    if (!def) {
        throw new Error(`Unknown DAO type: ${daoType}`);
    }
    return def;
}
/**
 * Get the state machine definition for a governance type.
 */
export function getGovernanceDefinition(governanceType) {
    const def = GOVERNANCE_DEFINITIONS[governanceType];
    if (!def) {
        throw new Error(`Unknown governance type: ${governanceType}`);
    }
    return def;
}
/**
 * Extract state machine definition from JSON governance file.
 * Returns just the states, initialState, and transitions needed for CreateStateMachine.
 */
export function extractStateMachineDefinition(jsonDef) {
    const def = jsonDef;
    return {
        states: def.states,
        initialState: def.initialState,
        transitions: def.transitions,
        metadata: def.metadata,
    };
}
