/**
 * Agent Profile — IndexerClient
 *
 * In-memory implementation of the IndexerClient interface for unit testing.
 * Mirrors the shape of fiber records returned by the ottochain-services indexer.
 */

// ── Data shapes matching indexer fiber records ────────────────────────────

export interface AgentFiberRecord {
  id: string;
  owners: string[];
  workflowType: 'AgentProfile';
  currentState: string;
  stateData: {
    agentId: string;
    walletAddress: string;
    displayName: string;
    capabilities: string[];
    customCapabilities?: string[];
    reputationScore: number;
    stakeBonded: number;
    isActive: boolean;
    registrationOrdinal: number;
    lastActiveOrdinal?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ReputationHistoryEntry {
  ordinal: number;
  transactionType: 'task_completion' | 'stake_update' | 'profile_update';
  timestamp: number;
  reputationChange: number;
  success?: boolean;
}

export interface IndexerClient {
  getAgentProfileByWallet(walletAddress: string): Promise<AgentFiberRecord | null>;
  searchAgentsByCapability(capability: string): Promise<AgentFiberRecord[]>;
  getAgentReputationHistory(walletAddress: string): Promise<ReputationHistoryEntry[]>;
  getActiveAgents(limit?: number): Promise<AgentFiberRecord[]>;
}

// ── Seed data for test environment ────────────────────────────────────────

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const SEED_PROFILES: AgentFiberRecord[] = [
  {
    id: 'fiber-agent-001',
    owners: [TEST_WALLET],
    workflowType: 'AgentProfile',
    currentState: 'active',
    stateData: {
      agentId:             'agent-001',
      walletAddress:       TEST_WALLET,
      displayName:         'Test ML Agent',
      capabilities:        ['ml_classify', 'data_process'],
      reputationScore:     85,
      stakeBonded:         2000,
      isActive:            true,
      registrationOrdinal: 100,
      lastActiveOrdinal:   200,
    },
    createdAt: 1700000000000,
    updatedAt: 1700000100000,
  },
  {
    id: 'fiber-agent-002',
    owners: ['0xabcdef1234567890abcdef1234567890abcdef12'],
    workflowType: 'AgentProfile',
    currentState: 'active',
    stateData: {
      agentId:             'agent-002',
      walletAddress:       '0xabcdef1234567890abcdef1234567890abcdef12',
      displayName:         'Oracle Provider Agent',
      capabilities:        ['oracle_feed', 'data_process'],
      reputationScore:     72,
      stakeBonded:         1500,
      isActive:            true,
      registrationOrdinal: 110,
    },
    createdAt: 1700000200000,
    updatedAt: 1700000300000,
  },
];

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create an IndexerClient backed by the provided fiber records (or the built-in seed data).
 */
export function createIndexerClient(records?: AgentFiberRecord[]): IndexerClient {
  const store = records ?? SEED_PROFILES;

  return {
    async getAgentProfileByWallet(walletAddress: string): Promise<AgentFiberRecord | null> {
      return store.find(r => r.owners.includes(walletAddress)) ?? null;
    },

    async searchAgentsByCapability(capability: string): Promise<AgentFiberRecord[]> {
      return store.filter(
        r =>
          r.currentState === 'active' &&
          r.stateData.isActive &&
          (r.stateData.capabilities.includes(capability) ||
            (r.stateData.customCapabilities ?? []).includes(capability))
      );
    },

    async getAgentReputationHistory(walletAddress: string): Promise<ReputationHistoryEntry[]> {
      const profile = store.find(r => r.owners.includes(walletAddress));
      if (!profile) return [];

      // Synthesise a short history for the test wallet
      if (walletAddress === TEST_WALLET) {
        return [
          { ordinal: 101, transactionType: 'task_completion', timestamp: 1700000050000, reputationChange: 5, success: true },
          { ordinal: 150, transactionType: 'task_completion', timestamp: 1700000090000, reputationChange: 3, success: true },
          { ordinal: 180, transactionType: 'task_completion', timestamp: 1700000120000, reputationChange: -2, success: false },
        ];
      }
      return [];
    },

    async getActiveAgents(limit = 100): Promise<AgentFiberRecord[]> {
      const active = store
        .filter(r => r.currentState === 'active' && r.stateData.isActive)
        .sort((a, b) => b.stateData.reputationScore - a.stateData.reputationScore);
      return active.slice(0, limit);
    },
  };
}

/** Pre-built test indexer client with seed data. */
export const testIndexerClient: IndexerClient = createIndexerClient();
