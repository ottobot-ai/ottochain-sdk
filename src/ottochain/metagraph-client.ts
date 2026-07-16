/**
 * Ottochain Metagraph Client
 *
 * Client for interacting with ottochain ML0 custom routes (/v1 prefix)
 * and framework snapshot endpoints.
 *
 * @see modules/l0/src/main/scala/xyz/kd5ujc/metagraph_l0/ML0Routes.scala
 * @see modules/data_l1/src/main/scala/xyz/kd5ujc/data_l1/DataL1CustomRoutes.scala
 * @packageDocumentation
 */

import type { Signed } from '@constellation-network/metagraph-sdk';
import { createDataTransactionRequest } from './transaction.js';
import { HttpClient, NetworkError } from '@constellation-network/metagraph-sdk/network';
import type {
  OnChain,
  CalculatedState,
  StateMachineFiberRecord,
  ScriptFiberRecord,
  EventReceipt,
  ScriptInvocation,
  FiberStatus,
  RegistryEntry,
} from './types.js';
import type { CurrencySnapshotResponse } from './snapshot.js';
import { extractOnChainState } from './snapshot.js';
import { normalizeNullifierHex } from '../schema/nullifier.js';
import type {
  VersionInfo,
  TransitionFeeEstimate,
  ScriptFeeEstimate,
  SubscribeRequest,
  SubscribeResponse,
  SubscriberList,
} from '../openapi.js';

// Re-export the wire DTOs consumers need when calling the fee-estimate + webhook methods, so the
// `@ottochain/sdk/ottochain` subpath surfaces them alongside the client (they mirror the chain's
// `FeeEstimates.scala` / `webhooks/Subscriber.scala` byte-for-byte).
export type {
  VersionInfo,
  TransitionFeeEstimate,
  ScriptFeeEstimate,
  SubscribeRequest,
  SubscribeResponse,
  SubscriberList,
} from '../openapi.js';

/**
 * Structural view of the vendored `HttpClient`'s shared request helper, which `get`/`post` both delegate
 * to but which is not on the public `.d.ts`. Used only to issue verbs the public surface omits (DELETE),
 * so those calls inherit the same `NetworkError`/timeout handling as the typed helpers.
 */
interface HttpRequestCapable {
  request<T>(method: string, path: string, body?: unknown, options?: unknown): Promise<T>;
}

/**
 * Checkpoint response from the metagraph (ordinal + calculated state).
 */
export interface Checkpoint {
  ordinal: number;
  state: CalculatedState;
}

/**
 * A light-client state proof for one field of a fiber/asset record, verifiable against the
 * consensus-signed committed-state root (Merkle-Patricia inclusion). Returned by the `state-proof`
 * endpoints.
 */
export interface StateProof {
  /**
   * The trie key the proof is keyed on — the fiber/asset id (optionally suffixed with the requested
   * field). Chain: `StateProofResponse.key: String` (required).
   */
  key: string;
  ordinal: number;
  /** The committed-state combined root (= the snapshot's `calculatedStateProof`). */
  committedRoot: string;
  /** The Merkle-Patricia trie root. */
  mptRoot: string;
  /** The record (or projected field) the proof attests to. */
  record: unknown;
  /** The Merkle-Patricia inclusion proof. */
  proof: unknown;
  /**
   * The `stateData` field name that was projected, present ONLY when a `?field=` was requested
   * (chain `field: Option[String]`, `dropNullValues`-stripped otherwise).
   */
  field?: string;
  /**
   * The value of the projected `field`, present ONLY when a `?field=` was requested
   * (chain `fieldValue: Option[Json]`, `dropNullValues`-stripped otherwise).
   */
  fieldValue?: unknown;
}

/**
 * The `GET /v1/nullifiers/{domain}/{nf}` SPENT response (chain `StateProofHandler.nullifier`,
 * protocol-nullifier-set.md Phase A): the standard state-proof envelope keyed on the committed
 * `nullifier/<domain>/<nf>` key, whose proven `record` is the SPEND ORDINAL. Never carries
 * `field`/`fieldValue` (the route takes no `?field=`).
 */
export interface NullifierSpendProof extends StateProof {
  /** The snapshot ordinal at which the nullifier was consumed. */
  record: number;
}

/**
 * A static fee/gas estimate. The wire is one of two per-endpoint shapes — {@link TransitionFeeEstimate}
 * (state-machine transition) or {@link ScriptFeeEstimate} (script invocation) — that mirror the chain's
 * `FeeEstimates.scala` case classes byte-for-byte. Prefer the per-endpoint types on
 * {@link MetagraphClient.estimateTransitionFee} / {@link MetagraphClient.estimateScriptFee}; this union is
 * a convenience for code that handles either.
 */
export type FeeEstimate = TransitionFeeEstimate | ScriptFeeEstimate;

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
export type FiberStateCallback = (
  current: StateMachineFiberRecord | null,
  previous: StateMachineFiberRecord | null,
) => void;

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
  /** Multiple DL1 node URLs for resilient data submission */
  dl1Urls?: string[];
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
 * const machines = await client.getStateMachines('ACTIVE');
 *
 * // Get event receipts for a fiber
 * const events = await client.getStateMachineEvents(fiberId);
 * ```
 */
export class MetagraphClient {
  private ml0: HttpClient;
  private dl1?: HttpClient;
  private dl1Clients: HttpClient[];

  constructor(config: MetagraphClientConfig) {
    this.ml0 = new HttpClient(config.ml0Url, config.timeout);
    if (config.dl1Url) {
      this.dl1 = new HttpClient(config.dl1Url, config.timeout);
    }
    // Build DL1 client pool from dl1Urls (falls back to dl1Url if provided)
    const urls = config.dl1Urls ?? (config.dl1Url ? [config.dl1Url] : []);
    this.dl1Clients = urls.map((url) => new HttpClient(url, config.timeout));
  }

  // -------------------------------------------------------------------------
  // Custom routes (ML0 /data-application/v1/*)
  // -------------------------------------------------------------------------

  /**
   * Get the current on-chain state (directly from L0 context).
   */
  async getOnChain(): Promise<OnChain> {
    return this.ml0.get<OnChain>('/data-application/v1/onchain');
  }

  /**
   * Get the latest checkpoint (ordinal + calculated state).
   */
  async getCheckpoint(): Promise<Checkpoint> {
    return this.ml0.get<Checkpoint>('/data-application/v1/checkpoint');
  }

  /**
   * Get all state machines, optionally filtered by status.
   */
  async getStateMachines(status?: FiberStatus): Promise<Record<string, StateMachineFiberRecord>> {
    const query = status ? `?status=${status}` : '';
    return this.ml0.get<Record<string, StateMachineFiberRecord>>(`/data-application/v1/state-machines${query}`);
  }

  /**
   * Get a single state machine by fiber ID.
   */
  async getStateMachine(fiberId: string): Promise<StateMachineFiberRecord | null> {
    try {
      return await this.ml0.get<StateMachineFiberRecord>(`/data-application/v1/state-machines/${fiberId}`);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get event receipts for a state machine from the current ordinal's logs.
   */
  async getStateMachineEvents(fiberId: string): Promise<EventReceipt[]> {
    return this.ml0.get<EventReceipt[]>(`/data-application/v1/state-machines/${fiberId}/events`);
  }

  /**
   * Get all scripts, optionally filtered by status.
   */
  async getScripts(status?: FiberStatus): Promise<Record<string, ScriptFiberRecord>> {
    const query = status ? `?status=${status}` : '';
    return this.ml0.get<Record<string, ScriptFiberRecord>>(`/data-application/v1/scripts${query}`);
  }

  /**
   * Get a single script by fiber ID.
   */
  async getScript(scriptId: string): Promise<ScriptFiberRecord | null> {
    try {
      return await this.ml0.get<ScriptFiberRecord>(`/data-application/v1/scripts/${scriptId}`);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get script invocations from the current ordinal's logs.
   */
  async getScriptInvocations(scriptId: string): Promise<ScriptInvocation[]> {
    return this.ml0.get<ScriptInvocation[]>(`/data-application/v1/scripts/${scriptId}/invocations`);
  }

  // -------------------------------------------------------------------------
  // Registry, audit, state-proofs, fee estimates (ML0 /data-application/v1/*)
  // -------------------------------------------------------------------------

  /**
   * Get the node's service identity + build metadata. The chain's `GET …/version` returns a
   * `VersionInfo` OBJECT (`{ service, version, name, scalaVersion, sbtVersion, gitCommit, buildTime,
   * tessellationVersion }`) — chain `ServiceMeta.scala` — NOT a bare string.
   */
  async getVersion(): Promise<VersionInfo> {
    return this.ml0.get<VersionInfo>('/data-application/v1/version');
  }

  /** Get the full registry namespace, keyed by full registry name `labels.tld`. */
  async getRegistry(): Promise<Record<string, RegistryEntry>> {
    return this.ml0.get<Record<string, RegistryEntry>>('/data-application/v1/registry');
  }

  /** Resolve a single registry entry by full name (`labels.tld`), or null if unregistered. */
  async getRegistryEntry(name: string): Promise<RegistryEntry | null> {
    try {
      return await this.ml0.get<RegistryEntry>(`/data-application/v1/registry/${encodeURIComponent(name)}`);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) return null;
      throw error;
    }
  }

  /** Reverse-resolve a fiber UUID to its canonical registered name (#29), or null. */
  async getReverseName(fiberId: string): Promise<string | null> {
    try {
      return await this.ml0.get<string>(`/data-application/v1/registry/reverse/${fiberId}`);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) return null;
      throw error;
    }
  }

  /** Get the rendered audit-trail lines for a state-machine fiber. */
  async getStateMachineAudit(fiberId: string): Promise<string[]> {
    return this.ml0.get<string[]>(`/data-application/v1/state-machines/${fiberId}/audit`);
  }

  /** Light-client state proof for a field of a state-machine fiber, against the committed root. */
  async getStateMachineStateProof(fiberId: string, field: string): Promise<StateProof> {
    return this.ml0.get<StateProof>(
      `/data-application/v1/state-machines/${fiberId}/state-proof?field=${encodeURIComponent(field)}`,
    );
  }

  /** Light-client state proof for a field of a script fiber. */
  async getScriptStateProof(fiberId: string, field: string): Promise<StateProof> {
    return this.ml0.get<StateProof>(
      `/data-application/v1/scripts/${fiberId}/state-proof?field=${encodeURIComponent(field)}`,
    );
  }

  /** Light-client state proof for a field of an asset instance. */
  async getAssetStateProof(assetId: string, field: string): Promise<StateProof> {
    return this.ml0.get<StateProof>(
      `/data-application/v1/assets/${assetId}/state-proof?field=${encodeURIComponent(field)}`,
    );
  }

  /**
   * Look up a protocol nullifier (protocol-nullifier-set.md): is `nf` spent in `domain`
   * (= the consuming fiber's UUID)?
   *
   * Returns the chain's spent-nullifier state proof — a {@link StateProof} keyed on
   * `nullifier/<domain>/<nf>` whose `record` is the SPEND ORDINAL — or `null` when the
   * nullifier is unspent/unknown (the route 404s; MPT absence proofs for unspent are the
   * chain's Phase B — verify them with `verifyAbsenceProof` once served).
   *
   * `nf` is normalized exactly like the chain (`NullifierHex.scala`): one optional `0x`/`0X`
   * prefix stripped, lowercased, then required to be EXACTLY 64 hex chars — so the queried
   * key is byte-identical to the committed one. Throws on a value that cannot normalize
   * (mirroring the route's BadRequest) WITHOUT hitting the network.
   */
  async getNullifier(domain: string, nf: string): Promise<NullifierSpendProof | null> {
    const hex = normalizeNullifierHex(nf);
    if (hex === null) {
      throw new Error(`nullifier must be 64 hex chars (optionally 0x-prefixed), got '${nf}'`);
    }
    try {
      return await this.ml0.get<NullifierSpendProof>(`/data-application/v1/nullifiers/${domain}/${hex}`);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) return null;
      throw error;
    }
  }

  /**
   * Estimate the fee/gas for a transition event on a state-machine fiber. Returns a
   * {@link TransitionFeeEstimate} (`{ fiberId, currentState, event, gasEstimate, opCount, maxDepth,
   * candidateTransitions, note }`) — chain `FeeEstimates.scala`.
   */
  async estimateTransitionFee(fiberId: string, eventName: string): Promise<TransitionFeeEstimate> {
    return this.ml0.get<TransitionFeeEstimate>(
      `/data-application/v1/state-machines/${fiberId}/estimate-fee?event=${encodeURIComponent(eventName)}`,
    );
  }

  /**
   * Estimate the fee/gas for invoking a script fiber. Returns a {@link ScriptFeeEstimate}
   * (`{ scriptId, gasEstimate, opCount, maxDepth, note }`) — chain `FeeEstimates.scala`.
   */
  async estimateScriptFee(fiberId: string): Promise<ScriptFeeEstimate> {
    return this.ml0.get<ScriptFeeEstimate>(`/data-application/v1/scripts/${fiberId}/estimate-fee`);
  }

  // -------------------------------------------------------------------------
  // Webhook subscriptions (ML0 /data-application/v1/webhooks/*)
  // -------------------------------------------------------------------------

  /**
   * Subscribe a callback URL to snapshot-notification webhooks.
   *
   * `POST …/webhooks/subscribe` with `SubscribeRequest { callbackUrl, secret? }`; the chain replies
   * `201 Created` with `SubscribeResponse { id, callbackUrl, createdAt }`. Chain: `ML0Routes.scala`
   * (`webhook.subscribe`) + `webhooks/Subscriber.scala`.
   */
  async subscribeWebhook(request: SubscribeRequest): Promise<SubscribeResponse> {
    return this.ml0.post<SubscribeResponse>('/data-application/v1/webhooks/subscribe', request);
  }

  /**
   * Unsubscribe a webhook by its subscriber id.
   *
   * `DELETE …/webhooks/subscribe/{id}` → `204 No Content` (empty body) on success, or `404` if the id is
   * unknown. Chain: `ML0Routes.scala` (`webhook.unsubscribe`). The vendored `HttpClient` exposes only
   * `get`/`post`, so this reuses its shared private `request` helper — same `NetworkError`/timeout
   * handling as every other call — to issue the DELETE.
   */
  async unsubscribeWebhook(id: string): Promise<void> {
    await (this.ml0 as unknown as HttpRequestCapable).request<void>(
      'DELETE',
      `/data-application/v1/webhooks/subscribe/${encodeURIComponent(id)}`,
    );
  }

  /**
   * List the current webhook subscribers (secrets are redacted server-side).
   *
   * `GET …/webhooks/subscribers` → `SubscriberList { subscribers: Subscriber[] }`. Chain:
   * `ML0Routes.scala` (`webhook.list`) + `webhooks/Subscriber.scala`.
   */
  async listWebhookSubscribers(): Promise<SubscriberList> {
    return this.ml0.get<SubscriberList>('/data-application/v1/webhooks/subscribers');
  }

  // -------------------------------------------------------------------------
  // Framework snapshot endpoints (ML0 /snapshots/*)
  // -------------------------------------------------------------------------

  /**
   * Get the latest snapshot and decode its on-chain state.
   */
  async getLatestSnapshotOnChainState(): Promise<OnChain | null> {
    const snapshot = await this.ml0.get<CurrencySnapshotResponse>('/snapshots/latest');
    return extractOnChainState(snapshot);
  }

  /**
   * Get a snapshot by ordinal and decode its on-chain state.
   */
  async getSnapshotOnChainState(ordinal: number): Promise<OnChain | null> {
    const snapshot = await this.ml0.get<CurrencySnapshotResponse>(`/snapshots/${ordinal}`);
    return extractOnChainState(snapshot);
  }

  /**
   * Get the latest snapshot ordinal.
   */
  async getLatestOrdinal(): Promise<number> {
    const snapshot = await this.ml0.get<CurrencySnapshotResponse>('/snapshots/latest');
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
  subscribeFiberState(fiberId: string, callback: FiberStateCallback, options?: SubscribeOptions): Unsubscribe {
    const intervalMs = options?.pollIntervalMs ?? 2000;
    const onError = options?.onError ?? ((e: Error) => console.warn('[subscribeFiberState]', e));
    const fireImmediately = options?.fireImmediately ?? true;

    let previous: StateMachineFiberRecord | null = null;
    let lastSeqNum: number | null = null;
    let firstPoll = true; // Track first poll separately — handles null seqNum on missing fiber
    let active = true;

    const invokeCallback = (current: StateMachineFiberRecord | null, prev: StateMachineFiberRecord | null): void => {
      try {
        callback(current, prev);
      } catch (cbErr) {
        try {
          onError(cbErr instanceof Error ? cbErr : new Error(String(cbErr)));
        } catch {
          /* ignore */
        }
      }
    };

    const poll = async (): Promise<void> => {
      if (!active) return;

      let current: StateMachineFiberRecord | null;
      try {
        current = await this.getStateMachine(fiberId);
      } catch (err) {
        // Network / timeout error — notify and reschedule
        if (!active) return;
        try {
          onError(err instanceof Error ? err : new Error(String(err)));
        } catch {
          /* ignore */
        }
        if (active) setTimeout(poll, intervalMs);
        return;
      }

      // Guard: unsubscribe may have been called while awaiting
      if (!active) return;

      const currentSeq = current?.sequenceNumber ?? null;

      if (firstPoll) {
        firstPoll = false;
        lastSeqNum = currentSeq;
        previous = current;
        if (fireImmediately) {
          invokeCallback(current, null);
        }
      } else if (currentSeq !== lastSeqNum) {
        // State changed — sequenceNumber differs (handles null → value and value → null)
        const prev = previous;
        previous = current;
        lastSeqNum = currentSeq;
        invokeCallback(current, prev);
      }
      // No change → no callback

      // Schedule next poll (setTimeout recursion prevents overlapping polls)
      if (active) setTimeout(poll, intervalMs);
    };

    // Start first poll via setTimeout(0) so Jest fake-timer control works correctly:
    // callers can unsubscribe before the first poll runs, and each
    // jest.runOnlyPendingTimersAsync() advances exactly one poll cycle.
    setTimeout(poll, 0);

    return (): void => {
      active = false;
    };
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
  waitForState(
    fiberId: string,
    targetState: string,
    timeoutMs = 30_000,
    options?: Pick<SubscribeOptions, 'pollIntervalMs' | 'onError'>,
  ): Promise<StateMachineFiberRecord | null> {
    return new Promise((resolve) => {
      let resolved = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      // unsub starts as a no-op so it's safe to call even if subscribeFiberState
      // invokes the callback synchronously (before returning the real unsubscribe).
      let unsub: Unsubscribe = () => {};

      const done = (result: StateMachineFiberRecord | null): void => {
        if (resolved) return;
        resolved = true;
        if (timer !== null) clearTimeout(timer);
        unsub(); // safe: either the real unsub or the initial no-op
        resolve(result);
      };

      unsub = this.subscribeFiberState(
        fiberId,
        (current) => {
          if (current?.currentState === targetState) {
            done(current);
          }
        },
        { fireImmediately: true, ...options },
      );

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
  async postData<T>(signedData: T): Promise<{ hash: string }> {
    if (!this.dl1) {
      throw new Error('dl1Url is required for postData');
    }
    return this.dl1.post<{ hash: string }>('/data', signedData);
  }

  /**
   * Submit a self-signed transaction directly to DL1 nodes.
   *
   * Wraps the signed payload in `{ data, fee: null }` format and submits
   * to one of the configured DL1 nodes. Uses `Promise.any` when multiple
   * DL1 URLs are configured for resilience.
   *
   * @param signed - A `Signed<T>` object from `signTransaction()`
   * @returns Response containing the data hash
   * @throws Error if no DL1 URLs are configured or all nodes fail
   *
   * @example
   * ```typescript
   * const metagraph = new MetagraphClient({
   *   ml0Url: 'http://localhost:9200',
   *   dl1Urls: ['http://node1:9400', 'http://node2:9400'],
   * });
   * const signed = await signTransaction(payload, privateKey);
   * await metagraph.submitData(signed);
   * ```
   */
  async submitData<T>(signed: Signed<T>): Promise<{ hash: string }> {
    if (this.dl1Clients.length === 0) {
      throw new Error('dl1Url or dl1Urls is required for submitData');
    }
    const request = createDataTransactionRequest(signed);
    if (this.dl1Clients.length === 1) {
      return this.dl1Clients[0].post<{ hash: string }>('/data', request);
    }
    // Try all DL1 nodes concurrently, return first success
    const errors: Error[] = [];
    return new Promise<{ hash: string }>((resolve, reject) => {
      let settled = false;
      let pending = this.dl1Clients.length;
      for (const client of this.dl1Clients) {
        client.post<{ hash: string }>('/data', request).then(
          (result) => {
            if (!settled) {
              settled = true;
              resolve(result);
            }
          },
          (err) => {
            errors.push(err instanceof Error ? err : new Error(String(err)));
            pending--;
            if (pending === 0 && !settled) {
              reject(new Error('All DL1 nodes failed: ' + errors.map((e) => e.message).join('; ')));
            }
          },
        );
      }
    });
  }
}
