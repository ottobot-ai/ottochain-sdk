import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.v1";
/** Fiber lifecycle status */
export declare enum FiberStatus {
    FIBER_STATUS_UNSPECIFIED = "FIBER_STATUS_UNSPECIFIED",
    FIBER_STATUS_ACTIVE = "FIBER_STATUS_ACTIVE",
    FIBER_STATUS_ARCHIVED = "FIBER_STATUS_ARCHIVED",
    FIBER_STATUS_FAILED = "FIBER_STATUS_FAILED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function fiberStatusFromJSON(object: any): FiberStatus;
export declare function fiberStatusToJSON(object: FiberStatus): string;
export declare function fiberStatusToNumber(object: FiberStatus): number;
/** Access control policy for scripts */
export interface AccessControlPolicy {
    policy?: {
        $case: "public";
        public: PublicAccess;
    } | {
        $case: "whitelist";
        whitelist: WhitelistAccess;
    } | {
        $case: "fiberOwned";
        fiberOwned: FiberOwnedAccess;
    } | undefined;
}
export interface PublicAccess {
}
export interface WhitelistAccess {
    /** DAG addresses */
    addresses: string[];
}
export interface FiberOwnedAccess {
    fiberId: string;
}
/** State machine definition */
export interface StateMachineDefinition {
    states?: {
        [key: string]: any;
    } | undefined;
    /** State ID */
    initialState: string;
    transitions: {
        [key: string]: any;
    }[];
    metadata?: {
        [key: string]: any;
    } | undefined;
}
/** Emitted event from state machine transition */
export interface EmittedEvent {
    name: string;
    data?: any | undefined;
    destination?: string | undefined;
}
/** Event receipt - log entry for state machine transition */
export interface EventReceipt {
    fiberId: string;
    /** Fiber ordinal */
    sequenceNumber: number;
    eventName: string;
    /** Snapshot ordinal */
    ordinal: number;
    /** State ID */
    fromState: string;
    /** State ID */
    toState: string;
    success: boolean;
    gasUsed: number;
    triggersFired: number;
    errorMessage?: string | undefined;
    sourceFiberId?: string | undefined;
    emittedEvents: EmittedEvent[];
}
/** Script invocation - log entry for script oracle call */
export interface ScriptInvocation {
    fiberId: string;
    method: string;
    args?: any | undefined;
    result?: any | undefined;
    gasUsed: number;
    /** Snapshot ordinal */
    invokedAt: number;
    /** DAG address */
    invokedBy: string;
}
/** Fiber log entry - union of event receipt or script invocation */
export interface FiberLogEntry {
    entry?: {
        $case: "eventReceipt";
        eventReceipt: EventReceipt;
    } | {
        $case: "scriptInvocation";
        scriptInvocation: ScriptInvocation;
    } | undefined;
}
export declare const AccessControlPolicy: MessageFns<AccessControlPolicy>;
export declare const PublicAccess: MessageFns<PublicAccess>;
export declare const WhitelistAccess: MessageFns<WhitelistAccess>;
export declare const FiberOwnedAccess: MessageFns<FiberOwnedAccess>;
export declare const StateMachineDefinition: MessageFns<StateMachineDefinition>;
export declare const EmittedEvent: MessageFns<EmittedEvent>;
export declare const EventReceipt: MessageFns<EventReceipt>;
export declare const ScriptInvocation: MessageFns<ScriptInvocation>;
export declare const FiberLogEntry: MessageFns<FiberLogEntry>;
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
