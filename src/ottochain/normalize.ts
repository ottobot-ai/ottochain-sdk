/**
 * Normalize OttoChain Messages for Signing
 *
 * Converts OttoChain message objects to the wire format expected by the
 * Scala metagraph, then strips null object-fields so the canonical JSON the
 * TypeScript client signs matches the bytes the server signs/verifies.
 *
 * The Scala server (metakit rc.9) DROPS null object-fields via
 * `JsonBinaryCodec.dropNulls` before building the canonical bytes. Earlier
 * (rc.8) it kept nulls, so this module used to ADD explicit `null` for every
 * `Option[A] = None` field. That is now WRONG: emitting `metadata: null` (etc.)
 * makes the TS canonical JSON diverge from the server's and signature
 * verification fails (HTTP 400). We therefore OMIT null fields here, matching
 * the recursive `dropNulls` helper used by the signing path.
 *
 * Empty collections are preserved (they are NOT nulls):
 * - `List.empty` → `[]`
 * - `Map.empty` → `{}`
 *
 * Schema mapping (Scala → TypeScript):
 * - `Option[A] = None` → field omitted (NOT explicit null)
 * - `Option[A] = Some(v)` → v
 * - `List.empty` → `[]`
 * - `Map.empty` → `{}`
 */

import { dropNulls } from './drop-nulls.js';

/**
 * Normalize a State object for wire format.
 *
 * `metadata` is `Option[Json] = None` on the Scala side. When absent it is
 * omitted (not emitted as null) so the canonical form matches the server.
 */
function normalizeState(state: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: state.id,
    isFinal: state.isFinal ?? false,
  };
  if (state.metadata !== null && state.metadata !== undefined) {
    result.metadata = state.metadata;
  }
  return result;
}

/**
 * Normalize a Transition object for wire format
 *
 * Scala Transition schema:
 *   from: StateId (required)
 *   to: StateId (required)
 *   eventName: String (required)
 *   guard: JsonLogicExpression (required)
 *   effect: JsonLogicExpression (required)
 *   dependencies: Set[UUID] = Set.empty
 *
 * `dependencies` serializes as `[]` when empty (default). Both `guard`
 * and `effect` are required non-optional fields.
 */
function normalizeTransition(t: Record<string, unknown>): Record<string, unknown> {
  return {
    from: t.from,
    to: t.to,
    eventName: t.eventName,
    guard: t.guard,
    effect: t.effect,
    dependencies: t.dependencies ?? [],
  };
}

/**
 * Check if a value looks like FiberAppMetadata (has 'name' and 'app' fields).
 * These TypeScript-only fields should be stripped before sending to metagraph.
 */
function isFiberAppMetadata(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'app' in value
  );
}

/**
 * Normalize a StateMachineDefinition for wire format
 *
 * Strips FiberAppMetadata from the definition — the Scala schema expects
 * `metadata: Option[Json] = None`, not the TypeScript app metadata object.
 * When the definition has no (non-FiberAppMetadata) metadata, the field is
 * omitted rather than emitted as null.
 */
function normalizeDefinition(def: Record<string, unknown>): Record<string, unknown> {
  const states = def.states as Record<string, Record<string, unknown>> | undefined;
  const normalizedStates: Record<string, unknown> = {};
  if (states) {
    for (const [key, state] of Object.entries(states)) {
      normalizedStates[key] = normalizeState(state);
    }
  }

  const transitions = (def.transitions as Record<string, unknown>[] | undefined) ?? [];

  const result: Record<string, unknown> = {
    states: normalizedStates,
    initialState: def.initialState,
    transitions: transitions.map(normalizeTransition),
  };

  // Strip FiberAppMetadata if present — it's TypeScript-only, not part of wire
  // format. Otherwise pass real metadata through. The Scala schema has
  // `metadata: Option[Json] = None`, so omit the field when there's no value.
  const wireMetadata = isFiberAppMetadata(def.metadata) ? undefined : def.metadata;
  if (wireMetadata !== null && wireMetadata !== undefined) {
    result.metadata = wireMetadata;
  }

  return result;
}

/**
 * Normalize a CreateStateMachine message for wire format
 *
 * Structurally normalizes the message and omits Option=None fields:
 * - definition.metadata → omitted when absent / FiberAppMetadata
 * - definition.states[*].metadata → omitted when absent
 * - definition.transitions[*].dependencies → [] when absent
 * - parentFiberId → omitted when absent
 *
 * @example
 * ```typescript
 * const message = normalizeCreateStateMachine({
 *   fiberId: '...',
 *   definition: { states: { INIT: { id: { value: 'INIT' }, isFinal: false } }, ... },
 *   initialData: {}
 * });
 * // message has no `parentFiberId`, no `definition.metadata`, etc.
 * ```
 */
export function normalizeCreateStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    fiberId: msg.fiberId,
    definition: normalizeDefinition(msg.definition as Record<string, unknown>),
    initialData: msg.initialData ?? {},
  };
  if (msg.parentFiberId !== null && msg.parentFiberId !== undefined) {
    result.parentFiberId = msg.parentFiberId;
  }
  // Defensive: strip any remaining null object-fields (e.g. inside initialData)
  // so the canonical form matches the server's dropNulls behavior.
  return dropNulls(result);
}

/**
 * Normalize a TransitionStateMachine message for wire format
 *
 * Scala TransitionStateMachine schema:
 *   fiberId: UUID (required)
 *   eventName: String (required)
 *   payload: JsonLogicValue (required)
 *   targetSequenceNumber: FiberOrdinal (required)
 *
 * All top-level fields are required, but null fields nested inside `payload`
 * are stripped to match the server's canonical bytes.
 */
export function normalizeTransitionStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  return dropNulls({
    fiberId: msg.fiberId,
    eventName: msg.eventName,
    payload: msg.payload,
    targetSequenceNumber: msg.targetSequenceNumber,
  });
}

/**
 * Normalize an ArchiveStateMachine message for wire format
 *
 * Scala ArchiveStateMachine schema:
 *   fiberId: UUID (required)
 *   targetSequenceNumber: FiberOrdinal (required)
 *
 * All fields are required — no Option types, so no null normalization needed.
 */
export function normalizeArchiveStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  return {
    fiberId: msg.fiberId,
    targetSequenceNumber: msg.targetSequenceNumber,
  };
}

/**
 * Normalize any OttochainMessage wrapper for wire format.
 *
 * Detects the message type from the wrapper key and applies the
 * appropriate normalization. Null object-fields are stripped so the
 * canonical JSON matches what the Scala metagraph signs/verifies.
 *
 * @param message - OttochainMessage in wrapper format: `{ CreateStateMachine: {...} }`
 * @returns Normalized message with Option=None fields omitted (no explicit nulls)
 *
 * @example
 * ```typescript
 * const normalized = normalizeMessage({
 *   CreateStateMachine: { fiberId: '...', definition: {...}, initialData: {} }
 * });
 * const signed = await signTransaction(normalized, privateKey);
 * ```
 */
export function normalizeMessage(message: Record<string, unknown>): Record<string, unknown> {
  if ('CreateStateMachine' in message) {
    return { CreateStateMachine: normalizeCreateStateMachine(message.CreateStateMachine as Record<string, unknown>) };
  }
  if ('TransitionStateMachine' in message) {
    return { TransitionStateMachine: normalizeTransitionStateMachine(message.TransitionStateMachine as Record<string, unknown>) };
  }
  if ('ArchiveStateMachine' in message) {
    return { ArchiveStateMachine: normalizeArchiveStateMachine(message.ArchiveStateMachine as Record<string, unknown>) };
  }
  // CreateScript and InvokeScript — strip nulls (e.g. initialState: null) so the
  // canonical form matches the server. dropNulls preserves empty []/{}.
  return dropNulls(message);
}
