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
import type { OnChain, CalculatedState, StateMachineFiberRecord, ScriptFiberRecord, EventReceipt, OracleInvocation, FiberStatus } from './types.js';
/**
 * Checkpoint response from the metagraph (ordinal + calculated state).
 */
export interface Checkpoint {
    ordinal: number;
    state: CalculatedState;
}
/**
 * Options for subscribeFiberState polling behaviour.
 */
export interface SubscribeOptions {
    /**
     * Polling interval in milliseconds.
     * @default 2000
     */
    pollIntervalMs?: number;
    /**
     * Called when a poll fails (network error, timeout, etc.) or when the
     * user-supplied callback throws. The subscription continues after an error.
     * @default (e) => console.warn('[subscribeFiberState]', e)
     */
    onError?: (error: Error) => void;
    /**
     * If true, fire the callback immediately after the very first poll even
     * when no previous state exists (current vs. null).
     * Set false to suppress the initial callback and only fire on changes.
     *
     * **Edge case:** When `fireImmediately` is false and the fiber never exists
     * (getStateMachine always returns null), the callback will never fire because
     * the sequence number stays null between polls (no change detected).
     * @default true
     */
    fireImmediately?: boolean;
}
/**
 * Callback invoked when fiber state is first observed or changes.
 *
 * @param current  - Current fiber state, or null if fiber not found
 * @param previous - Previous fiber state, or null on first callback
 */
export type FiberStateCallback = (current: StateMachineFiberRecord | null, previous: StateMachineFiberRecord | null) => void;
/**
 * Unsubscribe function returned by subscribeFiberState.
 * Stops polling immediately and prevents any further callbacks. Idempotent.
 */
export type Unsubscribe = () => void;
/**
 * Configuration for the MetagraphClient.
 */
export interface MetagraphClientConfig {
    /** ML0 node base URL (e.g., 'http://localhost:9200') */
    ml0Url: string;
    /** DL1 node base URL for data submission (e.g., 'http://localhost:9400') */
    dl1Url?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}
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
export declare class MetagraphClient {
    private ml0;
    private dl1?;
    constructor(config: MetagraphClientConfig);
    /**
     * Get the current on-chain state (directly from L0 context).
     */
    getOnChain(): Promise<OnChain>;
    /**
     * Get the latest checkpoint (ordinal + calculated state).
     */
    getCheckpoint(): Promise<Checkpoint>;
    /**
     * Get all state machines, optionally filtered by status.
     */
    getStateMachines(status?: FiberStatus): Promise<Record<string, StateMachineFiberRecord>>;
    /**
     * Get a single state machine by fiber ID.
     */
    getStateMachine(fiberId: string): Promise<StateMachineFiberRecord | null>;
    /**
     * Get event receipts for a state machine from the current ordinal's logs.
     */
    getStateMachineEvents(fiberId: string): Promise<EventReceipt[]>;
    /**
     * Get all script oracles, optionally filtered by status.
     */
    getScripts(status?: FiberStatus): Promise<Record<string, ScriptFiberRecord>>;
    /**
     * Get a single script oracle by fiber ID.
     */
    getScript(scriptId: string): Promise<ScriptFiberRecord | null>;
    /**
     * Get oracle invocations from the current ordinal's logs.
     */
    getScriptInvocations(scriptId: string): Promise<OracleInvocation[]>;
    /**
     * Get the latest snapshot and decode its on-chain state.
     */
    getLatestSnapshotOnChainState(): Promise<OnChain | null>;
    /**
     * Get a snapshot by ordinal and decode its on-chain state.
     */
    getSnapshotOnChainState(ordinal: number): Promise<OnChain | null>;
    /**
     * Get the latest snapshot ordinal.
     */
    getLatestOrdinal(): Promise<number>;
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
    subscribeFiberState(fiberId: string, callback: FiberStateCallback, options?: SubscribeOptions): Unsubscribe;
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
    waitForState(fiberId: string, targetState: string, timeoutMs?: number, options?: Pick<SubscribeOptions, 'pollIntervalMs' | 'onError'>): Promise<StateMachineFiberRecord | null>;
    /**
     * Submit a signed data update to the DL1 node.
     * The POST /data endpoint is framework-provided (no /v1 prefix).
     *
     * @param signedData - Signed OttochainMessage
     * @returns Response hash
     */
    postData<T>(signedData: T): Promise<{
        hash: string;
    }>;
}
