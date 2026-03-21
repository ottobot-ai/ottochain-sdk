/**
 * Governance State Machine Definitions
 */

export { governanceUniversalDef, type UniversalGovernanceState, type UniversalGovernanceEvent } from './governance-universal.js';
export { governanceSimpleDef, type SimpleGovernanceState, type SimpleGovernanceEvent } from './governance-simple.js';
export { daoSingleDef, type DaoSingleState, type DaoSingleEvent } from './dao-single.js';
export { daoMultisigDef, type DaoMultisigState, type DaoMultisigEvent } from './dao-multisig.js';
export { daoTokenDef, type DaoTokenState, type DaoTokenEvent } from './dao-token.js';
export { daoReputationDef, type DaoReputationState, type DaoReputationEvent } from './dao-reputation.js';

export const GOVERNANCE_DEFINITIONS = {
  universal: () => import('./governance-universal.js').then(m => m.governanceUniversalDef),
  simple: () => import('./governance-simple.js').then(m => m.governanceSimpleDef),
  daoSingle: () => import('./dao-single.js').then(m => m.daoSingleDef),
  daoMultisig: () => import('./dao-multisig.js').then(m => m.daoMultisigDef),
  daoToken: () => import('./dao-token.js').then(m => m.daoTokenDef),
  daoReputation: () => import('./dao-reputation.js').then(m => m.daoReputationDef),
} as const;

export type GovernanceType = keyof typeof GOVERNANCE_DEFINITIONS;
