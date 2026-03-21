/**
 * Corporate Governance State Machines
 *
 * TypeScript definitions using defineFiberApp() pattern.
 * Converted from JSON state machine definitions.
 */

// Core corporate state machines
export {
  corpEntityDef,
  type CorpEntityState,
  type CorpEntityEvent,
} from "./corp-entity.js";
export {
  corpBoardDef,
  type CorpBoardState,
  type CorpBoardEvent,
} from "./corp-board.js";
export {
  corpShareholdersDef,
  type CorpShareholdersState,
  type CorpShareholdersEvent,
} from "./corp-shareholders.js";
export {
  corpSecuritiesDef,
  type CorpSecuritiesState,
  type CorpSecuritiesEvent,
} from "./corp-securities.js";

// Re-export all definitions as a collection
export const corporateStateMachines = {
  corpEntity: () => import("./corp-entity.js").then((m) => m.corpEntityDef),
  corpBoard: () => import("./corp-board.js").then((m) => m.corpBoardDef),
  corpShareholders: () =>
    import("./corp-shareholders.js").then((m) => m.corpShareholdersDef),
  corpSecurities: () =>
    import("./corp-securities.js").then((m) => m.corpSecuritiesDef),
} as const;
