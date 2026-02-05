/**
 * Contract Flow Example
 *
 * Demonstrates the complete lifecycle of a contract:
 * 1. Propose a contract
 * 2. Accept the contract
 * 3. Complete the contract
 *
 * @example
 * ```bash
 * npx ts-node examples/contract-flow.ts
 * ```
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
  ProposeContractRequestSchema,
  AcceptContractRequestSchema,
  CompleteContractRequestSchema,
  validate,
  ValidationError,
  KeyPair,
} from '../src/index.js';

// Configuration
const METAGRAPH_DATA_L1_URL = process.env.METAGRAPH_URL || 'http://localhost:9300';

/**
 * Simulate contract proposal
 */
async function proposeContract(proposer: KeyPair, counterpartyAddress: string) {
  console.log('📝 Step 1: Proposing Contract\n');

  const proposeRequest = {
    proposer: proposer.address,
    counterparty: counterpartyAddress,
    terms: {
      deliverable: 'Code review for PR #123',
      deadline: '2024-12-31',
      compensation: {
        amount: 100,
        currency: 'DAG',
      },
    },
    description: 'Code review services for the new API module',
  };

  // Validate request
  try {
    validate(ProposeContractRequestSchema, proposeRequest, 'proposeRequest');
    console.log('  ✅ Proposal validated');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`  ❌ Validation failed: ${error.message}`);
      throw error;
    }
    throw error;
  }

  // Sign the proposal
  const signedProposal = await createSignedObject(
    {
      action: 'ProposeContract',
      data: proposeRequest,
    },
    proposer.privateKey,
    { isDataUpdate: true }
  );

  console.log(`  ✅ Proposal signed by: ${proposer.address.slice(0, 15)}...`);
  console.log(`  📄 Terms: ${proposeRequest.description}`);

  // In production, submit to network here
  // For demo, we'll generate a mock contract ID
  const contractId = `contract-${Date.now()}`;
  console.log(`  🆔 Contract ID: ${contractId}\n`);

  return { contractId, signedProposal };
}

/**
 * Simulate contract acceptance
 */
async function acceptContract(acceptor: KeyPair, contractId: string) {
  console.log('✅ Step 2: Accepting Contract\n');

  const acceptRequest = {
    contractId,
    acceptor: acceptor.address,
  };

  // Validate request
  validate(AcceptContractRequestSchema, acceptRequest, 'acceptRequest');
  console.log('  ✅ Accept request validated');

  // Sign the acceptance
  const signedAcceptance = await createSignedObject(
    {
      action: 'AcceptContract',
      data: acceptRequest,
    },
    acceptor.privateKey,
    { isDataUpdate: true }
  );

  console.log(`  ✅ Accepted by: ${acceptor.address.slice(0, 15)}...`);
  console.log(`  📋 Contract ${contractId} is now ACTIVE\n`);

  return signedAcceptance;
}

/**
 * Simulate contract completion
 */
async function completeContract(completer: KeyPair, contractId: string) {
  console.log('🎉 Step 3: Completing Contract\n');

  const completeRequest = {
    contractId,
    completer: completer.address,
    proof: 'https://github.com/org/repo/pull/123#issuecomment-reviewed',
  };

  // Validate request
  validate(CompleteContractRequestSchema, completeRequest, 'completeRequest');
  console.log('  ✅ Completion request validated');

  // Sign the completion
  const signedCompletion = await createSignedObject(
    {
      action: 'CompleteContract',
      data: completeRequest,
    },
    completer.privateKey,
    { isDataUpdate: true }
  );

  console.log(`  ✅ Completed by: ${completer.address.slice(0, 15)}...`);
  console.log(`  📋 Proof: ${completeRequest.proof}`);
  console.log(`  🏁 Contract ${contractId} is now COMPLETED\n`);

  return signedCompletion;
}

/**
 * Run the full contract flow
 */
async function runContractFlow() {
  console.log('🚀 Contract Flow Example\n');
  console.log('═'.repeat(50) + '\n');

  // Generate keypairs for both parties
  console.log('Setting up test accounts...');
  const proposer = generateKeyPair();
  const counterparty = generateKeyPair();
  console.log(`  👤 Proposer:     ${proposer.address.slice(0, 20)}...`);
  console.log(`  👤 Counterparty: ${counterparty.address.slice(0, 20)}...`);
  console.log('');

  // Run the flow
  const { contractId } = await proposeContract(proposer, counterparty.address);
  await acceptContract(counterparty, contractId);
  await completeContract(counterparty, contractId);

  // Summary
  console.log('═'.repeat(50));
  console.log('📋 Contract Flow Summary');
  console.log('═'.repeat(50));
  console.log(`  Contract ID:   ${contractId}`);
  console.log(`  Proposer:      ${proposer.address.slice(0, 25)}...`);
  console.log(`  Counterparty:  ${counterparty.address.slice(0, 25)}...`);
  console.log(`  Final State:   COMPLETED`);
  console.log('═'.repeat(50));

  // Network submission note
  console.log('\n💡 To submit to a real network, set METAGRAPH_URL:');
  console.log(`   METAGRAPH_URL=http://your-node:9300 npx ts-node ${__filename}`);
}

// Run the example
runContractFlow().catch(console.error);
