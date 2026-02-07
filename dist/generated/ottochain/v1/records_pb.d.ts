import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address, FiberOrdinal, HashValue, SnapshotOrdinal, StateId } from "./common_pb.js";
import type { AccessControlPolicy, EventReceipt, FiberLogEntry, FiberStatus, ScriptInvocation, StateMachineDefinition } from "./fiber_pb.js";
import type { Value } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/v1/records.proto.
 */
export declare const file_ottochain_v1_records: GenFile;
/**
 * State machine fiber record - on-chain representation
 *
 * @generated from message ottochain.v1.StateMachineFiberRecord
 */
export type StateMachineFiberRecord = Message<"ottochain.v1.StateMachineFiberRecord"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal creation_ordinal = 2;
     */
    creationOrdinal?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal previous_update_ordinal = 3;
     */
    previousUpdateOrdinal?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal latest_update_ordinal = 4;
     */
    latestUpdateOrdinal?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.StateMachineDefinition definition = 5;
     */
    definition?: StateMachineDefinition;
    /**
     * @generated from field: ottochain.v1.StateId current_state = 6;
     */
    currentState?: StateId;
    /**
     * @generated from field: google.protobuf.Value state_data = 7;
     */
    stateData?: Value;
    /**
     * @generated from field: ottochain.v1.HashValue state_data_hash = 8;
     */
    stateDataHash?: HashValue;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal sequence_number = 9;
     */
    sequenceNumber?: FiberOrdinal;
    /**
     * @generated from field: repeated ottochain.v1.Address owners = 10;
     */
    owners: Address[];
    /**
     * @generated from field: ottochain.v1.FiberStatus status = 11;
     */
    status: FiberStatus;
    /**
     * @generated from field: optional ottochain.v1.EventReceipt last_receipt = 12;
     */
    lastReceipt?: EventReceipt;
    /**
     * @generated from field: optional string parent_fiber_id = 13;
     */
    parentFiberId?: string;
    /**
     * @generated from field: repeated string child_fiber_ids = 14;
     */
    childFiberIds: string[];
};
/**
 * Describes the message ottochain.v1.StateMachineFiberRecord.
 * Use `create(StateMachineFiberRecordSchema)` to create a new message.
 */
export declare const StateMachineFiberRecordSchema: GenMessage<StateMachineFiberRecord>;
/**
 * Script fiber record - on-chain representation
 *
 * @generated from message ottochain.v1.ScriptFiberRecord
 */
export type ScriptFiberRecord = Message<"ottochain.v1.ScriptFiberRecord"> & {
    /**
     * @generated from field: string fiber_id = 1;
     */
    fiberId: string;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal creation_ordinal = 2;
     */
    creationOrdinal?: SnapshotOrdinal;
    /**
     * @generated from field: ottochain.v1.SnapshotOrdinal latest_update_ordinal = 3;
     */
    latestUpdateOrdinal?: SnapshotOrdinal;
    /**
     * @generated from field: google.protobuf.Value script_program = 4;
     */
    scriptProgram?: Value;
    /**
     * @generated from field: optional google.protobuf.Value state_data = 5;
     */
    stateData?: Value;
    /**
     * @generated from field: optional ottochain.v1.HashValue state_data_hash = 6;
     */
    stateDataHash?: HashValue;
    /**
     * @generated from field: ottochain.v1.AccessControlPolicy access_control = 7;
     */
    accessControl?: AccessControlPolicy;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal sequence_number = 8;
     */
    sequenceNumber?: FiberOrdinal;
    /**
     * @generated from field: repeated ottochain.v1.Address owners = 9;
     */
    owners: Address[];
    /**
     * @generated from field: ottochain.v1.FiberStatus status = 10;
     */
    status: FiberStatus;
    /**
     * @generated from field: optional ottochain.v1.ScriptInvocation last_invocation = 11;
     */
    lastInvocation?: ScriptInvocation;
};
/**
 * Describes the message ottochain.v1.ScriptFiberRecord.
 * Use `create(ScriptFiberRecordSchema)` to create a new message.
 */
export declare const ScriptFiberRecordSchema: GenMessage<ScriptFiberRecord>;
/**
 * Fiber commit - lightweight proof in on-chain state
 *
 * @generated from message ottochain.v1.FiberCommit
 */
export type FiberCommit = Message<"ottochain.v1.FiberCommit"> & {
    /**
     * @generated from field: ottochain.v1.HashValue record_hash = 1;
     */
    recordHash?: HashValue;
    /**
     * @generated from field: optional ottochain.v1.HashValue state_data_hash = 2;
     */
    stateDataHash?: HashValue;
    /**
     * @generated from field: ottochain.v1.FiberOrdinal sequence_number = 3;
     */
    sequenceNumber?: FiberOrdinal;
};
/**
 * Describes the message ottochain.v1.FiberCommit.
 * Use `create(FiberCommitSchema)` to create a new message.
 */
export declare const FiberCommitSchema: GenMessage<FiberCommit>;
/**
 * On-chain state
 *
 * @generated from message ottochain.v1.OnChainState
 */
export type OnChainState = Message<"ottochain.v1.OnChainState"> & {
    /**
     * @generated from field: map<string, ottochain.v1.FiberCommit> fiber_commits = 1;
     */
    fiberCommits: {
        [key: string]: FiberCommit;
    };
    /**
     * @generated from field: map<string, ottochain.v1.FiberLogEntryList> latest_logs = 2;
     */
    latestLogs: {
        [key: string]: FiberLogEntryList;
    };
};
/**
 * Describes the message ottochain.v1.OnChainState.
 * Use `create(OnChainStateSchema)` to create a new message.
 */
export declare const OnChainStateSchema: GenMessage<OnChainState>;
/**
 * Helper for map of log entries
 *
 * @generated from message ottochain.v1.FiberLogEntryList
 */
export type FiberLogEntryList = Message<"ottochain.v1.FiberLogEntryList"> & {
    /**
     * @generated from field: repeated ottochain.v1.FiberLogEntry entries = 1;
     */
    entries: FiberLogEntry[];
};
/**
 * Describes the message ottochain.v1.FiberLogEntryList.
 * Use `create(FiberLogEntryListSchema)` to create a new message.
 */
export declare const FiberLogEntryListSchema: GenMessage<FiberLogEntryList>;
/**
 * Calculated state - queryable via ML0 endpoints
 *
 * @generated from message ottochain.v1.CalculatedState
 */
export type CalculatedState = Message<"ottochain.v1.CalculatedState"> & {
    /**
     * @generated from field: map<string, ottochain.v1.StateMachineFiberRecord> state_machines = 1;
     */
    stateMachines: {
        [key: string]: StateMachineFiberRecord;
    };
    /**
     * @generated from field: map<string, ottochain.v1.ScriptFiberRecord> scripts = 2;
     */
    scripts: {
        [key: string]: ScriptFiberRecord;
    };
};
/**
 * Describes the message ottochain.v1.CalculatedState.
 * Use `create(CalculatedStateSchema)` to create a new message.
 */
export declare const CalculatedStateSchema: GenMessage<CalculatedState>;
