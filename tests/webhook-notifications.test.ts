/**
 * Guards the webhook PUSH payload types against the chain wire.
 *
 * The `snapshot.finalized` notification is a server-initiated POST (not an OpenAPI-served endpoint),
 * so its shape is hand-authored in `src/ottochain/webhook-notifications.ts`. This test locks that
 * shape to the chain's derived JSON (webhooks/Subscriber.scala + WebhookDispatcher.scala):
 * a drift in a field name or nullability fails to compile (the fixture stops satisfying the type)
 * or fails the assertions below.
 */
import {
  SNAPSHOT_FINALIZED_EVENT,
  type SnapshotNotification,
  type SnapshotRejection,
} from '../src/ottochain/webhook-notifications';

// A byte-for-byte sample of what `WebhookDispatcher` emits (`notification.asJson.noSpaces`, no
// dropNulls). Kept as a raw string so `JSON.parse` → assignment proves the wire decodes to the type.
const WIRE_SAMPLE = JSON.stringify({
  event: 'snapshot.finalized',
  ordinal: 42,
  hash: 'abc123',
  timestamp: '2026-07-09T00:00:00Z',
  metagraphId: 'DAG_METAGRAPH_ID',
  stats: {
    updatesProcessed: 3,
    stateMachinesActive: 5,
    scriptsActive: 2,
    rejectedCount: 2,
  },
  rejections: [
    {
      updateType: 'TransitionStateMachine',
      fiberId: '11111111-2222-3333-4444-555555555555',
      // Present transition → numeric target; actual mismatched → also numeric.
      targetSequenceNumber: 7,
      actualSequenceNumber: 6,
      reason: 'SequenceNumberMismatch',
      updateHash: 'deadbeef',
    },
    {
      updateType: 'CreateStateMachine',
      fiberId: '99999999-8888-7777-6666-555555555555',
      // Non-sequenced update → the chain emits explicit `null` (Option[Long]=None, no dropNulls).
      targetSequenceNumber: null,
      actualSequenceNumber: null,
      reason: 'FiberAlreadyExists',
      updateHash: 'cafef00d',
    },
  ],
});

describe('webhook notification payloads', () => {
  it('the emitted event constant matches the chain', () => {
    expect(SNAPSHOT_FINALIZED_EVENT).toBe('snapshot.finalized');
  });

  it('decodes a chain `snapshot.finalized` push into SnapshotNotification', () => {
    // The assignment is the compile-time guard: the parsed wire must satisfy the interface exactly.
    const note: SnapshotNotification = JSON.parse(WIRE_SAMPLE);

    expect(note.event).toBe(SNAPSHOT_FINALIZED_EVENT);
    expect(note.ordinal).toBe(42);
    expect(note.hash).toBe('abc123');
    expect(note.timestamp).toBe('2026-07-09T00:00:00Z');
    expect(note.metagraphId).toBe('DAG_METAGRAPH_ID');

    expect(note.stats).toEqual({
      updatesProcessed: 3,
      stateMachinesActive: 5,
      scriptsActive: 2,
      rejectedCount: 2,
    });
    expect(note.stats.rejectedCount).toBe(note.rejections.length);
  });

  it('preserves explicit null for absent Option[Long] sequence numbers', () => {
    const note: SnapshotNotification = JSON.parse(WIRE_SAMPLE);
    const [mismatch, nonSeq] = note.rejections;

    // Key is always present (dispatcher does not drop nulls) — value is number OR null.
    expect(mismatch.targetSequenceNumber).toBe(7);
    expect(mismatch.actualSequenceNumber).toBe(6);
    expect(nonSeq.targetSequenceNumber).toBeNull();
    expect(nonSeq.actualSequenceNumber).toBeNull();
    expect('targetSequenceNumber' in nonSeq).toBe(true);

    // Exhaustive field guard against the chain `SnapshotRejection` case class.
    const expectedKeys: (keyof SnapshotRejection)[] = [
      'updateType',
      'fiberId',
      'targetSequenceNumber',
      'actualSequenceNumber',
      'reason',
      'updateHash',
    ];
    expect(Object.keys(nonSeq).sort()).toEqual([...expectedKeys].sort());
  });
});
