/**
 * OttoChain Applications
 *
 * Application-specific types and utilities for OttoChain SDK.
 *
 * @example
 * ```typescript
 * import { identity, contracts, markets, oracles, governance } from '@ottochain/sdk/apps';
 *
 * // Use identity types
 * const { AgentState } = identity;
 *
 * // Check oracle reputation
 * const state = oracles.OracleState.ACTIVE;
 *
 * // Create a multisig DAO
 * const dao = governance.createMultisigState({
 *   name: 'Treasury',
 *   signers: ['DAG...', 'DAG...', 'DAG...'],
 *   threshold: 2
 * });
 * ```
 *
 * @packageDocumentation
 */
// Re-export as namespaces for organized access
export * as identity from './identity/index.js';
export * as contracts from './contracts/index.js';
export * as markets from './markets/index.js';
export * as oracles from './oracles/index.js';
export * as governance from './governance/index.js';
export * as corporate from './corporate/index.js';
