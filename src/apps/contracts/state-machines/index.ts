/**
 * Contract State Machine Definitions
 */

export { contractAgreementDef, type AgreementState, type AgreementEvent } from './contract-agreement.js';
export { contractEscrowDef, type EscrowState, type EscrowEvent } from './contract-escrow.js';
export { contractUniversalDef, type UniversalContractState, type UniversalContractEvent } from './contract-universal.js';

export const CONTRACT_DEFINITIONS = {
  agreement: () => import('./contract-agreement.js').then(m => m.contractAgreementDef),
  escrow: () => import('./contract-escrow.js').then(m => m.contractEscrowDef),
  universal: () => import('./contract-universal.js').then(m => m.contractUniversalDef),
} as const;

export type ContractType = keyof typeof CONTRACT_DEFINITIONS;
