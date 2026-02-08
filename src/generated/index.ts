/**
 * Generated Protobuf Types
 * 
 * Auto-generated from proto/ definitions.
 * DO NOT EDIT - regenerate with `npm run generate`
 * 
 * @packageDocumentation
 */

// Core types
export * from './ottochain/v1/common_pb.js';
export * from './ottochain/v1/fiber_pb.js';
export * from './ottochain/v1/messages_pb.js';
export * from './ottochain/v1/records_pb.js';

// App: Identity
export * from './ottochain/apps/identity/v1/agent_pb.js';
export * from './ottochain/apps/identity/v1/attestation_pb.js';

// App: Contracts
export * from './ottochain/apps/contracts/v1/contract_pb.js';

// App: Markets
export * from './ottochain/apps/markets/v1/market_pb.js';

// App: Oracles
export * from './ottochain/apps/oracles/v1/oracle_pb.js';

// App: Governance (selective export to avoid conflicts)
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
} from './ottochain/apps/governance/v1/governance_pb.js';

// App: Corporate (selective export to avoid conflicts with Address)
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
  // Note: Address not exported here - use ottochain.v1.Address from common_pb
} from './ottochain/apps/corporate/v1/corporate_pb.js';
