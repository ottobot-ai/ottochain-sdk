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
