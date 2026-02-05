/**
 * Batch Transactions Example
 *
 * Demonstrates how to batch sign multiple transactions efficiently.
 * Useful for multi-signature scenarios or bulk operations.
 *
 * @example
 * ```bash
 * npx ts-node examples/batch-transactions.ts
 * ```
 */

import {
  generateKeyPair,
  batchSign,
  addSignature,
  createSignedObject,
  verify,
  KeyPair,
  Signed,
} from '../src/index.js';

/**
 * Example 1: Multi-party signing
 *
 * Multiple parties sign the same document
 */
async function multiPartySigningExample() {
  console.log('📝 Example 1: Multi-Party Signing\n');

  // Generate keypairs for three parties
  const party1 = generateKeyPair();
  const party2 = generateKeyPair();
  const party3 = generateKeyPair();

  console.log('  Parties:');
  console.log(`    Party 1: ${party1.address.slice(0, 20)}...`);
  console.log(`    Party 2: ${party2.address.slice(0, 20)}...`);
  console.log(`    Party 3: ${party3.address.slice(0, 20)}...`);

  // Document to sign
  const document = {
    type: 'MultiSigAgreement',
    terms: 'All parties agree to the terms of service',
    timestamp: new Date().toISOString(),
    requiredSignatures: 3,
  };

  // Method 1: Batch sign all at once (when you have all keys)
  console.log('\n  Method 1: Batch signing with all keys...');
  const batchSigned = await batchSign(document, [party1.privateKey, party2.privateKey, party3.privateKey]);
  console.log(`    ✅ Document signed by ${batchSigned.proofs.length} parties`);

  // Method 2: Sequential signing (when keys are distributed)
  console.log('\n  Method 2: Sequential signing...');
  let signed = await createSignedObject(document, party1.privateKey);
  console.log(`    ✅ Party 1 signed (${signed.proofs.length} signature)`);

  signed = await addSignature(signed, party2.privateKey);
  console.log(`    ✅ Party 2 signed (${signed.proofs.length} signatures)`);

  signed = await addSignature(signed, party3.privateKey);
  console.log(`    ✅ Party 3 signed (${signed.proofs.length} signatures)`);

  // Verify all signatures
  console.log('\n  Verifying signatures...');
  const verificationResult = await verify(signed);
  console.log(`    ✅ All signatures valid: ${verificationResult.isValid}`);
  console.log(`    ✅ Valid proofs: ${verificationResult.validProofs.length}`);

  return signed;
}

/**
 * Example 2: Batch processing
 *
 * Sign multiple different transactions efficiently
 */
async function batchProcessingExample() {
  console.log('\n📝 Example 2: Batch Processing Multiple Transactions\n');

  const signer = generateKeyPair();
  console.log(`  Signer: ${signer.address.slice(0, 20)}...`);

  // Multiple transactions to sign
  const transactions = [
    { action: 'Transfer', to: 'DAG0...', amount: 100 },
    { action: 'Transfer', to: 'DAG1...', amount: 200 },
    { action: 'Transfer', to: 'DAG2...', amount: 300 },
    { action: 'Stake', amount: 1000 },
    { action: 'Vote', proposalId: 'prop-123', vote: 'yes' },
  ];

  console.log(`\n  Signing ${transactions.length} transactions...`);

  // Sign all transactions in parallel
  const startTime = Date.now();
  const signedTransactions = await Promise.all(
    transactions.map((tx) => createSignedObject(tx, signer.privateKey))
  );
  const elapsed = Date.now() - startTime;

  console.log(`    ✅ Signed ${signedTransactions.length} transactions in ${elapsed}ms`);

  // Show results
  console.log('\n  Signed transactions:');
  signedTransactions.forEach((signed, i) => {
    const action = (signed.value as { action: string }).action;
    const sigPrefix = signed.proofs[0].signature.slice(0, 16);
    console.log(`    ${i + 1}. ${action}: sig=${sigPrefix}...`);
  });

  return signedTransactions;
}

/**
 * Example 3: Threshold signing simulation
 *
 * Simulate a 2-of-3 multi-sig requirement
 */
async function thresholdSigningExample() {
  console.log('\n📝 Example 3: Threshold Signing (2-of-3)\n');

  // Generate 3 keypairs
  const signers = [generateKeyPair(), generateKeyPair(), generateKeyPair()];

  console.log('  Signers (need 2 of 3):');
  signers.forEach((s, i) => console.log(`    Signer ${i + 1}: ${s.address.slice(0, 20)}...`));

  const transaction = {
    type: 'HighValueTransfer',
    amount: 1000000,
    to: 'DAG9...',
    requiredApprovals: 2,
  };

  // Only 2 signers approve
  console.log('\n  Collecting signatures...');
  let signed = await createSignedObject(transaction, signers[0].privateKey);
  console.log('    ✅ Signer 1 approved');

  // Signer 2 skips
  console.log('    ⏭️  Signer 2 unavailable');

  signed = await addSignature(signed, signers[2].privateKey);
  console.log('    ✅ Signer 3 approved');

  // Check if threshold met
  const threshold = 2;
  const hasEnoughSignatures = signed.proofs.length >= threshold;

  console.log(`\n  Threshold check:`);
  console.log(`    Required: ${threshold} signatures`);
  console.log(`    Collected: ${signed.proofs.length} signatures`);
  console.log(`    Status: ${hasEnoughSignatures ? '✅ APPROVED' : '❌ PENDING'}`);

  return signed;
}

/**
 * Run all examples
 */
async function main() {
  console.log('🚀 Batch Transactions Examples\n');
  console.log('═'.repeat(50) + '\n');

  await multiPartySigningExample();
  await batchProcessingExample();
  await thresholdSigningExample();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ All examples completed successfully!');
}

main().catch(console.error);
