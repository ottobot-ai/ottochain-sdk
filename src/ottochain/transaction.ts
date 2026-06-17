/**
 * Transaction Helpers for Self-Signed Mode
 *
 * These helpers create properly formatted payloads for the bridge's
 * self-signed mode, where clients sign their own transactions.
 */

import { getPublicKeyId } from '@constellation-network/metagraph-sdk';
import type { Signed } from '@constellation-network/metagraph-sdk';
import { signDataUpdate } from '../signing.js';

// ============================================================================
// State Machine Operations
// ============================================================================

/**
 * Parameters for creating a new state machine fiber
 */
export interface CreateStateMachineParams {
  fiberId: string;
  definition: Record<string, unknown>;
  initialData?: Record<string, unknown>;
  parentFiberId?: string;
}

/**
 * A CreateStateMachine message ready for signing
 */
export interface CreateStateMachineMessage {
  CreateStateMachine: {
    fiberId: string;
    definition: Record<string, unknown>;
    initialData: Record<string, unknown>;
    parentFiberId?: string;
  };
}

/**
 * Create a new state machine fiber payload.
 *
 * @param params - State machine creation parameters
 * @returns A CreateStateMachine message ready for signing
 *
 * @example
 * ```typescript
 * const create = createStateMachinePayload({
 *   fiberId: crypto.randomUUID(),
 *   definition: {
 *     states: { CREATED: { on: { activate: 'ACTIVE' } }, ACTIVE: {} },
 *     initialState: 'CREATED',
 *   },
 *   initialData: { owner: myAddress },
 * });
 * const signed = await signTransaction(create, privateKey);
 * ```
 */
export function createStateMachinePayload(params: CreateStateMachineParams): CreateStateMachineMessage {
  return {
    CreateStateMachine: {
      fiberId: params.fiberId,
      definition: params.definition,
      initialData: params.initialData ?? {},
      ...(params.parentFiberId ? { parentFiberId: params.parentFiberId } : {}),
    },
  };
}

/**
 * Parameters for creating a transition payload
 */
export interface TransitionParams {
  fiberId: string;
  eventName: string;
  payload?: Record<string, unknown>;
  targetSequenceNumber: number;
}

/**
 * A TransitionStateMachine message ready for signing
 */
export interface TransitionStateMachineMessage {
  TransitionStateMachine: {
    fiberId: string;
    eventName: string;
    payload: Record<string, unknown>;
    targetSequenceNumber: number;
  };
}

/**
 * Create a transition payload ready for signing.
 *
 * This creates the exact message structure expected by the metagraph.
 *
 * @param params - Transition parameters
 * @returns A TransitionStateMachine message ready for signing
 *
 * @example
 * ```typescript
 * const transition = createTransitionPayload({
 *   fiberId: 'my-fiber-id',
 *   eventName: 'activate',
 *   payload: {},
 *   targetSequenceNumber: 0,
 * });
 * ```
 */
export function createTransitionPayload(params: TransitionParams): TransitionStateMachineMessage {
  return {
    TransitionStateMachine: {
      fiberId: params.fiberId,
      eventName: params.eventName,
      payload: params.payload ?? {},
      targetSequenceNumber: params.targetSequenceNumber,
    },
  };
}

/**
 * Parameters for creating an archive payload
 */
export interface ArchiveParams {
  fiberId: string;
  targetSequenceNumber: number;
}

/**
 * An ArchiveStateMachine message ready for signing
 */
export interface ArchiveStateMachineMessage {
  ArchiveStateMachine: {
    fiberId: string;
    targetSequenceNumber: number;
  };
}

/**
 * Create an archive payload ready for signing.
 *
 * @param params - Archive parameters
 * @returns An ArchiveStateMachine message ready for signing
 */
export function createArchivePayload(params: ArchiveParams): ArchiveStateMachineMessage {
  return {
    ArchiveStateMachine: {
      fiberId: params.fiberId,
      targetSequenceNumber: params.targetSequenceNumber,
    },
  };
}

// ============================================================================
// Script Operations
// ============================================================================

/**
 * Parameters for creating a new script fiber
 */
export interface CreateScriptParams {
  fiberId: string;
  scriptProgram: Record<string, unknown>;
  initialState?: Record<string, unknown> | unknown[];
  accessControl?: Record<string, unknown>;
}

/**
 * A CreateScript message ready for signing
 */
export interface CreateScriptMessage {
  CreateScript: {
    fiberId: string;
    scriptProgram: Record<string, unknown>;
    initialState: Record<string, unknown> | unknown[] | null;
    accessControl: Record<string, unknown>;
  };
}

/**
 * Create a new script fiber payload.
 *
 * Note: `initialState` must be an object or array, NOT a primitive.
 *
 * @param params - Script creation parameters
 * @returns A CreateScript message ready for signing
 *
 * @example
 * ```typescript
 * const script = createScriptPayload({
 *   fiberId: crypto.randomUUID(),
 *   scriptProgram: {
 *     methods: {
 *       increment: { "+": [{ var: "state.value" }, 1] },
 *     },
 *   },
 *   initialState: { value: 0 },
 *   accessControl: { Public: {} },
 * });
 * const signed = await signTransaction(script, privateKey);
 * ```
 */
export function createScriptPayload(params: CreateScriptParams): CreateScriptMessage {
  return {
    CreateScript: {
      fiberId: params.fiberId,
      scriptProgram: params.scriptProgram,
      initialState: params.initialState ?? null,
      accessControl: params.accessControl ?? { Public: {} },
    },
  };
}

/**
 * Parameters for creating an invoke script payload
 */
export interface InvokeScriptParams {
  fiberId: string;
  method: string;
  args?: Record<string, unknown>;
  targetSequenceNumber: number;
}

/**
 * An InvokeScript message ready for signing
 */
export interface InvokeScriptMessage {
  InvokeScript: {
    fiberId: string;
    method: string;
    args: Record<string, unknown>;
    targetSequenceNumber: number;
  };
}

/**
 * Create an invoke script payload ready for signing.
 *
 * @param params - Invoke script parameters
 * @returns An InvokeScript message ready for signing
 */
export function createInvokeScriptPayload(params: InvokeScriptParams): InvokeScriptMessage {
  return {
    InvokeScript: {
      fiberId: params.fiberId,
      method: params.method,
      args: params.args ?? {},
      targetSequenceNumber: params.targetSequenceNumber,
    },
  };
}

/**
 * Sign a transaction payload for self-signed mode.
 *
 * This creates a Signed<T> object with the exact format expected by the bridge's
 * `/agent/transition` endpoint when using self-signed mode.
 *
 * The signature is computed over the null-dropped canonical bytes (null
 * object fields removed recursively, array nulls preserved, then RFC 8785),
 * matching metakit's content-hash rule. Explicit-null and absent optional
 * fields therefore produce identical signatures.
 *
 * @param message - The message to sign (e.g., from createTransitionPayload)
 * @param privateKey - The private key in hex format (64 characters)
 * @returns A signed object ready for submission to the bridge
 *
 * @example
 * ```typescript
 * import { createTransitionPayload, signTransaction, generateKeyPair } from '@ottochain/sdk';
 *
 * const keyPair = generateKeyPair();
 *
 * // Create the transition message
 * const transition = createTransitionPayload({
 *   fiberId: 'my-fiber-id',
 *   eventName: 'activate',
 *   payload: {},
 *   targetSequenceNumber: 0,
 * });
 *
 * // Sign it
 * const signedUpdate = await signTransaction(transition, keyPair.privateKey);
 *
 * // Submit to bridge
 * await fetch('https://bridge/agent/transition', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     fiberId: 'my-fiber-id',
 *     signedUpdate,
 *   }),
 * });
 * ```
 */
export async function signTransaction<T>(
  message: T,
  privateKey: string
): Promise<Signed<T>> {
  const proof = await signDataUpdate(message, privateKey);
  return {
    value: message,
    proofs: [proof],
  };
}

/**
 * A DataTransactionRequest ready for submission to the DL1 `/data` endpoint.
 */
export interface DataTransactionRequest<T> {
  data: Signed<T>;
  fee: null;
}

/**
 * Wrap a signed transaction in the DataTransactionRequest format
 * expected by tessellation's DL1 `/data` endpoint.
 *
 * @param signed - A signed transaction from signTransaction()
 * @returns Payload ready for POST to DL1 `/data`
 *
 * @example
 * ```typescript
 * const transition = createTransitionPayload({ ... });
 * const signed = await signTransaction(transition, privateKey);
 * const payload = createDataTransactionRequest(signed);
 *
 * // Submit directly to DL1
 * await fetch('http://dl1-node:9400/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload),
 * });
 * ```
 */
export function createDataTransactionRequest<T>(signed: Signed<T>): DataTransactionRequest<T> {
  return { data: signed, fee: null };
}

/**
 * Add an additional signature to a signed transaction.
 *
 * Use this for multi-signature scenarios where multiple parties
 * need to sign the same transaction.
 *
 * The new signature is computed over the null-dropped canonical bytes,
 * matching metakit's content-hash rule (see {@link signTransaction}).
 *
 * @param signed - The already-signed transaction
 * @param privateKey - Additional signer's private key
 * @returns Transaction with additional signature
 */
export async function addTransactionSignature<T>(
  signed: Signed<T>,
  privateKey: string
): Promise<Signed<T>> {
  const newProof = await signDataUpdate(signed.value, privateKey);
  return {
    value: signed.value,
    proofs: [...signed.proofs, newProof],
  };
}

/**
 * Get the public key ID from a private key in the format expected by registration.
 *
 * The bridge's self-signed registration expects the public key as a 128-character
 * hex string (without the 04 prefix).
 *
 * @param privateKey - Private key in hex format
 * @returns Public key ID (128 chars, no prefix)
 *
 * @example
 * ```typescript
 * const keyPair = generateKeyPair();
 * const publicKeyId = getPublicKeyForRegistration(keyPair.privateKey);
 *
 * await fetch('https://bridge/agent/register', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     signingMode: 'self',
 *     publicKey: publicKeyId,
 *     displayName: 'My Agent',
 *   }),
 * });
 * ```
 */
export function getPublicKeyForRegistration(privateKey: string): string {
  return getPublicKeyId(privateKey);
}
