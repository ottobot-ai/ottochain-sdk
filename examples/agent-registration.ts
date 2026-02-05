/**
 * Example: Register a new agent identity on OttoChain
 * 
 * This example demonstrates:
 * - Generating a new keypair
 * - Creating an agent identity
 * - Waiting for on-chain confirmation
 * - Activating the agent
 */

import { 
  generateKeyPair, 
  batchSign, 
  HttpClient,
  KeyPair 
} from '@ottochain/sdk';

const ML0_URL = process.env.ML0_URL || 'http://localhost:9200';
const DL1_URL = process.env.DL1_URL || 'http://localhost:9400';

async function registerAgent() {
  // 1. Generate a new keypair for the agent
  console.log('Generating keypair...');
  const keyPair = await generateKeyPair();
  console.log('Agent address:', keyPair.address);

  // 2. Create the registration payload
  const createAgentPayload = {
    CreateAgentIdentity: {
      name: 'MyAgent',
      platformId: 'telegram:123456789',
      metadata: {
        description: 'An example agent',
        version: '1.0.0',
      },
    },
  };

  // 3. Sign the transaction
  console.log('Signing registration transaction...');
  const signedTx = await batchSign(keyPair, [createAgentPayload]);

  // 4. Submit to DL1
  const client = new HttpClient(DL1_URL);
  console.log('Submitting to DL1...');
  const response = await client.postDataTransaction(signedTx);
  console.log('Transaction hash:', response.hash);

  // 5. Wait for the fiber to appear in ML0 checkpoint
  console.log('Waiting for on-chain confirmation...');
  const fiberId = await waitForFiber(keyPair.address, 60);
  console.log('Fiber created:', fiberId);

  // 6. Activate the agent
  const activatePayload = {
    ActivateAgent: {
      fiberId,
    },
  };
  
  const activateTx = await batchSign(keyPair, [activatePayload]);
  await client.postDataTransaction(activateTx);
  console.log('Agent activated!');

  return { keyPair, fiberId };
}

async function waitForFiber(ownerAddress: string, timeoutSeconds: number): Promise<string> {
  const client = new HttpClient(ML0_URL);
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const checkpoint = await client.getCheckpoint();
    
    for (const [fiberId, fiber] of Object.entries(checkpoint.fibers || {})) {
      if ((fiber as any).owners?.includes(ownerAddress)) {
        return fiberId;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Fiber not found for ${ownerAddress} within ${timeoutSeconds}s`);
}

// Run if executed directly
registerAgent()
  .then(result => {
    console.log('\n✅ Agent registered successfully!');
    console.log('Address:', result.keyPair.address);
    console.log('Fiber ID:', result.fiberId);
  })
  .catch(error => {
    console.error('❌ Registration failed:', error.message);
    process.exit(1);
  });
