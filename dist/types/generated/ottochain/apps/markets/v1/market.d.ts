import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.markets.v1";
/** Type of market mechanism */
export declare enum MarketType {
    MARKET_TYPE_UNSPECIFIED = "MARKET_TYPE_UNSPECIFIED",
    /** MARKET_TYPE_PREDICTION - Prediction market for future outcomes */
    MARKET_TYPE_PREDICTION = "MARKET_TYPE_PREDICTION",
    /** MARKET_TYPE_AUCTION - Auction with bidding mechanics */
    MARKET_TYPE_AUCTION = "MARKET_TYPE_AUCTION",
    /** MARKET_TYPE_CROWDFUND - Crowdfunding with funding goal */
    MARKET_TYPE_CROWDFUND = "MARKET_TYPE_CROWDFUND",
    /** MARKET_TYPE_GROUP_BUY - Group purchasing coordination */
    MARKET_TYPE_GROUP_BUY = "MARKET_TYPE_GROUP_BUY",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function marketTypeFromJSON(object: any): MarketType;
export declare function marketTypeToJSON(object: MarketType): string;
export declare function marketTypeToNumber(object: MarketType): number;
/** Market lifecycle states */
export declare enum MarketState {
    MARKET_STATE_UNSPECIFIED = "MARKET_STATE_UNSPECIFIED",
    /** MARKET_STATE_PROPOSED - Market created, awaiting activation */
    MARKET_STATE_PROPOSED = "MARKET_STATE_PROPOSED",
    /** MARKET_STATE_OPEN - Accepting commitments */
    MARKET_STATE_OPEN = "MARKET_STATE_OPEN",
    /** MARKET_STATE_CLOSED - No longer accepting commitments */
    MARKET_STATE_CLOSED = "MARKET_STATE_CLOSED",
    /** MARKET_STATE_RESOLVING - Oracles submitting resolutions */
    MARKET_STATE_RESOLVING = "MARKET_STATE_RESOLVING",
    /** MARKET_STATE_SETTLED - Final outcome determined (terminal) */
    MARKET_STATE_SETTLED = "MARKET_STATE_SETTLED",
    /** MARKET_STATE_REFUNDED - Commitments returned (terminal) */
    MARKET_STATE_REFUNDED = "MARKET_STATE_REFUNDED",
    /** MARKET_STATE_CANCELLED - Market cancelled by creator (terminal) */
    MARKET_STATE_CANCELLED = "MARKET_STATE_CANCELLED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function marketStateFromJSON(object: any): MarketState;
export declare function marketStateToJSON(object: MarketState): string;
export declare function marketStateToNumber(object: MarketState): number;
/** Agent commitment to a market position */
export interface Commitment {
    /** Committing agent's address */
    agent: string;
    /** Token amount committed */
    amount: number;
    /** Position data (outcome choice, bid, etc.) */
    data?: {
        [key: string]: any;
    } | undefined;
    /** When commitment was made */
    timestamp?: Date | undefined;
}
/** Oracle resolution submission */
export interface Resolution {
    /** Oracle's address */
    oracle: string;
    /** Resolved outcome identifier */
    outcome: string;
    /** Evidence/proof of outcome */
    proof: string;
    /** When resolution was submitted */
    timestamp?: Date | undefined;
}
/** Universal market container */
export interface Market {
    /** Unique market identifier */
    id: string;
    /** Type of market mechanism */
    marketType: MarketType;
    /** Market creator's address */
    creator: string;
    /** Human-readable market title */
    title: string;
    /** Market-specific terms and rules */
    terms?: {
        [key: string]: any;
    } | undefined;
    /** When market closes for commitments */
    deadline?: Date | undefined;
    /** Minimum commitment threshold */
    threshold: number;
    /** All agent commitments */
    commitments: Commitment[];
    /** Designated oracle addresses */
    oracles: string[];
    /** Required oracle agreement count */
    quorum: number;
    /** Oracle resolution submissions */
    resolutions: Resolution[];
    /** Current market state */
    status: MarketState;
    /** Market creation timestamp */
    createdAt?: Date | undefined;
    /** Last state update timestamp */
    updatedAt?: Date | undefined;
}
/** Create a new market */
export interface CreateMarketRequest {
    marketType: MarketType;
    creator: string;
    title: string;
    terms?: {
        [key: string]: any;
    } | undefined;
    deadline?: Date | undefined;
    threshold: number;
    oracles: string[];
    quorum: number;
}
/** Commit to a market position */
export interface CommitToMarketRequest {
    marketId: string;
    agent: string;
    amount: number;
    positionData?: {
        [key: string]: any;
    } | undefined;
}
/** Submit oracle resolution */
export interface SubmitResolutionRequest {
    marketId: string;
    oracle: string;
    outcome: string;
    proof: string;
}
/** Cancel a market (creator only, before CLOSED) */
export interface CancelMarketRequest {
    marketId: string;
    creator: string;
    reason: string;
}
/** Market state machine definition */
export interface MarketDefinition {
    /** Minimum oracle count required */
    minOracles: number;
    /** Epochs before resolution timeout */
    resolutionTimeoutEpochs: number;
    /** Allow refund if threshold not met */
    allowPartialRefund: boolean;
}
export declare const Commitment: MessageFns<Commitment>;
export declare const Resolution: MessageFns<Resolution>;
export declare const Market: MessageFns<Market>;
export declare const CreateMarketRequest: MessageFns<CreateMarketRequest>;
export declare const CommitToMarketRequest: MessageFns<CommitToMarketRequest>;
export declare const SubmitResolutionRequest: MessageFns<SubmitResolutionRequest>;
export declare const CancelMarketRequest: MessageFns<CancelMarketRequest>;
export declare const MarketDefinition: MessageFns<MarketDefinition>;
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
