/**
 * Signing Modes Example
 *
 * Demonstrates both server-signed and self-signed registration flows
 * for the OttoChain bridge agent API.
 */

import {
  generateKeyPair,
  getPublicKeyId,
  createTransitionPayload,
  signTransaction,
  HttpClient,
  MetagraphClient,
} from '@ottochain/sdk';

// Bridge URL - adjust for your environment
const BRIDGE_URL = process.env.BRIDGE_URL ?? 'http://localhost:3030';
const DL1_URLS = (process.env.DL1_URLS ?? 'http://localhost:9400').split(',');

/**
 * Example 1: Server-Signed Mode
 *
 * The bridge generates and stores the keypair. You send unsigned
 * requests and the bridge signs on your behalf.
 *
 * Pros:
 * - Simpler client code (no key management)
 * - Bridge handles all signing complexity
 *
 * Cons:
 * - Must trust the bridge operator
 * - Private key stored on bridge server
 */
async function serverSignedExample() {
  console.log('\n=== Server-Signed Mode ===\n');

  const client = new HttpClient(BRIDGE_URL);

  // Register without providing any keys
  console.log('1. Registering agent (server-signed)...');
  const registerResponse = await client.post<{
    fiberId: string;
    address: string;
    publicKey: string;
    signingMode: string;
  }>('/agent/register', {
    signingMode: 'server',
    displayName: 'Server-Signed Agent',
    platform: 'example',
    platformUserId: 'server-agent-001',
  });

  console.log(`   Fiber ID: ${registerResponse.fiberId}`);
  console.log(`   Address: ${registerResponse.address}`);
  console.log(`   Signing Mode: ${registerResponse.signingMode}`);
  console.log('   Note: Private key is stored on bridge (never returned)');

  // Wait for fiber to sync
  console.log('\n2. Waiting for fiber sync...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Activate - just send fiberId, bridge signs internally
  console.log('\n3. Activating agent (bridge signs)...');
  const activateResponse = await client.post<{
    hash: string;
    status: string;
  }>('/agent/activate', {
    fiberId: registerResponse.fiberId,
    waitForSync: true,
  });

  console.log(`   Transaction hash: ${activateResponse.hash}`);
  console.log(`   Status: ${activateResponse.status}`);

  // Transition - same pattern
  console.log('\n4. Sending transition (bridge signs)...');
  const transitionResponse = await client.post<{
    hash: string;
    event: string;
  }>('/agent/transition', {
    fiberId: registerResponse.fiberId,
    event: 'receive_vouch',
    payload: { from: 'DAG123...', reason: 'Trusted partner' },
  });

  console.log(`   Event: ${transitionResponse.event}`);
  console.log(`   Transaction hash: ${transitionResponse.hash}`);

  return registerResponse.fiberId;
}

/**
 * Example 2: Self-Signed Mode
 *
 * You manage your own keypair and sign transactions client-side.
 * The bridge validates signatures and relays to the metagraph.
 *
 * Pros:
 * - Full key custody (private key never leaves your control)
 * - Audit trail of who signed what
 * - Better for production/compliance
 *
 * Cons:
 * - More complex client code
 * - Must securely store your own keys
 */
async function selfSignedExample() {
  console.log('\n=== Self-Signed Mode ===\n');

  const client = new HttpClient(BRIDGE_URL);

  // Generate keypair client-side
  console.log('1. Generating keypair locally...');
  const keyPair = generateKeyPair();
  const publicKeyId = getPublicKeyId(keyPair.privateKey);

  console.log(`   Address: ${keyPair.address}`);
  console.log(`   Public Key ID: ${publicKeyId.slice(0, 16)}...`);
  console.log('   Private key stored locally (never sent to bridge)');

  // Register with your public key
  console.log('\n2. Registering agent (self-signed)...');
  const registerResponse = await client.post<{
    fiberId: string;
    address: string;
    signingMode: string;
  }>('/agent/register', {
    signingMode: 'self',
    publicKey: publicKeyId, // 128-char hex, no 04 prefix
    displayName: 'Self-Signed Agent',
    platform: 'example',
    platformUserId: 'self-agent-001',
  });

  console.log(`   Fiber ID: ${registerResponse.fiberId}`);
  console.log(`   Address: ${registerResponse.address}`);
  console.log(`   Signing Mode: ${registerResponse.signingMode}`);

  // Wait for fiber to sync
  console.log('\n3. Waiting for fiber sync...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get current sequence number (for targetSequenceNumber)
  // In production, you'd query the bridge or metagraph for this
  const currentSequence = 0;

  // Create and sign activation transaction locally
  console.log('\n4. Creating and signing activation locally...');
  const activatePayload = createTransitionPayload({
    fiberId: registerResponse.fiberId,
    eventName: 'activate',
    payload: {},
    targetSequenceNumber: currentSequence,
  });

  const signedActivate = await signTransaction(activatePayload, keyPair.privateKey);

  console.log('   Payload signed with local private key');
  console.log(`   Proofs: ${signedActivate.proofs.length}`);

  // Submit pre-signed transaction
  console.log('\n5. Submitting pre-signed activation...');
  const activateResponse = await client.post<{
    hash: string;
    signingMode: string;
  }>('/agent/transition', {
    fiberId: registerResponse.fiberId,
    signedUpdate: signedActivate,
  });

  console.log(`   Transaction hash: ${activateResponse.hash}`);
  console.log(`   Signing Mode confirmed: ${activateResponse.signingMode}`);

  // Another transition example
  console.log('\n6. Creating and signing another transition...');
  const transitionPayload = createTransitionPayload({
    fiberId: registerResponse.fiberId,
    eventName: 'receive_vouch',
    payload: { from: keyPair.address, reason: 'Self vouch example' },
    targetSequenceNumber: currentSequence + 1,
  });

  const signedTransition = await signTransaction(transitionPayload, keyPair.privateKey);

  const transitionResponse = await client.post<{
    hash: string;
  }>('/agent/transition', {
    fiberId: registerResponse.fiberId,
    signedUpdate: signedTransition,
  });

  console.log(`   Transaction hash: ${transitionResponse.hash}`);

  return registerResponse.fiberId;
}


/**
 * Example 3: Direct DL1 Submission (No Bridge)
 *
 * Self-signed transactions can be submitted directly to DL1 nodes,
 * bypassing the bridge entirely for transaction submission.
 * The bridge is still needed for registration metadata.
 *
 * This is the most decentralized approach — only the metagraph
 * nodes need to be reachable.
 */
async function directDL1Example() {
  console.log('\n=== Direct DL1 Submission ===\n');

  // Connect directly to DL1 nodes (no bridge needed for submission)
  const metagraph = new MetagraphClient({
    ml0Url: 'http://localhost:9200',
    dl1Urls: DL1_URLS,
  });

  // Generate keypair and create a transition payload
  const keyPair = generateKeyPair();
  console.log(`1. Generated keypair: ${keyPair.address}`);

  // Assume fiberId from a prior registration
  const fiberId = 'example-fiber-id';

  const payload = createTransitionPayload({
    fiberId,
    eventName: 'activate',
    payload: {},
    targetSequenceNumber: 0,
  });

  // Sign locally
  const signed = await signTransaction(payload, keyPair.privateKey);
  console.log('2. Signed transaction locally');

  // Submit directly to DL1 — no bridge involved
  console.log('3. Submitting directly to DL1...');
  try {
    const result = await metagraph.submitData(signed);
    console.log(`   Hash: ${result.hash}`);
  } catch (err) {
    console.log(`   (Expected to fail without running metagraph: ${(err as Error).message})`);
  }

  console.log('\nNote: Bridge is still needed for registration metadata.');
  console.log('But transaction submission can go directly to DL1 nodes.');
}

/**
 * Main entry point
 */
async function main() {
  console.log('OttoChain Signing Modes Example');
  console.log('================================');
  console.log(`Bridge URL: ${BRIDGE_URL}`);

  try {
    // Run server-signed example
    await serverSignedExample();

    // Run self-signed example
    await selfSignedExample();

    // Run direct DL1 example
    await directDL1Example();

    console.log('\n=== Summary ===\n');
    console.log('Server-signed mode:');
    console.log('  - Easier to implement');
    console.log('  - Bridge manages keys');
    console.log('  - Good for dev/testing');
    console.log('');
    console.log('Self-signed mode:');
    console.log('  - Full key custody');
    console.log('  - Client signs locally');
    console.log('  - Better for production');
    console.log('');
    console.log('Direct DL1 submission:');
    console.log('  - No bridge dependency for tx submission');
    console.log('  - Multi-node resilience with Promise.any');
    console.log('  - Most decentralized approach');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);
