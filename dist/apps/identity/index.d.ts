/**
 * Agent Identity Application
 *
 * Types and utilities for the Agent Identity system on OttoChain.
 *
 * @example
 * ```typescript
 * import { AgentState, AttestationType, AgentIdentitySchema } from '@ottochain/sdk/apps/identity';
 * import { create } from '@bufbuild/protobuf';
 *
 * const agent = create(AgentIdentitySchema, {
 *   publicKey: '...',
 *   reputation: 10,
 *   state: AgentState.REGISTERED,
 * });
 * ```
 *
 * @packageDocumentation
 */
export * from '../../generated/ottochain/apps/identity/v1/agent_pb.js';
export * from '../../generated/ottochain/apps/identity/v1/attestation_pb.js';
export * from './types.js';
