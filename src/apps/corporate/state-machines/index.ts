/**
 * Corporate State Machine Definitions
 */

export { corpEntityDef, type CorpEntityState, type CorpEntityEvent } from './corp-entity.js';
export { corpBoardDef, type CorpBoardState, type CorpBoardEvent } from './corp-board.js';
export { corpShareholdersDef, type CorpShareholdersState, type CorpShareholdersEvent } from './corp-shareholders.js';
export { corpSecuritiesDef, type CorpSecuritiesState, type CorpSecuritiesEvent } from './corp-securities.js';

export const CORPORATE_DEFINITIONS = {
  entity: () => import('./corp-entity.js').then(m => m.corpEntityDef),
  board: () => import('./corp-board.js').then(m => m.corpBoardDef),
  shareholders: () => import('./corp-shareholders.js').then(m => m.corpShareholdersDef),
  securities: () => import('./corp-securities.js').then(m => m.corpSecuritiesDef),
} as const;

export type CorporateType = keyof typeof CORPORATE_DEFINITIONS;
