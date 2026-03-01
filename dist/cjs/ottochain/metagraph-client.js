"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetagraphClient = void 0;
const client_js_1 = require("../metakit/network/client.js");
const types_js_1 = require("../metakit/network/types.js");
const snapshot_js_1 = require("./snapshot.js");
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
class MetagraphClient {
    constructor(config) {
        this.ml0 = new client_js_1.HttpClient(config.ml0Url, config.timeout);
        if (config.dl1Url) {
            this.dl1 = new client_js_1.HttpClient(config.dl1Url, config.timeout);
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
            if (error instanceof types_js_1.NetworkError && error.statusCode === 404) {
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
            if (error instanceof types_js_1.NetworkError && error.statusCode === 404) {
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
        return (0, snapshot_js_1.extractOnChainState)(snapshot);
    }
    /**
     * Get a snapshot by ordinal and decode its on-chain state.
     */
    async getSnapshotOnChainState(ordinal) {
        const snapshot = await this.ml0.get(`/snapshots/${ordinal}`);
        return (0, snapshot_js_1.extractOnChainState)(snapshot);
    }
    /**
     * Get the latest snapshot ordinal.
     */
    async getLatestOrdinal() {
        const snapshot = await this.ml0.get('/snapshots/latest');
        return snapshot.value.ordinal;
    }
    // -------------------------------------------------------------------------
    // Fiber state subscription
    // -------------------------------------------------------------------------
    /**
     * Subscribe to state changes for a state machine fiber.
     *
     * Polls ML0 at the configured interval and compares `sequenceNumber` to
     * detect changes. Fires the callback with `(current, previous)` on the
     * first poll (if `fireImmediately` is true — the default) and on every
     * subsequent change.
     *
     * ML0 consistency: state is read from snapshot-level `CalculatedState`
     * (via `checkpointService.get`), so a poll never returns a mid-transition
     * value — every observation is a fully committed state.
     *
     * Uses `setTimeout` recursion to prevent overlapping polls when a request
     * takes longer than `pollIntervalMs`.
     *
     * @param fiberId  - UUID of the state machine fiber to watch
     * @param callback - Called on first observation and on every state change
     * @param options  - Polling interval, error handler, fireImmediately flag
     * @returns Unsubscribe function — call to stop polling immediately
     *
     * @example
     * ```typescript
     * const unsub = client.subscribeFiberState(fiberId, (current, prev) => {
     *   if (current?.currentState === 'Completed') {
     *     unsub();
     *   }
     * });
     * // Later:
     * unsub();
     * ```
     */
    subscribeFiberState(fiberId, callback, options) {
        const intervalMs = options?.pollIntervalMs ?? 2000;
        const onError = options?.onError ?? ((e) => console.warn('[subscribeFiberState]', e));
        const fireImmediately = options?.fireImmediately ?? true;
        if (fireImmediately === false) {
            // Warn: if the fiber never exists, the callback will never fire (seqNum stays null, no change detected).
            console.warn('[subscribeFiberState] fireImmediately=false: callback will never fire if the fiber does not exist.');
        }
        let previous = null;
        let lastSeqNum = null;
        let firstPoll = true; // Track first poll separately — handles null seqNum on missing fiber
        let active = true;
        const invokeCallback = (current, prev) => {
            try {
                callback(current, prev);
            }
            catch (cbErr) {
                try {
                    onError(cbErr instanceof Error ? cbErr : new Error(String(cbErr)));
                }
                catch { /* ignore */ }
            }
        };
        const poll = async () => {
            if (!active)
                return;
            let current;
            try {
                current = await this.getStateMachine(fiberId);
            }
            catch (err) {
                // Network / timeout error — notify and reschedule
                if (!active)
                    return;
                try {
                    onError(err instanceof Error ? err : new Error(String(err)));
                }
                catch { /* ignore */ }
                if (active)
                    setTimeout(poll, intervalMs);
                return;
            }
            // Guard: unsubscribe may have been called while awaiting
            if (!active)
                return;
            const currentSeq = current?.sequenceNumber ?? null;
            if (firstPoll) {
                firstPoll = false;
                lastSeqNum = currentSeq;
                previous = current;
                if (fireImmediately) {
                    invokeCallback(current, null);
                }
            }
            else if (currentSeq !== lastSeqNum) {
                // State changed — sequenceNumber differs (handles null → value and value → null)
                const prev = previous;
                previous = current;
                lastSeqNum = currentSeq;
                invokeCallback(current, prev);
            }
            // No change → no callback
            // Schedule next poll (setTimeout recursion prevents overlapping polls)
            if (active)
                setTimeout(poll, intervalMs);
        };
        // Start first poll via setTimeout(0) so Jest fake-timer control works correctly:
        // callers can unsubscribe before the first poll runs, and each
        // jest.runOnlyPendingTimersAsync() advances exactly one poll cycle.
        setTimeout(poll, 0);
        return () => { active = false; };
    }
    /**
     * Wait for a fiber to reach a specific state, with an optional timeout.
     *
     * Builds on `subscribeFiberState` — resolves with the fiber record once
     * `currentState === targetState`, or resolves with `null` after `timeoutMs`.
     * Always calls unsubscribe on resolution or timeout (no memory leaks).
     *
     * @param fiberId     - UUID of the state machine fiber
     * @param targetState - State name to wait for (e.g. `'Completed'`)
     * @param timeoutMs   - Maximum wait in milliseconds (default: 30 000)
     * @returns Fiber record when target state reached, or `null` on timeout
     *
     * @example
     * ```typescript
     * const result = await client.waitForState(fiberId, 'Completed', 15_000);
     * if (result === null) console.warn('Timed out waiting for Completed');
     * ```
     */
    waitForState(fiberId, targetState, timeoutMs = 30000, options) {
        return new Promise((resolve) => {
            let resolved = false;
            let timer = null;
            // unsub starts as a no-op so it's safe to call even if subscribeFiberState
            // invokes the callback synchronously (before returning the real unsubscribe).
            let unsub = () => { };
            const done = (result) => {
                if (resolved)
                    return;
                resolved = true;
                if (timer !== null)
                    clearTimeout(timer);
                unsub(); // safe: either the real unsub or the initial no-op
                resolve(result);
            };
            unsub = this.subscribeFiberState(fiberId, (current) => {
                if (current?.currentState === targetState) {
                    done(current);
                }
            }, { fireImmediately: true, ...options });
            // Only arm the timeout if the callback hasn't already resolved (synchronous case)
            if (!resolved) {
                timer = setTimeout(() => done(null), timeoutMs);
            }
        });
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
exports.MetagraphClient = MetagraphClient;
