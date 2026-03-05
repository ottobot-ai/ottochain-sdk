/**
 * Contracts Example: Full Contract Lifecycle
 *
 * Demonstrates the complete contract lifecycle on OttoChain:
 *   Path A — Happy path:  propose → accept → complete → finalize
 *   Path B — Rejection:   propose → reject
 *   Path C — Dispute:     propose → accept → dispute
 *
 * Uses the Contracts domain state machine from @ottochain/sdk/apps/contracts.
 *
 * Run:
 *   npx tsx examples/contracts/contract-lifecycle.ts
 *   npx tsx examples/contracts/contract-lifecycle.ts --path=B
 *   npx tsx examples/contracts/contract-lifecycle.ts --path=C
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
} from '../../src/index.js';
import {
  getContractDefinition,
  ContractState,
} from '../../src/apps/contracts/index.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const METAGRAPH_URL = process.env.METAGRAPH_URL ?? 'http://localhost:9300';
const BRIDGE_URL    = process.env.BRIDGE_URL    ?? 'http://localhost:3030';
const WORKFLOW_PATH = (process.argv.find(a => a.startsWith('--path='))?.split('=')[1] ?? 'A') as 'A' | 'B' | 'C';

const PARENT_ORDINAL = 0;
const PARENT_HASH    = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function sendTransition(
  client:    DataL1Client,
  keyPair:   Awaited<ReturnType<typeof generateKeyPair>>,
  fiberId:   string,
  event:     string,
  data:      Record<string, unknown>,
  ordinal:   number,
): Promise<void> {
  const msg = {
    TransitionStateMachine: { fiberId, event, data },
  };
  const signed = await createSignedObject(msg, keyPair.privateKey);
  const parent = { ordinal, hash: PARENT_HASH };
  await client.sendTransaction(signed, parent);
}

async function queryFiberState(fiberId: string): Promise<{ state: string; data: unknown } | null> {
  try {
    const resp = await fetch(`${BRIDGE_URL}/state-machines/${fiberId}`);
    if (!resp.ok) return null;
    const body = await resp.json() as { currentState: string; stateData: unknown };
    return { state: body.currentState, data: body.stateData };
  } catch {
    return null;
  }
}

// ─── Workflow Steps ────────────────────────────────────────────────────────────

async function createContractFiber(
  proposer:      Awaited<ReturnType<typeof generateKeyPair>>,
  counterparty:  Awaited<ReturnType<typeof generateKeyPair>>,
): Promise<string> {
  const fiberId = crypto.randomUUID();
  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const def     = getContractDefinition();

  const createMsg = {
    CreateStateMachine: {
      fiberId,
      definition:   def,
      initialState: 'proposed',
      initialData: {
        proposer:    proposer.address,
        counterparty: counterparty.address,
        terms: {
          description:  'Implement feature X',
          deliverables: ['Pull request with tests', 'Documentation update'],
          deadline:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          payment: { amount: 500, token: 'DAG' },
        },
        milestones: [],
        status: ContractState.PROPOSED,
      },
    },
  };

  const signed = await createSignedObject(createMsg, proposer.privateKey);
  const parent = { ordinal: PARENT_ORDINAL, hash: PARENT_HASH };
  await client.sendTransaction(signed, parent);

  console.log(`  ✓ Contract fiber created: ${fiberId}`);
  return fiberId;
}

// ─── Path A: Happy Path ────────────────────────────────────────────────────────

async function runPathA(
  proposer:     Awaited<ReturnType<typeof generateKeyPair>>,
  counterparty: Awaited<ReturnType<typeof generateKeyPair>>,
) {
  console.log('\n📋  Path A: Full Lifecycle (propose → accept → complete → finalize)\n');
  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = await createContractFiber(proposer, counterparty);

  // Accept
  await sendTransition(client, counterparty, fiberId, 'accept', {
    acceptedBy: counterparty.address,
    timestamp:  new Date().toISOString(),
  }, 1);
  console.log('  ✓ Contract accepted by counterparty');

  // Proposer marks complete
  await sendTransition(client, proposer, fiberId, 'complete', {
    completedBy: proposer.address,
    evidence:    'https://github.com/example/pr/42',
    notes:       'All deliverables submitted',
  }, 2);
  console.log('  ✓ Proposer marked work complete');

  // Counterparty finalizes (releases payment)
  await sendTransition(client, counterparty, fiberId, 'finalize', {
    finalizedBy:    counterparty.address,
    paymentReleased: true,
    rating:          5,
    feedback:        'Excellent work, delivered on time',
  }, 3);
  console.log('  ✓ Contract finalized — payment released');

  const state = await queryFiberState(fiberId);
  if (state) {
    console.log(`\n  Final state: ${state.state}`);
  }

  return fiberId;
}

// ─── Path B: Rejection ────────────────────────────────────────────────────────

async function runPathB(
  proposer:     Awaited<ReturnType<typeof generateKeyPair>>,
  counterparty: Awaited<ReturnType<typeof generateKeyPair>>,
) {
  console.log('\n📋  Path B: Rejection (propose → reject)\n');
  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = await createContractFiber(proposer, counterparty);

  await sendTransition(client, counterparty, fiberId, 'reject', {
    rejectedBy: counterparty.address,
    reason:     'Terms not acceptable — payment amount too low',
    timestamp:  new Date().toISOString(),
  }, 1);
  console.log('  ✓ Contract rejected by counterparty');

  const state = await queryFiberState(fiberId);
  if (state) {
    console.log(`\n  Final state: ${state.state}`);
  }

  return fiberId;
}

// ─── Path C: Dispute ──────────────────────────────────────────────────────────

async function runPathC(
  proposer:     Awaited<ReturnType<typeof generateKeyPair>>,
  counterparty: Awaited<ReturnType<typeof generateKeyPair>>,
) {
  console.log('\n📋  Path C: Dispute (propose → accept → dispute)\n');
  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = await createContractFiber(proposer, counterparty);

  // Accept
  await sendTransition(client, counterparty, fiberId, 'accept', {
    acceptedBy: counterparty.address,
    timestamp:  new Date().toISOString(),
  }, 1);
  console.log('  ✓ Contract accepted');

  // Raise dispute
  await sendTransition(client, proposer, fiberId, 'dispute', {
    disputedBy: proposer.address,
    reason:     'Work does not meet specifications',
    evidence:   'Screenshots attached in off-chain storage',
    timestamp:  new Date().toISOString(),
  }, 2);
  console.log('  ✓ Dispute raised by proposer');

  const state = await queryFiberState(fiberId);
  if (state) {
    console.log(`\n  Final state: ${state.state} (awaiting arbitration)`);
  }

  return fiberId;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  OttoChain SDK — Contracts Lifecycle Example ║');
  console.log(`║  Path ${WORKFLOW_PATH}                                       ║`);
  console.log('╚══════════════════════════════════════════════╝');

  const proposer    = await generateKeyPair();
  const counterparty = await generateKeyPair();

  console.log(`\n  Proposer address:    ${proposer.address}`);
  console.log(`  Counterparty address: ${counterparty.address}`);

  switch (WORKFLOW_PATH) {
    case 'A': await runPathA(proposer, counterparty); break;
    case 'B': await runPathB(proposer, counterparty); break;
    case 'C': await runPathC(proposer, counterparty); break;
    default:
      console.error(`Unknown path: ${WORKFLOW_PATH}. Use A, B, or C.`);
      process.exit(1);
  }

  console.log('\n✅  Contracts example complete!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
