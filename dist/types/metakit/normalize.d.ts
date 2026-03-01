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
 * Normalize a CreateStateMachine message for wire format
 *
 * Ensures all Option fields are explicit null:
 * - definition.metadata
 * - definition.states[*].metadata
 * - definition.transitions[*].guard
 * - definition.transitions[*].actions
 * - definition.transitions[*].metadata
 * - parentFiberId
 *
 * @example
 * ```typescript
 * const message = normalizeCreateStateMachine({
 *   fiberId: '...',
 *   definition: { states: { INIT: { id: { value: 'INIT' }, isFinal: false } }, ... },
 *   initialData: {}
 * });
 * // message now has parentFiberId: null, definition.metadata: null, etc.
 * ```
 */
export declare function normalizeCreateStateMachine(msg: Record<string, unknown>): Record<string, unknown>;
/**
 * Normalize a TransitionStateMachine message for wire format
 */
export declare function normalizeTransitionStateMachine(msg: Record<string, unknown>): Record<string, unknown>;
/**
 * Normalize an ArchiveStateMachine message for wire format
 */
export declare function normalizeArchiveStateMachine(msg: Record<string, unknown>): Record<string, unknown>;
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
export declare function normalizeMessage(message: Record<string, unknown>): Record<string, unknown>;
