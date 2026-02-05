/**
 * Contracts Application
 * 
 * Types and utilities for the Contract system on OttoChain.
 * 
 * @example
 * ```typescript
 * import { Contract, ContractState, CONTRACT_TRANSITIONS } from '@ottochain/sdk/apps/contracts';
 * 
 * const contract: Contract = {
 *   id: 'fiber-123',
 *   contractId: 'contract-001',
 *   proposer: 'DAG...',
 *   counterparty: 'DAG...',
 *   state: 'PROPOSED',
 *   terms: { task: 'Build feature X', deadline: '2026-03-01' },
 *   proposedAt: new Date().toISOString(),
 * };
 * ```
 * 
 * @packageDocumentation
 */

export * from './types.js';
