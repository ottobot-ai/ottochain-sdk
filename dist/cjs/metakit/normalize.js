"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMessage = exports.normalizeArchiveStateMachine = exports.normalizeTransitionStateMachine = exports.normalizeCreateStateMachine = void 0;
/**
 * Normalize a State object for wire format
 */
function normalizeState(state) {
    return {
        id: state.id,
        isFinal: state.isFinal ?? false,
        metadata: state.metadata ?? null,
    };
}
/**
 * Normalize a Transition object for wire format
 */
function normalizeTransition(t) {
    return {
        from: t.from,
        eventName: t.eventName,
        to: t.to,
        guard: t.guard ?? null,
        actions: t.actions ?? null,
        metadata: t.metadata ?? null,
    };
}
/**
 * Normalize a StateMachineDefinition for wire format
 */
function normalizeDefinition(def) {
    const states = def.states;
    const normalizedStates = {};
    if (states) {
        for (const [key, state] of Object.entries(states)) {
            normalizedStates[key] = normalizeState(state);
        }
    }
    const transitions = def.transitions ?? [];
    return {
        states: normalizedStates,
        initialState: def.initialState,
        transitions: transitions.map(normalizeTransition),
        metadata: def.metadata ?? null,
    };
}
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
function normalizeCreateStateMachine(msg) {
    return {
        fiberId: msg.fiberId,
        definition: normalizeDefinition(msg.definition),
        initialData: msg.initialData ?? {},
        parentFiberId: msg.parentFiberId ?? null,
    };
}
exports.normalizeCreateStateMachine = normalizeCreateStateMachine;
/**
 * Normalize a TransitionStateMachine message for wire format
 */
function normalizeTransitionStateMachine(msg) {
    return {
        fiberId: msg.fiberId,
        eventName: msg.eventName,
        eventData: msg.eventData ?? null,
        fiberOrdinal: msg.fiberOrdinal,
    };
}
exports.normalizeTransitionStateMachine = normalizeTransitionStateMachine;
/**
 * Normalize an ArchiveStateMachine message for wire format
 */
function normalizeArchiveStateMachine(msg) {
    return {
        fiberId: msg.fiberId,
        reason: msg.reason ?? null,
    };
}
exports.normalizeArchiveStateMachine = normalizeArchiveStateMachine;
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
function normalizeMessage(message) {
    if ('CreateStateMachine' in message) {
        return { CreateStateMachine: normalizeCreateStateMachine(message.CreateStateMachine) };
    }
    if ('TransitionStateMachine' in message) {
        return { TransitionStateMachine: normalizeTransitionStateMachine(message.TransitionStateMachine) };
    }
    if ('ArchiveStateMachine' in message) {
        return { ArchiveStateMachine: normalizeArchiveStateMachine(message.ArchiveStateMachine) };
    }
    // CreateScript and InvokeScript — pass through (no optional fields)
    return message;
}
exports.normalizeMessage = normalizeMessage;
