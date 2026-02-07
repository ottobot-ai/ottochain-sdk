/**
 * Input Validation with Zod Schemas
 *
 * Provides runtime validation for SDK types using Zod.
 *
 * @packageDocumentation
 */
import { z } from 'zod';
import { ValidationError } from './errors.js';
/**
 * Schema for a DAG address
 */
export declare const DagAddressSchema: z.ZodString;
/**
 * Schema for a private key (64-character hex string)
 */
export declare const PrivateKeySchema: z.ZodString;
/**
 * Schema for a public key (128 or 130 character hex string)
 */
export declare const PublicKeySchema: z.ZodString;
/**
 * Schema for a KeyPair
 */
export declare const KeyPairSchema: z.ZodObject<{
    /** Private key in hex format */
    privateKey: z.ZodString;
    /** Public key in hex format (uncompressed, with 04 prefix) */
    publicKey: z.ZodString;
    /** DAG address derived from the public key */
    address: z.ZodString;
}, "strip", z.ZodTypeAny, {
    privateKey: string;
    publicKey: string;
    address: string;
}, {
    privateKey: string;
    publicKey: string;
    address: string;
}>;
/**
 * Type for a validated KeyPair
 */
export type ValidatedKeyPair = z.infer<typeof KeyPairSchema>;
/**
 * Schema for a SignatureProof
 */
export declare const SignatureProofSchema: z.ZodObject<{
    /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
    id: z.ZodString;
    /** DER-encoded ECDSA signature in hex format */
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    signature: string;
}, {
    id: string;
    signature: string;
}>;
/**
 * Type for a validated SignatureProof
 */
export type ValidatedSignatureProof = z.infer<typeof SignatureProofSchema>;
/**
 * Schema for a Signed object (generic)
 */
export declare const SignedSchema: <T extends z.ZodTypeAny>(valueSchema: T) => z.ZodObject<{
    value: T;
    proofs: z.ZodArray<z.ZodObject<{
        /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
        id: z.ZodString;
        /** DER-encoded ECDSA signature in hex format */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        signature: string;
    }, {
        id: string;
        signature: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    value: T;
    proofs: z.ZodArray<z.ZodObject<{
        /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
        id: z.ZodString;
        /** DER-encoded ECDSA signature in hex format */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        signature: string;
    }, {
        id: string;
        signature: string;
    }>, "many">;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    value: T;
    proofs: z.ZodArray<z.ZodObject<{
        /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
        id: z.ZodString;
        /** DER-encoded ECDSA signature in hex format */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        signature: string;
    }, {
        id: string;
        signature: string;
    }>, "many">;
}>, any>[k]; } : never, z.baseObjectInputType<{
    value: T;
    proofs: z.ZodArray<z.ZodObject<{
        /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
        id: z.ZodString;
        /** DER-encoded ECDSA signature in hex format */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        signature: string;
    }, {
        id: string;
        signature: string;
    }>, "many">;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    value: T;
    proofs: z.ZodArray<z.ZodObject<{
        /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
        id: z.ZodString;
        /** DER-encoded ECDSA signature in hex format */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        signature: string;
    }, {
        id: string;
        signature: string;
    }>, "many">;
}>[k_1]; } : never>;
/**
 * Schema for TransactionReference
 */
export declare const TransactionReferenceSchema: z.ZodObject<{
    ordinal: z.ZodNumber;
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hash: string;
    ordinal: number;
}, {
    hash: string;
    ordinal: number;
}>;
/**
 * Schema for CurrencyTransactionValue
 */
export declare const CurrencyTransactionValueSchema: z.ZodObject<{
    source: z.ZodString;
    destination: z.ZodString;
    amount: z.ZodNumber;
    fee: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    source: string;
    destination: string;
    amount: number;
    fee: number;
}, {
    source: string;
    destination: string;
    amount: number;
    fee?: number | undefined;
}>;
/**
 * Schema for CurrencyTransaction
 */
export declare const CurrencyTransactionSchema: z.ZodObject<{
    value: z.ZodObject<{
        source: z.ZodString;
        destination: z.ZodString;
        amount: z.ZodNumber;
        fee: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        source: string;
        destination: string;
        amount: number;
        fee: number;
    }, {
        source: string;
        destination: string;
        amount: number;
        fee?: number | undefined;
    }>;
    parent: z.ZodObject<{
        ordinal: z.ZodNumber;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        hash: string;
        ordinal: number;
    }, {
        hash: string;
        ordinal: number;
    }>;
}, "strip", z.ZodTypeAny, {
    value: {
        source: string;
        destination: string;
        amount: number;
        fee: number;
    };
    parent: {
        hash: string;
        ordinal: number;
    };
}, {
    value: {
        source: string;
        destination: string;
        amount: number;
        fee?: number | undefined;
    };
    parent: {
        hash: string;
        ordinal: number;
    };
}>;
/**
 * Type for a validated CurrencyTransaction
 */
export type ValidatedCurrencyTransaction = z.infer<typeof CurrencyTransactionSchema>;
/**
 * Schema for TransferParams
 */
export declare const TransferParamsSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    amount: z.ZodNumber;
    fee: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    fee: number;
    from: string;
    to: string;
}, {
    amount: number;
    from: string;
    to: string;
    fee?: number | undefined;
}>;
/**
 * Type for validated TransferParams
 */
export type ValidatedTransferParams = z.infer<typeof TransferParamsSchema>;
/**
 * Schema for AgentIdentity registration
 */
export declare const AgentIdentityRegistrationSchema: z.ZodObject<{
    /** Public key in hex format */
    publicKey: z.ZodString;
    /** Display name for the agent */
    displayName: z.ZodString;
    /** Initial reputation (default: 10) */
    reputation: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    publicKey: string;
    displayName: string;
    reputation: number;
}, {
    publicKey: string;
    displayName: string;
    reputation?: number | undefined;
}>;
/**
 * Type for validated AgentIdentity registration
 */
export type ValidatedAgentIdentityRegistration = z.infer<typeof AgentIdentityRegistrationSchema>;
/**
 * Schema for PlatformLink
 */
export declare const PlatformLinkSchema: z.ZodObject<{
    platform: z.ZodEnum<["DISCORD", "TELEGRAM", "TWITTER", "GITHUB", "CUSTOM"]>;
    platformUserId: z.ZodString;
    platformUsername: z.ZodString;
    verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    platform: "DISCORD" | "TELEGRAM" | "TWITTER" | "GITHUB" | "CUSTOM";
    platformUserId: string;
    platformUsername: string;
    verified: boolean;
}, {
    platform: "DISCORD" | "TELEGRAM" | "TWITTER" | "GITHUB" | "CUSTOM";
    platformUserId: string;
    platformUsername: string;
    verified?: boolean | undefined;
}>;
/**
 * Type for validated PlatformLink
 */
export type ValidatedPlatformLink = z.infer<typeof PlatformLinkSchema>;
/**
 * Schema for contract terms (flexible structure)
 */
export declare const ContractTermsSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
/**
 * Schema for ProposeContractRequest
 */
export declare const ProposeContractRequestSchema: z.ZodObject<{
    /** Proposer's DAG address */
    proposer: z.ZodString;
    /** Counterparty's DAG address */
    counterparty: z.ZodString;
    /** Contract terms */
    terms: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    /** Human-readable description */
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    proposer: string;
    counterparty: string;
    terms: Record<string, unknown>;
    description: string;
}, {
    proposer: string;
    counterparty: string;
    terms: Record<string, unknown>;
    description: string;
}>;
/**
 * Type for validated ProposeContractRequest
 */
export type ValidatedProposeContractRequest = z.infer<typeof ProposeContractRequestSchema>;
/**
 * Schema for AcceptContractRequest
 */
export declare const AcceptContractRequestSchema: z.ZodObject<{
    /** Contract ID to accept */
    contractId: z.ZodString;
    /** Acceptor's DAG address */
    acceptor: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contractId: string;
    acceptor: string;
}, {
    contractId: string;
    acceptor: string;
}>;
/**
 * Type for validated AcceptContractRequest
 */
export type ValidatedAcceptContractRequest = z.infer<typeof AcceptContractRequestSchema>;
/**
 * Schema for CompleteContractRequest
 */
export declare const CompleteContractRequestSchema: z.ZodObject<{
    /** Contract ID to complete */
    contractId: z.ZodString;
    /** Completer's DAG address */
    completer: z.ZodString;
    /** Proof of completion */
    proof: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contractId: string;
    completer: string;
    proof: string;
}, {
    contractId: string;
    completer: string;
    proof: string;
}>;
/**
 * Type for validated CompleteContractRequest
 */
export type ValidatedCompleteContractRequest = z.infer<typeof CompleteContractRequestSchema>;
/**
 * Validate data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param fieldName - Optional field name for error context
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const keyPair = validate(KeyPairSchema, inputData, 'keyPair');
 * // keyPair is now typed as ValidatedKeyPair
 * ```
 */
export declare function validate<T extends z.ZodTypeAny>(schema: T, data: unknown, fieldName?: string): z.infer<T>;
/**
 * Validate a private key
 *
 * @param privateKey - Private key to validate
 * @returns Validated private key
 * @throws {ValidationError} If validation fails
 */
export declare function validatePrivateKey(privateKey: unknown): string;
/**
 * Validate a public key
 *
 * @param publicKey - Public key to validate
 * @returns Validated public key
 * @throws {ValidationError} If validation fails
 */
export declare function validatePublicKey(publicKey: unknown): string;
/**
 * Validate a DAG address
 *
 * @param address - Address to validate
 * @returns Validated address
 * @throws {ValidationError} If validation fails
 */
export declare function validateAddress(address: unknown): string;
/**
 * Validate a KeyPair
 *
 * @param keyPair - KeyPair to validate
 * @returns Validated KeyPair
 * @throws {ValidationError} If validation fails
 */
export declare function validateKeyPair(keyPair: unknown): ValidatedKeyPair;
/**
 * Safe validation that returns a result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and data or error
 *
 * @example
 * ```typescript
 * const result = safeParse(KeyPairSchema, inputData);
 * if (result.success) {
 *   console.log(result.data.address);
 * } else {
 *   console.log(result.error.message);
 * }
 * ```
 */
export declare function safeParse<T extends z.ZodTypeAny>(schema: T, data: unknown): {
    success: true;
    data: z.infer<T>;
} | {
    success: false;
    error: ValidationError;
};
/**
 * Assert that a condition is true, throwing ValidationError if not
 *
 * @param condition - Condition to check
 * @param message - Error message if condition is false
 * @param field - Optional field name for context
 * @throws {ValidationError} If condition is false
 */
export declare function assert(condition: boolean, message: string, field?: string): asserts condition;
