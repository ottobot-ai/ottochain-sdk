/**
 * Signed object utilities — local wrappers for @constellation-network/metagraph-sdk.
 *
 * createSignedObject and addSignature are wrapped as async for backward compatibility.
 * batchSign is wrapped as async and throws async for backward compatibility.
 *
 * @packageDocumentation
 */

import {
  createSignedObject as _createSignedObject,
  addSignature as _addSignature,
  batchSign as _batchSign,
} from '@constellation-network/metagraph-sdk';
import type { Signed, SigningOptions } from '@constellation-network/metagraph-sdk';

/**
 * Create a signed object with a single signature.
 * Async wrapper for backward compatibility.
 */
export async function createSignedObject<T>(
  value: T,
  privateKey: string,
  options?: SigningOptions
): Promise<Signed<T>> {
  return _createSignedObject(value, privateKey, options);
}

/**
 * Add an additional signature to an existing signed object.
 * Async wrapper for backward compatibility.
 */
export async function addSignature<T>(
  signed: Signed<T>,
  privateKey: string,
  options?: SigningOptions
): Promise<Signed<T>> {
  return _addSignature(signed, privateKey, options);
}

/**
 * Create a signed object with multiple signatures at once.
 * Async wrapper for backward compatibility; throws async if privateKeys is empty.
 */
export async function batchSign<T>(
  value: T,
  privateKeys: string[],
  options?: SigningOptions
): Promise<Signed<T>> {
  return _batchSign(value, privateKeys, options);
}
