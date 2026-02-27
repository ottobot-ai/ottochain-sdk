/**
 * Transaction Helpers for Self-Signed Mode
 *
 * These helpers create properly formatted payloads for the bridge's
 * self-signed mode, where clients sign their own transactions.
 */

import { signDataUpdate } from './sign.js';
import type { Signed } from './types.js';
import { getPublicKeyId } from './wallet.js';

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
 * Add an additional signature to a signed transaction.
 *
 * Use this for multi-signature scenarios where multiple parties
 * need to sign the same transaction.
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
