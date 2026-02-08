/**
 * Ottochain-specific type definitions
 *
 * TypeScript interfaces matching the wire format from the Scala metagraph.
 * The JSON Logic engine stores state as plain JSON - no wrapper objects.
 *
 * @see modules/models/src/main/scala/xyz/kd5ujc/schema/
 * @packageDocumentation
 */
export type { Address, FiberId, StateId, HashValue, FiberOrdinal, SnapshotOrdinal, Timestamp, } from '../types.js';
/**
 * JSON logic value - arbitrary JSON data used for state data and payloads.
 */
export type JsonLogicValue = unknown;
/**
 * JSON logic expression - a JsonLogic program definition.
 */
export type JsonLogicExpression = unknown;
/**
 * Lifecycle status of a fiber.
 * Wire format: plain string.
 */
export type FiberStatus = 'Active' | 'Archived' | 'Failed';
/**
 * Access control policy for script oracles.
 * Wire format: discriminated union with type key.
 */
export type AccessControlPolicy = {
    Public: Record<string, never>;
} | {
    Whitelist: {
        addresses: string[];
    };
} | {
    FiberOwned: {
        fiberId: string;
    };
};
/**
 * Definition of a state machine's structure and transitions.
 * Wire format: plain JSON object with string initialState.
 */
export interface StateMachineDefinition {
    states: Record<string, unknown>;
    initialState: string;
    transitions: unknown[];
    metadata?: JsonLogicValue;
}
/**
 * Event emitted by a state machine transition trigger.
 */
export interface EmittedEvent {
    name: string;
    data: JsonLogicValue;
    destination?: string;
}
/**
 * Receipt of a state machine event processing.
 * Wire format: all ordinals/states are plain primitives.
 */
export interface EventReceipt {
    fiberId: string;
    sequenceNumber: number;
    eventName: string;
    ordinal: number;
    fromState: string;
    toState: string;
    success: boolean;
    gasUsed: number;
    triggersFired: number;
    errorMessage?: string;
    sourceFiberId?: string;
    emittedEvents: EmittedEvent[];
}
/**
 * Log entry for a script oracle invocation.
 */
export interface OracleInvocation {
    fiberId: string;
    method: string;
    args: JsonLogicValue;
    result: JsonLogicValue;
    gasUsed: number;
    invokedAt: number;
    invokedBy: string;
}
/**
 * Union type for all fiber log entries.
 */
export type FiberLogEntry = EventReceipt | OracleInvocation;
/**
 * On-chain record for a state machine fiber.
 * Wire format: all ordinals/states/hashes are plain primitives.
 */
export interface StateMachineFiberRecord {
    fiberId: string;
    creationOrdinal: number;
    previousUpdateOrdinal: number;
    latestUpdateOrdinal: number;
    definition: StateMachineDefinition;
    currentState: string;
    stateData: JsonLogicValue;
    stateDataHash: string;
    sequenceNumber: number;
    owners: string[];
    status: FiberStatus;
    lastReceipt?: EventReceipt;
    parentFiberId?: string;
    childFiberIds: string[];
}
/**
 * On-chain record for a script oracle fiber.
 */
export interface ScriptFiberRecord {
    fiberId: string;
    creationOrdinal: number;
    latestUpdateOrdinal: number;
    scriptProgram: JsonLogicExpression;
    stateData?: JsonLogicValue;
    stateDataHash?: string;
    accessControl: AccessControlPolicy;
    sequenceNumber: number;
    owners: string[];
    status: FiberStatus;
    lastInvocation?: OracleInvocation;
}
/**
 * Union type for all fiber records.
 */
export type FiberRecord = StateMachineFiberRecord | ScriptFiberRecord;
/**
 * Commit hash for a single fiber in the on-chain state.
 */
export interface FiberCommit {
    recordHash: string;
    stateDataHash?: string;
    sequenceNumber: number;
}
/**
 * Full on-chain state of the ottochain metagraph.
 */
export interface OnChain {
    fiberCommits: Record<string, FiberCommit>;
    latestLogs: Record<string, FiberLogEntry[]>;
}
/**
 * Full calculated state (served by ML0 /v1/ endpoints).
 */
export interface CalculatedState {
    stateMachines: Record<string, StateMachineFiberRecord>;
    scripts: Record<string, ScriptFiberRecord>;
}
/**
 * Create a new state machine fiber.
 */
export interface CreateStateMachine {
    fiberId: string;
    definition: StateMachineDefinition;
    initialData: JsonLogicValue;
    parentFiberId?: string;
}
/**
 * Trigger a state machine transition.
 */
export interface TransitionStateMachine {
    fiberId: string;
    eventName: string;
    payload: JsonLogicValue;
    targetSequenceNumber: number;
}
/**
 * Archive a state machine fiber.
 */
export interface ArchiveStateMachine {
    fiberId: string;
    targetSequenceNumber: number;
}
/**
 * Create a new script oracle fiber.
 */
export interface CreateScript {
    fiberId: string;
    scriptProgram: JsonLogicExpression;
    initialState?: JsonLogicValue;
    accessControl: AccessControlPolicy;
}
/**
 * Invoke a script oracle.
 */
export interface InvokeScript {
    fiberId: string;
    method: string;
    args: JsonLogicValue;
    targetSequenceNumber: number;
}
/**
 * Union type for all ottochain messages.
 * JSON is wrapped as `{ MessageName: { ...fields } }`.
 */
export type OttochainMessage = {
    CreateStateMachine: CreateStateMachine;
} | {
    TransitionStateMachine: TransitionStateMachine;
} | {
    ArchiveStateMachine: ArchiveStateMachine;
} | {
    CreateScript: CreateScript;
} | {
    InvokeScript: InvokeScript;
};
