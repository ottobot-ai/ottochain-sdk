/**
 * DataUpdate Signing Wrappers — dropNulls applied internally
 *
 * Metakit (>= 1.8) computes content hashes by recursively dropping
 * null-valued OBJECT fields (array nulls are preserved) before RFC 8785
 * canonicalization (`JsonBinaryCodec.dropNulls`). This makes
 * `Option = None` indistinguishable from an absent field, so schema
 * evolution never changes prior hashes.
 *
 * The upstream `@constellation-network/metagraph-sdk` signs over the
 * payload as-is, so a payload containing explicit nulls would be signed
 * over different bytes than the metagraph hashes — and the node rejects
 * the signature (HTTP 400).
 *
 * These wrappers shadow the upstream dataUpdate signing surface and apply
 * `dropNulls` internally, unconditionally. Standard-mode signing
 * (currency transactions etc.) is passed through unchanged.
 */

import {
  signDataUpdate as baseSignDataUpdate,
  createSignedObject as baseCreateSignedObject,
  addSignature as baseAddSignature,
  batchSign as baseBatchSign,
} from '@constellation-network/metagraph-sdk';
import type {
  SignatureProof,
  Signed,
  SigningOptions,
  SigningMode,
} from '@constellation-network/metagraph-sdk';
import { dropNulls } from './ottochain/drop-nulls.js';

function resolveMode(options: SigningOptions = {}): SigningMode {
  if (options.mode) return options.mode;
  if (options.isDataUpdate) return 'dataUpdate';
  return 'standard';
}

/**
 * Sign data as a DataUpdate, hashing over null-dropped canonical bytes.
 *
 * Applies `dropNulls` internally so that explicit-null and absent optional
 * fields produce identical signatures, matching metakit's content-hash rule
 * (drop null object fields, preserve array nulls, then RFC 8785).
 */
export function signDataUpdate<T>(data: T, privateKey: string): SignatureProof {
  return baseSignDataUpdate(dropNulls(data), privateKey);
}

/**
 * Create a signed object. In `dataUpdate` mode the signature is computed
 * over the null-dropped canonical bytes (the returned `value` is the
 * caller's original payload, untouched).
 */
export function createSignedObject<T>(
  value: T,
  privateKey: string,
  options: SigningOptions = {}
): Signed<T> {
  if (resolveMode(options) === 'dataUpdate') {
    const signed = baseCreateSignedObject(dropNulls(value), privateKey, options);
    return { ...signed, value };
  }
  return baseCreateSignedObject(value, privateKey, options);
}

/**
 * Add an additional signature to an existing signed object. In
 * `dataUpdate` mode the new signature is computed over the null-dropped
 * canonical bytes of `signed.value`.
 */
export function addSignature<T>(
  signed: Signed<T>,
  privateKey: string,
  options?: SigningOptions
): Signed<T> {
  const mode = options ? resolveMode(options) : ((signed as Signed<T> & { mode?: SigningMode }).mode ?? 'standard');
  if (mode === 'dataUpdate') {
    const result = baseAddSignature({ ...signed, value: dropNulls(signed.value) }, privateKey, options);
    return { ...result, value: signed.value };
  }
  return baseAddSignature(signed, privateKey, options);
}

/**
 * Create a signed object with multiple signatures at once. In
 * `dataUpdate` mode all signatures are computed over the null-dropped
 * canonical bytes (the returned `value` is the caller's original payload).
 */
export function batchSign<T>(
  value: T,
  privateKeys: string[],
  options: SigningOptions = {}
): Signed<T> {
  if (resolveMode(options) === 'dataUpdate') {
    const signed = baseBatchSign(dropNulls(value), privateKeys, options);
    return { ...signed, value };
  }
  return baseBatchSign(value, privateKeys, options);
}
