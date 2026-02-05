/**
 * Ottochain Metagraph Client
 *
 * Client for interacting with ottochain ML0 custom routes (/v1 prefix)
 * and framework snapshot endpoints.
 *
 * @see modules/l0/src/main/scala/xyz/kd5ujc/metagraph_l0/ML0CustomRoutes.scala
 * @see modules/data_l1/src/main/scala/xyz/kd5ujc/data_l1/DataL1CustomRoutes.scala
 * @packageDocumentation
 */
import { HttpClient } from '../metakit/network/client.js';
import { NetworkError } from '../metakit/network/types.js';
import { extractOnChainState } from './snapshot.js';
/**
 * Client for ottochain metagraph operations.
 *
 * Provides typed access to all ML0 custom routes (under /data-application/v1/)
 * and framework snapshot endpoints.
 *
 * @example
 * ```typescript
 * const client = new MetagraphClient({
 *   ml0Url: 'http://localhost:9200',
 *   dl1Url: 'http://localhost:9400',
 * });
 *
 * // Query on-chain state
 * const onChain = await client.getOnChain();
 *
 * // Get all active state machines
 * const machines = await client.getStateMachines('Active');
 *
 * // Get event receipts for a fiber
 * const events = await client.getStateMachineEvents(fiberId);
 * ```
 */
export class MetagraphClient {
    constructor(config) {
        this.ml0 = new HttpClient(config.ml0Url, config.timeout);
        if (config.dl1Url) {
            this.dl1 = new HttpClient(config.dl1Url, config.timeout);
        }
    }
    // -------------------------------------------------------------------------
    // Custom routes (ML0 /data-application/v1/*)
    // -------------------------------------------------------------------------
    /**
     * Get the current on-chain state (directly from L0 context).
     */
    async getOnChain() {
        return this.ml0.get('/data-application/v1/onchain');
    }
    /**
     * Get the latest checkpoint (ordinal + calculated state).
     */
    async getCheckpoint() {
        return this.ml0.get('/data-application/v1/checkpoint');
    }
    /**
     * Get all state machines, optionally filtered by status.
     */
    async getStateMachines(status) {
        const query = status ? `?status=${status}` : '';
        return this.ml0.get(`/data-application/v1/state-machines${query}`);
    }
    /**
     * Get a single state machine by fiber ID.
     */
    async getStateMachine(fiberId) {
        try {
            return await this.ml0.get(`/data-application/v1/state-machines/${fiberId}`);
        }
        catch (error) {
            if (error instanceof NetworkError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Get event receipts for a state machine from the current ordinal's logs.
     */
    async getStateMachineEvents(fiberId) {
        return this.ml0.get(`/data-application/v1/state-machines/${fiberId}/events`);
    }
    /**
     * Get all script oracles, optionally filtered by status.
     */
    async getScripts(status) {
        const query = status ? `?status=${status}` : '';
        return this.ml0.get(`/data-application/v1/oracles${query}`);
    }
    /**
     * Get a single script oracle by fiber ID.
     */
    async getScript(scriptId) {
        try {
            return await this.ml0.get(`/data-application/v1/oracles/${scriptId}`);
        }
        catch (error) {
            if (error instanceof NetworkError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Get oracle invocations from the current ordinal's logs.
     */
    async getScriptInvocations(scriptId) {
        return this.ml0.get(`/data-application/v1/oracles/${scriptId}/invocations`);
    }
    // -------------------------------------------------------------------------
    // Framework snapshot endpoints (ML0 /snapshots/*)
    // -------------------------------------------------------------------------
    /**
     * Get the latest snapshot and decode its on-chain state.
     */
    async getLatestSnapshotOnChainState() {
        const snapshot = await this.ml0.get('/snapshots/latest');
        return extractOnChainState(snapshot);
    }
    /**
     * Get a snapshot by ordinal and decode its on-chain state.
     */
    async getSnapshotOnChainState(ordinal) {
        const snapshot = await this.ml0.get(`/snapshots/${ordinal}`);
        return extractOnChainState(snapshot);
    }
    /**
     * Get the latest snapshot ordinal.
     */
    async getLatestOrdinal() {
        const snapshot = await this.ml0.get('/snapshots/latest');
        return snapshot.value.ordinal;
    }
    // -------------------------------------------------------------------------
    // DL1 data submission (framework POST /data)
    // -------------------------------------------------------------------------
    /**
     * Submit a signed data update to the DL1 node.
     * The POST /data endpoint is framework-provided (no /v1 prefix).
     *
     * @param signedData - Signed OttochainMessage
     * @returns Response hash
     */
    async postData(signedData) {
        if (!this.dl1) {
            throw new Error('dl1Url is required for postData');
        }
        return this.dl1.post('/data', signedData);
    }
}
