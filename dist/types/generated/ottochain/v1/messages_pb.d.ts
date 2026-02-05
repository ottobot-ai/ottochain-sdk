import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { FiberOrdinal } from "./common_pb.js";
import type { AccessControlPolicy, StateMachineDefinition } from "./fiber_pb.js";
import type { Value } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/v1/messages.proto.
 */
export declare const file_ottochain_v1_messages: GenFile;
/**
 * Create a new state machine fiber
 *
 * @generated from message ottochain.v1.CreateStateMachine
 */
export type CreateStateMachine = Message<"ottochain.v1.CreateStateMachine"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: ottochain.v1.StateMachineDefinition definition = 2;
     */
    definition?: StateMachineDefinition;
    /**
     * @generated from field: google.protobuf.Value initial_data = 3;
     */
    initialData?: Value;
    /**
     * @generated from field: optional string parent_fiber_id = 4;
     */
    parentFiberId?: string;
};
/**
 * Describes the message ottochain.v1.CreateStateMachine.
 * Use `create(CreateStateMachineSchema)` to create a new message.
 */
export declare const CreateStateMachineSchema: GenMessage<CreateStateMachine>;
/**
 * Trigger a state machine transition
 *
 * @generated from message ottochain.v1.TransitionStateMachine
 */
export type TransitionStateMachine = Message<"ottochain.v1.TransitionStateMachine"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: string event_name = 2;
     */
    eventName: string;
    /**
     * @generated from field: google.protobuf.Value payload = 3;
     */
    payload?: Value;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal target_sequence_number = 4;
     */
    targetSequenceNumber?: FiberOrdinal;
};
/**
 * Describes the message ottochain.v1.TransitionStateMachine.
 * Use `create(TransitionStateMachineSchema)` to create a new message.
 */
export declare const TransitionStateMachineSchema: GenMessage<TransitionStateMachine>;
/**
 * Archive a state machine fiber
 *
 * @generated from message ottochain.v1.ArchiveStateMachine
 */
export type ArchiveStateMachine = Message<"ottochain.v1.ArchiveStateMachine"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal target_sequence_number = 2;
     */
    targetSequenceNumber?: FiberOrdinal;
};
/**
 * Describes the message ottochain.v1.ArchiveStateMachine.
 * Use `create(ArchiveStateMachineSchema)` to create a new message.
 */
export declare const ArchiveStateMachineSchema: GenMessage<ArchiveStateMachine>;
/**
 * Create a new script fiber
 *
 * @generated from message ottochain.v1.CreateScript
 */
export type CreateScript = Message<"ottochain.v1.CreateScript"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: google.protobuf.Value script_program = 2;
     */
    scriptProgram?: Value;
    /**
     * @generated from field: optional google.protobuf.Value initial_state = 3;
     */
    initialState?: Value;
    /**
     * @generated from field: ottochain.v1.AccessControlPolicy access_control = 4;
     */
    accessControl?: AccessControlPolicy;
};
/**
 * Describes the message ottochain.v1.CreateScript.
 * Use `create(CreateScriptSchema)` to create a new message.
 */
export declare const CreateScriptSchema: GenMessage<CreateScript>;
/**
 * Invoke a script
 *
 * @generated from message ottochain.v1.InvokeScript
 */
export type InvokeScript = Message<"ottochain.v1.InvokeScript"> & {
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
     * @generated from field: ottochain.v1.FiberOrdinal target_sequence_number = 4;
     */
    targetSequenceNumber?: FiberOrdinal;
};
/**
 * Describes the message ottochain.v1.InvokeScript.
 * Use `create(InvokeScriptSchema)` to create a new message.
 */
export declare const InvokeScriptSchema: GenMessage<InvokeScript>;
/**
 * Union message type for all OttoChain operations
 *
 * @generated from message ottochain.v1.OttochainMessage
 */
export type OttochainMessage = Message<"ottochain.v1.OttochainMessage"> & {
    /**
     * @generated from oneof ottochain.v1.OttochainMessage.message
     */
    message: {
        /**
         * @generated from field: ottochain.v1.CreateStateMachine create_state_machine = 1;
         */
        value: CreateStateMachine;
        case: "createStateMachine";
    } | {
        /**
         * @generated from field: ottochain.v1.TransitionStateMachine transition_state_machine = 2;
         */
        value: TransitionStateMachine;
        case: "transitionStateMachine";
    } | {
        /**
         * @generated from field: ottochain.v1.ArchiveStateMachine archive_state_machine = 3;
         */
        value: ArchiveStateMachine;
        case: "archiveStateMachine";
    } | {
        /**
         * @generated from field: ottochain.v1.CreateScript create_script = 4;
         */
        value: CreateScript;
        case: "createScript";
    } | {
        /**
         * @generated from field: ottochain.v1.InvokeScript invoke_script = 5;
         */
        value: InvokeScript;
        case: "invokeScript";
    } | {
        case: undefined;
        value?: undefined;
    };
};
/**
 * Describes the message ottochain.v1.OttochainMessage.
 * Use `create(OttochainMessageSchema)` to create a new message.
 */
export declare const OttochainMessageSchema: GenMessage<OttochainMessage>;
