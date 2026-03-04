/**
 * Markets Example: Prediction Market (Order Book Demo)
 *
 * Demonstrates a prediction market lifecycle on OttoChain:
 *   1. Create a binary prediction market ("Will X happen by date Y?")
 *   2. Multiple agents commit their predictions
 *   3. Oracle submits resolution
 *   4. Winners can claim their payouts
 *
 * Uses the Markets domain state machine from @ottochain/sdk/apps/markets.
 *
 * Run:
 *   npx tsx examples/markets/prediction-market.ts
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
} from '../../src/index.js';
import {
  getMarketDefinition,
  MarketType,
  MarketState,
} from '../../src/apps/markets/index.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const METAGRAPH_URL = process.env.METAGRAPH_URL ?? 'http://localhost:9300';
const BRIDGE_URL    = process.env.BRIDGE_URL    ?? 'http://localhost:3030';

const PARENT_ORDINAL = 0;
const PARENT_HASH    = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function sendTransition(
  client:  DataL1Client,
  keyPair: Awaited<ReturnType<typeof generateKeyPair>>,
  fiberId: string,
  event:   string,
  data:    Record<string, unknown>,
  ordinal: number,
): Promise<void> {
  const msg    = { TransitionStateMachine: { fiberId, event, data } };
  const signed = await createSignedObject(msg, keyPair.privateKey);
  await client.sendTransaction(signed, { ordinal, hash: PARENT_HASH });
}

async function queryMarketState(fiberId: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${BRIDGE_URL}/state-machines/${fiberId}`);
    if (!resp.ok) return null;
    return await resp.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Main Workflow ─────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  OttoChain SDK — Prediction Market Example   ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Participants
  const creator  = await generateKeyPair();
  const alice    = await generateKeyPair();
  const bob      = await generateKeyPair();
  const oracle   = await generateKeyPair();

  console.log(`\n  Market creator: ${creator.address}`);
  console.log(`  Alice (YES):    ${alice.address}`);
  console.log(`  Bob   (NO):     ${bob.address}`);
  console.log(`  Oracle:         ${oracle.address}`);

  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = crypto.randomUUID();
  const marketDef = getMarketDefinition();

  // ─── Step 1: Create market ─────────────────────────────────────────────────

  console.log('\n📊  Step 1: Create Prediction Market\n');

  const resolutionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const createMsg = {
    CreateStateMachine: {
      fiberId,
      definition:   marketDef,
      initialState: 'open',
      initialData: {
        creator:    creator.address,
        oracle:     oracle.address,
        question:   'Will OttoChain mainnet launch before Q3 2026?',
        type:       MarketType.BINARY,
        status:     MarketState.OPEN,
        resolutionDate: resolutionDate.toISOString(),
        minimumCommitment: 10,
        commitments: [],
        totalYes: 0,
        totalNo:  0,
      },
    },
  };

  const signedCreate = await createSignedObject(createMsg, creator.privateKey);
  await client.sendTransaction(signedCreate, { ordinal: PARENT_ORDINAL, hash: PARENT_HASH });
  console.log(`  ✓ Market created: ${fiberId}`);
  console.log(`  ✓ Question: "Will OttoChain mainnet launch before Q3 2026?"`);
  console.log(`  ✓ Closes: ${resolutionDate.toLocaleDateString()}`);

  // ─── Step 2: Participants commit ──────────────────────────────────────────

  console.log('\n📊  Step 2: Participants Commit Positions\n');

  await sendTransition(client, alice, fiberId, 'commit', {
    participant: alice.address,
    position:    'YES',
    amount:      100,
    token:       'DAG',
    timestamp:   new Date().toISOString(),
  }, 1);
  console.log('  ✓ Alice committed: YES — 100 DAG');

  await sendTransition(client, bob, fiberId, 'commit', {
    participant: bob.address,
    position:    'NO',
    amount:      50,
    token:       'DAG',
    timestamp:   new Date().toISOString(),
  }, 2);
  console.log('  ✓ Bob committed:   NO  — 50 DAG');

  // Additional YES commitment
  await sendTransition(client, creator, fiberId, 'commit', {
    participant: creator.address,
    position:    'YES',
    amount:      75,
    token:       'DAG',
    timestamp:   new Date().toISOString(),
  }, 3);
  console.log('  ✓ Creator committed: YES — 75 DAG');
  console.log('\n  Total YES pool: 175 DAG');
  console.log('  Total NO pool:   50 DAG');

  // ─── Step 3: Oracle resolves ──────────────────────────────────────────────

  console.log('\n📊  Step 3: Oracle Submits Resolution\n');

  await sendTransition(client, oracle, fiberId, 'resolve', {
    resolver:   oracle.address,
    outcome:    'YES',
    evidence:   'Mainnet launched 2026-06-15 — block #1 confirmed at tx hash 0xabc...',
    timestamp:  new Date().toISOString(),
  }, 4);
  console.log('  ✓ Market resolved: YES wins!');
  console.log('  ✓ YES pool (175 DAG) + NO pool (50 DAG) = 225 DAG total payout');

  // ─── Step 4: Winner claims ─────────────────────────────────────────────────

  console.log('\n📊  Step 4: Winners Claim Payouts\n');

  // Alice's share: 100/175 × 225 ≈ 128.6 DAG
  await sendTransition(client, alice, fiberId, 'claim', {
    claimant:   alice.address,
    position:   'YES',
    timestamp:  new Date().toISOString(),
  }, 5);
  const alicePayout = Math.round((100 / 175) * 225 * 100) / 100;
  console.log(`  ✓ Alice claimed: ~${alicePayout} DAG (proportional to YES stake)`);

  // Creator's share: 75/175 × 225 ≈ 96.4 DAG
  const creatorPayout = Math.round((75 / 175) * 225 * 100) / 100;
  console.log(`  ✓ Creator claims: ~${creatorPayout} DAG (proportional to YES stake)`);

  // ─── Final state ──────────────────────────────────────────────────────────

  console.log('\n📊  Final Market State\n');
  const state = await queryMarketState(fiberId);
  if (state) {
    console.log(`  State: ${(state as { currentState: string }).currentState}`);
    console.log(`  Full state: ${JSON.stringify(state, null, 2)}`);
  } else {
    console.log('  (Cluster not running — state unavailable in offline mode)');
  }

  console.log('\n✅  Prediction market example complete!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
