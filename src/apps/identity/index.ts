/**
 * Agent Identity Application
 * 
 * Types and utilities for the Agent Identity system on OttoChain.
 * 
 * @example
 * ```typescript
 * import { AgentState, AttestationType, DEFAULT_REPUTATION_CONFIG } from '@ottochain/sdk/apps/identity';
 * 
 * const agent: AgentIdentity = {
 *   address: 'DAG...',
 *   publicKey: '...',
 *   reputation: DEFAULT_REPUTATION_CONFIG.baseReputation,
 *   state: 'REGISTERED',
 *   platformLinks: [],
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString(),
 * };
 * ```
 * 
 * @packageDocumentation
 */

export * from './types.js';
