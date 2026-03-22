/**
 * OttoChain Applications
 *
 * Application-specific types and utilities for OttoChain SDK.
 *
 * Each app provides:
 * - Universal state machine (minimal, extensible)
 * - Specialized state machines (opinionated defaults)
 * - getXxxDefinition() helper to retrieve definitions
 *
 * @example
 * ```typescript
 * import { identity, contracts, markets, governance, corporate } from '@ottochain/sdk/apps';
 *
 * // Get identity definitions
 * const agentDef = identity.getIdentityDefinition('agent');
 * const oracleDef = identity.getIdentityDefinition('oracle');
 *
 * // Get market definitions
 * const predictionDef = markets.getMarketDefinition('prediction');
 * const auctionDef = markets.getMarketDefinition('auction');
 *
 * // Get DAO definitions
 * const multisigDef = governance.getGovernanceDefinition('daoMultisig');
 * ```
 *
 * @packageDocumentation
 */

// Re-export as namespaces for organized access
export * as identity from "./identity/index.js";
export * as contracts from "./contracts/index.js";
export * as markets from "./markets/index.js";
export * as governance from "./governance/index.js";
export * as corporate from "./corporate/index.js";
/** @deprecated Use `identity` — oracle types are unified into Identity */
export * as oracles from "./oracles/index.js";
