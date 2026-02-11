/**
 * Delegation SDK Utilities
 *
 * High-level convenience methods for creating, signing, and managing
 * delegated transactions in OttoChain.
 *
 * @packageDocumentation
 */
import { Value, Struct } from './generated/google/protobuf/struct.js';
import { DelegationApproach, FeePaymentMethod, } from './generated/ottochain/v1/delegation.js';
import { sign, verifySignature } from './metakit/index.js';
/**
 * Create a delegation authority structure
 */
export function createDelegation(config) {
    const delegationId = generateDelegationId(config.principalAddress, config.delegateAddress);
    const nonce = Date.now(); // Simple nonce, could be improved
    // Ensure scope is a full DelegationScope
    const fullScope = {
        fiberIds: config.scope.fiberIds || [],
        allowedOperations: config.scope.allowedOperations || [],
        maxGasPerTx: config.scope.maxGasPerTx,
        maxTotalGas: config.scope.maxTotalGas,
        policyRules: config.scope.policyRules,
    };
    return {
        delegationId,
        principalAddress: config.principalAddress,
        delegateAddress: config.delegateAddress,
        scope: fullScope,
        approach: config.approach,
        expiresAt: config.expiresAt,
        nonce,
        principalSignature: '', // To be filled by signDelegation
        metadata: config.metadata ? Struct.fromJSON(config.metadata) : undefined,
    };
}
/**
 * Sign a delegation with the principal's private key
 */
export async function signDelegation(delegation, principalPrivateKey) {
    // Create signature payload (everything except the signature itself)
    const payload = createDelegationSignaturePayload(delegation);
    // Sign the payload
    const signature = await sign(payload, principalPrivateKey);
    return {
        ...delegation,
        principalSignature: signature.signature,
    };
}
/**
 * Create a delegation revocation message
 */
export function revokeDelegation(delegationId, reason) {
    return {
        delegationId,
        reason,
        nonce: Date.now(),
        revocationSignature: '', // To be filled by signing
        revokedAt: new Date(),
    };
}
/**
 * Sign a delegation revocation with the principal's private key
 */
export async function signRevocation(revocation, principalPrivateKey) {
    // Create signature payload (everything except the signature itself)
    const payload = createRevocationSignaturePayload(revocation);
    // Sign the payload
    const signature = await sign(payload, principalPrivateKey);
    return {
        ...revocation,
        revocationSignature: signature.signature,
    };
}
/**
 * Submit a signed delegation revocation to the bridge
 *
 * This method submits a signed revocation to immediately invalidate
 * a delegation and prevent further use.
 */
export async function submitRevocation(revocation, bridgeUrl) {
    if (!revocation.revocationSignature) {
        throw new Error('Revocation must be signed before submission');
    }
    const defaultBridgeUrl = process.env.OTTOCHAIN_BRIDGE_URL || 'https://bridge.ottochain.ai';
    const url = bridgeUrl || defaultBridgeUrl;
    try {
        const response = await fetch(`${url}/api/delegations/${revocation.delegationId}/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ revocation }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Revocation submission failed: ${response.status} ${response.statusText}: ${errorText}`);
        }
        const result = await response.json();
        return {
            success: result.success ?? true,
            message: result.message ?? 'Delegation revoked successfully',
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to submit revocation: ${error.message}`);
        }
        throw new Error(`Failed to submit revocation: ${String(error)}`);
    }
}
/**
 * Client-side validation of delegation
 */
export function isDelegationValid(delegation) {
    const errors = [];
    // Check required fields
    if (!delegation.delegationId) {
        errors.push('Missing delegation ID');
    }
    if (!delegation.principalAddress) {
        errors.push('Missing principal address');
    }
    if (!delegation.delegateAddress) {
        errors.push('Missing delegate address');
    }
    if (!delegation.principalSignature) {
        errors.push('Missing principal signature');
    }
    // Check expiry
    if (delegation.expiresAt) {
        if (delegation.expiresAt <= new Date()) {
            errors.push('Delegation has expired');
        }
    }
    else {
        errors.push('Missing expiry timestamp');
    }
    // Validate scope
    if (!delegation.scope) {
        errors.push('Missing delegation scope');
    }
    else {
        if (delegation.scope.fiberIds?.length === 0 &&
            delegation.scope.allowedOperations?.length === 0) {
            errors.push('Scope must specify either fiber IDs or allowed operations');
        }
    }
    // Check approach
    if (!delegation.approach || delegation.approach === DelegationApproach.DELEGATION_APPROACH_UNSPECIFIED) {
        errors.push('Must specify delegation approach');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Verify a delegation signature
 */
export async function verifyDelegationSignature(delegation, principalPublicKey) {
    if (!delegation.principalSignature) {
        return false;
    }
    const payload = createDelegationSignaturePayload(delegation);
    return verifySignature(payload, {
        id: principalPublicKey,
        signature: delegation.principalSignature,
    });
}
/**
 * Create a relayed transaction envelope
 */
export function createRelayedTransaction(transaction, delegationProof, gasConfig, relayerAddress) {
    return {
        transaction: Struct.fromJSON(transaction),
        delegationProof: delegationProof.type === 'sessionKey'
            ? { $case: 'sessionKeyProof', sessionKeyProof: delegationProof.proof }
            : { $case: 'signedIntentProof', signedIntentProof: delegationProof.proof },
        gasConfig,
        relayerAddress,
        relayerSignature: '', // To be filled by relayer
    };
}
/**
 * Submit a delegated transaction via relayer
 *
 * This method creates a relayed transaction envelope and submits it to the bridge
 * endpoint for processing. The transaction is executed with delegation authority
 * rather than direct user signing.
 */
export async function submitDelegated(transaction, delegation, bridgeUrl) {
    // Validate delegation before submission
    const validation = isDelegationValid(delegation);
    if (!validation.valid) {
        throw new Error(`Invalid delegation: ${validation.errors.join(', ')}`);
    }
    // Default bridge URL if not provided
    const defaultBridgeUrl = process.env.OTTOCHAIN_BRIDGE_URL || 'https://bridge.ottochain.ai';
    const url = bridgeUrl || defaultBridgeUrl;
    // Create delegation proof based on approach
    let delegationProof;
    if (delegation.approach === DelegationApproach.DELEGATION_APPROACH_SESSION_KEY) {
        // For session key approach, create session key proof
        const sessionKeyProof = {
            sessionKey: {
                delegationId: delegation.delegationId,
                sessionPublicKey: delegation.delegateAddress, // Simplified - in real implementation this would be the session key
                sessionExpiresAt: delegation.expiresAt,
                authorizationSignature: delegation.principalSignature,
            },
            transactionSignature: '', // To be filled by relayer
        };
        delegationProof = { type: 'sessionKey', proof: sessionKeyProof };
    }
    else {
        // For signed intent approach, create signed intent proof
        const signedIntentProof = {
            signedIntent: {
                delegationId: delegation.delegationId,
                transaction: Struct.fromJSON(transaction),
                intentNonce: delegation.nonce,
                intentExpiresAt: delegation.expiresAt,
                intentSignature: delegation.principalSignature,
            },
        };
        delegationProof = { type: 'signedIntent', proof: signedIntentProof };
    }
    // Create gas configuration
    const gasConfig = {
        gasLimit: 100000, // Default gas limit
        paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS,
    };
    // Create relayed transaction envelope
    const relayedTx = createRelayedTransaction(transaction, delegationProof, gasConfig, delegation.delegateAddress);
    try {
        // Submit to bridge endpoint
        const response = await fetch(`${url}/api/delegations/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                relayedTransaction: relayedTx,
                delegationAuthority: delegation,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bridge submission failed: ${response.status} ${response.statusText}: ${errorText}`);
        }
        const result = await response.json();
        return {
            txId: result.transactionId || result.txId || 'unknown',
            status: result.status || 'submitted',
            receipt: result.receipt,
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to submit delegated transaction: ${error.message}`);
        }
        throw new Error(`Failed to submit delegated transaction: ${String(error)}`);
    }
}
/**
 * Query delegation status from the bridge
 *
 * Retrieves the current status of a delegation, including whether it's active,
 * revoked, expired, and usage statistics.
 */
export async function getDelegationStatus(delegationId, bridgeUrl) {
    const defaultBridgeUrl = process.env.OTTOCHAIN_BRIDGE_URL || 'https://bridge.ottochain.ai';
    const url = bridgeUrl || defaultBridgeUrl;
    try {
        const response = await fetch(`${url}/api/delegations/${delegationId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Delegation not found: ${delegationId}`);
            }
            const errorText = await response.text();
            throw new Error(`Failed to query delegation status: ${response.status} ${response.statusText}: ${errorText}`);
        }
        const result = await response.json();
        return {
            active: result.active ?? false,
            revoked: result.revoked ?? false,
            expired: result.expired ?? false,
            usageCount: result.usageCount ?? 0,
            lastUsed: result.lastUsed ? new Date(result.lastUsed) : undefined,
            delegation: result.delegation,
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to query delegation status: ${String(error)}`);
    }
}
/**
 * List active delegations for a principal address
 *
 * Retrieves all active delegations created by a user, useful for
 * delegation management and audit purposes.
 */
export async function listDelegations(principalAddress, options = {}) {
    const defaultBridgeUrl = process.env.OTTOCHAIN_BRIDGE_URL || 'https://bridge.ottochain.ai';
    const url = options.bridgeUrl || defaultBridgeUrl;
    const queryParams = new URLSearchParams();
    if (options.includeExpired)
        queryParams.set('includeExpired', 'true');
    if (options.includeRevoked)
        queryParams.set('includeRevoked', 'true');
    try {
        const response = await fetch(`${url}/api/delegations?principal=${encodeURIComponent(principalAddress)}&${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to list delegations: ${response.status} ${response.statusText}: ${errorText}`);
        }
        const result = await response.json();
        return (result.delegations ?? []).map((item) => ({
            delegation: item.delegation,
            active: item.active ?? false,
            usageCount: item.usageCount ?? 0,
            lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to list delegations: ${String(error)}`);
    }
}
// =============================================================================
// Pattern Helpers
// =============================================================================
/**
 * Create time-based delegation scope
 */
export function timeWindow(start, end) {
    return {
        policyRules: Value.fromJSON({
            and: [
                { ">=": [{ var: "current_time" }, start.toISOString()] },
                { "<=": [{ var: "current_time" }, end.toISOString()] },
            ],
        }),
    };
}
/**
 * Create action filter for delegation scope
 */
export function actionFilter(allowedActions) {
    return {
        allowedOperations: allowedActions,
    };
}
/**
 * Create spending limit for delegation scope
 */
export function amountLimit(maxAmount) {
    return {
        policyRules: Value.fromJSON({
            "<=": [{ var: "transaction.amount" }, maxAmount],
        }),
    };
}
/**
 * Combine multiple scope constraints
 */
export function combineScopes(...scopes) {
    const combined = {
        fiberIds: [],
        allowedOperations: [],
    };
    const policyRules = [];
    for (const scope of scopes) {
        if (scope.fiberIds) {
            combined.fiberIds = [...(combined.fiberIds || []), ...scope.fiberIds];
        }
        if (scope.allowedOperations) {
            combined.allowedOperations = [...(combined.allowedOperations || []), ...scope.allowedOperations];
        }
        if (scope.maxGasPerTx) {
            combined.maxGasPerTx = Math.min(combined.maxGasPerTx || Infinity, scope.maxGasPerTx);
        }
        if (scope.maxTotalGas) {
            combined.maxTotalGas = Math.min(combined.maxTotalGas || Infinity, scope.maxTotalGas);
        }
        if (scope.policyRules) {
            policyRules.push(scope.policyRules.structValue || scope.policyRules);
        }
    }
    // Combine policy rules with AND logic
    if (policyRules.length > 0) {
        combined.policyRules = Value.fromJSON(policyRules.length === 1 ? policyRules[0] : { and: policyRules });
    }
    return combined;
}
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Generate a unique delegation ID
 */
function generateDelegationId(principalAddress, delegateAddress) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${principalAddress.substring(0, 8)}-${delegateAddress.substring(0, 8)}-${timestamp}-${random}`;
}
// Helper functions removed - using Date objects directly since 
// generated TypeScript types handle timestamp conversion automatically
/**
 * Create the signature payload for a delegation
 */
function createDelegationSignaturePayload(delegation) {
    // Create a deterministic representation of the delegation for signing
    // Excludes the signature field itself
    const payload = {
        delegationId: delegation.delegationId,
        principalAddress: delegation.principalAddress,
        delegateAddress: delegation.delegateAddress,
        scope: delegation.scope,
        approach: delegation.approach,
        expiresAt: delegation.expiresAt,
        nonce: delegation.nonce,
    };
    return JSON.stringify(payload, null, 0);
}
/**
 * Create the signature payload for a delegation revocation
 */
function createRevocationSignaturePayload(revocation) {
    // Create a deterministic representation of the revocation for signing
    // Excludes the signature field itself
    const payload = {
        delegationId: revocation.delegationId,
        reason: revocation.reason,
        nonce: revocation.nonce,
        revokedAt: revocation.revokedAt,
    };
    return JSON.stringify(payload, null, 0);
}
