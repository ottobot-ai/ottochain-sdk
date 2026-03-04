/**
 * Identity Example: DID + Credential Workflow
 *
 * Demonstrates the complete Agent Identity lifecycle on OttoChain:
 *   1. Register a new agent identity (DID)
 *   2. Add platform links (GitHub, Twitter, etc.)
 *   3. Issue and receive attestations
 *   4. Build reputation through vouching
 *   5. Query identity state
 *
 * Prerequisites:
 *   - OttoChain cluster running (or use METAGRAPH_URL env var)
 *   - Bridge service running (or use BRIDGE_URL env var)
 *
 * Run:
 *   npx tsx examples/identity/did-credential-workflow.ts
 */

import {
  generateKeyPair,
  createSignedObject,
  DataL1Client,
} from '../../src/index.js';
import {
  getIdentityDefinition,
  AgentState,
  Platform,
} from '../../src/apps/identity/index.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const METAGRAPH_URL   = process.env.METAGRAPH_URL   ?? 'http://localhost:9300';
const BRIDGE_URL      = process.env.BRIDGE_URL      ?? 'http://localhost:3030';
const PARENT_ORDINAL  = 0;
const PARENT_HASH     = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForFiber(
  client: DataL1Client,
  fiberId: string,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`${BRIDGE_URL}/state-machines/${fiberId}`);
      if (resp.ok) return;
    } catch {
      // not yet
    }
    await sleep(1_000);
  }
  throw new Error(`Fiber ${fiberId} did not appear within ${timeoutMs}ms`);
}

// ─── Steps ────────────────────────────────────────────────────────────────────

/**
 * Step 1 — Register agent identity
 *
 * Creates a new state machine fiber for the agent using the identity
 * state machine definition from the SDK.
 */
async function registerAgentIdentity(agentKeyPair: Awaited<ReturnType<typeof generateKeyPair>>) {
  console.log('\n🪪  Step 1: Register Agent Identity\n');

  const identityDef = getIdentityDefinition();
  const fiberId     = crypto.randomUUID();

  const createMsg = {
    CreateStateMachine: {
      fiberId,
      definition:   identityDef,
      initialState: 'unregistered',
      initialData: {
        agentId:     agentKeyPair.address,
        displayName: 'Demo Agent',
        platforms:   [],
        reputation:  0,
        attestations: [],
      },
    },
  };

  const client  = new DataL1Client({ baseUrl: METAGRAPH_URL });
  const signed  = await createSignedObject(createMsg, agentKeyPair.privateKey);
  const parent  = { ordinal: PARENT_ORDINAL, hash: PARENT_HASH };
  await client.sendTransaction(signed, parent);

  console.log(`  ✓ Agent registered — fiberId: ${fiberId}`);
  console.log(`  ✓ Address: ${agentKeyPair.address}`);
  return fiberId;
}

/**
 * Step 2 — Add platform link (GitHub)
 *
 * Transitions the identity fiber to 'registered' state with a
 * verified platform link.
 */
async function addPlatformLink(
  agentKeyPair: Awaited<ReturnType<typeof generateKeyPair>>,
  fiberId:      string,
) {
  console.log('\n🔗  Step 2: Add Platform Link (GitHub)\n');

  const client = new DataL1Client({ baseUrl: METAGRAPH_URL });

  const addLinkMsg = {
    TransitionStateMachine: {
      fiberId,
      event: 'register',
      data: {
        agentId:     agentKeyPair.address,
        displayName: 'Demo Agent',
        platforms: [
          {
            platform: Platform.GITHUB,
            handle:   'demo-agent',
            verified: true,
          },
        ],
      },
    },
  };

  const signed = await createSignedObject(addLinkMsg, agentKeyPair.privateKey);
  const parent = { ordinal: PARENT_ORDINAL + 1, hash: PARENT_HASH };
  await client.sendTransaction(signed, parent);

  console.log(`  ✓ Platform link added — github:demo-agent`);
}

/**
 * Step 3 — Issue attestation
 *
 * Another agent vouches for the demo agent, increasing its reputation.
 */
async function issueAttestation(
  attesterKeyPair: Awaited<ReturnType<typeof generateKeyPair>>,
  subjectFiberId:  string,
) {
  console.log('\n📜  Step 3: Issue Attestation (Vouch)\n');

  const client = new DataL1Client({ baseUrl: METAGRAPH_URL });

  const vouchMsg = {
    TransitionStateMachine: {
      fiberId: subjectFiberId,
      event:   'vouch',
      data: {
        attester:  attesterKeyPair.address,
        subject:   subjectFiberId,
        message:   'Verified contributor — high-quality work',
        reputationDelta: 10,
      },
    },
  };

  const signed = await createSignedObject(vouchMsg, attesterKeyPair.privateKey);
  const parent = { ordinal: PARENT_ORDINAL + 2, hash: PARENT_HASH };
  await client.sendTransaction(signed, parent);

  console.log(`  ✓ Attestation issued by ${attesterKeyPair.address}`);
}

/**
 * Step 4 — Query identity state
 *
 * Reads the current state of the identity fiber from the bridge.
 */
async function queryIdentityState(fiberId: string) {
  console.log('\n🔍  Step 4: Query Identity State\n');

  const resp = await fetch(`${BRIDGE_URL}/state-machines/${fiberId}`);
  if (!resp.ok) {
    console.log(`  ⚠  Fiber not found (cluster may not be running): ${resp.status}`);
    return;
  }

  const state = await resp.json() as { currentState: string; stateData: Record<string, unknown> };
  console.log(`  ✓ State: ${state.currentState}`);
  console.log(`  ✓ Reputation: ${state.stateData.reputation ?? 0}`);
  console.log(`  ✓ Platforms: ${JSON.stringify(state.stateData.platforms ?? [])}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  OttoChain SDK — Identity Workflow Example   ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Generate key pairs
  const agentKeys    = await generateKeyPair();
  const attesterKeys = await generateKeyPair();

  console.log(`\n  Agent address:    ${agentKeys.address}`);
  console.log(`  Attester address: ${attesterKeys.address}`);

  // Run workflow
  const fiberId = await registerAgentIdentity(agentKeys);
  await addPlatformLink(agentKeys, fiberId);
  await issueAttestation(attesterKeys, fiberId);
  await queryIdentityState(fiberId);

  console.log('\n✅  Identity workflow complete!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
