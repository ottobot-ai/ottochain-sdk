/**
 * Normalize OttoChain Messages for Signing
 *
 * Converts OttoChain message objects to the wire format expected by the
 * Scala metagraph. Specifically, ensures all `Option[A]=None` fields are
 * present as explicit `null` values, matching what circe's magnolia encoder
 * produces on the Scala side.
 *
 * This is necessary because metakit's `JsonBinaryCodec.deriveDataUpdate`
 * (rc.8) canonicalizes the circe-encoded JSON **including null fields**.
 * If the TypeScript client omits optional fields (undefined), the canonical
 * JSON won't match and signature verification will fail.
 *
 * Schema mapping (Scala → TypeScript):
 * - `Option[A] = None` → `null` (must be explicit, not undefined/absent)
 * - `Option[A] = Some(v)` → `v`
 * - `List.empty` → `[]`
 * - `Map.empty` → `{}`
 */

/**
 * Normalize a State object for wire format
 */
function normalizeState(state: Record<string, unknown>): Record<string, unknown> {
  return {
    id: state.id,
    isFinal: state.isFinal ?? false,
    metadata: state.metadata ?? null,
  };
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
  // The Scala schema has `metadata: Option[Json] = None`, so use null for wire format.
  const wireMetadata = isFiberAppMetadata(def.metadata) ? null : (def.metadata ?? null);

  return {
    states: normalizedStates,
    initialState: def.initialState,
    transitions: transitions.map(normalizeTransition),
    metadata: wireMetadata,
  };
}

/**
 * Normalize a CreateStateMachine message for wire format
 *
 * Ensures all Option/default fields are explicit in wire format:
 * - definition.metadata → null when absent
 * - definition.states[*].metadata → null when absent
 * - definition.transitions[*].dependencies → [] when absent
 * - parentFiberId → null when absent
 * - participants → null when absent (Optional Set[Address] for multi-party signing)
 *
 * @example
 * ```typescript
 * const message = normalizeCreateStateMachine({
 *   fiberId: '...',
 *   definition: { states: { INIT: { id: { value: 'INIT' }, isFinal: false } }, ... },
 *   initialData: {}
 * });
 * // message now has parentFiberId: null, participants: null, definition.metadata: null, etc.
 * ```
 */
export function normalizeCreateStateMachine(msg: Record<string, unknown>): Record<string, unknown> {
  return {
    fiberId: msg.fiberId,
    definition: normalizeDefinition(msg.definition as Record<string, unknown>),
    initialData: msg.initialData ?? {},
    parentFiberId: msg.parentFiberId ?? null,
    participants: msg.participants ?? null,
  };
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
