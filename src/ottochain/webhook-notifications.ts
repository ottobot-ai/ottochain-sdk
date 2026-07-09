/**
 * Webhook notification PAYLOAD types — the server-initiated push the chain POSTs to a subscribed
 * callback, NOT part of the client's request surface.
 *
 * These are hand-authored (not generated from the OpenAPI contract) because the push is an OUTBOUND
 * POST from the metagraph to the subscriber's callback URL — it is not an endpoint the chain's tapir
 * `ApiEndpoints` serves, so it never appears in `openapi/ottochain-openapi-ml0.json`. They mirror the
 * chain's shared network DTOs byte-for-byte:
 *
 *   chain: modules/models/src/main/scala/xyz/kd5ujc/schema/api/webhooks/Subscriber.scala
 *          (SnapshotNotification / NotificationStats / SnapshotRejection)
 *   emit:  modules/l0/.../webhooks/WebhookDispatcher.scala — `notification.asJson.noSpaces`
 *
 * Field-shape notes tied to the chain source:
 * - The dispatcher serializes with a plain derived encoder (`.asJson`, NO `dropNullValues`), so an
 *   `Option[Long]` that is `None` is emitted as an explicit `null` — the KEY is always present, the
 *   VALUE is nullable. Hence `number | null` (a required key), not `number | undefined` (an optional
 *   key). Consumers must handle `null`.
 * - `Long` → JSON number; `Instant` → ISO-8601 string; `UUID` → string.
 * - The dispatcher only ever emits `"snapshot.finalized"` today (there is a dead, never-dispatched
 *   `RejectionNotification`/`transaction.rejected` type in the chain models — deliberately NOT mirrored
 *   here, because the SDK should model only what is actually sent). Rejections now ride the finalized
 *   snapshot's `rejections[]`, drained from its committed `RejectionReceipt`s.
 *
 * @see modules/models/.../schema/api/webhooks/Subscriber.scala
 * @see modules/l0/.../webhooks/WebhookDispatcher.scala
 * @packageDocumentation
 */

/** The only event the chain's `WebhookDispatcher` currently emits. */
export const SNAPSHOT_FINALIZED_EVENT = 'snapshot.finalized' as const;

/**
 * Aggregate counters for the finalized snapshot, mirrors chain `NotificationStats`.
 */
export interface NotificationStats {
  /** Number of data updates processed into this snapshot. */
  updatesProcessed: number;
  /** Count of active state-machine fibers after this snapshot. */
  stateMachinesActive: number;
  /** Count of active script fibers after this snapshot. */
  scriptsActive: number;
  /** Number of updates rejected while combining this snapshot (== `rejections.length`). */
  rejectedCount: number;
}

/**
 * A single post-finalization rejection, batched onto the `snapshot.finalized` notification. Drained
 * from the committed snapshot's `RejectionReceipt`s, so it reflects committed state (not a pre-combine
 * guess). Mirrors chain `SnapshotRejection`.
 */
export interface SnapshotRejection {
  /** The rejected update's type, e.g. `"TransitionStateMachine"`, `"CreateStateMachine"`. */
  updateType: string;
  /** UUID of the target fiber. */
  fiberId: string;
  /**
   * The transition's target sequence number, or `null` for non-sequenced updates. Chain
   * `Option[Long]`, emitted as an explicit `null` when absent (dispatcher does not drop nulls).
   */
  targetSequenceNumber: number | null;
  /**
   * The fiber's actual sequence number at rejection time (for a sequence mismatch), or `null`. Chain
   * `Option[Long]`, emitted as an explicit `null` when absent.
   */
  actualSequenceNumber: number | null;
  /** Human-readable rejection reason (the combiner's `CombineRejected` code/message). */
  reason: string;
  /** Hash of the signed update, for correlation with a submitted transaction. */
  updateHash: string;
}

/**
 * The payload POSTed to a subscribed webhook callback when a snapshot finalizes — the confirm TICK.
 * Mirrors chain `SnapshotNotification`.
 *
 * There is NO per-update "accepted" event: an update is accepted iff its `updateHash` lands in a
 * finalized snapshot AND is absent from every `rejections[]` of the snapshots up to that ordinal.
 */
export interface SnapshotNotification {
  /** Always `"snapshot.finalized"`. */
  event: typeof SNAPSHOT_FINALIZED_EVENT;
  /** The finalized snapshot ordinal. Chain `Long`. */
  ordinal: number;
  /** The finalized snapshot hash. */
  hash: string;
  /** ISO-8601 dispatch timestamp. Chain `Instant`. */
  timestamp: string;
  /** The metagraph token identifier this notification is for. */
  metagraphId: string;
  /** Aggregate counters for the snapshot. */
  stats: NotificationStats;
  /** Updates rejected while combining this snapshot (empty if none). */
  rejections: SnapshotRejection[];
}
