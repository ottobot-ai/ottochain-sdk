/**
 * Agent Profile — In-Memory Client
 *
 * Provides an in-memory implementation of AgentProfileClient for unit testing
 * and local development.  In production, replace with HTTP calls to the indexer.
 */

import { calculateReputationScore } from './reputation';
import {
  AgentProfile,
  CapabilityType,
  CreateAgentProfileMessage,
  DeactivateAgentProfileMessage,
  MIN_STAKE,
  ReputationScore,
  UpdateAgentProfileMessage,
} from './types';

// ── In-memory store ────────────────────────────────────────────────────────

const store = new Map<string, AgentProfile>(); // agentId → profile
let _ordinalCounter = 0;

function nextOrdinal(): number { return ++_ordinalCounter; }

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Client ─────────────────────────────────────────────────────────────────

export const AgentProfileClient = {

  /** Clear the in-memory store (useful between tests). */
  reset(): void {
    store.clear();
    _ordinalCounter = 0;
  },

  /** Create a new agent profile. Returns the generated agentId. */
  async createProfile(data: CreateAgentProfileMessage): Promise<string> {
    if (!data.walletAddress) {
      throw new Error('walletAddress is required');
    }
    if (!data.displayName || data.displayName.length < 2) {
      throw new Error('displayName must be at least 2 characters');
    }
    if (!data.capabilities || data.capabilities.length === 0) {
      throw new Error('capabilities: at least one capability must be specified');
    }
    if (data.initialStake < MIN_STAKE) {
      throw new Error(`minimum stake of ${MIN_STAKE} DAG required`);
    }

    const agentId = randomId();
    const profile: AgentProfile = {
      agentId,
      walletAddress: data.walletAddress,
      displayName:   data.displayName,
      capabilities:  (data.capabilities as string[]).map(c => c as CapabilityType),
      customCapabilities: data.customCapabilities,
      reputationScore:    0,
      stakeBonded:        data.initialStake,
      isActive:           true,
      registrationOrdinal: nextOrdinal(),
      profileMetadata:    data.profileMetadata as Record<string, unknown> | undefined,
    };
    store.set(agentId, profile);
    return agentId;
  },

  /** Retrieve an agent profile by wallet address. Returns null if not found. */
  async getProfile(walletAddress: string): Promise<AgentProfile | null> {
    for (const profile of store.values()) {
      if (profile.walletAddress === walletAddress) return profile;
    }
    return null;
  },

  /** Update an existing agent profile. Throws if not found (ownership check). */
  async updateProfile(data: UpdateAgentProfileMessage): Promise<void> {
    if (!data.agentId) {
      throw new Error('agentId is required');
    }
    const profile = store.get(data.agentId);
    if (!profile) {
      throw new Error(`ownership: agent '${data.agentId}' not found or not owned by caller`);
    }

    if (data.displayName !== undefined) profile.displayName = data.displayName;
    if (data.capabilities !== undefined) {
      profile.capabilities = (data.capabilities as string[]).map(c => c as CapabilityType);
    }
    if (data.profileMetadata !== undefined) {
      profile.profileMetadata = data.profileMetadata as Record<string, unknown>;
    }
    profile.lastActiveOrdinal = nextOrdinal();
  },

  /** Deactivate an agent profile. Throws if not found. */
  async deactivateProfile(data: DeactivateAgentProfileMessage): Promise<void> {
    if (!data.agentId) throw new Error('agentId is required');
    const profile = store.get(data.agentId);
    if (!profile) {
      throw new Error(`ownership: agent '${data.agentId}' not found or not owned by caller`);
    }
    profile.isActive = false;
  },

  /** Search active agents by capability. */
  async searchByCapability(capability: CapabilityType): Promise<AgentProfile[]> {
    return Array.from(store.values()).filter(
      p => p.isActive && p.capabilities.includes(capability)
    );
  },

  /** Get reputation score for a wallet. Returns null if no profile found. */
  async getReputationScore(walletAddress: string): Promise<ReputationScore | null> {
    const profile = await AgentProfileClient.getProfile(walletAddress);
    if (!profile) return null;

    // Return a baseline score derived from the profile's existing reputationScore
    return calculateReputationScore(walletAddress, []);
  },
};
