import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Platform } from "./agent_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/identity/v1/attestation.proto.
 */
export declare const file_ottochain_apps_identity_v1_attestation: GenFile;
/**
 * Reputation change record
 *
 * @generated from message ottochain.apps.identity.v1.ReputationDelta
 */
export type ReputationDelta = Message<"ottochain.apps.identity.v1.ReputationDelta"> & {
    /**
     * @generated from field: ottochain.apps.identity.v1.AttestationType attestation_type = 1;
     */
    attestationType: AttestationType;
    /**
     * @generated from field: int32 delta = 2;
     */
    delta: number;
    /**
     * @generated from field: string reason = 3;
     */
    reason: string;
    /**
     * @generated from field: google.protobuf.Timestamp recorded_at = 4;
     */
    recordedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.identity.v1.ReputationDelta.
 * Use `create(ReputationDeltaSchema)` to create a new message.
 */
export declare const ReputationDeltaSchema: GenMessage<ReputationDelta>;
/**
 * Attestation record
 *
 * @generated from message ottochain.apps.identity.v1.Attestation
 */
export type Attestation = Message<"ottochain.apps.identity.v1.Attestation"> & {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: ottochain.apps.identity.v1.AttestationType type = 2;
     */
    type: AttestationType;
    /**
     * Agent receiving attestation
     *
     * @generated from field: ottochain.v1.Address subject = 3;
     */
    subject?: Address;
    /**
     * Agent or platform issuing
     *
     * @generated from field: ottochain.v1.Address issuer = 4;
     */
    issuer?: Address;
    /**
     * If issued by platform
     *
     * @generated from field: ottochain.apps.identity.v1.Platform issuer_platform = 5;
     */
    issuerPlatform: Platform;
    /**
     * Reputation change
     *
     * @generated from field: int32 delta = 6;
     */
    delta: number;
    /**
     * @generated from field: string reason = 7;
     */
    reason: string;
    /**
     * @generated from field: string tx_hash = 8;
     */
    txHash: string;
    /**
     * @generated from field: google.protobuf.Timestamp created_at = 9;
     */
    createdAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.identity.v1.Attestation.
 * Use `create(AttestationSchema)` to create a new message.
 */
export declare const AttestationSchema: GenMessage<Attestation>;
/**
 * Vouch request - one agent vouching for another
 *
 * @generated from message ottochain.apps.identity.v1.VouchRequest
 */
export type VouchRequest = Message<"ottochain.apps.identity.v1.VouchRequest"> & {
    /**
     * @generated from field: ottochain.v1.Address from_address = 1;
     */
    fromAddress?: Address;
    /**
     * @generated from field: ottochain.v1.Address to_address = 2;
     */
    toAddress?: Address;
    /**
     * @generated from field: string reason = 3;
     */
    reason: string;
};
/**
 * Describes the message ottochain.apps.identity.v1.VouchRequest.
 * Use `create(VouchRequestSchema)` to create a new message.
 */
export declare const VouchRequestSchema: GenMessage<VouchRequest>;
/**
 * Challenge request - disputing an agent's behavior
 *
 * @generated from message ottochain.apps.identity.v1.ChallengeRequest
 */
export type ChallengeRequest = Message<"ottochain.apps.identity.v1.ChallengeRequest"> & {
    /**
     * @generated from field: ottochain.v1.Address challenger = 1;
     */
    challenger?: Address;
    /**
     * @generated from field: ottochain.v1.Address challenged = 2;
     */
    challenged?: Address;
    /**
     * @generated from field: string evidence = 3;
     */
    evidence: string;
    /**
     * @generated from field: string reason = 4;
     */
    reason: string;
};
/**
 * Describes the message ottochain.apps.identity.v1.ChallengeRequest.
 * Use `create(ChallengeRequestSchema)` to create a new message.
 */
export declare const ChallengeRequestSchema: GenMessage<ChallengeRequest>;
/**
 * Reputation thresholds and rules
 *
 * @generated from message ottochain.apps.identity.v1.ReputationConfig
 */
export type ReputationConfig = Message<"ottochain.apps.identity.v1.ReputationConfig"> & {
    /**
     * Starting rep (default: 10)
     *
     * @generated from field: int32 base_reputation = 1;
     */
    baseReputation: number;
    /**
     * Contract completion (default: +5)
     *
     * @generated from field: int32 completion_delta = 2;
     */
    completionDelta: number;
    /**
     * Vouch received (default: +2)
     *
     * @generated from field: int32 vouch_delta = 3;
     */
    vouchDelta: number;
    /**
     * Violation penalty (default: -10)
     *
     * @generated from field: int32 violation_delta = 4;
     */
    violationDelta: number;
    /**
     * Behavioral bonus (default: +3)
     *
     * @generated from field: int32 behavioral_delta = 5;
     */
    behavioralDelta: number;
    /**
     * Floor (default: 0)
     *
     * @generated from field: int32 min_reputation = 6;
     */
    minReputation: number;
    /**
     * Min rep to challenge (default: 5)
     *
     * @generated from field: int32 challenge_threshold = 7;
     */
    challengeThreshold: number;
};
/**
 * Describes the message ottochain.apps.identity.v1.ReputationConfig.
 * Use `create(ReputationConfigSchema)` to create a new message.
 */
export declare const ReputationConfigSchema: GenMessage<ReputationConfig>;
/**
 * Types of attestations that affect reputation
 *
 * @generated from enum ottochain.apps.identity.v1.AttestationType
 */
export declare enum AttestationType {
    /**
     * @generated from enum value: ATTESTATION_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Contract completed successfully (+5)
     *
     * @generated from enum value: ATTESTATION_TYPE_COMPLETION = 1;
     */
    COMPLETION = 1,
    /**
     * Vouched for by another agent (+2)
     *
     * @generated from enum value: ATTESTATION_TYPE_VOUCH = 2;
     */
    VOUCH = 2,
    /**
     * Protocol violation (-10)
     *
     * @generated from enum value: ATTESTATION_TYPE_VIOLATION = 3;
     */
    VIOLATION = 3,
    /**
     * Positive behavioral signal (+3)
     *
     * @generated from enum value: ATTESTATION_TYPE_BEHAVIORAL = 4;
     */
    BEHAVIORAL = 4
}
/**
 * Describes the enum ottochain.apps.identity.v1.AttestationType.
 */
export declare const AttestationTypeSchema: GenEnum<AttestationType>;
