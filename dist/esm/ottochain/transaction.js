/**
 * Transaction Helpers for Self-Signed Mode
 *
 * These helpers create properly formatted payloads for the bridge's
 * self-signed mode, where clients sign their own transactions.
 */
import { signDataUpdate, getPublicKeyId } from '@constellation-network/metagraph-sdk';
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
export function createStateMachinePayload(params) {
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
export function createTransitionPayload(params) {
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
 * Create an archive payload ready for signing.
 *
 * @param params - Archive parameters
 * @returns An ArchiveStateMachine message ready for signing
 */
export function createArchivePayload(params) {
    return {
        ArchiveStateMachine: {
            fiberId: params.fiberId,
            targetSequenceNumber: params.targetSequenceNumber,
        },
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
 *   accessControl: { type: 'open' },
 * });
 * const signed = await signTransaction(script, privateKey);
 * ```
 */
export function createScriptPayload(params) {
    return {
        CreateScript: {
            fiberId: params.fiberId,
            scriptProgram: params.scriptProgram,
            initialState: params.initialState ?? null,
            accessControl: params.accessControl ?? { type: 'open' },
        },
    };
}
/**
 * Create an invoke script payload ready for signing.
 *
 * @param params - Invoke script parameters
 * @returns An InvokeScript message ready for signing
 */
export function createInvokeScriptPayload(params) {
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
export async function signTransaction(message, privateKey) {
    const proof = await signDataUpdate(message, privateKey);
    return {
        value: message,
        proofs: [proof],
    };
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
export function createDataTransactionRequest(signed) {
    return { data: signed, fee: null };
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
export async function addTransactionSignature(signed, privateKey) {
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
export function getPublicKeyForRegistration(privateKey) {
    return getPublicKeyId(privateKey);
}
