/**
 * Delegation Pattern Examples
 * 
 * Common delegation use cases for OttoChain applications
 */

import {
  createDelegation,
  signDelegation,
  isDelegationValid,
  submitDelegated,
  getDelegationStatus,
  listDelegations,
  revokeDelegation,
  signRevocation,
  submitRevocation,
  timeWindow,
  actionFilter,
  amountLimit,
  combineScopes,
  DelegationApproach,
  FeePaymentMethod,
} from '../src/index.js';

// Example 1: Trading Bot Delegation
// Allow a trading bot to execute buy/sell orders within limits
async function createTradingBotDelegation() {
  console.log('=== Trading Bot Delegation Example ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const botAddress = 'DAG456...bot';
  
  // Create delegation with trading restrictions
  const delegation = createDelegation({
    principalAddress: userAddress,
    delegateAddress: botAddress,
    scope: combineScopes(
      actionFilter(['CreateMarketOrder', 'CancelOrder']),
      amountLimit(1000), // Max $1000 per transaction
      timeWindow(new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
    ),
    approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    metadata: {
      purpose: 'automated-trading',
      maxDailyVolume: 10000,
    },
  });
  
  // Sign the delegation
  const signedDelegation = await signDelegation(delegation, userPrivateKey);
  
  // Validate before use
  const validation = isDelegationValid(signedDelegation);
  if (!validation.valid) {
    console.error('Delegation validation failed:', validation.errors);
    return;
  }
  
  console.log('Trading bot delegation created:', {
    id: signedDelegation.delegationId,
    expires: signedDelegation.expiresAt,
    scope: signedDelegation.scope,
  });
}

// Example 2: Mobile App Session Key
// Create session key for mobile app with limited permissions
async function createMobileAppSession() {
  console.log('=== Mobile App Session Example ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const appAddress = 'DAG789...app';
  
  // Create delegation for mobile app usage
  const delegation = createDelegation({
    principalAddress: userAddress,
    delegateAddress: appAddress,
    scope: combineScopes(
      // Allow identity updates and basic transfers
      actionFilter(['UpdateProfile', 'TransferTokens', 'CreateAttestation']),
      amountLimit(100), // Max $100 per transaction
      timeWindow(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    ),
    approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    metadata: {
      device: 'mobile-app',
      version: '1.2.0',
    },
  });
  
  const signedDelegation = await signDelegation(delegation, userPrivateKey);
  
  console.log('Mobile session delegation created:', {
    id: signedDelegation.delegationId,
    validFor: '7 days',
    maxAmount: '$100 per transaction',
  });
}

// Example 3: Recurring Payment Authorization
// Pre-authorize specific recurring payments using signed intents
async function createRecurringPaymentAuth() {
  console.log('=== Recurring Payment Authorization ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const serviceAddress = 'DAG999...service';
  
  // Create delegation for subscription service
  const delegation = createDelegation({
    principalAddress: userAddress,
    delegateAddress: serviceAddress,
    scope: combineScopes(
      actionFilter(['TransferTokens']),
      amountLimit(50), // Max $50 per payment
      {
        // Only allow payments to specific recipient
        fiberIds: ['subscription-fiber-123'],
        policyRules: {
          structValue: {
            and: [
              { '==': [{ var: 'transaction.recipient' }, serviceAddress] },
              { '==': [{ var: 'transaction.amount' }, 50] }, // Exact amount
              // Allow only once per month
              { '>=': [
                { '-': [{ var: 'current_time' }, { var: 'last_payment_time' }] },
                2592000 // 30 days in seconds
              ]},
            ],
          },
        },
      }
    ),
    approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    metadata: {
      paymentType: 'subscription',
      service: 'premium-features',
    },
  });
  
  const signedDelegation = await signDelegation(delegation, userPrivateKey);
  
  console.log('Recurring payment delegation created:', {
    id: signedDelegation.delegationId,
    amount: '$50/month',
    validFor: '1 year',
    recipient: serviceAddress,
  });
}

// Example 4: Emergency Recovery Delegation
// Limited delegation for account recovery scenarios
async function createEmergencyRecoveryAuth() {
  console.log('=== Emergency Recovery Authorization ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const recoveryAddress = 'DAG777...recovery';
  
  const delegation = createDelegation({
    principalAddress: userAddress,
    delegateAddress: recoveryAddress,
    scope: combineScopes(
      // Only allow account recovery operations
      actionFilter(['UpdateRecoveryKey', 'TransferTokens']),
      amountLimit(10000), // Higher limit for emergency
      {
        // Additional security: require time delay
        policyRules: {
          structValue: {
            and: [
              // Must be at least 48 hours after delegation creation
              { '>=': [
                { '-': [{ var: 'current_time' }, { var: 'delegation_created_time' }] },
                172800 // 48 hours
              ]},
              // Require additional authorization proof
              { '!=': [{ var: 'emergency_proof' }, null] },
            ],
          },
        },
      }
    ),
    approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    metadata: {
      purpose: 'emergency-recovery',
      requiresDelay: true,
    },
  });
  
  const signedDelegation = await signDelegation(delegation, userPrivateKey);
  
  console.log('Emergency recovery delegation created:', {
    id: signedDelegation.delegationId,
    delayRequired: '48 hours',
    validFor: '90 days',
  });
}

// Example 5: Multi-Service Gaming Delegation
// Allow game services to perform multiple types of operations
async function createGamingDelegation() {
  console.log('=== Gaming Service Delegation ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const gameAddress = 'DAG555...game';
  
  const delegation = createDelegation({
    principalAddress: userAddress,
    delegateAddress: gameAddress,
    scope: combineScopes(
      // Allow various game operations
      actionFilter([
        'TransferTokens',      // In-game purchases
        'CreateAsset',         // NFT minting
        'UpdateMetadata',      // Character updates
        'CreateAttestation',   // Achievement proofs
      ]),
      amountLimit(200), // Max $200 per transaction
      {
        // Game-specific fiber operations
        fiberIds: ['game-assets-fiber', 'achievements-fiber'],
        // Game session time limits
        policyRules: {
          structValue: {
            and: [
              // Only during reasonable gaming hours
              { '>=': [{ var: 'hour_of_day' }, 8] },
              { '<=': [{ var: 'hour_of_day' }, 23] },
              // Rate limiting: max 10 transactions per hour
              { '<=': [{ var: 'hourly_transaction_count' }, 10] },
            ],
          },
        },
      }
    ),
    approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    metadata: {
      gameId: 'ottochain-rpg',
      playerLevel: 15,
      region: 'us-east',
    },
  });
  
  const signedDelegation = await signDelegation(delegation, userPrivateKey);
  
  console.log('Gaming delegation created:', {
    id: signedDelegation.delegationId,
    operations: 4,
    rateLimit: '10 tx/hour',
    validFor: '30 days',
  });
}

// Example 6: Complete Delegation Lifecycle with Bridge Integration
// Demonstrates creating, using, monitoring, and revoking delegations
async function demonstrateDelegationLifecycle() {
  console.log('=== Complete Delegation Lifecycle ===');
  
  const userPrivateKey = 'your-private-key-here';
  const userAddress = 'DAG123...user';
  const relayerAddress = 'DAG888...relayer';
  const bridgeUrl = 'https://bridge.ottochain.ai'; // or process.env.OTTOCHAIN_BRIDGE_URL
  
  try {
    // 1. Create and sign delegation
    const delegation = createDelegation({
      principalAddress: userAddress,
      delegateAddress: relayerAddress,
      scope: combineScopes(
        actionFilter(['TransferTokens', 'UpdateProfile']),
        amountLimit(250),
        timeWindow(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      ),
      approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        purpose: 'lifecycle-demo',
        createdBy: 'sdk-example',
      },
    });

    const signedDelegation = await signDelegation(delegation, userPrivateKey);
    console.log('✓ Delegation created and signed:', signedDelegation.delegationId);

    // 2. Submit a delegated transaction
    const transaction = {
      type: 'TransferTokens',
      recipient: 'DAG999...recipient',
      amount: 50,
      memo: 'Delegated payment via SDK',
    };

    try {
      const result = await submitDelegated(transaction, signedDelegation, bridgeUrl);
      console.log('✓ Delegated transaction submitted:', result.txId);
    } catch (error) {
      console.log('⚠ Bridge not available for transaction submission:', error.message);
    }

    // 3. Check delegation status
    try {
      const status = await getDelegationStatus(signedDelegation.delegationId, bridgeUrl);
      console.log('✓ Delegation status:', {
        active: status.active,
        revoked: status.revoked,
        expired: status.expired,
        usageCount: status.usageCount,
      });
    } catch (error) {
      console.log('⚠ Bridge not available for status check:', error.message);
    }

    // 4. List all delegations for user
    try {
      const delegations = await listDelegations(userAddress, { bridgeUrl });
      console.log('✓ Active delegations count:', delegations.length);
    } catch (error) {
      console.log('⚠ Bridge not available for delegation listing:', error.message);
    }

    // 5. Revoke the delegation
    const revocation = revokeDelegation(
      signedDelegation.delegationId,
      'Example lifecycle complete'
    );
    const signedRevocation = await signRevocation(revocation, userPrivateKey);

    try {
      const revocationResult = await submitRevocation(signedRevocation, bridgeUrl);
      console.log('✓ Delegation revoked:', revocationResult.message);
    } catch (error) {
      console.log('⚠ Bridge not available for revocation:', error.message);
    }

    // 6. Verify revocation status
    try {
      const finalStatus = await getDelegationStatus(signedDelegation.delegationId, bridgeUrl);
      console.log('✓ Final delegation status:', {
        revoked: finalStatus.revoked,
        active: finalStatus.active,
      });
    } catch (error) {
      console.log('⚠ Bridge not available for final status check:', error.message);
    }

  } catch (error) {
    console.error('Lifecycle demonstration error:', error);
  }
}

// Run examples
async function main() {
  try {
    await createTradingBotDelegation();
    console.log();
    await createMobileAppSession();
    console.log();
    await createRecurringPaymentAuth();
    console.log();
    await createEmergencyRecoveryAuth();
    console.log();
    await createGamingDelegation();
    console.log();
    await demonstrateDelegationLifecycle();
  } catch (error) {
    console.error('Example error:', error);
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main();
}