"use strict";
/**
 * Metakit SDK
 *
 * Reusable signing, encoding, and network operations for Constellation metagraphs.
 * This module is framework-level functionality, independent of any specific metagraph domain.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.HttpClient = exports.DataL1Client = exports.CurrencyL1Client = exports.unitsToToken = exports.tokenToUnits = exports.isValidDagAddress = exports.getTransactionReference = exports.hashCurrencyTransaction = exports.encodeCurrencyTransaction = exports.verifyCurrencyTransaction = exports.signCurrencyTransaction = exports.createCurrencyTransactionBatch = exports.createCurrencyTransaction = exports.TOKEN_DECIMALS = exports.isValidPublicKey = exports.isValidPrivateKey = exports.getAddress = exports.getPublicKeyId = exports.getPublicKeyHex = exports.keyPairFromPrivateKey = exports.generateKeyPair = exports.batchSign = exports.addSignature = exports.createSignedObject = exports.verifySignature = exports.verifyHash = exports.verify = exports.signHash = exports.signDataUpdate = exports.sign = exports.decodeDataUpdate = exports.computeDigest = exports.hashData = exports.hashBytes = exports.hash = exports.encodeDataUpdate = exports.toBytes = exports.canonicalize = exports.CONSTELLATION_PREFIX = exports.ALGORITHM = void 0;
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "ALGORITHM", { enumerable: true, get: function () { return types_js_1.ALGORITHM; } });
Object.defineProperty(exports, "CONSTELLATION_PREFIX", { enumerable: true, get: function () { return types_js_1.CONSTELLATION_PREFIX; } });
// Canonicalization
var canonicalize_js_1 = require("./canonicalize.js");
Object.defineProperty(exports, "canonicalize", { enumerable: true, get: function () { return canonicalize_js_1.canonicalize; } });
// Binary encoding
var binary_js_1 = require("./binary.js");
Object.defineProperty(exports, "toBytes", { enumerable: true, get: function () { return binary_js_1.toBytes; } });
Object.defineProperty(exports, "encodeDataUpdate", { enumerable: true, get: function () { return binary_js_1.encodeDataUpdate; } });
// Hashing
var hash_js_1 = require("./hash.js");
Object.defineProperty(exports, "hash", { enumerable: true, get: function () { return hash_js_1.hash; } });
Object.defineProperty(exports, "hashBytes", { enumerable: true, get: function () { return hash_js_1.hashBytes; } });
Object.defineProperty(exports, "hashData", { enumerable: true, get: function () { return hash_js_1.hashData; } });
Object.defineProperty(exports, "computeDigest", { enumerable: true, get: function () { return hash_js_1.computeDigest; } });
// Codec utilities
var codec_js_1 = require("./codec.js");
Object.defineProperty(exports, "decodeDataUpdate", { enumerable: true, get: function () { return codec_js_1.decodeDataUpdate; } });
// Signing
var sign_js_1 = require("./sign.js");
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return sign_js_1.sign; } });
Object.defineProperty(exports, "signDataUpdate", { enumerable: true, get: function () { return sign_js_1.signDataUpdate; } });
Object.defineProperty(exports, "signHash", { enumerable: true, get: function () { return sign_js_1.signHash; } });
// Verification
var verify_js_1 = require("./verify.js");
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return verify_js_1.verify; } });
Object.defineProperty(exports, "verifyHash", { enumerable: true, get: function () { return verify_js_1.verifyHash; } });
Object.defineProperty(exports, "verifySignature", { enumerable: true, get: function () { return verify_js_1.verifySignature; } });
// High-level API
var signed_object_js_1 = require("./signed-object.js");
Object.defineProperty(exports, "createSignedObject", { enumerable: true, get: function () { return signed_object_js_1.createSignedObject; } });
Object.defineProperty(exports, "addSignature", { enumerable: true, get: function () { return signed_object_js_1.addSignature; } });
Object.defineProperty(exports, "batchSign", { enumerable: true, get: function () { return signed_object_js_1.batchSign; } });
// Wallet utilities
var wallet_js_1 = require("./wallet.js");
Object.defineProperty(exports, "generateKeyPair", { enumerable: true, get: function () { return wallet_js_1.generateKeyPair; } });
Object.defineProperty(exports, "keyPairFromPrivateKey", { enumerable: true, get: function () { return wallet_js_1.keyPairFromPrivateKey; } });
Object.defineProperty(exports, "getPublicKeyHex", { enumerable: true, get: function () { return wallet_js_1.getPublicKeyHex; } });
Object.defineProperty(exports, "getPublicKeyId", { enumerable: true, get: function () { return wallet_js_1.getPublicKeyId; } });
Object.defineProperty(exports, "getAddress", { enumerable: true, get: function () { return wallet_js_1.getAddress; } });
Object.defineProperty(exports, "isValidPrivateKey", { enumerable: true, get: function () { return wallet_js_1.isValidPrivateKey; } });
Object.defineProperty(exports, "isValidPublicKey", { enumerable: true, get: function () { return wallet_js_1.isValidPublicKey; } });
var currency_types_js_1 = require("./currency-types.js");
Object.defineProperty(exports, "TOKEN_DECIMALS", { enumerable: true, get: function () { return currency_types_js_1.TOKEN_DECIMALS; } });
// Currency transaction operations
var currency_transaction_js_1 = require("./currency-transaction.js");
Object.defineProperty(exports, "createCurrencyTransaction", { enumerable: true, get: function () { return currency_transaction_js_1.createCurrencyTransaction; } });
Object.defineProperty(exports, "createCurrencyTransactionBatch", { enumerable: true, get: function () { return currency_transaction_js_1.createCurrencyTransactionBatch; } });
Object.defineProperty(exports, "signCurrencyTransaction", { enumerable: true, get: function () { return currency_transaction_js_1.signCurrencyTransaction; } });
Object.defineProperty(exports, "verifyCurrencyTransaction", { enumerable: true, get: function () { return currency_transaction_js_1.verifyCurrencyTransaction; } });
Object.defineProperty(exports, "encodeCurrencyTransaction", { enumerable: true, get: function () { return currency_transaction_js_1.encodeCurrencyTransaction; } });
Object.defineProperty(exports, "hashCurrencyTransaction", { enumerable: true, get: function () { return currency_transaction_js_1.hashCurrencyTransaction; } });
Object.defineProperty(exports, "getTransactionReference", { enumerable: true, get: function () { return currency_transaction_js_1.getTransactionReference; } });
Object.defineProperty(exports, "isValidDagAddress", { enumerable: true, get: function () { return currency_transaction_js_1.isValidDagAddress; } });
Object.defineProperty(exports, "tokenToUnits", { enumerable: true, get: function () { return currency_transaction_js_1.tokenToUnits; } });
Object.defineProperty(exports, "unitsToToken", { enumerable: true, get: function () { return currency_transaction_js_1.unitsToToken; } });
// Network operations
var index_js_1 = require("./network/index.js");
Object.defineProperty(exports, "CurrencyL1Client", { enumerable: true, get: function () { return index_js_1.CurrencyL1Client; } });
Object.defineProperty(exports, "DataL1Client", { enumerable: true, get: function () { return index_js_1.DataL1Client; } });
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return index_js_1.HttpClient; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return index_js_1.NetworkError; } });
