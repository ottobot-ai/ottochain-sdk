/**
 * Metakit SDK
 *
 * Reusable signing, encoding, and network operations for Constellation metagraphs.
 * This module is framework-level functionality, independent of any specific metagraph domain.
 *
 * @packageDocumentation
 */
export type { SignatureProof, Signed, KeyPair, Hash, VerificationResult, SigningOptions, } from './types.js';
export { ALGORITHM, CONSTELLATION_PREFIX } from './types.js';
export { canonicalize } from './canonicalize.js';
export { toBytes, encodeDataUpdate } from './binary.js';
export { hash, hashBytes, hashData, computeDigest } from './hash.js';
export { decodeDataUpdate } from './codec.js';
export { sign, signDataUpdate, signHash } from './sign.js';
export { verify, verifyHash, verifySignature } from './verify.js';
export { createSignedObject, addSignature, batchSign } from './signed-object.js';
export { generateKeyPair, keyPairFromPrivateKey, getPublicKeyHex, getPublicKeyId, getAddress, isValidPrivateKey, isValidPublicKey, } from './wallet.js';
export type { TransactionReference, CurrencyTransactionValue, CurrencyTransaction, TransferParams, } from './currency-types.js';
export { TOKEN_DECIMALS } from './currency-types.js';
export { createCurrencyTransaction, createCurrencyTransactionBatch, signCurrencyTransaction, verifyCurrencyTransaction, encodeCurrencyTransaction, hashCurrencyTransaction, getTransactionReference, isValidDagAddress, tokenToUnits, unitsToToken, } from './currency-transaction.js';
export { CurrencyL1Client, DataL1Client, HttpClient, NetworkError } from './network/index.js';
export type { NetworkConfig, RequestOptions, TransactionStatus, PendingTransaction, PostTransactionResponse, EstimateFeeResponse, PostDataResponse, } from './network/index.js';
