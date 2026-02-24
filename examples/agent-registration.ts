/**
 * Agent Registration Example
 *
 * Demonstrates how to register an agent identity on the OttoChain network.
 *
 * @example
 * ```bash
 * npx ts-node examples/agent-registration.ts
 * ```
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
  AgentIdentityRegistrationSchema,
  validate,
  ValidationError,
} from '../src/index.js';

// Configuration
const METAGRAPH_DATA_L1_URL = process.env.METAGRAPH_URL || 'http://localhost:9300';

/**
 * Register a new agent identity
 */
async function registerAgent() {
  console.log('🚀 Agent Registration Example\n');

  // Step 1: Generate a new keypair for the agent
  console.log('Step 1: Generating new keypair...');
  const keyPair = generateKeyPair();
  console.log(`  ✅ Address: ${keyPair.address}`);
  console.log(`  ✅ Public Key: ${keyPair.publicKey.slice(0, 20)}...`);

  // Step 2: Create the registration payload
  console.log('\nStep 2: Creating registration payload...');
  const registrationData = {
    publicKey: keyPair.publicKey,
    displayName: 'My AI Agent',
    reputation: 10,
  };

  // Validate the registration data
  try {
    validate(AgentIdentityRegistrationSchema, registrationData, 'registration');
    console.log('  ✅ Payload validated successfully');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`  ❌ Validation failed: ${error.message}`);
      console.error(`  Field: ${error.field}`);
      return;
    }
    throw error;
  }

  // Step 3: Sign the registration
  console.log('\nStep 3: Signing registration...');
  const signedRegistration = await createSignedObject(
    {
      action: 'RegisterAgent',
      data: registrationData,
    },
    keyPair.privateKey,
    { isDataUpdate: true }
  );
  console.log(`  ✅ Signed with ${signedRegistration.proofs.length} proof(s)`);
  console.log(`  ✅ Signer ID: ${signedRegistration.proofs[0].id.slice(0, 20)}...`);

  // Step 4: Submit to the network (optional - requires running metagraph)
  console.log('\nStep 4: Submitting to network...');
  const client = new DataL1Client(METAGRAPH_DATA_L1_URL);

  try {
    const response = await client.postData(signedRegistration);
    console.log(`  ✅ Submitted! Hash: ${response.hash}`);
  } catch (error) {
    console.log(`  ⚠️ Network unavailable (expected in demo): ${(error as Error).message}`);
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log('─'.repeat(50));
  console.log(`Agent Address:    ${keyPair.address}`);
  console.log(`Display Name:     ${registrationData.displayName}`);
  console.log(`Initial Rep:      ${registrationData.reputation}`);
  console.log('─'.repeat(50));

  // Important: In production, securely store the private key!
  console.log('\n⚠️  IMPORTANT: Save your private key securely!');
  console.log(`   Private Key: ${keyPair.privateKey}`);
}

// Run the example
registerAgent().catch(console.error);
