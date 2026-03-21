/**
 * Identity State Machine Definitions
 * 
 * TypeScript-first definitions - no JSON, no code generation.
 */

export { identityAgentDef, type AgentState, type AgentEvent } from './identity-agent.js';
export { identityOracleDef, type OracleState, type OracleEvent } from './identity-oracle.js';
export { identityUniversalDef, type UniversalIdentityState, type UniversalIdentityEvent } from './identity-universal.js';

// Re-export all definitions as a record for iteration
export const IDENTITY_DEFINITIONS = {
  agent: () => import('./identity-agent.js').then(m => m.identityAgentDef),
  oracle: () => import('./identity-oracle.js').then(m => m.identityOracleDef),
  universal: () => import('./identity-universal.js').then(m => m.identityUniversalDef),
} as const;

export type IdentityType = keyof typeof IDENTITY_DEFINITIONS;
