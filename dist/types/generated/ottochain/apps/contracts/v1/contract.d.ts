import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.contracts.v1";
/** Contract lifecycle states */
export declare enum ContractState {
    CONTRACT_STATE_UNSPECIFIED = "CONTRACT_STATE_UNSPECIFIED",
    /** CONTRACT_STATE_PROPOSED - Awaiting counterparty acceptance */
    CONTRACT_STATE_PROPOSED = "CONTRACT_STATE_PROPOSED",
    /** CONTRACT_STATE_ACTIVE - Both parties agreed, in progress */
    CONTRACT_STATE_ACTIVE = "CONTRACT_STATE_ACTIVE",
    /** CONTRACT_STATE_COMPLETED - Successfully fulfilled (terminal) */
    CONTRACT_STATE_COMPLETED = "CONTRACT_STATE_COMPLETED",
    /** CONTRACT_STATE_REJECTED - Counterparty declined (terminal) */
    CONTRACT_STATE_REJECTED = "CONTRACT_STATE_REJECTED",
    /** CONTRACT_STATE_DISPUTED - Under dispute resolution */
    CONTRACT_STATE_DISPUTED = "CONTRACT_STATE_DISPUTED",
    /** CONTRACT_STATE_CANCELLED - Cancelled by proposer before acceptance (terminal) */
    CONTRACT_STATE_CANCELLED = "CONTRACT_STATE_CANCELLED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function contractStateFromJSON(object: any): ContractState;
export declare function contractStateToJSON(object: ContractState): string;
export declare function contractStateToNumber(object: ContractState): number;
/** Contract between two agents */
export interface Contract {
    id: string;
    /** Human-readable ID */
    contractId: string;
    proposer: string;
    counterparty: string;
    state: ContractState;
    /** Flexible terms structure */
    terms?: {
        [key: string]: any;
    } | undefined;
    proposedAt?: Date | undefined;
    acceptedAt?: Date | undefined;
    completedAt?: Date | undefined;
    /** Evidence of completion */
    completionProof: string;
}
/** Propose a new contract */
export interface ProposeContractRequest {
    proposer: string;
    counterparty: string;
    terms?: {
        [key: string]: any;
    } | undefined;
    description: string;
}
/** Accept a proposed contract */
export interface AcceptContractRequest {
    contractId: string;
    acceptor: string;
}
/** Complete a contract with proof */
export interface CompleteContractRequest {
    contractId: string;
    completer: string;
    proof: string;
}
/** Reject a proposed contract */
export interface RejectContractRequest {
    contractId: string;
    rejector: string;
    reason: string;
}
/** Dispute a contract */
export interface DisputeContractRequest {
    contractId: string;
    disputant: string;
    evidence: string;
    reason: string;
}
/** Contract state machine definition */
export interface ContractDefinition {
    /** Both parties must sign completion */
    requireBothSignatures: boolean;
    /** How long after completion disputes allowed */
    disputeWindowEpochs: number;
}
export declare const Contract: MessageFns<Contract>;
export declare const ProposeContractRequest: MessageFns<ProposeContractRequest>;
export declare const AcceptContractRequest: MessageFns<AcceptContractRequest>;
export declare const CompleteContractRequest: MessageFns<CompleteContractRequest>;
export declare const RejectContractRequest: MessageFns<RejectContractRequest>;
export declare const DisputeContractRequest: MessageFns<DisputeContractRequest>;
export declare const ContractDefinition: MessageFns<ContractDefinition>;
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
