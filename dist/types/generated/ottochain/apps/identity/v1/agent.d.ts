import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.identity.v1";
/** Agent lifecycle states in the identity state machine */
export declare enum AgentState {
    AGENT_STATE_UNSPECIFIED = "AGENT_STATE_UNSPECIFIED",
    /** AGENT_STATE_REGISTERED - Initial state after registration */
    AGENT_STATE_REGISTERED = "AGENT_STATE_REGISTERED",
    /** AGENT_STATE_ACTIVE - Activated and participating */
    AGENT_STATE_ACTIVE = "AGENT_STATE_ACTIVE",
    /** AGENT_STATE_CHALLENGED - Under dispute/challenge */
    AGENT_STATE_CHALLENGED = "AGENT_STATE_CHALLENGED",
    /** AGENT_STATE_SUSPENDED - Challenge upheld, temporarily suspended */
    AGENT_STATE_SUSPENDED = "AGENT_STATE_SUSPENDED",
    /** AGENT_STATE_PROBATION - Recovering from suspension */
    AGENT_STATE_PROBATION = "AGENT_STATE_PROBATION",
    /** AGENT_STATE_WITHDRAWN - Voluntarily exited (terminal) */
    AGENT_STATE_WITHDRAWN = "AGENT_STATE_WITHDRAWN",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function agentStateFromJSON(object: any): AgentState;
export declare function agentStateToJSON(object: AgentState): string;
export declare function agentStateToNumber(object: AgentState): number;
/** Platform where agent identity is linked */
export declare enum Platform {
    PLATFORM_UNSPECIFIED = "PLATFORM_UNSPECIFIED",
    PLATFORM_DISCORD = "PLATFORM_DISCORD",
    PLATFORM_TELEGRAM = "PLATFORM_TELEGRAM",
    PLATFORM_TWITTER = "PLATFORM_TWITTER",
    PLATFORM_GITHUB = "PLATFORM_GITHUB",
    PLATFORM_CUSTOM = "PLATFORM_CUSTOM",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function platformFromJSON(object: any): Platform;
export declare function platformToJSON(object: Platform): string;
export declare function platformToNumber(object: Platform): number;
/** Platform identity link */
export interface PlatformLink {
    platform: Platform;
    platformUserId: string;
    platformUsername: string;
    linkedAt?: Date | undefined;
    verified: boolean;
}
/** Agent identity on-chain state */
export interface AgentIdentity {
    address: string;
    publicKey: string;
    displayName: string;
    reputation: number;
    state: AgentState;
    platformLinks: PlatformLink[];
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
/**
 * State machine definition for AgentIdentity workflow
 * This defines the valid states and transitions
 */
export interface AgentIdentityDefinition {
    /** Default: 10 */
    initialReputation: number;
    /** Min rep to activate (default: 0) */
    activationThreshold: number;
    /** How long suspension lasts */
    suspensionDurationEpochs: number;
}
export declare const PlatformLink: MessageFns<PlatformLink>;
export declare const AgentIdentity: MessageFns<AgentIdentity>;
export declare const AgentIdentityDefinition: MessageFns<AgentIdentityDefinition>;
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
