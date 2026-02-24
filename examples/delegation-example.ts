/**
 * @fileoverview Example usage of OttoChain Delegation SDK
 */

import {
  DelegationManager,
  DelegationBuilder,
  RelayerClient,
  DelegationApproach,
  FeePaymentMethod
} from '../src/delegation/index.js';

// Example signing function (replace with your actual signing implementation)
async function signMessage(message: string): Promise<{ signature: string; publicKey: string }> {
  // In a real implementation, this would use a wallet or private key to sign
  console.log('Signing message:', message);
  
  // Placeholder signature
  return {
    signature: `0x${'a'.repeat(128)}`, // 64-byte signature
    publicKey: `0x${'b'.repeat(66)}`    // 33-byte compressed public key
  };
}

async function sessionKeyDelegationExample() {
  console.log('\n=== Session Key Delegation Example ===\n');

  // Initialize delegation manager
  const config = {
    bridgeUrl: 'https://bridge.ottochain.ai',
    defaultGasConfig: {
      gasLimit: 500000,
      paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
    }
  };

  const delegationManager = new DelegationManager(config);

  // 1. Create delegation scope
  const scope = DelegationBuilder.createScope({
    allowedOperations: ['CreateFiber', 'TransitionFiber'],
    fiberIds: ['fiber_123', 'fiber_456'], // Optional: restrict to specific fibers
    maxGasPerTx: 100000,
    maxTotalGas: 1000000
  });

  // 2. Create and sign delegation
  const delegation = await delegationManager.createDelegation({
    principalAddress: '0x1234567890123456789012345678901234567890',
    delegateAddress: '0x0987654321098765432109876543210987654321',
    scope,
    approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }, signMessage);

  console.log('Created delegation:', delegation.delegationId);

  // 3. Submit delegation to bridge
  await delegationManager.submitDelegation(delegation);
  console.log('Delegation submitted to bridge');

  // 4. Generate session key pair
  const sessionKeyPair = DelegationBuilder.generateKeyPair();
  console.log('Generated session key pair');

  // 5. Create and sign session key
  const sessionKey = await delegationManager.createSessionKey({
    delegationId: delegation.delegationId,
    sessionKeyPair,
    sessionExpiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  }, signMessage);

  console.log('Created session key');

  // 6. Submit session key to bridge
  await delegationManager.submitSessionKey(sessionKey);
  console.log('Session key submitted to bridge');

  // 7. Use relayer to submit transactions
  const relayerClient = new RelayerClient(
    config,
    '0x1111111111111111111111111111111111111111',
    delegationManager
  );

  // Example transaction
  const transaction = {
    type: 'CreateFiber',
    fiberId: 'fiber_new_123',
    definition: {
      name: 'Example Fiber',
      description: 'Created via delegation'
    }
  };

  const result = await relayerClient.submitWithSessionKey(
    transaction,
    delegation.delegationId,
    sessionKeyPair.privateKey
  );

  console.log('Transaction submitted via session key:', result);
}

async function signedIntentDelegationExample() {
  console.log('\n=== Signed Intent Delegation Example ===\n');

  const config = {
    bridgeUrl: 'https://bridge.ottochain.ai',
    defaultGasConfig: {
      gasLimit: 500000,
      paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_PRINCIPAL_PAYS
    }
  };

  const delegationManager = new DelegationManager(config);

  // 1. Create delegation scope with JSON Logic policy
  const scope = DelegationBuilder.createScope({
    allowedOperations: ['TransitionFiber'],
    fiberIds: ['market_fiber_789'],
    maxGasPerTx: 50000,
    policyRules: {
      // Example JSON Logic policy: only allow transitions to 'OPEN' state
      'and': [
        { '===': [{ 'var': 'transaction.newState' }, 'OPEN'] },
        { '>=': [{ 'var': 'transaction.timestamp' }, { 'var': 'currentTime' }] }
      ]
    }
  });

  // 2. Create delegation
  const delegation = await delegationManager.createDelegation({
    principalAddress: '0x2222222222222222222222222222222222222222',
    delegateAddress: '0x3333333333333333333333333333333333333333',
    scope,
    approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT
  }, signMessage);

  console.log('Created delegation:', delegation.delegationId);

  // 3. Submit delegation
  await delegationManager.submitDelegation(delegation);

  // 4. Create pre-signed transaction intents
  const marketOpenTransaction = {
    type: 'TransitionFiber',
    fiberId: 'market_fiber_789',
    newState: 'OPEN',
    timestamp: Date.now() + 60000, // 1 minute in future
    payload: {
      openPrice: 100,
      volume: 1000
    }
  };

  const signedIntent = await delegationManager.createSignedIntent({
    delegationId: delegation.delegationId,
    transaction: marketOpenTransaction,
    intentExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    executionConditions: {
      'and': [
        { '>=': [{ 'var': 'currentTime' }, 1640995200] }, // After specific timestamp
        { '<=': [{ 'var': 'marketVolume' }, 5000] }        // Market volume condition
      ]
    }
  }, signMessage);

  console.log('Created signed intent');

  // 5. Submit signed intent
  await delegationManager.submitSignedIntent(signedIntent);

  // 6. Relayer executes the intent when conditions are met
  const relayerClient = new RelayerClient(
    config,
    '0x4444444444444444444444444444444444444444',
    delegationManager
  );

  // Relayer provides proof that conditions are met
  const conditionProof = {
    currentTime: Date.now(),
    marketVolume: 3000
  };

  const result = await relayerClient.submitWithSignedIntent(
    delegation.delegationId,
    signedIntent.intentNonce,
    conditionProof
  );

  console.log('Signed intent executed:', result);
}

async function delegationManagementExample() {
  console.log('\n=== Delegation Management Example ===\n');

  const config = {
    bridgeUrl: 'https://bridge.ottochain.ai'
  };

  const delegationManager = new DelegationManager(config);

  // Create a delegation
  const delegation = await delegationManager.createDelegation({
    principalAddress: '0x5555555555555555555555555555555555555555',
    delegateAddress: '0x6666666666666666666666666666666666666666',
    scope: DelegationBuilder.createScope({
      allowedOperations: ['CreateFiber', 'TransitionFiber']
    }),
    approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
  }, signMessage);

  console.log('Created delegation:', delegation.delegationId);

  // Check delegation status
  let status = await delegationManager.getDelegationStatus(delegation.delegationId);
  console.log('Delegation status:', status);

  // List all active delegations
  const activeDelegations = delegationManager.getActiveDelegations();
  console.log('Active delegations:', activeDelegations.length);

  // Revoke the delegation
  const revocation = await delegationManager.revokeDelegation(
    delegation.delegationId,
    'No longer needed',
    signMessage
  );

  console.log('Delegation revoked:', revocation);

  // Submit revocation to bridge
  await delegationManager.submitRevocation(revocation);
  console.log('Revocation submitted');

  // Check status after revocation
  status = await delegationManager.getDelegationStatus(delegation.delegationId);
  console.log('Status after revocation:', status);

  // Clean up expired delegations
  delegationManager.cleanup();
  console.log('Cleanup completed');
}

async function relayerServiceExample() {
  console.log('\n=== Relayer Service Example ===\n');

  const config = {
    bridgeUrl: 'https://bridge.ottochain.ai',
    defaultGasConfig: {
      gasLimit: 500000,
      gasPrice: 20000000000, // 20 gwei
      paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
    }
  };

  const relayerClient = new RelayerClient(
    config,
    '0x7777777777777777777777777777777777777777'
  );

  const delegationId = 'del_example_123';

  // Get available transactions to relay
  const relayableTransactions = await relayerClient.getRelayableTransactions(delegationId);
  console.log('Relayable transactions:', relayableTransactions.length);

  for (const tx of relayableTransactions) {
    try {
      // Estimate gas for the transaction
      const gasEstimate = await relayerClient.estimateGas(tx.transaction, delegationId);
      console.log('Gas estimate:', gasEstimate);

      // Check if conditions are met (if any)
      if (tx.executionConditions) {
        // In a real implementation, you'd evaluate the conditions
        console.log('Checking execution conditions...');
      }

      // Submit the transaction
      const result = await relayerClient.submitWithSignedIntent(
        delegationId,
        tx.intentNonce
      );

      console.log('Transaction relayed successfully:', result.transactionHash);
    } catch (error) {
      console.error('Failed to relay transaction:', error.message);
    }
  }
}

// Example usage
async function main() {
  try {
    await sessionKeyDelegationExample();
    await signedIntentDelegationExample();
    await delegationManagementExample();
    await relayerServiceExample();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}