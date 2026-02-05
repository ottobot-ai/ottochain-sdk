import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/v1/common.proto.
 */
export declare const file_ottochain_v1_common: GenFile;
/**
 * Fiber sequence number (non-negative)
 *
 * @generated from message ottochain.v1.FiberOrdinal
 */
export type FiberOrdinal = Message<"ottochain.v1.FiberOrdinal"> & {
    /**
     * @generated from field: int64 value = 1;
     */
    value: bigint;
};
/**
 * Describes the message ottochain.v1.FiberOrdinal.
 * Use `create(FiberOrdinalSchema)` to create a new message.
 */
export declare const FiberOrdinalSchema: GenMessage<FiberOrdinal>;
/**
 * Snapshot ordinal from Constellation framework
 *
 * @generated from message ottochain.v1.SnapshotOrdinal
 */
export type SnapshotOrdinal = Message<"ottochain.v1.SnapshotOrdinal"> & {
    /**
     * @generated from field: int64 value = 1;
     */
    value: bigint;
};
/**
 * Describes the message ottochain.v1.SnapshotOrdinal.
 * Use `create(SnapshotOrdinalSchema)` to create a new message.
 */
export declare const SnapshotOrdinalSchema: GenMessage<SnapshotOrdinal>;
/**
 * State identifier for state machines
 *
 * @generated from message ottochain.v1.StateId
 */
export type StateId = Message<"ottochain.v1.StateId"> & {
    /**
     * @generated from field: string value = 1;
     */
    value: string;
};
/**
 * Describes the message ottochain.v1.StateId.
 * Use `create(StateIdSchema)` to create a new message.
 */
export declare const StateIdSchema: GenMessage<StateId>;
/**
 * Hash value
 *
 * @generated from message ottochain.v1.HashValue
 */
export type HashValue = Message<"ottochain.v1.HashValue"> & {
    /**
     * @generated from field: string value = 1;
     */
    value: string;
};
/**
 * Describes the message ottochain.v1.HashValue.
 * Use `create(HashValueSchema)` to create a new message.
 */
export declare const HashValueSchema: GenMessage<HashValue>;
/**
 * DAG address (Constellation network address)
 *
 * @generated from message ottochain.v1.Address
 */
export type Address = Message<"ottochain.v1.Address"> & {
    /**
     * @generated from field: string value = 1;
     */
    value: string;
};
/**
 * Describes the message ottochain.v1.Address.
 * Use `create(AddressSchema)` to create a new message.
 */
export declare const AddressSchema: GenMessage<Address>;
