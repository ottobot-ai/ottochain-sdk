/**
 * Governance Example: DAO Proposal + Vote
 *
 * Demonstrates the DAO governance lifecycle on OttoChain:
 *   1. Bootstrap a Multisig DAO (2-of-3 threshold)
 *   2. Any member can create a proposal
 *   3. Members vote YES/NO/ABSTAIN
 *   4. Proposal executes when threshold is reached
 *
 * Also shows a Token-weighted DAO for comparison.
 *
 * Run:
 *   npx tsx examples/governance/dao-proposal-vote.ts
 *   npx tsx examples/governance/dao-proposal-vote.ts --type=token
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
} from '../../src/index.js';
import {
  getDAODefinition,
  DAOType,
  DAOStatus,
  ProposalStatus,
  VoteChoice,
} from '../../src/apps/governance/index.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const METAGRAPH_URL = process.env.METAGRAPH_URL ?? 'http://localhost:9300';
const BRIDGE_URL    = process.env.BRIDGE_URL    ?? 'http://localhost:3030';
const DAO_TYPE      = (process.argv.find(a => a.startsWith('--type='))?.split('=')[1] ?? 'multisig') as 'multisig' | 'token';

const PARENT_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function queryState(fiberId: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${BRIDGE_URL}/state-machines/${fiberId}`);
    if (!resp.ok) return null;
    return await resp.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Multisig DAO (2-of-3) ────────────────────────────────────────────────────

async function runMultisigDAO(members: Awaited<ReturnType<typeof generateKeyPair>>[]) {
  console.log('\n🏛️   Multisig DAO — 2-of-3 threshold\n');

  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = crypto.randomUUID();
  const daoDef  = getDAODefinition('Multisig');

  const [alice, bob, charlie] = members;

  // ── Bootstrap DAO ──
  const createMsg = {
    CreateStateMachine: {
      fiberId,
      definition:   daoDef,
      initialState: 'active',
      initialData: {
        daoId:     fiberId,
        daoType:   DAOType.MULTISIG,
        status:    DAOStatus.ACTIVE,
        signers:   [alice.address, bob.address, charlie.address],
        threshold: 2,
        proposals: [],
        executed:  [],
      },
    },
  };

  const signedCreate = await createSignedObject(createMsg, alice.privateKey);
  await client.sendTransaction(signedCreate, { ordinal: 0, hash: PARENT_HASH });
  console.log(`  ✓ Multisig DAO created: ${fiberId}`);
  console.log(`  ✓ Signers: Alice, Bob, Charlie`);
  console.log(`  ✓ Threshold: 2-of-3`);

  // ── Create proposal ──
  const proposalId = crypto.randomUUID();

  await sendTransition(client, alice, fiberId, 'propose', {
    proposalId,
    proposer:      alice.address,
    title:         'Upgrade metagraph to v0.8.0',
    description:   'Deploy the latest metagraph release with authentication improvements.',
    calldata: {
      action:    'deploy',
      version:   '0.8.0',
      configUrl: 'ipfs://QmXxx/config.json',
    },
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }, 1);
  console.log(`\n  ✓ Proposal created: "${`Upgrade metagraph to v0.8.0`}"`);
  console.log(`  ✓ Proposal ID: ${proposalId}`);

  // ── Alice votes YES ──
  await sendTransition(client, alice, fiberId, 'sign', {
    proposalId,
    signer:    alice.address,
    vote:      VoteChoice.YES,
    timestamp: new Date().toISOString(),
  }, 2);
  console.log('\n  ✓ Alice signed YES (1/2 required)');

  // ── Bob votes YES → threshold reached → auto-execute ──
  await sendTransition(client, bob, fiberId, 'sign', {
    proposalId,
    signer:    bob.address,
    vote:      VoteChoice.YES,
    timestamp: new Date().toISOString(),
  }, 3);
  console.log('  ✓ Bob signed YES (2/2 reached — threshold met!)');
  console.log('  ✓ Proposal auto-executes on threshold');

  const state = await queryState(fiberId);
  if (state) {
    console.log(`\n  DAO state: ${(state as { currentState: string }).currentState}`);
  }
}

// ─── Token-weighted DAO ───────────────────────────────────────────────────────

async function runTokenDAO(members: Awaited<ReturnType<typeof generateKeyPair>>[]) {
  console.log('\n🏛️   Token-weighted DAO — quorum 51%, passing 51%\n');

  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const fiberId = crypto.randomUUID();
  const daoDef  = getDAODefinition('Token');

  const [alice, bob, charlie] = members;

  const createMsg = {
    CreateStateMachine: {
      fiberId,
      definition:   daoDef,
      initialState: 'active',
      initialData: {
        daoId:   fiberId,
        daoType: DAOType.TOKEN,
        status:  DAOStatus.ACTIVE,
        token:   'OTTO',
        quorum:  51,    // % of total supply needed
        passing: 51,    // % of votes needed
        members: [
          { address: alice.address,   balance: 600 },
          { address: bob.address,     balance: 300 },
          { address: charlie.address, balance: 100 },
        ],
        totalSupply: 1000,
        proposals:   [],
      },
    },
  };

  const signedCreate = await createSignedObject(createMsg, alice.privateKey);
  await client.sendTransaction(signedCreate, { ordinal: 0, hash: PARENT_HASH });
  console.log(`  ✓ Token DAO created: ${fiberId}`);
  console.log('  ✓ Token: OTTO');
  console.log('  ✓ Balances: Alice=600 (60%), Bob=300 (30%), Charlie=100 (10%)');

  const proposalId = crypto.randomUUID();

  await sendTransition(client, alice, fiberId, 'propose', {
    proposalId,
    proposer:    alice.address,
    title:       'Add Charlie as council member',
    description: 'Proposal to expand the council with Charlie',
    expiresAt:   new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }, 1);
  console.log(`\n  ✓ Proposal: "Add Charlie as council member"`);

  // Alice votes YES — 600/1000 = 60% voting power
  await sendTransition(client, alice, fiberId, 'vote', {
    proposalId,
    voter:    alice.address,
    choice:   VoteChoice.YES,
    power:    600,
    timestamp: new Date().toISOString(),
  }, 2);
  console.log('\n  ✓ Alice votes YES (60% voting power)');
  console.log('  ✓ Quorum: 60% ✓ (≥51% required)');
  console.log('  ✓ Passing: 60% YES ✓ (≥51% required)');
  console.log('  ✓ Proposal passes!');

  // Charlie votes NO (doesn't change outcome — already passing)
  await sendTransition(client, charlie, fiberId, 'vote', {
    proposalId,
    voter:     charlie.address,
    choice:    VoteChoice.NO,
    power:     100,
    timestamp: new Date().toISOString(),
  }, 3);
  console.log('  ✓ Charlie votes NO (10% — outcome unchanged)');

  const state = await queryState(fiberId);
  if (state) {
    console.log(`\n  DAO state: ${(state as { currentState: string }).currentState}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  OttoChain SDK — DAO Governance Example      ║');
  console.log(`║  Type: ${DAO_TYPE.padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════╝');

  const alice   = await generateKeyPair();
  const bob     = await generateKeyPair();
  const charlie = await generateKeyPair();
  const members = [alice, bob, charlie];

  console.log(`\n  Alice:   ${alice.address}`);
  console.log(`  Bob:     ${bob.address}`);
  console.log(`  Charlie: ${charlie.address}`);

  if (DAO_TYPE === 'token') {
    await runTokenDAO(members);
  } else {
    await runMultisigDAO(members);
  }

  console.log('\n✅  Governance example complete!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
