import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { JsonObject, Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/markets/v1/market.proto.
 */
export declare const file_ottochain_apps_markets_v1_market: GenFile;
/**
 * Agent commitment to a market position
 *
 * @generated from message ottochain.apps.markets.v1.Commitment
 */
export type Commitment = Message<"ottochain.apps.markets.v1.Commitment"> & {
    /**
     * Committing agent's address
     *
     * @generated from field: ottochain.v1.Address agent = 1;
     */
    agent?: Address;
    /**
     * Token amount committed
     *
     * @generated from field: int64 amount = 2;
     */
    amount: bigint;
    /**
     * Position data (outcome choice, bid, etc.)
     *
     * @generated from field: google.protobuf.Struct data = 3;
     */
    data?: JsonObject;
    /**
     * When commitment was made
     *
     * @generated from field: google.protobuf.Timestamp timestamp = 4;
     */
    timestamp?: Timestamp;
};
/**
 * Describes the message ottochain.apps.markets.v1.Commitment.
 * Use `create(CommitmentSchema)` to create a new message.
 */
export declare const CommitmentSchema: GenMessage<Commitment>;
/**
 * Oracle resolution submission
 *
 * @generated from message ottochain.apps.markets.v1.Resolution
 */
export type Resolution = Message<"ottochain.apps.markets.v1.Resolution"> & {
    /**
     * Oracle's address
     *
     * @generated from field: ottochain.v1.Address oracle = 1;
     */
    oracle?: Address;
    /**
     * Resolved outcome identifier
     *
     * @generated from field: string outcome = 2;
     */
    outcome: string;
    /**
     * Evidence/proof of outcome
     *
     * @generated from field: string proof = 3;
     */
    proof: string;
    /**
     * When resolution was submitted
     *
     * @generated from field: google.protobuf.Timestamp timestamp = 4;
     */
    timestamp?: Timestamp;
};
/**
 * Describes the message ottochain.apps.markets.v1.Resolution.
 * Use `create(ResolutionSchema)` to create a new message.
 */
export declare const ResolutionSchema: GenMessage<Resolution>;
/**
 * Universal market container
 *
 * @generated from message ottochain.apps.markets.v1.Market
 */
export type Market = Message<"ottochain.apps.markets.v1.Market"> & {
    /**
     * Unique market identifier
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * Type of market mechanism
     *
     * @generated from field: ottochain.apps.markets.v1.MarketType market_type = 2;
     */
    marketType: MarketType;
    /**
     * Market creator's address
     *
     * @generated from field: ottochain.v1.Address creator = 3;
     */
    creator?: Address;
    /**
     * Human-readable market title
     *
     * @generated from field: string title = 4;
     */
    title: string;
    /**
     * Market-specific terms and rules
     *
     * @generated from field: google.protobuf.Struct terms = 5;
     */
    terms?: JsonObject;
    /**
     * When market closes for commitments
     *
     * @generated from field: google.protobuf.Timestamp deadline = 6;
     */
    deadline?: Timestamp;
    /**
     * Minimum commitment threshold
     *
     * @generated from field: int64 threshold = 7;
     */
    threshold: bigint;
    /**
     * All agent commitments
     *
     * @generated from field: repeated ottochain.apps.markets.v1.Commitment commitments = 8;
     */
    commitments: Commitment[];
    /**
     * Designated oracle addresses
     *
     * @generated from field: repeated ottochain.v1.Address oracles = 9;
     */
    oracles: Address[];
    /**
     * Required oracle agreement count
     *
     * @generated from field: int32 quorum = 10;
     */
    quorum: number;
    /**
     * Oracle resolution submissions
     *
     * @generated from field: repeated ottochain.apps.markets.v1.Resolution resolutions = 11;
     */
    resolutions: Resolution[];
    /**
     * Current market state
     *
     * @generated from field: ottochain.apps.markets.v1.MarketState status = 12;
     */
    status: MarketState;
    /**
     * Market creation timestamp
     *
     * @generated from field: google.protobuf.Timestamp created_at = 13;
     */
    createdAt?: Timestamp;
    /**
     * Last state update timestamp
     *
     * @generated from field: google.protobuf.Timestamp updated_at = 14;
     */
    updatedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.markets.v1.Market.
 * Use `create(MarketSchema)` to create a new message.
 */
export declare const MarketSchema: GenMessage<Market>;
/**
 * Create a new market
 *
 * @generated from message ottochain.apps.markets.v1.CreateMarketRequest
 */
export type CreateMarketRequest = Message<"ottochain.apps.markets.v1.CreateMarketRequest"> & {
    /**
     * @generated from field: ottochain.apps.markets.v1.MarketType market_type = 1;
     */
    marketType: MarketType;
    /**
     * @generated from field: ottochain.v1.Address creator = 2;
     */
    creator?: Address;
    /**
     * @generated from field: string title = 3;
     */
    title: string;
    /**
     * @generated from field: google.protobuf.Struct terms = 4;
     */
    terms?: JsonObject;
    /**
     * @generated from field: google.protobuf.Timestamp deadline = 5;
     */
    deadline?: Timestamp;
    /**
     * @generated from field: int64 threshold = 6;
     */
    threshold: bigint;
    /**
     * @generated from field: repeated ottochain.v1.Address oracles = 7;
     */
    oracles: Address[];
    /**
     * @generated from field: int32 quorum = 8;
     */
    quorum: number;
};
/**
 * Describes the message ottochain.apps.markets.v1.CreateMarketRequest.
 * Use `create(CreateMarketRequestSchema)` to create a new message.
 */
export declare const CreateMarketRequestSchema: GenMessage<CreateMarketRequest>;
/**
 * Commit to a market position
 *
 * @generated from message ottochain.apps.markets.v1.CommitToMarketRequest
 */
export type CommitToMarketRequest = Message<"ottochain.apps.markets.v1.CommitToMarketRequest"> & {
    /**
     * @generated from field: string market_id = 1;
     */
    marketId: string;
    /**
     * @generated from field: ottochain.v1.Address agent = 2;
     */
    agent?: Address;
    /**
     * @generated from field: int64 amount = 3;
     */
    amount: bigint;
    /**
     * @generated from field: google.protobuf.Struct position_data = 4;
     */
    positionData?: JsonObject;
};
/**
 * Describes the message ottochain.apps.markets.v1.CommitToMarketRequest.
 * Use `create(CommitToMarketRequestSchema)` to create a new message.
 */
export declare const CommitToMarketRequestSchema: GenMessage<CommitToMarketRequest>;
/**
 * Submit oracle resolution
 *
 * @generated from message ottochain.apps.markets.v1.SubmitResolutionRequest
 */
export type SubmitResolutionRequest = Message<"ottochain.apps.markets.v1.SubmitResolutionRequest"> & {
    /**
     * @generated from field: string market_id = 1;
     */
    marketId: string;
    /**
     * @generated from field: ottochain.v1.Address oracle = 2;
     */
    oracle?: Address;
    /**
     * @generated from field: string outcome = 3;
     */
    outcome: string;
    /**
     * @generated from field: string proof = 4;
     */
    proof: string;
};
/**
 * Describes the message ottochain.apps.markets.v1.SubmitResolutionRequest.
 * Use `create(SubmitResolutionRequestSchema)` to create a new message.
 */
export declare const SubmitResolutionRequestSchema: GenMessage<SubmitResolutionRequest>;
/**
 * Cancel a market (creator only, before CLOSED)
 *
 * @generated from message ottochain.apps.markets.v1.CancelMarketRequest
 */
export type CancelMarketRequest = Message<"ottochain.apps.markets.v1.CancelMarketRequest"> & {
    /**
     * @generated from field: string market_id = 1;
     */
    marketId: string;
    /**
     * @generated from field: ottochain.v1.Address creator = 2;
     */
    creator?: Address;
    /**
     * @generated from field: string reason = 3;
     */
    reason: string;
};
/**
 * Describes the message ottochain.apps.markets.v1.CancelMarketRequest.
 * Use `create(CancelMarketRequestSchema)` to create a new message.
 */
export declare const CancelMarketRequestSchema: GenMessage<CancelMarketRequest>;
/**
 * Market state machine definition
 *
 * Valid transitions:
 *   PROPOSED -> OPEN (activate)
 *   PROPOSED -> CANCELLED (cancel)
 *   OPEN -> CLOSED (close_commitments / deadline reached)
 *   OPEN -> CANCELLED (cancel, if no commitments)
 *   CLOSED -> RESOLVING (begin_resolution)
 *   RESOLVING -> SETTLED (quorum_reached)
 *   RESOLVING -> REFUNDED (resolution_failed / timeout)
 *   CLOSED -> REFUNDED (threshold_not_met)
 *
 * @generated from message ottochain.apps.markets.v1.MarketDefinition
 */
export type MarketDefinition = Message<"ottochain.apps.markets.v1.MarketDefinition"> & {
    /**
     * Minimum oracle count required
     *
     * @generated from field: int32 min_oracles = 1;
     */
    minOracles: number;
    /**
     * Epochs before resolution timeout
     *
     * @generated from field: int32 resolution_timeout_epochs = 2;
     */
    resolutionTimeoutEpochs: number;
    /**
     * Allow refund if threshold not met
     *
     * @generated from field: bool allow_partial_refund = 3;
     */
    allowPartialRefund: boolean;
};
/**
 * Describes the message ottochain.apps.markets.v1.MarketDefinition.
 * Use `create(MarketDefinitionSchema)` to create a new message.
 */
export declare const MarketDefinitionSchema: GenMessage<MarketDefinition>;
/**
 * Type of market mechanism
 *
 * @generated from enum ottochain.apps.markets.v1.MarketType
 */
export declare enum MarketType {
    /**
     * @generated from enum value: MARKET_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Prediction market for future outcomes
     *
     * @generated from enum value: MARKET_TYPE_PREDICTION = 1;
     */
    PREDICTION = 1,
    /**
     * Auction with bidding mechanics
     *
     * @generated from enum value: MARKET_TYPE_AUCTION = 2;
     */
    AUCTION = 2,
    /**
     * Crowdfunding with funding goal
     *
     * @generated from enum value: MARKET_TYPE_CROWDFUND = 3;
     */
    CROWDFUND = 3,
    /**
     * Group purchasing coordination
     *
     * @generated from enum value: MARKET_TYPE_GROUP_BUY = 4;
     */
    GROUP_BUY = 4
}
/**
 * Describes the enum ottochain.apps.markets.v1.MarketType.
 */
export declare const MarketTypeSchema: GenEnum<MarketType>;
/**
 * Market lifecycle states
 *
 * @generated from enum ottochain.apps.markets.v1.MarketState
 */
export declare enum MarketState {
    /**
     * @generated from enum value: MARKET_STATE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Market created, awaiting activation
     *
     * @generated from enum value: MARKET_STATE_PROPOSED = 1;
     */
    PROPOSED = 1,
    /**
     * Accepting commitments
     *
     * @generated from enum value: MARKET_STATE_OPEN = 2;
     */
    OPEN = 2,
    /**
     * No longer accepting commitments
     *
     * @generated from enum value: MARKET_STATE_CLOSED = 3;
     */
    CLOSED = 3,
    /**
     * Oracles submitting resolutions
     *
     * @generated from enum value: MARKET_STATE_RESOLVING = 4;
     */
    RESOLVING = 4,
    /**
     * Final outcome determined (terminal)
     *
     * @generated from enum value: MARKET_STATE_SETTLED = 5;
     */
    SETTLED = 5,
    /**
     * Commitments returned (terminal)
     *
     * @generated from enum value: MARKET_STATE_REFUNDED = 6;
     */
    REFUNDED = 6,
    /**
     * Market cancelled by creator (terminal)
     *
     * @generated from enum value: MARKET_STATE_CANCELLED = 7;
     */
    CANCELLED = 7
}
/**
 * Describes the enum ottochain.apps.markets.v1.MarketState.
 */
export declare const MarketStateSchema: GenEnum<MarketState>;
