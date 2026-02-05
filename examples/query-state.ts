/**
 * Example: Query Metagraph State
 * 
 * This example demonstrates:
 * - Fetching the latest checkpoint
 * - Querying fiber state
 * - Listing agents and contracts
 * - Watching for state changes
 */

import { HttpClient } from '@ottochain/sdk';

const ML0_URL = process.env.ML0_URL || 'http://localhost:9200';

async function queryState() {
  const client = new HttpClient(ML0_URL);

  // 1. Get latest checkpoint
  console.log('=== Latest Checkpoint ===');
  const checkpoint = await client.getCheckpoint();
  console.log('Ordinal:', checkpoint.ordinal);
  console.log('Hash:', checkpoint.hash?.slice(0, 16) + '...');
  console.log('Fiber count:', Object.keys(checkpoint.fibers || {}).length);

  // 2. List all fibers
  console.log('\n=== All Fibers ===');
  const fibers = checkpoint.fibers || {};
  for (const [fiberId, fiber] of Object.entries(fibers)) {
    const f = fiber as any;
    console.log(`- ${fiberId.slice(0, 8)}...`);
    console.log(`  Type: ${f.workflowType || 'unknown'}`);
    console.log(`  State: ${f.currentState || 'unknown'}`);
    console.log(`  Owners: ${f.owners?.join(', ') || 'none'}`);
  }

  // 3. Filter agents (AgentIdentity fibers)
  console.log('\n=== Active Agents ===');
  const agents = Object.entries(fibers).filter(([_, f]) => 
    (f as any).workflowType === 'AgentIdentity'
  );
  console.log(`Found ${agents.length} agents`);
  
  for (const [fiberId, fiber] of agents) {
    const f = fiber as any;
    const state = f.state || {};
    console.log(`- ${state.name || 'Unnamed'}`);
    console.log(`  Address: ${f.owners?.[0] || 'unknown'}`);
    console.log(`  Reputation: ${state.reputation || 0}`);
    console.log(`  Status: ${f.currentState}`);
  }

  // 4. Filter contracts
  console.log('\n=== Active Contracts ===');
  const contracts = Object.entries(fibers).filter(([_, f]) => 
    (f as any).workflowType === 'Contract'
  );
  console.log(`Found ${contracts.length} contracts`);

  // 5. Watch for changes (polling)
  console.log('\n=== Watching for Changes (10s) ===');
  let lastOrdinal = checkpoint.ordinal;
  const watchDuration = 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < watchDuration) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const current = await client.getCheckpoint();
    
    if (current.ordinal !== lastOrdinal) {
      console.log(`New ordinal: ${lastOrdinal} -> ${current.ordinal}`);
      const newFiberCount = Object.keys(current.fibers || {}).length;
      const oldFiberCount = Object.keys(fibers).length;
      if (newFiberCount !== oldFiberCount) {
        console.log(`Fiber count changed: ${oldFiberCount} -> ${newFiberCount}`);
      }
      lastOrdinal = current.ordinal;
    } else {
      process.stdout.write('.');
    }
  }
  console.log('\nWatch complete');

  return { checkpoint, agents, contracts };
}

// Run if executed directly
queryState()
  .then(result => {
    console.log('\n✅ State query complete!');
    console.log(`Ordinal: ${result.checkpoint.ordinal}`);
    console.log(`Agents: ${result.agents.length}`);
    console.log(`Contracts: ${result.contracts.length}`);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
