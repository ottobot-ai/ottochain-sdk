/**
 * OttoChain SDK Delegation Examples
 *
 * Comprehensive examples demonstrating the complete delegation workflow
 * from session key creation to intent execution.
 */
import { DelegationClient, DelegationHelpers, DELEGATION_CONSTANTS, DelegationError, } from '../delegation/index.js';
import { IntentStatus } from '../generated/ottochain/apps/delegation/v1/intents.js';
// Mock addresses and keys for examples
const USER_ADDRESS = 'dag_user123_example_address_for_demonstration';
const AGENT_ADDRESS = 'dag_agent456_example_address_for_delegation';
const BRIDGE_URL = 'https://bridge.ottochain.xyz';
/**
 * Example 1: Basic Session Key Creation
 */
export async function createBasicSessionKey() {
    console.log('=== Example 1: Creating Basic Session Key ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
        enableValidation: true,
        enableRevocationMonitoring: true,
    });
    try {
        // Create a simple transfer scope
        const scope = DelegationHelpers.createTransferScope('100.0', // Max per transaction: 100 DAG
        '500.0' // Max total: 500 DAG
        );
        console.log('Delegation scope:', JSON.stringify(scope, null, 2));
        // Create session key delegation
        const response = await client.createSessionKey(USER_ADDRESS, {
            delegateAddress: AGENT_ADDRESS,
            scope,
            expiryHours: 2, // Expires in 2 hours
            autoRevoke: true, // Enable revocation monitoring
        }, 'user_signature_placeholder', 1 // nonce
        );
        if (response.success) {
            console.log('✅ Session key created successfully!');
            console.log('Delegation ID:', response.delegationId);
            console.log('Session Key ID:', response.sessionKey?.sessionKeyId);
            console.log('Public Key:', response.sessionKey?.publicKey);
            console.log('Expires At:', response.sessionKey?.expiresAt);
        }
        else {
            console.log('❌ Failed to create session key:', response.errorMessage);
        }
    }
    catch (error) {
        console.error('Error creating session key:', error);
    }
    console.log('\n');
}
/**
 * Example 2: Market Operations Delegation
 */
export async function createMarketOperationsDelegation() {
    console.log('=== Example 2: Market Operations Delegation ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
        enableValidation: true,
    });
    try {
        // Create a market operations scope with reputation requirement
        const scope = DelegationHelpers.createMarketScope('50.0', // Max per transaction: 50 DAG
        '200.0', // Max total: 200 DAG
        75 // Minimum reputation score: 75
        );
        console.log('Market operations scope:', JSON.stringify(scope, null, 2));
        const response = await client.createSessionKey(USER_ADDRESS, {
            delegateAddress: AGENT_ADDRESS,
            scope,
            expiryHours: 24, // Full day delegation
        }, 'user_signature_for_market_ops', 2 // nonce
        );
        if (response.success) {
            console.log('✅ Market operations delegation created!');
            // Check delegation status
            const status = await client.checkDelegationStatus(response.delegationId);
            console.log('Delegation valid:', status.isValid);
            console.log('Time remaining:', status.timeRemaining, 'seconds');
            if (status.errors) {
                console.log('Validation errors:', status.errors);
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    console.log('\n');
}
/**
 * Example 3: Intent Creation and Signing
 */
export async function createAndSignIntent() {
    console.log('=== Example 3: Intent Creation and Signing ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
        enableValidation: true,
    });
    try {
        // First create a delegation (reuse from previous example)
        const scope = DelegationHelpers.createTransferScope('25.0', '100.0');
        const delegationResponse = await client.createSessionKey(USER_ADDRESS, {
            delegateAddress: AGENT_ADDRESS,
            scope,
            expiryHours: 1,
        }, 'user_signature_for_intent', 3 // nonce
        );
        if (!delegationResponse.success) {
            throw new Error('Failed to create delegation');
        }
        const delegationId = delegationResponse.delegationId;
        console.log('✅ Delegation created:', delegationId);
        // Create an intent for a transfer operation
        const intent = {
            intentId: `intent_${Date.now()}`,
            delegationId,
            userAddress: USER_ADDRESS,
            description: 'Transfer 20 DAG to recipient with market condition check',
            validationRules: {
                // JSON Logic rule: only execute if DAG price is above $0.50
                typeUrl: 'type.googleapis.com/google.protobuf.Value',
                value: new Uint8Array(), // Would contain serialized JSON Logic
            },
            executionConditions: [{
                    conditionType: 'market_price',
                    conditionLogic: {
                        typeUrl: 'type.googleapis.com/google.protobuf.Value',
                        value: new Uint8Array(), // JSON Logic: DAG price > 0.50
                    },
                    description: 'DAG price must be above $0.50',
                    isMet: false,
                    lastEvaluated: new Date(),
                }],
            maxValueThreshold: '25.0',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            intentNonce: 1,
            userSignature: '', // Will be filled by signIntent
            status: IntentStatus.INTENT_STATUS_PENDING,
        };
        console.log('Intent to sign:', JSON.stringify({
            intentId: intent.intentId,
            description: intent.description,
            maxValueThreshold: intent.maxValueThreshold,
        }, null, 2));
        // Sign the intent with session key
        const intentResponse = await client.signIntent(USER_ADDRESS, {
            delegationId,
            intent,
            validateBeforeSign: true,
        }, 'session_key_private_key_placeholder');
        if (intentResponse.success) {
            console.log('✅ Intent signed and created successfully!');
            console.log('Intent ID:', intentResponse.intentId);
        }
        else {
            console.log('❌ Failed to sign intent:', intentResponse.errorMessage);
        }
    }
    catch (error) {
        console.error('Error in intent workflow:', error);
    }
    console.log('\n');
}
/**
 * Example 4: Delegation Management and Monitoring
 */
export async function manageDelegations() {
    console.log('=== Example 4: Delegation Management ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
        enableRevocationMonitoring: true,
    });
    try {
        // Get all active delegations for user
        const activeDelegations = await client.getActiveDelegations(USER_ADDRESS);
        console.log(`Found ${activeDelegations.length} active delegations:`);
        for (const delegation of activeDelegations) {
            console.log(`- ${delegation.delegationId}`);
            console.log(`  Delegate: ${delegation.delegateAddress}`);
            console.log(`  Expires: ${delegation.expiresAt}`);
            console.log(`  Operations: ${delegation.scope?.allowedOperations.join(', ')}`);
            // Check detailed status
            const status = await client.checkDelegationStatus(delegation.delegationId);
            console.log(`  Status: ${status.isValid ? '✅ Valid' : '❌ Invalid'}`);
            if (status.timeRemaining) {
                const hours = Math.floor(status.timeRemaining / 3600);
                const minutes = Math.floor((status.timeRemaining % 3600) / 60);
                console.log(`  Time remaining: ${hours}h ${minutes}m`);
            }
        }
        // Example: Revoke a specific delegation
        if (activeDelegations.length > 0) {
            const toRevoke = activeDelegations[0];
            console.log(`\nRevoking delegation ${toRevoke.delegationId}...`);
            const revocationResponse = await client.revokeDelegation(toRevoke.delegationId, USER_ADDRESS, 'Testing revocation in example', 'revocation_signature_placeholder', 10 // nonce
            );
            if (revocationResponse.success) {
                console.log('✅ Delegation revoked successfully');
            }
            else {
                console.log('❌ Revocation failed:', revocationResponse.errorMessage);
            }
        }
    }
    catch (error) {
        console.error('Error managing delegations:', error);
    }
    console.log('\n');
}
/**
 * Example 5: Advanced Delegation Scopes
 */
export async function advancedDelegationScopes() {
    console.log('=== Example 5: Advanced Delegation Scopes ===\n');
    try {
        // Custom scope for multi-operation delegation
        const customScope = {
            allowedOperations: [
                DELEGATION_CONSTANTS.OPERATIONS.TRANSFER,
                DELEGATION_CONSTANTS.OPERATIONS.PLACE_BET,
                DELEGATION_CONSTANTS.OPERATIONS.CLAIM_WINNINGS,
            ],
            allowedContracts: [
                'dag_market_contract_abc123',
                'dag_prediction_contract_def456',
            ],
            maxTransactionAmount: '75.0',
            maxTotalAmount: '300.0',
            minReputationScore: 80,
        };
        // Validate the scope
        const validation = DelegationHelpers.validateScope(customScope);
        console.log('Scope validation result:', validation);
        if (validation.isValid) {
            console.log('✅ Custom scope is valid');
            console.log('Scope details:', JSON.stringify(customScope, null, 2));
        }
        else {
            console.log('❌ Scope validation failed:');
            validation.errors.forEach(error => console.log(`  - ${error}`));
        }
        // Compare different scope types
        console.log('\n--- Scope Comparison ---');
        const transferScope = DelegationHelpers.createTransferScope('100', '500');
        const marketScope = DelegationHelpers.createMarketScope('50', '200', 70);
        const governanceScope = DelegationHelpers.createGovernanceScope(85);
        console.log('Transfer scope operations:', transferScope.allowedOperations);
        console.log('Market scope operations:', marketScope.allowedOperations);
        console.log('Governance scope operations:', governanceScope.allowedOperations);
    }
    catch (error) {
        console.error('Error with advanced scopes:', error);
    }
    console.log('\n');
}
/**
 * Example 6: Error Handling and Recovery
 */
export async function errorHandlingExample() {
    console.log('=== Example 6: Error Handling ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
        timeout: 5000, // Short timeout for testing
        retries: 2,
    });
    try {
        // Example of handling delegation errors
        const invalidScope = {
            allowedOperations: [], // Invalid: empty operations
            allowedContracts: [],
            maxTransactionAmount: '1000',
            maxTotalAmount: '100', // Invalid: max transaction > max total
        };
        const validation = DelegationHelpers.validateScope(invalidScope);
        console.log('Invalid scope validation:', validation);
        // Try to create delegation with invalid scope
        if (!validation.isValid) {
            console.log('❌ Scope validation errors:');
            validation.errors.forEach(error => console.log(`  - ${error}`));
            // Throw custom delegation error
            throw new DelegationError('Invalid delegation scope', 'SCOPE_VIOLATION', { scope: invalidScope, errors: validation.errors });
        }
    }
    catch (error) {
        if (error instanceof DelegationError) {
            console.log(`Delegation error [${error.code}]: ${error.message}`);
            console.log('Error details:', error.details);
        }
        else {
            console.error('Unexpected error:', error);
        }
    }
    // Example of timeout handling
    try {
        console.log('\nTesting timeout handling...');
        // This would timeout with current short timeout setting
        await client.getDelegations({ limit: 10, offset: 0 });
    }
    catch (error) {
        console.log('Expected timeout or network error:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('\n');
}
/**
 * Example 7: Batch Operations
 */
export async function batchOperationsExample() {
    console.log('=== Example 7: Batch Operations ===\n');
    const client = new DelegationClient({
        bridgeUrl: BRIDGE_URL,
    });
    try {
        // Simulate multiple active delegations
        const delegationIds = [
            'del_1234567890_example1',
            'del_1234567890_example2',
            'del_1234567890_example3',
        ];
        console.log('Batch revoking delegations:', delegationIds);
        const batchResults = await client.batchRevokeDelegations(delegationIds, USER_ADDRESS, 'Batch revocation test', 'batch_revocation_signature', 20 // starting nonce
        );
        console.log('Batch revocation results:');
        batchResults.forEach((result, index) => {
            const delegationId = delegationIds[index];
            if (result.success) {
                console.log(`  ✅ ${delegationId}: Revoked successfully`);
            }
            else {
                console.log(`  ❌ ${delegationId}: ${result.errorMessage}`);
            }
        });
    }
    catch (error) {
        console.error('Batch operation error:', error);
    }
    console.log('\n');
}
/**
 * Run all examples
 */
export async function runAllDelegationExamples() {
    console.log('🚀 OttoChain SDK Delegation Examples\n');
    console.log('Note: These examples use placeholder values and mock data.');
    console.log('In a real application, you would use actual addresses, signatures, and a running bridge service.\n');
    // Run examples in sequence
    await createBasicSessionKey();
    await createMarketOperationsDelegation();
    await createAndSignIntent();
    await manageDelegations();
    await advancedDelegationScopes();
    await errorHandlingExample();
    await batchOperationsExample();
    console.log('✨ All examples completed!');
}
// If running directly
if (require.main === module) {
    runAllDelegationExamples().catch(console.error);
}
