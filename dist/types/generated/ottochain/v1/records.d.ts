import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { AccessControlPolicy, EventReceipt, FiberLogEntry, FiberStatus, ScriptInvocation, StateMachineDefinition } from "./fiber.js";
export declare const protobufPackage = "ottochain.v1";
/** State machine fiber record - on-chain representation */
export interface StateMachineFiberRecord {
    fiberId: string;
    /** Snapshot ordinal */
    creationOrdinal: number;
    /** Snapshot ordinal */
    previousUpdateOrdinal: number;
    /** Snapshot ordinal */
    latestUpdateOrdinal: number;
    definition?: StateMachineDefinition | undefined;
    /** State ID */
    currentState: string;
    stateData?: any | undefined;
    /** Hash value */
    stateDataHash: string;
    /** Fiber ordinal */
    sequenceNumber: number;
    /** DAG addresses */
    owners: string[];
    status: FiberStatus;
    lastReceipt?: EventReceipt | undefined;
    parentFiberId?: string | undefined;
    childFiberIds: string[];
}
/** Script fiber record - on-chain representation */
export interface ScriptFiberRecord {
    fiberId: string;
    /** Snapshot ordinal */
    creationOrdinal: number;
    /** Snapshot ordinal */
    latestUpdateOrdinal: number;
    scriptProgram?: any | undefined;
    stateData?: any | undefined;
    /** Hash value */
    stateDataHash?: string | undefined;
    accessControl?: AccessControlPolicy | undefined;
    /** Fiber ordinal */
    sequenceNumber: number;
    /** DAG addresses */
    owners: string[];
    status: FiberStatus;
    lastInvocation?: ScriptInvocation | undefined;
}
/** Fiber commit - lightweight proof in on-chain state */
export interface FiberCommit {
    /** Hash value */
    recordHash: string;
    /** Hash value */
    stateDataHash?: string | undefined;
    /** Fiber ordinal */
    sequenceNumber: number;
}
/** On-chain state */
export interface OnChainState {
    fiberCommits: {
        [key: string]: FiberCommit;
    };
    latestLogs: {
        [key: string]: FiberLogEntryList;
    };
}
export interface OnChainState_FiberCommitsEntry {
    key: string;
    value?: FiberCommit | undefined;
}
export interface OnChainState_LatestLogsEntry {
    key: string;
    value?: FiberLogEntryList | undefined;
}
/** Helper for map of log entries */
export interface FiberLogEntryList {
    entries: FiberLogEntry[];
}
/** Calculated state - queryable via ML0 endpoints */
export interface CalculatedState {
    stateMachines: {
        [key: string]: StateMachineFiberRecord;
    };
    scripts: {
        [key: string]: ScriptFiberRecord;
    };
}
export interface CalculatedState_StateMachinesEntry {
    key: string;
    value?: StateMachineFiberRecord | undefined;
}
export interface CalculatedState_ScriptsEntry {
    key: string;
    value?: ScriptFiberRecord | undefined;
}
export declare const StateMachineFiberRecord: MessageFns<StateMachineFiberRecord>;
export declare const ScriptFiberRecord: MessageFns<ScriptFiberRecord>;
export declare const FiberCommit: MessageFns<FiberCommit>;
export declare const OnChainState: MessageFns<OnChainState>;
export declare const OnChainState_FiberCommitsEntry: MessageFns<OnChainState_FiberCommitsEntry>;
export declare const OnChainState_LatestLogsEntry: MessageFns<OnChainState_LatestLogsEntry>;
export declare const FiberLogEntryList: MessageFns<FiberLogEntryList>;
export declare const CalculatedState: MessageFns<CalculatedState>;
export declare const CalculatedState_StateMachinesEntry: MessageFns<CalculatedState_StateMachinesEntry>;
export declare const CalculatedState_ScriptsEntry: MessageFns<CalculatedState_ScriptsEntry>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {
    $case: string;
} ? {
    [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]>;
} & {
    $case: T["$case"];
} : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
