/**
 * Token Application
 *
 * TypeScript SDK utilities for building OttoChain token state machines.
 * Supports all 16 TDEG token archetypes via the `createTokenStateMachine` factory.
 *
 * @example
 * ```typescript
 * import {
 *   createTokenStateMachine,
 *   getNFTDefinition,
 *   TOKEN_BEHAVIOR_TYPES,
 *   makeTokenBehavior,
 *   isTransferable,
 * } from '@ottochain/sdk/apps/token';
 *
 * // Named preset
 * const nftDef = getNFTDefinition();
 *
 * // Parametric factory
 * const customDef = createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.GOVERNED_NFT);
 *
 * // Custom behavior
 * const myBehavior = makeTokenBehavior(true, true, false, false); // 12 = FUNGIBLE_TOKEN
 * const customFungible = createTokenStateMachine(myBehavior);
 * ```
 *
 * @packageDocumentation
 */

// Types and constants
export type { TokenBehavior, TokenStateMachineDefinition, TokenEvent } from "./types";
export type {
  TransferEvent,
  SplitEvent,
  MergeEvent,
  ExpireEvent,
  BurnEvent,
  WireState,
  WireStateId,
  WireTransition,
  TokenStateMachineMetadata,
} from "./types";
export {
  TOKEN_BEHAVIOR_FLAGS,
  TOKEN_BEHAVIOR_TYPES,
  TOKEN_BEHAVIOR_NAMES,
} from "./types";

// Predicates
export {
  makeTokenBehavior,
  isTransferable,
  isDivisible,
  isExpirable,
  isGovernable,
  describeTokenBehavior,
} from "./predicates";

// State machine factory and named presets
export {
  createTokenStateMachine,
  getNFTDefinition,
  getFungibleTokenDefinition,
  getStablecoinDefinition,
  getLicenseDefinition,
  getSoulboundBadgeDefinition,
} from "./state-machine";

// Event builders and validators
export {
  createTransferEvent,
  createSplitEvent,
  createMergeEvent,
  createExpireEvent,
  createBurnEvent,
  validateTokenEvent,
} from "./events";
