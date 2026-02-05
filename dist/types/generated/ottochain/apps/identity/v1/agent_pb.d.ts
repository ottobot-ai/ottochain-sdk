import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/identity/v1/agent.proto.
 */
export declare const file_ottochain_apps_identity_v1_agent: GenFile;
/**
 * Platform identity link
 *
 * @generated from message ottochain.apps.identity.v1.PlatformLink
 */
export type PlatformLink = Message<"ottochain.apps.identity.v1.PlatformLink"> & {
    /**
     * @generated from field: ottochain.apps.identity.v1.Platform platform = 1;
     */
    platform: Platform;
    /**
     * @generated from field: string platform_user_id = 2;
     */
    platformUserId: string;
    /**
     * @generated from field: string platform_username = 3;
     */
    platformUsername: string;
    /**
     * @generated from field: google.protobuf.Timestamp linked_at = 4;
     */
    linkedAt?: Timestamp;
    /**
     * @generated from field: bool verified = 5;
     */
    verified: boolean;
};
/**
 * Describes the message ottochain.apps.identity.v1.PlatformLink.
 * Use `create(PlatformLinkSchema)` to create a new message.
 */
export declare const PlatformLinkSchema: GenMessage<PlatformLink>;
/**
 * Agent identity on-chain state
 *
 * @generated from message ottochain.apps.identity.v1.AgentIdentity
 */
export type AgentIdentity = Message<"ottochain.apps.identity.v1.AgentIdentity"> & {
    /**
     * @generated from field: ottochain.v1.Address address = 1;
     */
    address?: Address;
    /**
     * @generated from field: string public_key = 2;
     */
    publicKey: string;
    /**
     * @generated from field: string display_name = 3;
     */
    displayName: string;
    /**
     * @generated from field: int32 reputation = 4;
     */
    reputation: number;
    /**
     * @generated from field: ottochain.apps.identity.v1.AgentState state = 5;
     */
    state: AgentState;
    /**
     * @generated from field: repeated ottochain.apps.identity.v1.PlatformLink platform_links = 6;
     */
    platformLinks: PlatformLink[];
    /**
     * @generated from field: google.protobuf.Timestamp created_at = 7;
     */
    createdAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp updated_at = 8;
     */
    updatedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.identity.v1.AgentIdentity.
 * Use `create(AgentIdentitySchema)` to create a new message.
 */
export declare const AgentIdentitySchema: GenMessage<AgentIdentity>;
/**
 * State machine definition for AgentIdentity workflow
 * This defines the valid states and transitions
 *
 * Initial state is always REGISTERED
 * Valid transitions:
 *   REGISTERED -> ACTIVE (activate)
 *   ACTIVE -> CHALLENGED (challenge)
 *   ACTIVE -> WITHDRAWN (withdraw)
 *   CHALLENGED -> SUSPENDED (uphold_challenge)
 *   CHALLENGED -> ACTIVE (dismiss_challenge)
 *   SUSPENDED -> PROBATION (begin_probation)
 *   PROBATION -> ACTIVE (complete_probation)
 *
 * @generated from message ottochain.apps.identity.v1.AgentIdentityDefinition
 */
export type AgentIdentityDefinition = Message<"ottochain.apps.identity.v1.AgentIdentityDefinition"> & {
    /**
     * Default: 10
     *
     * @generated from field: int32 initial_reputation = 1;
     */
    initialReputation: number;
    /**
     * Min rep to activate (default: 0)
     *
     * @generated from field: int32 activation_threshold = 2;
     */
    activationThreshold: number;
    /**
     * How long suspension lasts
     *
     * @generated from field: int32 suspension_duration_epochs = 3;
     */
    suspensionDurationEpochs: number;
};
/**
 * Describes the message ottochain.apps.identity.v1.AgentIdentityDefinition.
 * Use `create(AgentIdentityDefinitionSchema)` to create a new message.
 */
export declare const AgentIdentityDefinitionSchema: GenMessage<AgentIdentityDefinition>;
/**
 * Agent lifecycle states in the identity state machine
 *
 * @generated from enum ottochain.apps.identity.v1.AgentState
 */
export declare enum AgentState {
    /**
     * @generated from enum value: AGENT_STATE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Initial state after registration
     *
     * @generated from enum value: AGENT_STATE_REGISTERED = 1;
     */
    REGISTERED = 1,
    /**
     * Activated and participating
     *
     * @generated from enum value: AGENT_STATE_ACTIVE = 2;
     */
    ACTIVE = 2,
    /**
     * Under dispute/challenge
     *
     * @generated from enum value: AGENT_STATE_CHALLENGED = 3;
     */
    CHALLENGED = 3,
    /**
     * Challenge upheld, temporarily suspended
     *
     * @generated from enum value: AGENT_STATE_SUSPENDED = 4;
     */
    SUSPENDED = 4,
    /**
     * Recovering from suspension
     *
     * @generated from enum value: AGENT_STATE_PROBATION = 5;
     */
    PROBATION = 5,
    /**
     * Voluntarily exited (terminal)
     *
     * @generated from enum value: AGENT_STATE_WITHDRAWN = 6;
     */
    WITHDRAWN = 6
}
/**
 * Describes the enum ottochain.apps.identity.v1.AgentState.
 */
export declare const AgentStateSchema: GenEnum<AgentState>;
/**
 * Platform where agent identity is linked
 *
 * @generated from enum ottochain.apps.identity.v1.Platform
 */
export declare enum Platform {
    /**
     * @generated from enum value: PLATFORM_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: PLATFORM_DISCORD = 1;
     */
    DISCORD = 1,
    /**
     * @generated from enum value: PLATFORM_TELEGRAM = 2;
     */
    TELEGRAM = 2,
    /**
     * @generated from enum value: PLATFORM_TWITTER = 3;
     */
    TWITTER = 3,
    /**
     * @generated from enum value: PLATFORM_GITHUB = 4;
     */
    GITHUB = 4,
    /**
     * @generated from enum value: PLATFORM_CUSTOM = 5;
     */
    CUSTOM = 5
}
/**
 * Describes the enum ottochain.apps.identity.v1.Platform.
 */
export declare const PlatformSchema: GenEnum<Platform>;
