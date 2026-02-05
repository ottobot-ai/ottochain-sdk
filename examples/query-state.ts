/**
 * Query State Example
 *
 * Demonstrates how to query fibers, checkpoints, and agent state from the network.
 *
 * @example
 * ```bash
 * npx ts-node examples/query-state.ts
 * ```
 */

import {
  DataL1Client,
  CurrencyL1Client,
  HttpClient,
  NetworkError,
  generateKeyPair,
} from '../src/index.js';

// Configuration
const METAGRAPH_DATA_L1_URL = process.env.METAGRAPH_DATA_URL || 'http://localhost:9300';
const METAGRAPH_CURRENCY_L1_URL = process.env.METAGRAPH_CURRENCY_URL || 'http://localhost:9200';

/**
 * Example 1: Query data endpoint
 */
async function queryDataEndpoint() {
  console.log('📊 Example 1: Query Data L1 Endpoint\n');

  const client = new DataL1Client(METAGRAPH_DATA_L1_URL);

  try {
    // Query a hypothetical state endpoint
    // Note: Actual endpoints depend on your metagraph implementation
    const response = await client.get('/state');
    console.log('  ✅ Data L1 state:', JSON.stringify(response, null, 2).slice(0, 200));
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log(`  ⚠️  Network error: ${error.message}`);
      console.log(`     Status: ${error.statusCode || 'N/A'}`);
    } else {
      console.log(`  ⚠️  Error: ${(error as Error).message}`);
    }
    console.log('     (This is expected if no metagraph is running)\n');
  }
}

/**
 * Example 2: Query currency endpoint
 */
async function queryCurrencyEndpoint() {
  console.log('💰 Example 2: Query Currency L1 Endpoint\n');

  const client = new CurrencyL1Client(METAGRAPH_CURRENCY_L1_URL);

  // Generate a test address
  const { address } = generateKeyPair();

  try {
    // Query balance for an address
    const balance = await client.getBalance(address);
    console.log(`  ✅ Balance for ${address.slice(0, 20)}...: ${balance}`);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log(`  ⚠️  Network error: ${error.message}`);
    } else {
      console.log(`  ⚠️  Error: ${(error as Error).message}`);
    }
    console.log('     (This is expected if no metagraph is running)\n');
  }

  try {
    // Query last reference for an address
    const lastRef = await client.getLastReference(address);
    console.log(`  ✅ Last reference: ordinal=${lastRef.ordinal}, hash=${lastRef.hash.slice(0, 16)}...`);
  } catch (error) {
    console.log(`  ⚠️  Could not get last reference`);
    console.log('     (Address may not have any transactions)\n');
  }
}

/**
 * Example 3: Query with custom HTTP client
 */
async function queryWithCustomClient() {
  console.log('🔧 Example 3: Custom HTTP Client\n');

  // Create a custom HTTP client with timeout
  const client = new HttpClient(METAGRAPH_DATA_L1_URL, 5000); // 5 second timeout

  console.log('  Making request with 5s timeout...');

  try {
    // Query any endpoint
    const result = await client.get('/node/info');
    console.log('  ✅ Node info:', JSON.stringify(result, null, 2).slice(0, 200));
  } catch (error) {
    if (error instanceof NetworkError) {
      if (error.message.includes('timeout')) {
        console.log('  ⏱️  Request timed out after 5 seconds');
      } else {
        console.log(`  ⚠️  Network error: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️  Error: ${(error as Error).message}`);
    }
  }
}

/**
 * Example 4: Simulated state queries
 *
 * Shows the expected format for querying different state types
 */
function simulatedStateQueries() {
  console.log('\n📋 Example 4: Simulated State Query Formats\n');

  // These show the expected format when a metagraph is running

  console.log('  Agent Identity Query:');
  console.log('    Endpoint: GET /data/agents/{address}');
  console.log('    Expected Response:');
  const agentResponse = {
    address: 'DAG4o9z...',
    displayName: 'MyAgent',
    reputation: 42,
    state: 'ACTIVE',
    platformLinks: [
      {
        platform: 'DISCORD',
        platformUserId: '12345',
        verified: true,
      },
    ],
  };
  console.log('    ' + JSON.stringify(agentResponse, null, 2).replace(/\n/g, '\n    '));

  console.log('\n  Contract Query:');
  console.log('    Endpoint: GET /data/contracts/{contractId}');
  console.log('    Expected Response:');
  const contractResponse = {
    id: 'contract-123',
    proposer: 'DAG4o9z...',
    counterparty: 'DAG5x2y...',
    state: 'ACTIVE',
    terms: {
      deliverable: 'Code review',
      deadline: '2024-12-31',
    },
    proposedAt: '2024-01-15T10:00:00Z',
    acceptedAt: '2024-01-16T14:30:00Z',
  };
  console.log('    ' + JSON.stringify(contractResponse, null, 2).replace(/\n/g, '\n    '));

  console.log('\n  Fiber/Checkpoint Query:');
  console.log('    Endpoint: GET /data/fibers/{fiberId}');
  console.log('    Expected Response:');
  const fiberResponse = {
    fiberId: 'fiber-abc123',
    stateDefinition: 'AgentIdentity',
    currentState: 'ACTIVE',
    lastCheckpoint: {
      ordinal: 42,
      hash: 'abc123...',
      timestamp: '2024-01-20T10:00:00Z',
    },
    history: [
      { state: 'REGISTERED', ordinal: 1 },
      { state: 'ACTIVE', ordinal: 5 },
    ],
  };
  console.log('    ' + JSON.stringify(fiberResponse, null, 2).replace(/\n/g, '\n    '));
}

/**
 * Example 5: Error handling patterns
 */
async function errorHandlingExample() {
  console.log('\n⚠️  Example 5: Error Handling Patterns\n');

  const client = new HttpClient('http://invalid-host:9999', 2000);

  console.log('  Demonstrating error handling...');

  try {
    await client.get('/endpoint');
    console.log('  ✅ Request succeeded');
  } catch (error) {
    if (error instanceof NetworkError) {
      // Handle specific error types
      if (error.statusCode === 404) {
        console.log('  📭 Resource not found (404)');
      } else if (error.statusCode === 500) {
        console.log('  💥 Server error (500)');
      } else if (error.message.includes('timeout')) {
        console.log('  ⏱️  Request timed out - retry with exponential backoff');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('  🔌 Connection refused - server may be down');
      } else {
        console.log(`  ❌ Network error: ${error.message}`);
      }

      // Access additional error info
      if (error.responseBody) {
        console.log(`     Response: ${error.responseBody.slice(0, 100)}`);
      }
    } else {
      console.log(`  ❓ Unexpected error: ${(error as Error).message}`);
    }
  }

  console.log('\n  Best practices:');
  console.log('    • Always wrap network calls in try/catch');
  console.log('    • Check for NetworkError to handle API errors');
  console.log('    • Implement retry logic for transient failures');
  console.log('    • Log error details for debugging');
}

/**
 * Run all examples
 */
async function main() {
  console.log('🚀 Query State Examples\n');
  console.log('═'.repeat(50));
  console.log('  Using endpoints:');
  console.log(`    Data L1:     ${METAGRAPH_DATA_L1_URL}`);
  console.log(`    Currency L1: ${METAGRAPH_CURRENCY_L1_URL}`);
  console.log('═'.repeat(50) + '\n');

  await queryDataEndpoint();
  await queryCurrencyEndpoint();
  await queryWithCustomClient();
  simulatedStateQueries();
  await errorHandlingExample();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ All query examples completed!');
  console.log('\n💡 Tip: Set environment variables to use a real metagraph:');
  console.log('   METAGRAPH_DATA_URL=http://your-node:9300');
  console.log('   METAGRAPH_CURRENCY_URL=http://your-node:9200');
}

main().catch(console.error);
