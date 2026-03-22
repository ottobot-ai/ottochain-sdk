/**
 * Normalize OttoChain Messages for Signing
 *
 * Converts OttoChain message objects to the wire format expected by the
 * Scala metagraph. Metakit's JsonBinaryCodec (used by OttoChain for data
 * transaction signing) canonicalizes JSON with dropNullValues = true.
 *
 * NOTE: This is Metakit's codec, NOT tessellation's JsonSerializer (which
 * uses Brotli compression for snapshots/consensus — a different layer).
 * Different layers use different byte-sequence encoders.
 *
 * Because Metakit drops null fields during canonicalization, the canonical
 * JSON used for signature verification **omits** null fields entirely.
 * If the TypeScript client includes explicit nulls (e.g., `"metadata": null`),
 * the canonical form won't match and signature verification will fail.
 *
 * Schema mapping (Scala → TypeScript wire format):
 * - `Option[A] = None` → field OMITTED (not null, not undefined)
 * - `Option[A] = Some(v)` → `v`
 * - `List.empty` / `Set.empty` → `[]`
 * - `Map.empty` → `{}`
 * - `Boolean = false` → `false` (always include, not a null/Option)
 */

/**
 * Normalize a State object for wire format.
 * State: id (required), isFinal (default false), metadata (Option = None)
 * Omit metadata when null/undefined (dropNullValues).
 */
function normalizeState(state: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: state.id,
    isFinal: state.isFinal ?? false,
  };
  if (state.metadata != null) {
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

  // Strip FiberAppMetadata if present — it's TypeScript-only, not part of wire format.
  // Omit metadata entirely when null/FiberAppMetadata (dropNullValues = true on Scala side).
  const wireMetadata = isFiberAppMetadata(def.metadata) ? undefined : def.metadata;

  const result: Record<string, unknown> = {
    states: normalizedStates,
    initialState: def.initialState,
    transitions: transitions.map(normalizeTransition),
  };
  if (wireMetadata != null) {
    result.metadata = wireMetadata;
  }
  return result;
}

/**
 * Normalize a CreateStateMachine message for wire format
 *
 * Metakit's JsonBinaryCodec uses dropNullValues = true for canonicalization.
 * Optional fields at their defaults must be OMITTED (not set to null)
 * to match the canonical JSON used for signature verification.
 *
 * - definition.metadata → OMITTED when absent/FiberAppMetadata
 * - definition.states[*].metadata → OMITTED when absent
 * - definition.transitions[*].dependencies → [] (Set.empty default, always included)
 * - parentFiberId → OMITTED when absent (Option[UUID] = None)
 * - participants → OMITTED when absent (Option[Set[Address]] = None)
 *
 * @example
 * ```typescript
 * const message = normalizeCreateStateMachine({
 *   fiberId: '...',
 *   definition: { states: { INIT: { id: 'INIT', isFinal: false } }, ... },
 *   initialData: {}
 * });
 * // Optional fields are absent (not null): no parentFiberId, no metadata, etc.
 * ```
 */
export function normalizeCreateStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    fiberId: msg.fiberId,
    definition: normalizeDefinition(msg.definition as Record<string, unknown>),
    initialData: msg.initialData ?? {},
  };
  if (msg.parentFiberId != null) {
    result.parentFiberId = msg.parentFiberId;
  }
  if (msg.participants != null) {
    result.participants = msg.participants;
  }
  return result;
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
 * All fields are required — no Option types, so no null normalization needed.
 */
export function normalizeTransitionStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  return {
    fiberId: msg.fiberId,
    eventName: msg.eventName,
    payload: msg.payload,
    targetSequenceNumber: msg.targetSequenceNumber,
  };
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
 * appropriate normalization.
 *
 * @param message - OttochainMessage in wrapper format: `{ CreateStateMachine: {...} }`
 * @returns Normalized message with all Option fields as explicit null
 *
 * @example
 * ```typescript
 * const normalized = normalizeMessage({
 *   CreateStateMachine: { fiberId: '...', definition: {...}, initialData: {} }
 * });
 * const signed = await signDataUpdate(normalized, privateKey);
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
  // CreateScript and InvokeScript — pass through (no optional fields)
  return message;
}
