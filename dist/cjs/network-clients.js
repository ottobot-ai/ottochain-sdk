"use strict";
/**
 * OttoChain network clients — CurrencyL1Client and DataL1Client.
 *
 * These clients provide a higher-level API on top of the HttpClient from
 * @constellation-network/metagraph-sdk/network, tailored for Constellation L1 nodes.
 *
 * HttpClient and NetworkError are re-exported from the package for convenience.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataL1Client = exports.CurrencyL1Client = exports.createMetagraphClient = exports.NetworkError = exports.HttpClient = void 0;
const network_1 = require("@constellation-network/metagraph-sdk/network");
var network_2 = require("@constellation-network/metagraph-sdk/network");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return network_2.HttpClient; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return network_2.NetworkError; } });
var network_3 = require("@constellation-network/metagraph-sdk/network");
Object.defineProperty(exports, "createMetagraphClient", { enumerable: true, get: function () { return network_3.createMetagraphClient; } });
// ─────────────────────────────────────────────────────────────────────────────
// CurrencyL1Client
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Client for interacting with Currency L1 nodes.
 *
 * @example
 * ```typescript
 * const client = new CurrencyL1Client({ l1Url: 'http://localhost:9010' });
 * const lastRef = await client.getLastReference('DAG...');
 * ```
 */
class CurrencyL1Client {
    constructor(config) {
        if (!config.l1Url) {
            throw new Error('l1Url is required for CurrencyL1Client');
        }
        this.client = new network_1.HttpClient(config.l1Url, config.timeout);
    }
    async getLastReference(address, options) {
        return this.client.get(`/transactions/last-reference/${address}`, options);
    }
    async postTransaction(transaction, options) {
        return this.client.post('/transactions', transaction, options);
    }
    async getPendingTransaction(hash, options) {
        try {
            return await this.client.get(`/transactions/${hash}`, options);
        }
        catch (error) {
            if (error instanceof network_1.NetworkError && error.statusCode === 404)
                return null;
            throw error;
        }
    }
    async checkHealth(options) {
        try {
            await this.client.get('/cluster/info', options);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.CurrencyL1Client = CurrencyL1Client;
// ─────────────────────────────────────────────────────────────────────────────
// DataL1Client
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Client for interacting with Data L1 nodes (metagraphs).
 *
 * @example
 * ```typescript
 * const client = new DataL1Client({ dataL1Url: 'http://localhost:8080' });
 * const result = await client.postData(signedData);
 * ```
 */
class DataL1Client {
    constructor(config) {
        if (!config.dataL1Url) {
            throw new Error('dataL1Url is required for DataL1Client');
        }
        this.client = new network_1.HttpClient(config.dataL1Url, config.timeout);
    }
    async estimateFee(data, options) {
        return this.client.post('/data/estimate-fee', data, options);
    }
    async postData(data, options) {
        return this.client.post('/data', data, options);
    }
    async checkHealth(options) {
        try {
            await this.client.get('/cluster/info', options);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.DataL1Client = DataL1Client;
