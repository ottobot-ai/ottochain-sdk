/**
 * Token Application
 *
 * TypeScript SDK utilities for building OttoChain token state machines.
 * Supports all 16 TDEG token archetypes.
 *
 * @packageDocumentation
 */

export type { TokenBehavior, TokenStateMachineDefinition, TokenEvent, TransferEvent, SplitEvent, MergeEvent, ExpireEvent, BurnEvent, WireState, WireStateId, WireTransition, TokenStateMachineMetadata } from './types';
export { TOKEN_BEHAVIOR_FLAGS, TOKEN_BEHAVIOR_TYPES, TOKEN_BEHAVIOR_NAMES } from './types';

export { makeTokenBehavior, isTransferable, isDivisible, isExpirable, isGovernable, describeTokenBehavior } from './predicates';

export { createTokenStateMachine, getNFTDefinition, getFungibleTokenDefinition, getStablecoinDefinition, getLicenseDefinition, getSoulboundBadgeDefinition } from './state-machine';

export { createTransferEvent, createSplitEvent, createMergeEvent, createExpireEvent, createBurnEvent, validateTokenEvent } from './events';
