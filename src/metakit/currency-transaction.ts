/**
 * Currency transaction operations — re-exported from @constellation-network/metagraph-sdk.
 *
 * Note: createCurrencyTransaction and createCurrencyTransactionBatch are wrapped as async
 * for backward compatibility with consumers that use .then()/.catch() or await on them.
 *
 * @packageDocumentation
 */

import {
  createCurrencyTransaction as _createCurrencyTransaction,
  createCurrencyTransactionBatch as _createCurrencyTransactionBatch,
} from '@constellation-network/metagraph-sdk';

import type { TransferParams, CurrencyTransaction, TransactionReference } from '@constellation-network/metagraph-sdk';

export {
  signCurrencyTransaction,
  verifyCurrencyTransaction,
  encodeCurrencyTransaction,
  hashCurrencyTransaction,
  getTransactionReference,
  isValidDagAddress,
  tokenToUnits,
  unitsToToken,
} from '@constellation-network/metagraph-sdk';

/**
 * Create and sign a currency transaction.
 *
 * Async wrapper around the package function for backward compatibility.
 */
export async function createCurrencyTransaction(
  params: TransferParams,
  privateKey: string,
  lastRef: TransactionReference
): Promise<CurrencyTransaction> {
  return _createCurrencyTransaction(params, privateKey, lastRef);
}

/**
 * Create and sign multiple currency transactions in a batch.
 *
 * Async wrapper around the package function for backward compatibility.
 */
export async function createCurrencyTransactionBatch(
  transfers: TransferParams[],
  privateKey: string,
  lastRef: TransactionReference
): Promise<CurrencyTransaction[]> {
  return _createCurrencyTransactionBatch(transfers, privateKey, lastRef);
}
