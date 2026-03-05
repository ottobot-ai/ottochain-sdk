/**
 * Metakit SDK
 *
 * Reusable signing, encoding, and network operations for Constellation metagraphs.
 * This module is framework-level functionality, independent of any specific metagraph domain.
 *
 * Core functionality is now provided by @constellation-network/metagraph-sdk.
 * OttoChain-specific additions (transaction helpers, network compat wrappers) are maintained locally.
 *
 * @packageDocumentation
 */

// ─── Core re-exports from @constellation-network/metagraph-sdk ────────────────

// Core types
export type {
  SignatureProof,
  Signed,
  KeyPair,
  Hash,
  VerificationResult,
  SigningOptions,
  SigningMode,
} from '@constellation-network/metagraph-sdk';

export { ALGORITHM, CONSTELLATION_PREFIX } from '@constellation-network/metagraph-sdk';

// Canonicalization
export { canonicalize } from '@constellation-network/metagraph-sdk';

// Binary encoding
export { toBytes, encodeDataUpdate } from '@constellation-network/metagraph-sdk';

// Hashing
export { hash, hashBytes, hashData, computeDigest } from '@constellation-network/metagraph-sdk';

// Codec utilities
export { decodeDataUpdate } from '@constellation-network/metagraph-sdk';

// Signing
export { sign, signDataUpdate, signHash } from '@constellation-network/metagraph-sdk';

// Verification (local wrapper to preserve isDataUpdate backward compatibility)
export { verify, verifyHash, verifySignature } from './verify.js';

// High-level API (async wrappers for backward compatibility)
export { createSignedObject, addSignature, batchSign } from './signed-object.js';

// Wallet utilities
export {
  generateKeyPair,
  keyPairFromPrivateKey,
  getPublicKeyHex,
  getPublicKeyId,
  getAddress,
  isValidPrivateKey,
  isValidPublicKey,
} from '@constellation-network/metagraph-sdk';

// Currency transaction types
export type {
  TransactionReference,
  CurrencyTransactionValue,
  CurrencyTransaction,
  TransferParams,
} from '@constellation-network/metagraph-sdk';

export { TOKEN_DECIMALS } from '@constellation-network/metagraph-sdk';

// Currency transaction operations
// createCurrencyTransaction/Batch are wrapped as async for backward compatibility (see currency-transaction.ts)
export {
  createCurrencyTransaction,
  createCurrencyTransactionBatch,
  signCurrencyTransaction,
  verifyCurrencyTransaction,
  encodeCurrencyTransaction,
  hashCurrencyTransaction,
  getTransactionReference,
  isValidDagAddress,
  tokenToUnits,
  unitsToToken,
} from './currency-transaction.js';

// ─── Network operations (compat wrappers + package re-exports) ────────────────
export { CurrencyL1Client, DataL1Client, HttpClient, NetworkError } from './network/index.js';
export type {
  NetworkConfig,
  RequestOptions,
  TransactionStatus,
  PendingTransaction,
  PostTransactionResponse,
  EstimateFeeResponse,
  PostDataResponse,
} from './network/index.js';

// ─── OttoChain-specific transaction helpers ───────────────────────────────────

// Transaction helpers for self-signed mode
export {
  createTransitionPayload,
  createArchivePayload,
  createInvokeScriptPayload,
  signTransaction,
  addTransactionSignature,
  getPublicKeyForRegistration,
} from './transaction.js';
export {
  createStateMachinePayload,
  createScriptPayload,
  createDataTransactionRequest,
} from './transaction.js';
export type {
  CreateStateMachineParams,
  CreateStateMachineMessage,
  CreateScriptParams,
  CreateScriptMessage,
  DataTransactionRequest,
  TransitionParams,
  TransitionStateMachineMessage,
  ArchiveParams,
  ArchiveStateMachineMessage,
  InvokeScriptParams,
  InvokeScriptMessage,
} from './transaction.js';
