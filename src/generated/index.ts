/**
 * Generated Protobuf Types
 *
 * Auto-generated from proto/ definitions using ts-proto.
 * DO NOT EDIT - regenerate with `pnpm run generate`
 *
 * @packageDocumentation
 */

// Core types
export {
  FiberOrdinal,
  SnapshotOrdinal,
  StateId,
  HashValue,
  Address,
} from './ottochain/v1/common.js';

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

// App: Identity
export {
  AgentState,
  Platform,
  PlatformLink,
  AgentIdentity,
  AgentIdentityDefinition,
} from './ottochain/apps/identity/v1/agent.js';

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
  ContractState,
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
  MarketType,
  MarketState,
  Commitment,
  Resolution,
  Market,
  CreateMarketRequest,
  CommitToMarketRequest,
  SubmitResolutionRequest,
  CancelMarketRequest,
  MarketDefinition,
} from './ottochain/apps/markets/v1/market.js';

// App: Oracles
export {
  OracleState,
  OracleReputation,
  SlashingEvent,
  Oracle,
  RegisterOracleRequest,
  ActivateOracleRequest,
  AddStakeRequest,
  WithdrawStakeRequest,
  SlashOracleRequest,
  WithdrawOracleRequest,
  OracleDefinition,
} from './ottochain/apps/oracles/v1/oracle.js';

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
