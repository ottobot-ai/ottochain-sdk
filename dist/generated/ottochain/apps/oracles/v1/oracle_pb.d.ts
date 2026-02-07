import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/oracles/v1/oracle.proto.
 */
export declare const file_ottochain_apps_oracles_v1_oracle: GenFile;
/**
 * Oracle reputation metrics
 *
 * @generated from message ottochain.apps.oracles.v1.OracleReputation
 */
export type OracleReputation = Message<"ottochain.apps.oracles.v1.OracleReputation"> & {
    /**
     * Accuracy as percentage (0-100)
     *
     * @generated from field: int32 accuracy_percentage = 1;
     */
    accuracyPercentage: number;
    /**
     * Total markets resolved
     *
     * @generated from field: int32 total_resolutions = 2;
     */
    totalResolutions: number;
    /**
     * Disputes resolved in oracle's favor
     *
     * @generated from field: int32 disputes_won = 3;
     */
    disputesWon: number;
    /**
     * Disputes resolved against oracle
     *
     * @generated from field: int32 disputes_lost = 4;
     */
    disputesLost: number;
};
/**
 * Describes the message ottochain.apps.oracles.v1.OracleReputation.
 * Use `create(OracleReputationSchema)` to create a new message.
 */
export declare const OracleReputationSchema: GenMessage<OracleReputation>;
/**
 * Record of a slashing event
 *
 * @generated from message ottochain.apps.oracles.v1.SlashingEvent
 */
export type SlashingEvent = Message<"ottochain.apps.oracles.v1.SlashingEvent"> & {
    /**
     * Description of infraction
     *
     * @generated from field: string reason = 1;
     */
    reason: string;
    /**
     * Amount slashed from stake
     *
     * @generated from field: int64 amount = 2;
     */
    amount: bigint;
    /**
     * Market where infraction occurred
     *
     * @generated from field: string market_id = 3;
     */
    marketId: string;
    /**
     * When slashing occurred
     *
     * @generated from field: google.protobuf.Timestamp timestamp = 4;
     */
    timestamp?: Timestamp;
};
/**
 * Describes the message ottochain.apps.oracles.v1.SlashingEvent.
 * Use `create(SlashingEventSchema)` to create a new message.
 */
export declare const SlashingEventSchema: GenMessage<SlashingEvent>;
/**
 * Oracle identity and state
 *
 * @generated from message ottochain.apps.oracles.v1.Oracle
 */
export type Oracle = Message<"ottochain.apps.oracles.v1.Oracle"> & {
    /**
     * Unique oracle identifier
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * Oracle's DAG address
     *
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address;
    /**
     * Current staked amount
     *
     * @generated from field: int64 stake = 3;
     */
    stake: bigint;
    /**
     * Reputation metrics
     *
     * @generated from field: ottochain.apps.oracles.v1.OracleReputation reputation = 4;
     */
    reputation?: OracleReputation;
    /**
     * Current accuracy score (0-100)
     *
     * @generated from field: int32 accuracy = 5;
     */
    accuracy: number;
    /**
     * Total markets resolved
     *
     * @generated from field: int32 markets_resolved = 6;
     */
    marketsResolved: number;
    /**
     * Dispute rate percentage (0-100)
     *
     * @generated from field: int32 dispute_rate = 7;
     */
    disputeRate: number;
    /**
     * Expertise domains (e.g., "sports", "crypto", "politics")
     *
     * @generated from field: repeated string domains = 8;
     */
    domains: string[];
    /**
     * Current oracle state
     *
     * @generated from field: ottochain.apps.oracles.v1.OracleState state = 9;
     */
    state: OracleState;
    /**
     * History of slashing events
     *
     * @generated from field: repeated ottochain.apps.oracles.v1.SlashingEvent slashing_history = 10;
     */
    slashingHistory: SlashingEvent[];
    /**
     * Registration timestamp
     *
     * @generated from field: google.protobuf.Timestamp registered_at = 11;
     */
    registeredAt?: Timestamp;
    /**
     * Last state update timestamp
     *
     * @generated from field: google.protobuf.Timestamp updated_at = 12;
     */
    updatedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.oracles.v1.Oracle.
 * Use `create(OracleSchema)` to create a new message.
 */
export declare const OracleSchema: GenMessage<Oracle>;
/**
 * Register a new oracle
 *
 * @generated from message ottochain.apps.oracles.v1.RegisterOracleRequest
 */
export type RegisterOracleRequest = Message<"ottochain.apps.oracles.v1.RegisterOracleRequest"> & {
    /**
     * @generated from field: ottochain.v1.Address address = 1;
     */
    address?: Address;
    /**
     * @generated from field: int64 initial_stake = 2;
     */
    initialStake: bigint;
    /**
     * @generated from field: repeated string domains = 3;
     */
    domains: string[];
};
/**
 * Describes the message ottochain.apps.oracles.v1.RegisterOracleRequest.
 * Use `create(RegisterOracleRequestSchema)` to create a new message.
 */
export declare const RegisterOracleRequestSchema: GenMessage<RegisterOracleRequest>;
/**
 * Activate a registered oracle
 *
 * @generated from message ottochain.apps.oracles.v1.ActivateOracleRequest
 */
export type ActivateOracleRequest = Message<"ottochain.apps.oracles.v1.ActivateOracleRequest"> & {
    /**
     * @generated from field: string oracle_id = 1;
     */
    oracleId: string;
    /**
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address;
};
/**
 * Describes the message ottochain.apps.oracles.v1.ActivateOracleRequest.
 * Use `create(ActivateOracleRequestSchema)` to create a new message.
 */
export declare const ActivateOracleRequestSchema: GenMessage<ActivateOracleRequest>;
/**
 * Add stake to oracle
 *
 * @generated from message ottochain.apps.oracles.v1.AddStakeRequest
 */
export type AddStakeRequest = Message<"ottochain.apps.oracles.v1.AddStakeRequest"> & {
    /**
     * @generated from field: string oracle_id = 1;
     */
    oracleId: string;
    /**
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address;
    /**
     * @generated from field: int64 amount = 3;
     */
    amount: bigint;
};
/**
 * Describes the message ottochain.apps.oracles.v1.AddStakeRequest.
 * Use `create(AddStakeRequestSchema)` to create a new message.
 */
export declare const AddStakeRequestSchema: GenMessage<AddStakeRequest>;
/**
 * Withdraw stake (initiates cooldown)
 *
 * @generated from message ottochain.apps.oracles.v1.WithdrawStakeRequest
 */
export type WithdrawStakeRequest = Message<"ottochain.apps.oracles.v1.WithdrawStakeRequest"> & {
    /**
     * @generated from field: string oracle_id = 1;
     */
    oracleId: string;
    /**
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address;
    /**
     * @generated from field: int64 amount = 3;
     */
    amount: bigint;
};
/**
 * Describes the message ottochain.apps.oracles.v1.WithdrawStakeRequest.
 * Use `create(WithdrawStakeRequestSchema)` to create a new message.
 */
export declare const WithdrawStakeRequestSchema: GenMessage<WithdrawStakeRequest>;
/**
 * Slash an oracle for misbehavior
 *
 * @generated from message ottochain.apps.oracles.v1.SlashOracleRequest
 */
export type SlashOracleRequest = Message<"ottochain.apps.oracles.v1.SlashOracleRequest"> & {
    /**
     * @generated from field: string oracle_id = 1;
     */
    oracleId: string;
    /**
     * @generated from field: string market_id = 2;
     */
    marketId: string;
    /**
     * @generated from field: string reason = 3;
     */
    reason: string;
    /**
     * @generated from field: int64 amount = 4;
     */
    amount: bigint;
};
/**
 * Describes the message ottochain.apps.oracles.v1.SlashOracleRequest.
 * Use `create(SlashOracleRequestSchema)` to create a new message.
 */
export declare const SlashOracleRequestSchema: GenMessage<SlashOracleRequest>;
/**
 * Withdraw oracle from service
 *
 * @generated from message ottochain.apps.oracles.v1.WithdrawOracleRequest
 */
export type WithdrawOracleRequest = Message<"ottochain.apps.oracles.v1.WithdrawOracleRequest"> & {
    /**
     * @generated from field: string oracle_id = 1;
     */
    oracleId: string;
    /**
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address;
};
/**
 * Describes the message ottochain.apps.oracles.v1.WithdrawOracleRequest.
 * Use `create(WithdrawOracleRequestSchema)` to create a new message.
 */
export declare const WithdrawOracleRequestSchema: GenMessage<WithdrawOracleRequest>;
/**
 * Oracle state machine definition
 *
 * Valid transitions:
 *   UNREGISTERED -> REGISTERED (register)
 *   REGISTERED -> ACTIVE (activate, requires min_stake)
 *   ACTIVE -> SLASHED (slash)
 *   ACTIVE -> WITHDRAWN (withdraw)
 *   SLASHED -> ACTIVE (recover, after cooldown + restake)
 *   SLASHED -> WITHDRAWN (withdraw, forfeit remaining stake)
 *
 * @generated from message ottochain.apps.oracles.v1.OracleDefinition
 */
export type OracleDefinition = Message<"ottochain.apps.oracles.v1.OracleDefinition"> & {
    /**
     * Minimum stake to activate
     *
     * @generated from field: int64 min_stake = 1;
     */
    minStake: bigint;
    /**
     * Epochs before slashed oracle can recover
     *
     * @generated from field: int32 slash_cooldown_epochs = 2;
     */
    slashCooldownEpochs: number;
    /**
     * Min accuracy to remain active (0-100)
     *
     * @generated from field: int32 accuracy_threshold = 3;
     */
    accuracyThreshold: number;
    /**
     * Max dispute rate before auto-slash (0-100)
     *
     * @generated from field: int32 max_dispute_rate = 4;
     */
    maxDisputeRate: number;
};
/**
 * Describes the message ottochain.apps.oracles.v1.OracleDefinition.
 * Use `create(OracleDefinitionSchema)` to create a new message.
 */
export declare const OracleDefinitionSchema: GenMessage<OracleDefinition>;
/**
 * Oracle lifecycle states
 *
 * @generated from enum ottochain.apps.oracles.v1.OracleState
 */
export declare enum OracleState {
    /**
     * @generated from enum value: ORACLE_STATE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Not yet registered
     *
     * @generated from enum value: ORACLE_STATE_UNREGISTERED = 1;
     */
    UNREGISTERED = 1,
    /**
     * Registered but not yet active
     *
     * @generated from enum value: ORACLE_STATE_REGISTERED = 2;
     */
    REGISTERED = 2,
    /**
     * Active and eligible for markets
     *
     * @generated from enum value: ORACLE_STATE_ACTIVE = 3;
     */
    ACTIVE = 3,
    /**
     * Penalized for misbehavior
     *
     * @generated from enum value: ORACLE_STATE_SLASHED = 4;
     */
    SLASHED = 4,
    /**
     * Voluntarily exited (terminal)
     *
     * @generated from enum value: ORACLE_STATE_WITHDRAWN = 5;
     */
    WITHDRAWN = 5
}
/**
 * Describes the enum ottochain.apps.oracles.v1.OracleState.
 */
export declare const OracleStateSchema: GenEnum<OracleState>;
