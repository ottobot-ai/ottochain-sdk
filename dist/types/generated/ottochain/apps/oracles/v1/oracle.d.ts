import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.oracles.v1";
/** Oracle lifecycle states */
export declare enum OracleState {
    ORACLE_STATE_UNSPECIFIED = "ORACLE_STATE_UNSPECIFIED",
    /** ORACLE_STATE_UNREGISTERED - Not yet registered */
    ORACLE_STATE_UNREGISTERED = "ORACLE_STATE_UNREGISTERED",
    /** ORACLE_STATE_REGISTERED - Registered but not yet active */
    ORACLE_STATE_REGISTERED = "ORACLE_STATE_REGISTERED",
    /** ORACLE_STATE_ACTIVE - Active and eligible for markets */
    ORACLE_STATE_ACTIVE = "ORACLE_STATE_ACTIVE",
    /** ORACLE_STATE_SLASHED - Penalized for misbehavior */
    ORACLE_STATE_SLASHED = "ORACLE_STATE_SLASHED",
    /** ORACLE_STATE_WITHDRAWN - Voluntarily exited (terminal) */
    ORACLE_STATE_WITHDRAWN = "ORACLE_STATE_WITHDRAWN",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function oracleStateFromJSON(object: any): OracleState;
export declare function oracleStateToJSON(object: OracleState): string;
export declare function oracleStateToNumber(object: OracleState): number;
/** Oracle reputation metrics */
export interface OracleReputation {
    /** Accuracy as percentage (0-100) */
    accuracyPercentage: number;
    /** Total markets resolved */
    totalResolutions: number;
    /** Disputes resolved in oracle's favor */
    disputesWon: number;
    /** Disputes resolved against oracle */
    disputesLost: number;
}
/** Record of a slashing event */
export interface SlashingEvent {
    /** Description of infraction */
    reason: string;
    /** Amount slashed from stake */
    amount: number;
    /** Market where infraction occurred */
    marketId: string;
    /** When slashing occurred */
    timestamp?: Date | undefined;
}
/** Oracle identity and state */
export interface Oracle {
    /** Unique oracle identifier */
    id: string;
    /** Oracle's DAG address */
    address: string;
    /** Current staked amount */
    stake: number;
    /** Reputation metrics */
    reputation?: OracleReputation | undefined;
    /** Current accuracy score (0-100) */
    accuracy: number;
    /** Total markets resolved */
    marketsResolved: number;
    /** Dispute rate percentage (0-100) */
    disputeRate: number;
    /** Expertise domains (e.g., "sports", "crypto", "politics") */
    domains: string[];
    /** Current oracle state */
    state: OracleState;
    /** History of slashing events */
    slashingHistory: SlashingEvent[];
    /** Registration timestamp */
    registeredAt?: Date | undefined;
    /** Last state update timestamp */
    updatedAt?: Date | undefined;
}
/** Register a new oracle */
export interface RegisterOracleRequest {
    address: string;
    initialStake: number;
    domains: string[];
}
/** Activate a registered oracle */
export interface ActivateOracleRequest {
    oracleId: string;
    address: string;
}
/** Add stake to oracle */
export interface AddStakeRequest {
    oracleId: string;
    address: string;
    amount: number;
}
/** Withdraw stake (initiates cooldown) */
export interface WithdrawStakeRequest {
    oracleId: string;
    address: string;
    amount: number;
}
/** Slash an oracle for misbehavior */
export interface SlashOracleRequest {
    oracleId: string;
    marketId: string;
    reason: string;
    amount: number;
}
/** Withdraw oracle from service */
export interface WithdrawOracleRequest {
    oracleId: string;
    address: string;
}
/** Oracle state machine definition */
export interface OracleDefinition {
    /** Minimum stake to activate */
    minStake: number;
    /** Epochs before slashed oracle can recover */
    slashCooldownEpochs: number;
    /** Min accuracy to remain active (0-100) */
    accuracyThreshold: number;
    /** Max dispute rate before auto-slash (0-100) */
    maxDisputeRate: number;
}
export declare const OracleReputation: MessageFns<OracleReputation>;
export declare const SlashingEvent: MessageFns<SlashingEvent>;
export declare const Oracle: MessageFns<Oracle>;
export declare const RegisterOracleRequest: MessageFns<RegisterOracleRequest>;
export declare const ActivateOracleRequest: MessageFns<ActivateOracleRequest>;
export declare const AddStakeRequest: MessageFns<AddStakeRequest>;
export declare const WithdrawStakeRequest: MessageFns<WithdrawStakeRequest>;
export declare const SlashOracleRequest: MessageFns<SlashOracleRequest>;
export declare const WithdrawOracleRequest: MessageFns<WithdrawOracleRequest>;
export declare const OracleDefinition: MessageFns<OracleDefinition>;
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
