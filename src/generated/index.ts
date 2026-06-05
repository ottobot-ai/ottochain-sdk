/**
 * Generated Protobuf Types
 *
 * Auto-generated from proto/ definitions using ts-proto.
 * DO NOT EDIT - regenerate with `npm run generate`
 *
 * @packageDocumentation
 *
 * NOTE — Dual-type architecture:
 * These generated types use proto conventions (FIBER_STATUS_ACTIVE, plain string StateId).
 * The wire-format REST API types in src/ottochain/types.ts use plain strings ('Active').
 * Both coexist intentionally until PR #89 (Migrate fiber-engine to generated Scala types) merges.
 *
 * TODO PR #89 migration: after PR #89 merges and cluster confirms new format,
 * migrate all state-machine JSON files in src/apps/ from Circe-format
 * ({ value: '...' } wrapped initialState) to plain string format.
 * See docs/type-architecture.md for full migration plan.
 */

// Core types (primitives - no wrapper messages)
// Type aliases are in src/types.ts

export {
  FiberStatus,
  AccessControlPolicy,
  PublicAccess,
  WhitelistAccess,
  FiberOwnedAccess,
  StateMachineDefinition,
  EmittedEvent,
  EventReceipt,
  ScriptInvocation,
  FiberLogEntry,
} from './ottochain/v1/fiber.js';

export {
  CreateStateMachine,
  TransitionStateMachine,
  ArchiveStateMachine,
  CreateScript,
  InvokeScript,
  OttochainMessage,
} from './ottochain/v1/messages.js';

export {
  StateMachineFiberRecord,
  ScriptFiberRecord,
  FiberCommit,
  OnChainState,
  CalculatedState,
} from './ottochain/v1/records.js';

// App: Identity (unified in v2.1)
// The nested lifecycle/kind enums dropped their app prefix in the proto
// (now Type/State, disambiguated by package ottochain.apps.identity.v1).
// This flat barrel re-aliases them back to app-qualified names so the global
// export namespace stays collision-free across apps.
export {
  Type as IdentityType,
  State as IdentityState,
  Platform,
  PlatformLink,
  Reputation,
  PenaltyEvent,
  Identity,
  RegisterIdentityRequest,
  ActivateIdentityRequest,
  LinkPlatformRequest,
  ChallengeIdentityRequest,
  AddStakeRequest,
  WithdrawIdentityRequest,
  IdentityDefinition,
} from './ottochain/apps/identity/v1/identity.js';

// Legacy aliases for backward compatibility
export { State as AgentState } from './ottochain/apps/identity/v1/identity.js';
export { State as OracleState } from './ottochain/apps/identity/v1/identity.js';

export {
  AttestationType,
  ReputationDelta,
  Attestation,
  VouchRequest,
  ChallengeRequest,
  ReputationConfig,
} from './ottochain/apps/identity/v1/attestation.js';

// App: Contracts
export {
  State as ContractState,
  Contract,
  ProposeContractRequest,
  AcceptContractRequest,
  CompleteContractRequest,
  RejectContractRequest,
  DisputeContractRequest,
  ContractDefinition,
} from './ottochain/apps/contracts/v1/contract.js';

// App: Markets
export {
  Type as MarketType,
  State as MarketState,
  Commitment,
  Resolution,
  Market,
  CreateMarketRequest,
  CommitToMarketRequest,
  SubmitResolutionRequest,
  CancelMarketRequest,
  MarketDefinition,
} from './ottochain/apps/markets/v1/market.js';

// App: Oracles - REMOVED in v2.1 (absorbed into identity)
// OracleState is now an alias for IdentityState (see above)
// Oracle-specific messages moved to identity.proto

// App: Governance
export {
  DAOType,
  DAOStatus,
  ProposalStatus,
  VoteChoice,
  DAOMetadata,
  Proposal,
  Vote,
  VoteTally,
  SingleOwnerDAO,
  SingleOwnerAction,
  OwnershipTransfer,
  MultisigDAO,
  MultisigAction,
  TokenDAO,
  TokenProposalResult,
  ThresholdDAO,
  ThresholdVotes,
  ThresholdHistoryEntry,
  CreateDAORequest,
  ProposeRequest,
  VoteRequest,
  ExecuteRequest,
} from './ottochain/apps/governance/v1/governance.js';

// App: Corporate
export {
  EntityType,
  EntityState,
  DirectorStatus,
  OfficerStatus,
  BoardMeetingType,
  ResolutionStatus,
  Jurisdiction,
  ShareClass,
  CorporateEntity,
  RegisteredAgent,
  Incorporator,
  ShareStructure,
  CorporateBoard,
  Director,
  SeatInfo,
  QuorumRules,
  BoardMeeting,
  MeetingAttendee,
  CorporateOfficers,
  Officer,
  OfficerAction,
  CorporateShareholders,
  Shareholder,
  ShareHolding,
  CorporateResolution,
  ResolutionVote,
  CorporateSecurities,
  SecurityIssuance,
  SecurityTransfer,
  CorporateCompliance,
  FilingRecord,
  ComplianceRequirement,
  CreateEntityRequest,
  AppointDirectorRequest,
  IssueSharesRequest,
  ProposeResolutionRequest,
} from './ottochain/apps/corporate/v1/corporate.js';
