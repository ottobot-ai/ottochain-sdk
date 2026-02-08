import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { AccessControlPolicy, StateMachineDefinition } from "./fiber.js";
export declare const protobufPackage = "ottochain.v1";
/** Create a new state machine fiber */
export interface CreateStateMachine {
    fiberId: string;
    definition?: StateMachineDefinition | undefined;
    initialData?: any | undefined;
    parentFiberId?: string | undefined;
}
/** Trigger a state machine transition */
export interface TransitionStateMachine {
    fiberId: string;
    eventName: string;
    payload?: any | undefined;
    /** Fiber ordinal */
    targetSequenceNumber: number;
}
/** Archive a state machine fiber */
export interface ArchiveStateMachine {
    fiberId: string;
    /** Fiber ordinal */
    targetSequenceNumber: number;
}
/** Create a new script fiber */
export interface CreateScript {
    fiberId: string;
    scriptProgram?: any | undefined;
    initialState?: any | undefined;
    accessControl?: AccessControlPolicy | undefined;
}
/** Invoke a script */
export interface InvokeScript {
    fiberId: string;
    method: string;
    args?: any | undefined;
    /** Fiber ordinal */
    targetSequenceNumber: number;
}
/** Union message type for all OttoChain operations */
export interface OttochainMessage {
    message?: {
        $case: "createStateMachine";
        createStateMachine: CreateStateMachine;
    } | {
        $case: "transitionStateMachine";
        transitionStateMachine: TransitionStateMachine;
    } | {
        $case: "archiveStateMachine";
        archiveStateMachine: ArchiveStateMachine;
    } | {
        $case: "createScript";
        createScript: CreateScript;
    } | {
        $case: "invokeScript";
        invokeScript: InvokeScript;
    } | undefined;
}
export declare const CreateStateMachine: MessageFns<CreateStateMachine>;
export declare const TransitionStateMachine: MessageFns<TransitionStateMachine>;
export declare const ArchiveStateMachine: MessageFns<ArchiveStateMachine>;
export declare const CreateScript: MessageFns<CreateScript>;
export declare const InvokeScript: MessageFns<InvokeScript>;
export declare const OttochainMessage: MessageFns<OttochainMessage>;
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
