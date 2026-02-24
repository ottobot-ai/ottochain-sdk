/**
 * Generated Protobuf Types
 *
 * Auto-generated from proto/ definitions using ts-proto.
 * DO NOT EDIT - regenerate with `npm run generate`
 *
 * @packageDocumentation
 *
 * NOTE — Dual-type architecture:
 * These generated types use proto conventions (FIBER_STATUS_ACTIVE, StateId { value } wrappers).
 * The wire-format REST API types in src/ottochain/types.ts use plain strings ('Active').
 * Both coexist intentionally until PR #89 (Migrate fiber-engine to generated Scala types) merges.
 *
 * TODO PR #89 migration: after PR #89 merges and cluster confirms new format,
 * migrate all state-machine JSON files in src/apps/ from Circe-format
 * ({ value: '...' } wrapped initialState) to plain string format.
 * See docs/type-architecture.md for full migration plan.
 */
export { FiberStatus, AccessControlPolicy, PublicAccess, WhitelistAccess, FiberOwnedAccess, StateMachineDefinition, EmittedEvent, EventReceipt, ScriptInvocation, FiberLogEntry, } from './ottochain/v1/fiber.js';
export { CreateStateMachine, TransitionStateMachine, ArchiveStateMachine, CreateScript, InvokeScript, OttochainMessage, } from './ottochain/v1/messages.js';
export { StateMachineFiberRecord, ScriptFiberRecord, FiberCommit, OnChainState, CalculatedState, } from './ottochain/v1/records.js';
export { AgentState, Platform, PlatformLink, AgentIdentity, AgentIdentityDefinition, } from './ottochain/apps/identity/v1/agent.js';
export { AttestationType, ReputationDelta, Attestation, VouchRequest, ChallengeRequest, ReputationConfig, } from './ottochain/apps/identity/v1/attestation.js';
export { ContractState, Contract, ProposeContractRequest, AcceptContractRequest, CompleteContractRequest, RejectContractRequest, DisputeContractRequest, ContractDefinition, } from './ottochain/apps/contracts/v1/contract.js';
export { MarketType, MarketState, Commitment, Resolution, Market, CreateMarketRequest, CommitToMarketRequest, SubmitResolutionRequest, CancelMarketRequest, MarketDefinition, } from './ottochain/apps/markets/v1/market.js';
export { OracleState, OracleReputation, SlashingEvent, Oracle, RegisterOracleRequest, ActivateOracleRequest, AddStakeRequest, WithdrawStakeRequest, SlashOracleRequest, WithdrawOracleRequest, OracleDefinition, } from './ottochain/apps/oracles/v1/oracle.js';
export { DAOType, DAOStatus, ProposalStatus, VoteChoice, DAOMetadata, Proposal, Vote, VoteTally, SingleOwnerDAO, SingleOwnerAction, OwnershipTransfer, MultisigDAO, MultisigAction, TokenDAO, TokenProposalResult, ThresholdDAO, ThresholdVotes, ThresholdHistoryEntry, CreateDAORequest, ProposeRequest, VoteRequest, ExecuteRequest, } from './ottochain/apps/governance/v1/governance.js';
export { EntityType, EntityState, DirectorStatus, OfficerStatus, BoardMeetingType, ResolutionStatus, Jurisdiction, ShareClass, CorporateEntity, RegisteredAgent, Incorporator, ShareStructure, CorporateBoard, Director, SeatInfo, QuorumRules, BoardMeeting, MeetingAttendee, CorporateOfficers, Officer, OfficerAction, CorporateShareholders, Shareholder, ShareHolding, CorporateResolution, ResolutionVote, CorporateSecurities, SecurityIssuance, SecurityTransfer, CorporateCompliance, FilingRecord, ComplianceRequirement, CreateEntityRequest, AppointDirectorRequest, IssueSharesRequest, ProposeResolutionRequest, } from './ottochain/apps/corporate/v1/corporate.js';
