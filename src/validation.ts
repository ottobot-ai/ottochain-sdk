/**
 * Input Validation with Zod Schemas
 *
 * Provides runtime validation for SDK types using Zod.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { ValidationError } from './errors.js';

// ============================================================================
// Primitive Schemas
// ============================================================================

/**
 * Schema for a hex string of specific length
 */
const hexString = (length?: number) => {
  let schema = z.string().regex(/^[0-9a-fA-F]+$/, 'Must be a valid hex string');
  if (length !== undefined) {
    schema = schema.length(length, `Must be exactly ${length} characters`);
  }
  return schema;
};

/**
 * Schema for a DAG address
 */
export const DagAddressSchema = z
  .string()
  .regex(/^DAG[0-9][a-zA-Z0-9]{36}$/, 'Must be a valid DAG address');

// ============================================================================
// Core Type Schemas
// ============================================================================

/**
 * Schema for a private key (64-character hex string)
 */
export const PrivateKeySchema = hexString(64).describe('Private key in hex format (64 characters)');

/**
 * Schema for a public key (128 or 130 character hex string)
 */
export const PublicKeySchema = z
  .string()
  .regex(/^(04)?[0-9a-fA-F]{128}$/, 'Must be a valid public key (128 or 130 hex chars)')
  .describe('Public key in hex format (with optional 04 prefix)');

/**
 * Schema for a KeyPair
 */
export const KeyPairSchema = z.object({
  /** Private key in hex format */
  privateKey: PrivateKeySchema,
  /** Public key in hex format (uncompressed, with 04 prefix) */
  publicKey: PublicKeySchema,
  /** DAG address derived from the public key */
  address: DagAddressSchema,
});

/**
 * Type for a validated KeyPair
 */
export type ValidatedKeyPair = z.infer<typeof KeyPairSchema>;

/**
 * Schema for a SignatureProof
 */
export const SignatureProofSchema = z.object({
  /** Public key hex (uncompressed, without 04 prefix) - 128 characters */
  id: hexString(128),
  /** DER-encoded ECDSA signature in hex format */
  signature: hexString(),
});

/**
 * Type for a validated SignatureProof
 */
export type ValidatedSignatureProof = z.infer<typeof SignatureProofSchema>;

/**
 * Schema for a Signed object (generic)
 */
export const SignedSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    proofs: z.array(SignatureProofSchema).min(1, 'At least one proof is required'),
  });

// ============================================================================
// Transaction Schemas
// ============================================================================

/**
 * Schema for TransactionReference
 */
export const TransactionReferenceSchema = z.object({
  ordinal: z.number().int().min(0),
  hash: z.string().min(1),
});

/**
 * Schema for CurrencyTransactionValue
 */
export const CurrencyTransactionValueSchema = z.object({
  source: DagAddressSchema,
  destination: DagAddressSchema,
  amount: z.number().int().positive('Amount must be positive'),
  fee: z.number().int().min(0).default(0),
});

/**
 * Schema for CurrencyTransaction
 */
export const CurrencyTransactionSchema = z.object({
  value: CurrencyTransactionValueSchema,
  parent: TransactionReferenceSchema,
});

/**
 * Type for a validated CurrencyTransaction
 */
export type ValidatedCurrencyTransaction = z.infer<typeof CurrencyTransactionSchema>;

/**
 * Schema for TransferParams
 */
export const TransferParamsSchema = z.object({
  from: DagAddressSchema,
  to: DagAddressSchema,
  amount: z.number().positive('Amount must be positive'),
  fee: z.number().min(0).optional().default(0),
});

/**
 * Type for validated TransferParams
 */
export type ValidatedTransferParams = z.infer<typeof TransferParamsSchema>;

// ============================================================================
// Identity Schemas
// ============================================================================

/**
 * Schema for AgentIdentity registration
 */
export const AgentIdentityRegistrationSchema = z.object({
  /** Public key in hex format */
  publicKey: PublicKeySchema,
  /** Display name for the agent */
  displayName: z.string().min(1).max(64),
  /** Initial reputation (default: 10) */
  reputation: z.number().int().min(0).optional().default(10),
});

/**
 * Type for validated AgentIdentity registration
 */
export type ValidatedAgentIdentityRegistration = z.infer<typeof AgentIdentityRegistrationSchema>;

/**
 * Schema for PlatformLink
 */
export const PlatformLinkSchema = z.object({
  platform: z.enum(['DISCORD', 'TELEGRAM', 'TWITTER', 'GITHUB', 'CUSTOM']),
  platformUserId: z.string().min(1),
  platformUsername: z.string().min(1),
  verified: z.boolean().optional().default(false),
});

/**
 * Type for validated PlatformLink
 */
export type ValidatedPlatformLink = z.infer<typeof PlatformLinkSchema>;

// ============================================================================
// Contract Schemas
// ============================================================================

/**
 * Schema for contract terms (flexible structure)
 */
export const ContractTermsSchema = z.record(z.string(), z.unknown());

/**
 * Schema for ProposeContractRequest
 */
export const ProposeContractRequestSchema = z.object({
  /** Proposer's DAG address */
  proposer: DagAddressSchema,
  /** Counterparty's DAG address */
  counterparty: DagAddressSchema,
  /** Contract terms */
  terms: ContractTermsSchema,
  /** Human-readable description */
  description: z.string().min(1).max(1000),
});

/**
 * Type for validated ProposeContractRequest
 */
export type ValidatedProposeContractRequest = z.infer<typeof ProposeContractRequestSchema>;

/**
 * Schema for AcceptContractRequest
 */
export const AcceptContractRequestSchema = z.object({
  /** Contract ID to accept */
  contractId: z.string().min(1),
  /** Acceptor's DAG address */
  acceptor: DagAddressSchema,
});

/**
 * Type for validated AcceptContractRequest
 */
export type ValidatedAcceptContractRequest = z.infer<typeof AcceptContractRequestSchema>;

/**
 * Schema for CompleteContractRequest
 */
export const CompleteContractRequestSchema = z.object({
  /** Contract ID to complete */
  contractId: z.string().min(1),
  /** Completer's DAG address */
  completer: DagAddressSchema,
  /** Proof of completion */
  proof: z.string().min(1),
});

/**
 * Type for validated CompleteContractRequest
 */
export type ValidatedCompleteContractRequest = z.infer<typeof CompleteContractRequestSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

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
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  fieldName?: string
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues;
    const firstIssue = issues[0];

    // Build a helpful error message
    const path = firstIssue.path.length > 0 ? firstIssue.path.join('.') : fieldName || 'input';
    const message = `Validation failed for '${path}': ${firstIssue.message}`;

    throw new ValidationError(message, {
      field: path,
      value: data,
      details: {
        issues: issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
    });
  }

  return result.data;
}

/**
 * Validate a private key
 *
 * @param privateKey - Private key to validate
 * @returns Validated private key
 * @throws {ValidationError} If validation fails
 */
export function validatePrivateKey(privateKey: unknown): string {
  return validate(PrivateKeySchema, privateKey, 'privateKey');
}

/**
 * Validate a public key
 *
 * @param publicKey - Public key to validate
 * @returns Validated public key
 * @throws {ValidationError} If validation fails
 */
export function validatePublicKey(publicKey: unknown): string {
  return validate(PublicKeySchema, publicKey, 'publicKey');
}

/**
 * Validate a DAG address
 *
 * @param address - Address to validate
 * @returns Validated address
 * @throws {ValidationError} If validation fails
 */
export function validateAddress(address: unknown): string {
  return validate(DagAddressSchema, address, 'address');
}

/**
 * Validate a KeyPair
 *
 * @param keyPair - KeyPair to validate
 * @returns Validated KeyPair
 * @throws {ValidationError} If validation fails
 */
export function validateKeyPair(keyPair: unknown): ValidatedKeyPair {
  return validate(KeyPairSchema, keyPair, 'keyPair');
}

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
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues;
  const firstIssue = issues[0];
  const path = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'input';
  const message = `Validation failed for '${path}': ${firstIssue.message}`;

  return {
    success: false,
    error: new ValidationError(message, {
      field: path,
      value: data,
      details: {
        issues: issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
    }),
  };
}

/**
 * Assert that a condition is true, throwing ValidationError if not
 *
 * @param condition - Condition to check
 * @param message - Error message if condition is false
 * @param field - Optional field name for context
 * @throws {ValidationError} If condition is false
 */
export function assert(condition: boolean, message: string, field?: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message, { field });
  }
}
