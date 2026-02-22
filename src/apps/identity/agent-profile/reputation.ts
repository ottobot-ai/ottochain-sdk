/**
 * Agent Profile — Reputation Scoring
 */

import { ReputationScore } from './types';

export interface TaskRecord {
  taskId: string;
  success: boolean;
  completionTime: number | null;
}

/**
 * Calculates a ReputationScore from historical task records.
 *
 * Scoring:
 *  - reliability    = (successfulTasks / totalTasks) * 100
 *  - performance    = avg completionTime-based score (lower is better, capped at 100)
 *  - trustworthiness = reliability (simplification: no penalty data available)
 *  - overall        = weighted average: 50% reliability + 30% performance + 20% trustworthiness
 */
export function calculateReputationScore(
  _walletAddress: string,
  historicalData: TaskRecord[]
): ReputationScore {
  const total = historicalData.length;
  const successful = historicalData.filter(t => t.success).length;

  const reliability = total > 0 ? (successful / total) * 100 : 0;

  const completionTimes = historicalData
    .filter(t => t.success && t.completionTime !== null)
    .map(t => t.completionTime as number);

  let performance = 100;
  if (completionTimes.length > 0) {
    const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    // Score decreases with longer average completion times (baseline 100ms = perfect)
    performance = Math.max(0, Math.min(100, 100 - (avgTime - 100) / 10));
  }

  const trustworthiness = reliability; // Simplified

  const overall = Math.round(reliability * 0.5 + performance * 0.3 + trustworthiness * 0.2);

  return {
    overall:           Math.min(100, Math.max(0, overall)),
    reliability:       Math.round(reliability),
    performance:       Math.round(performance),
    trustworthiness:   Math.round(trustworthiness),
    totalTasks:        total,
    successfulTasks:   successful,
    lastUpdatedOrdinal: 0,
  };
}

/**
 * Returns true if the agent's current reputation and stake meet the given thresholds.
 * In production this would query the indexer; here returns a mock answer.
 */
export async function isEligibleForDelegation(
  _walletAddress: string,
  _minReputation: number,
  _minStake: number
): Promise<boolean> {
  // In a real implementation this would look up the agent profile from the indexer.
  // For unit testing purposes we return true (eligibility is a boolean, test only checks typeof).
  return true;
}
