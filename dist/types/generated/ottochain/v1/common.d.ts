import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.v1";
/** Fiber sequence number (non-negative) */
export interface FiberOrdinal {
    value: number;
}
/** Snapshot ordinal from Constellation framework */
export interface SnapshotOrdinal {
    value: number;
}
/** State identifier for state machines */
export interface StateId {
    value: string;
}
/** Hash value */
export interface HashValue {
    value: string;
}
/** DAG address (Constellation network address) */
export interface Address {
    value: string;
}
export declare const FiberOrdinal: MessageFns<FiberOrdinal>;
export declare const SnapshotOrdinal: MessageFns<SnapshotOrdinal>;
export declare const StateId: MessageFns<StateId>;
export declare const HashValue: MessageFns<HashValue>;
export declare const Address: MessageFns<Address>;
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
