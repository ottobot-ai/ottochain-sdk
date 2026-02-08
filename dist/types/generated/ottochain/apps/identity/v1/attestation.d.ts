import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Platform } from "./agent.js";
export declare const protobufPackage = "ottochain.apps.identity.v1";
/** Types of attestations that affect reputation */
export declare enum AttestationType {
    ATTESTATION_TYPE_UNSPECIFIED = "ATTESTATION_TYPE_UNSPECIFIED",
    /** ATTESTATION_TYPE_COMPLETION - Contract completed successfully (+5) */
    ATTESTATION_TYPE_COMPLETION = "ATTESTATION_TYPE_COMPLETION",
    /** ATTESTATION_TYPE_VOUCH - Vouched for by another agent (+2) */
    ATTESTATION_TYPE_VOUCH = "ATTESTATION_TYPE_VOUCH",
    /** ATTESTATION_TYPE_VIOLATION - Protocol violation (-10) */
    ATTESTATION_TYPE_VIOLATION = "ATTESTATION_TYPE_VIOLATION",
    /** ATTESTATION_TYPE_BEHAVIORAL - Positive behavioral signal (+3) */
    ATTESTATION_TYPE_BEHAVIORAL = "ATTESTATION_TYPE_BEHAVIORAL",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function attestationTypeFromJSON(object: any): AttestationType;
export declare function attestationTypeToJSON(object: AttestationType): string;
export declare function attestationTypeToNumber(object: AttestationType): number;
/** Reputation change record */
export interface ReputationDelta {
    attestationType: AttestationType;
    delta: number;
    reason: string;
    recordedAt?: Date | undefined;
}
/** Attestation record */
export interface Attestation {
    id: string;
    type: AttestationType;
    /** Agent receiving attestation */
    subject: string;
    /** Agent or platform issuing */
    issuer: string;
    /** If issued by platform */
    issuerPlatform: Platform;
    /** Reputation change */
    delta: number;
    reason: string;
    txHash: string;
    createdAt?: Date | undefined;
}
/** Vouch request - one agent vouching for another */
export interface VouchRequest {
    fromAddress: string;
    toAddress: string;
    reason: string;
}
/** Challenge request - disputing an agent's behavior */
export interface ChallengeRequest {
    challenger: string;
    challenged: string;
    evidence: string;
    reason: string;
}
/** Reputation thresholds and rules */
export interface ReputationConfig {
    /** Starting rep (default: 10) */
    baseReputation: number;
    /** Contract completion (default: +5) */
    completionDelta: number;
    /** Vouch received (default: +2) */
    vouchDelta: number;
    /** Violation penalty (default: -10) */
    violationDelta: number;
    /** Behavioral bonus (default: +3) */
    behavioralDelta: number;
    /** Floor (default: 0) */
    minReputation: number;
    /** Min rep to challenge (default: 5) */
    challengeThreshold: number;
}
export declare const ReputationDelta: MessageFns<ReputationDelta>;
export declare const Attestation: MessageFns<Attestation>;
export declare const VouchRequest: MessageFns<VouchRequest>;
export declare const ChallengeRequest: MessageFns<ChallengeRequest>;
export declare const ReputationConfig: MessageFns<ReputationConfig>;
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
