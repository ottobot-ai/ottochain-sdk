/**
 * OttoChain Applications
 * 
 * Application-specific types and utilities for OttoChain SDK.
 * 
 * @example
 * ```typescript
 * import { identity, contracts, markets, oracles } from '@ottochain/sdk/apps';
 * 
 * // Use identity types
 * const { AgentState, AGENT_TRANSITIONS } = identity;
 * 
 * // Use market calculations
 * const payout = markets.calculatePayout(shares);
 * 
 * // Check oracle reputation
 * const newRep = oracles.calculateReputation(current, delta);
 * ```
 * 
 * @packageDocumentation
 */

// Re-export as namespaces for organized access
export * as identity from './identity/index.js';
export * as contracts from './contracts/index.js';
export * as markets from './markets/index.js';
export * as oracles from './oracles/index.js';

// Also allow direct imports
export * from './identity/index.js';
export * from './contracts/index.js';
export * from './markets/index.js';
export * from './oracles/index.js';
