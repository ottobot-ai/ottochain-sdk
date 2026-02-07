import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address, FiberOrdinal, SnapshotOrdinal, StateId } from "./common_pb.js";
import type { Value } from "@bufbuild/protobuf/wkt";
import type { JsonObject, Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/v1/fiber.proto.
 */
export declare const file_ottochain_v1_fiber: GenFile;
/**
 * Access control policy for scripts
 *
 * @generated from message ottochain.v1.AccessControlPolicy
 */
export type AccessControlPolicy = Message<"ottochain.v1.AccessControlPolicy"> & {
    /**
     * @generated from oneof ottochain.v1.AccessControlPolicy.policy
     */
    policy: {
        /**
         * @generated from field: ottochain.v1.PublicAccess public = 1;
         */
        value: PublicAccess;
        case: "public";
    } | {
        /**
         * @generated from field: ottochain.v1.WhitelistAccess whitelist = 2;
         */
        value: WhitelistAccess;
        case: "whitelist";
    } | {
        /**
         * @generated from field: ottochain.v1.FiberOwnedAccess fiber_owned = 3;
         */
        value: FiberOwnedAccess;
        case: "fiberOwned";
    } | {
        case: undefined;
        value?: undefined;
    };
};
/**
 * Describes the message ottochain.v1.AccessControlPolicy.
 * Use `create(AccessControlPolicySchema)` to create a new message.
 */
export declare const AccessControlPolicySchema: GenMessage<AccessControlPolicy>;
/**
 * @generated from message ottochain.v1.PublicAccess
 */
export type PublicAccess = Message<"ottochain.v1.PublicAccess"> & {};
/**
 * Describes the message ottochain.v1.PublicAccess.
 * Use `create(PublicAccessSchema)` to create a new message.
 */
export declare const PublicAccessSchema: GenMessage<PublicAccess>;
/**
 * @generated from message ottochain.v1.WhitelistAccess
 */
export type WhitelistAccess = Message<"ottochain.v1.WhitelistAccess"> & {
    /**
     * @generated from field: repeated ottochain.v1.Address addresses = 1;
     */
    addresses: Address[];
};
/**
 * Describes the message ottochain.v1.WhitelistAccess.
 * Use `create(WhitelistAccessSchema)` to create a new message.
 */
export declare const WhitelistAccessSchema: GenMessage<WhitelistAccess>;
/**
 * @generated from message ottochain.v1.FiberOwnedAccess
 */
export type FiberOwnedAccess = Message<"ottochain.v1.FiberOwnedAccess"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
};
/**
 * Describes the message ottochain.v1.FiberOwnedAccess.
 * Use `create(FiberOwnedAccessSchema)` to create a new message.
 */
export declare const FiberOwnedAccessSchema: GenMessage<FiberOwnedAccess>;
/**
 * State machine definition
 *
 * @generated from message ottochain.v1.StateMachineDefinition
 */
export type StateMachineDefinition = Message<"ottochain.v1.StateMachineDefinition"> & {
    /**
     * @generated from field: google.protobuf.Struct states = 1;
     */
    states?: JsonObject;
    /**
     * @generated from field: ottochain.v1.StateId initial_state = 2;
     */
    initialState?: StateId;
    /**
     * @generated from field: repeated google.protobuf.Struct transitions = 3;
     */
    transitions: JsonObject[];
    /**
     * @generated from field: optional google.protobuf.Struct metadata = 4;
     */
    metadata?: JsonObject;
};
/**
 * Describes the message ottochain.v1.StateMachineDefinition.
 * Use `create(StateMachineDefinitionSchema)` to create a new message.
 */
export declare const StateMachineDefinitionSchema: GenMessage<StateMachineDefinition>;
/**
 * Emitted event from state machine transition
 *
 * @generated from message ottochain.v1.EmittedEvent
 */
export type EmittedEvent = Message<"ottochain.v1.EmittedEvent"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: google.protobuf.Value data = 2;
     */
    data?: Value;
    /**
     * @generated from field: optional string destination = 3;
     */
    destination?: string;
};
/**
 * Describes the message ottochain.v1.EmittedEvent.
 * Use `create(EmittedEventSchema)` to create a new message.
 */
export declare const EmittedEventSchema: GenMessage<EmittedEvent>;
/**
 * Event receipt - log entry for state machine transition
 *
 * @generated from message ottochain.v1.EventReceipt
 */
export type EventReceipt = Message<"ottochain.v1.EventReceipt"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal sequence_number = 2;
     */
    sequenceNumber?: FiberOrdinal;
    /**
     * @generated from field: string event_name = 3;
     */
    eventName: string;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal ordinal = 4;
     */
    ordinal?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.StateId from_state = 5;
     */
    fromState?: StateId;
    /**
     * @generated from field: ottochain.v1.StateId to_state = 6;
     */
    toState?: StateId;
    /**
     * @generated from field: bool success = 7;
     */
    success: boolean;
    /**
     * @generated from field: int64 gas_used = 8;
     */
    gasUsed: bigint;
    /**
     * @generated from field: int32 triggers_fired = 9;
     */
    triggersFired: number;
    /**
     * @generated from field: optional string error_message = 10;
     */
    errorMessage?: string;
    /**
     * @generated from field: optional string source_fiber_id = 11;
     */
    sourceFiberId?: string;
    /**
     * @generated from field: repeated ottochain.v1.EmittedEvent emitted_events = 12;
     */
    emittedEvents: EmittedEvent[];
};
/**
 * Describes the message ottochain.v1.EventReceipt.
 * Use `create(EventReceiptSchema)` to create a new message.
 */
export declare const EventReceiptSchema: GenMessage<EventReceipt>;
/**
 * Script invocation - log entry for script oracle call
 *
 * @generated from message ottochain.v1.ScriptInvocation
 */
export type ScriptInvocation = Message<"ottochain.v1.ScriptInvocation"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: string method = 2;
     */
    method: string;
    /**
     * @generated from field: google.protobuf.Value args = 3;
     */
    args?: Value;
    /**
     * @generated from field: google.protobuf.Value result = 4;
     */
    result?: Value;
    /**
     * @generated from field: int64 gas_used = 5;
     */
    gasUsed: bigint;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal invoked_at = 6;
     */
    invokedAt?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.Address invoked_by = 7;
     */
    invokedBy?: Address;
};
/**
 * Describes the message ottochain.v1.ScriptInvocation.
 * Use `create(ScriptInvocationSchema)` to create a new message.
 */
export declare const ScriptInvocationSchema: GenMessage<ScriptInvocation>;
/**
 * Fiber log entry - union of event receipt or script invocation
 *
 * @generated from message ottochain.v1.FiberLogEntry
 */
export type FiberLogEntry = Message<"ottochain.v1.FiberLogEntry"> & {
    /**
     * @generated from oneof ottochain.v1.FiberLogEntry.entry
     */
    entry: {
        /**
         * @generated from field: ottochain.v1.EventReceipt event_receipt = 1;
         */
        value: EventReceipt;
        case: "eventReceipt";
    } | {
        /**
         * @generated from field: ottochain.v1.ScriptInvocation script_invocation = 2;
         */
        value: ScriptInvocation;
        case: "scriptInvocation";
    } | {
        case: undefined;
        value?: undefined;
    };
};
/**
 * Describes the message ottochain.v1.FiberLogEntry.
 * Use `create(FiberLogEntrySchema)` to create a new message.
 */
export declare const FiberLogEntrySchema: GenMessage<FiberLogEntry>;
/**
 * Fiber lifecycle status
 *
 * @generated from enum ottochain.v1.FiberStatus
 */
export declare enum FiberStatus {
    /**
     * @generated from enum value: FIBER_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: FIBER_STATUS_ACTIVE = 1;
     */
    ACTIVE = 1,
    /**
     * @generated from enum value: FIBER_STATUS_ARCHIVED = 2;
     */
    ARCHIVED = 2,
    /**
     * @generated from enum value: FIBER_STATUS_FAILED = 3;
     */
    FAILED = 3
}
/**
 * Describes the enum ottochain.v1.FiberStatus.
 */
export declare const FiberStatusSchema: GenEnum<FiberStatus>;
