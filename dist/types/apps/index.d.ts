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
 * const { AgentState, AGENT_TRANSITIONS } = identity;
 *
 * // Use market calculations
 * const payout = markets.calculatePayout(shares);
 *
 * // Check oracle reputation
 * const newRep = oracles.calculateReputation(current, delta);
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
export * as identity from './identity/index.js';
export * as contracts from './contracts/index.js';
export * as markets from './markets/index.js';
export * as oracles from './oracles/index.js';
export * as governance from './governance/index.js';
export * as corporate from './corporate/index.js';
export * from './identity/index.js';
export * from './contracts/index.js';
export * from './markets/index.js';
export * from './oracles/index.js';
export * from './governance/index.js';
export * from './corporate/index.js';
