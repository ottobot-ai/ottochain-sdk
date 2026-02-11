import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.v1";
/** Delegation approach selector */
export declare enum DelegationApproach {
    DELEGATION_APPROACH_UNSPECIFIED = "DELEGATION_APPROACH_UNSPECIFIED",
    /** DELEGATION_APPROACH_SESSION_KEY - Temporary signing authority */
    DELEGATION_APPROACH_SESSION_KEY = "DELEGATION_APPROACH_SESSION_KEY",
    /** DELEGATION_APPROACH_SIGNED_INTENT - Pre-signed transaction intents */
    DELEGATION_APPROACH_SIGNED_INTENT = "DELEGATION_APPROACH_SIGNED_INTENT",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function delegationApproachFromJSON(object: any): DelegationApproach;
export declare function delegationApproachToJSON(object: DelegationApproach): string;
export declare function delegationApproachToNumber(object: DelegationApproach): number;
/** How fees are handled for relayed transactions */
export declare enum FeePaymentMethod {
    FEE_PAYMENT_METHOD_UNSPECIFIED = "FEE_PAYMENT_METHOD_UNSPECIFIED",
    /** FEE_PAYMENT_METHOD_RELAYER_PAYS - Relayer covers all fees */
    FEE_PAYMENT_METHOD_RELAYER_PAYS = "FEE_PAYMENT_METHOD_RELAYER_PAYS",
    /** FEE_PAYMENT_METHOD_PRINCIPAL_PAYS - Deducted from principal's account */
    FEE_PAYMENT_METHOD_PRINCIPAL_PAYS = "FEE_PAYMENT_METHOD_PRINCIPAL_PAYS",
    /** FEE_PAYMENT_METHOD_SPONSOR_PAYS - Third-party sponsor covers fees */
    FEE_PAYMENT_METHOD_SPONSOR_PAYS = "FEE_PAYMENT_METHOD_SPONSOR_PAYS",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function feePaymentMethodFromJSON(object: any): FeePaymentMethod;
export declare function feePaymentMethodToJSON(object: FeePaymentMethod): string;
export declare function feePaymentMethodToNumber(object: FeePaymentMethod): number;
/** Scope of delegation authority */
export interface DelegationScope {
    /** Specific fiber IDs this delegation can operate on */
    fiberIds: string[];
    /** Allowed transaction types (message names from OttochainMessage) */
    allowedOperations: string[];
    /** Maximum gas/fee limit per transaction */
    maxGasPerTx?: number | undefined;
    /** Maximum total gas/fee for entire delegation */
    maxTotalGas?: number | undefined;
    /** Custom JSON Logic policy for advanced validation */
    policyRules?: any | undefined;
}
/** Core delegation authority structure */
export interface DelegationAuthority {
    /** Unique delegation identifier */
    delegationId: string;
    /** Principal (user) granting the delegation */
    principalAddress: string;
    /** Delegate (relayer) receiving the authority */
    delegateAddress: string;
    /** Delegation scope and permissions */
    scope?: DelegationScope | undefined;
    /** Delegation approach being used */
    approach: DelegationApproach;
    /** Expiry timestamp for the delegation */
    expiresAt?: Date | undefined;
    /** Nonce for replay protection */
    nonce: number;
    /** Principal's signature over the delegation */
    principalSignature: string;
    /** Optional metadata */
    metadata?: {
        [key: string]: any;
    } | undefined;
}
/** Session key delegation (temporary signing authority) */
export interface SessionKey {
    /** Reference to the parent delegation authority */
    delegationId: string;
    /** Temporary public key for signing */
    sessionPublicKey: string;
    /** Session key expiry (must be <= delegation expiry) */
    sessionExpiresAt?: Date | undefined;
    /** Session-specific scope restrictions */
    sessionScope?: DelegationScope | undefined;
    /** Principal's signature authorizing this session key */
    authorizationSignature: string;
}
/** Signed intent for pre-authorized transactions */
export interface SignedIntent {
    /** Reference to the parent delegation authority */
    delegationId: string;
    /** The specific transaction being pre-authorized (serialized) */
    transaction?: {
        [key: string]: any;
    } | undefined;
    /** Intent nonce for replay protection */
    intentNonce: number;
    /** Intent expiry timestamp */
    intentExpiresAt?: Date | undefined;
    /** Conditions that must be met for execution */
    executionConditions?: any | undefined;
    /** Principal's signature over the intent */
    intentSignature: string;
}
/** Delegation revocation message */
export interface DelegationRevocation {
    /** Delegation being revoked */
    delegationId: string;
    /** Reason for revocation (optional) */
    reason?: string | undefined;
    /** Revocation nonce */
    nonce: number;
    /** Principal's signature authorizing revocation */
    revocationSignature: string;
    /** Revocation timestamp */
    revokedAt?: Date | undefined;
}
/** Relayed transaction envelope */
export interface RelayedTransaction {
    /** Original transaction to be executed (serialized) */
    transaction?: {
        [key: string]: any;
    } | undefined;
    /** Delegation authority proof */
    delegationProof?: //
    /** Session key approach: signed by session key */
    {
        $case: "sessionKeyProof";
        sessionKeyProof: SessionKeyProof;
    } | //
    /** Signed intent approach: pre-signed intent */
    {
        $case: "signedIntentProof";
        signedIntentProof: SignedIntentProof;
    } | undefined;
    /** Gas/fee information */
    gasConfig?: GasConfig | undefined;
    /** Relayer information */
    relayerAddress: string;
    /** Relayer signature (for accountability) */
    relayerSignature: string;
}
/** Proof for session key delegation */
export interface SessionKeyProof {
    /** Session key used to sign the transaction */
    sessionKey?: SessionKey | undefined;
    /** Transaction signature by the session key */
    transactionSignature: string;
}
/** Proof for signed intent delegation */
export interface SignedIntentProof {
    /** Pre-signed intent being executed */
    signedIntent?: SignedIntent | undefined;
    /** Proof that execution conditions are met (if any) */
    conditionProof?: any | undefined;
}
/** Gas and fee configuration for relayed transactions */
export interface GasConfig {
    /** Gas limit for the transaction */
    gasLimit: number;
    /** Gas price (if applicable) */
    gasPrice?: number | undefined;
    /** Fee payment method */
    paymentMethod: FeePaymentMethod;
}
/** Create a new delegation authority */
export interface CreateDelegation {
    delegation?: DelegationAuthority | undefined;
}
/** Register a session key for delegation */
export interface RegisterSessionKey {
    sessionKey?: SessionKey | undefined;
}
/** Submit a pre-signed intent */
export interface SubmitSignedIntent {
    signedIntent?: SignedIntent | undefined;
}
/** Revoke an existing delegation */
export interface RevokeDelegation {
    revocation?: DelegationRevocation | undefined;
}
/** Submit a relayed transaction */
export interface SubmitRelayedTransaction {
    relayedTx?: RelayedTransaction | undefined;
}
export declare const DelegationScope: MessageFns<DelegationScope>;
export declare const DelegationAuthority: MessageFns<DelegationAuthority>;
export declare const SessionKey: MessageFns<SessionKey>;
export declare const SignedIntent: MessageFns<SignedIntent>;
export declare const DelegationRevocation: MessageFns<DelegationRevocation>;
export declare const RelayedTransaction: MessageFns<RelayedTransaction>;
export declare const SessionKeyProof: MessageFns<SessionKeyProof>;
export declare const SignedIntentProof: MessageFns<SignedIntentProof>;
export declare const GasConfig: MessageFns<GasConfig>;
export declare const CreateDelegation: MessageFns<CreateDelegation>;
export declare const RegisterSessionKey: MessageFns<RegisterSessionKey>;
export declare const SubmitSignedIntent: MessageFns<SubmitSignedIntent>;
export declare const RevokeDelegation: MessageFns<RevokeDelegation>;
export declare const SubmitRelayedTransaction: MessageFns<SubmitRelayedTransaction>;
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
