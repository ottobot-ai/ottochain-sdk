"use strict";
/**
 * Generated Protobuf Types
 *
 * Auto-generated from proto/ definitions using ts-proto.
 * DO NOT EDIT - regenerate with `pnpm run generate`
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDefinition = exports.CancelMarketRequest = exports.SubmitResolutionRequest = exports.CommitToMarketRequest = exports.CreateMarketRequest = exports.Market = exports.Resolution = exports.Commitment = exports.MarketState = exports.MarketType = exports.ContractDefinition = exports.DisputeContractRequest = exports.RejectContractRequest = exports.CompleteContractRequest = exports.AcceptContractRequest = exports.ProposeContractRequest = exports.Contract = exports.ContractState = exports.ReputationConfig = exports.ChallengeRequest = exports.VouchRequest = exports.Attestation = exports.ReputationDelta = exports.AttestationType = exports.AgentIdentityDefinition = exports.AgentIdentity = exports.PlatformLink = exports.Platform = exports.AgentState = exports.CalculatedState = exports.OnChainState = exports.FiberCommit = exports.ScriptFiberRecord = exports.StateMachineFiberRecord = exports.OttochainMessage = exports.InvokeScript = exports.CreateScript = exports.ArchiveStateMachine = exports.TransitionStateMachine = exports.CreateStateMachine = exports.FiberLogEntry = exports.ScriptInvocation = exports.EventReceipt = exports.EmittedEvent = exports.StateMachineDefinition = exports.FiberOwnedAccess = exports.WhitelistAccess = exports.PublicAccess = exports.AccessControlPolicy = exports.FiberStatus = void 0;
exports.BoardMeeting = exports.QuorumRules = exports.SeatInfo = exports.Director = exports.CorporateBoard = exports.ShareStructure = exports.Incorporator = exports.RegisteredAgent = exports.CorporateEntity = exports.ShareClass = exports.Jurisdiction = exports.ResolutionStatus = exports.BoardMeetingType = exports.OfficerStatus = exports.DirectorStatus = exports.EntityState = exports.EntityType = exports.ExecuteRequest = exports.VoteRequest = exports.ProposeRequest = exports.CreateDAORequest = exports.ThresholdHistoryEntry = exports.ThresholdVotes = exports.ThresholdDAO = exports.TokenProposalResult = exports.TokenDAO = exports.MultisigAction = exports.MultisigDAO = exports.OwnershipTransfer = exports.SingleOwnerAction = exports.SingleOwnerDAO = exports.VoteTally = exports.Vote = exports.Proposal = exports.DAOMetadata = exports.VoteChoice = exports.ProposalStatus = exports.DAOStatus = exports.DAOType = exports.OracleDefinition = exports.WithdrawOracleRequest = exports.SlashOracleRequest = exports.WithdrawStakeRequest = exports.AddStakeRequest = exports.ActivateOracleRequest = exports.RegisterOracleRequest = exports.Oracle = exports.SlashingEvent = exports.OracleReputation = exports.OracleState = void 0;
exports.ProposeResolutionRequest = exports.IssueSharesRequest = exports.AppointDirectorRequest = exports.CreateEntityRequest = exports.ComplianceRequirement = exports.FilingRecord = exports.CorporateCompliance = exports.SecurityTransfer = exports.SecurityIssuance = exports.CorporateSecurities = exports.ResolutionVote = exports.CorporateResolution = exports.ShareHolding = exports.Shareholder = exports.CorporateShareholders = exports.OfficerAction = exports.Officer = exports.CorporateOfficers = exports.MeetingAttendee = void 0;
// Core types (primitives - no wrapper messages)
// Type aliases are in src/types.ts
var fiber_js_1 = require("./ottochain/v1/fiber.js");
Object.defineProperty(exports, "FiberStatus", { enumerable: true, get: function () { return fiber_js_1.FiberStatus; } });
Object.defineProperty(exports, "AccessControlPolicy", { enumerable: true, get: function () { return fiber_js_1.AccessControlPolicy; } });
Object.defineProperty(exports, "PublicAccess", { enumerable: true, get: function () { return fiber_js_1.PublicAccess; } });
Object.defineProperty(exports, "WhitelistAccess", { enumerable: true, get: function () { return fiber_js_1.WhitelistAccess; } });
Object.defineProperty(exports, "FiberOwnedAccess", { enumerable: true, get: function () { return fiber_js_1.FiberOwnedAccess; } });
Object.defineProperty(exports, "StateMachineDefinition", { enumerable: true, get: function () { return fiber_js_1.StateMachineDefinition; } });
Object.defineProperty(exports, "EmittedEvent", { enumerable: true, get: function () { return fiber_js_1.EmittedEvent; } });
Object.defineProperty(exports, "EventReceipt", { enumerable: true, get: function () { return fiber_js_1.EventReceipt; } });
Object.defineProperty(exports, "ScriptInvocation", { enumerable: true, get: function () { return fiber_js_1.ScriptInvocation; } });
Object.defineProperty(exports, "FiberLogEntry", { enumerable: true, get: function () { return fiber_js_1.FiberLogEntry; } });
var messages_js_1 = require("./ottochain/v1/messages.js");
Object.defineProperty(exports, "CreateStateMachine", { enumerable: true, get: function () { return messages_js_1.CreateStateMachine; } });
Object.defineProperty(exports, "TransitionStateMachine", { enumerable: true, get: function () { return messages_js_1.TransitionStateMachine; } });
Object.defineProperty(exports, "ArchiveStateMachine", { enumerable: true, get: function () { return messages_js_1.ArchiveStateMachine; } });
Object.defineProperty(exports, "CreateScript", { enumerable: true, get: function () { return messages_js_1.CreateScript; } });
Object.defineProperty(exports, "InvokeScript", { enumerable: true, get: function () { return messages_js_1.InvokeScript; } });
Object.defineProperty(exports, "OttochainMessage", { enumerable: true, get: function () { return messages_js_1.OttochainMessage; } });
var records_js_1 = require("./ottochain/v1/records.js");
Object.defineProperty(exports, "StateMachineFiberRecord", { enumerable: true, get: function () { return records_js_1.StateMachineFiberRecord; } });
Object.defineProperty(exports, "ScriptFiberRecord", { enumerable: true, get: function () { return records_js_1.ScriptFiberRecord; } });
Object.defineProperty(exports, "FiberCommit", { enumerable: true, get: function () { return records_js_1.FiberCommit; } });
Object.defineProperty(exports, "OnChainState", { enumerable: true, get: function () { return records_js_1.OnChainState; } });
Object.defineProperty(exports, "CalculatedState", { enumerable: true, get: function () { return records_js_1.CalculatedState; } });
// App: Identity
var agent_js_1 = require("./ottochain/apps/identity/v1/agent.js");
Object.defineProperty(exports, "AgentState", { enumerable: true, get: function () { return agent_js_1.AgentState; } });
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return agent_js_1.Platform; } });
Object.defineProperty(exports, "PlatformLink", { enumerable: true, get: function () { return agent_js_1.PlatformLink; } });
Object.defineProperty(exports, "AgentIdentity", { enumerable: true, get: function () { return agent_js_1.AgentIdentity; } });
Object.defineProperty(exports, "AgentIdentityDefinition", { enumerable: true, get: function () { return agent_js_1.AgentIdentityDefinition; } });
var attestation_js_1 = require("./ottochain/apps/identity/v1/attestation.js");
Object.defineProperty(exports, "AttestationType", { enumerable: true, get: function () { return attestation_js_1.AttestationType; } });
Object.defineProperty(exports, "ReputationDelta", { enumerable: true, get: function () { return attestation_js_1.ReputationDelta; } });
Object.defineProperty(exports, "Attestation", { enumerable: true, get: function () { return attestation_js_1.Attestation; } });
Object.defineProperty(exports, "VouchRequest", { enumerable: true, get: function () { return attestation_js_1.VouchRequest; } });
Object.defineProperty(exports, "ChallengeRequest", { enumerable: true, get: function () { return attestation_js_1.ChallengeRequest; } });
Object.defineProperty(exports, "ReputationConfig", { enumerable: true, get: function () { return attestation_js_1.ReputationConfig; } });
// App: Contracts
var contract_js_1 = require("./ottochain/apps/contracts/v1/contract.js");
Object.defineProperty(exports, "ContractState", { enumerable: true, get: function () { return contract_js_1.ContractState; } });
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return contract_js_1.Contract; } });
Object.defineProperty(exports, "ProposeContractRequest", { enumerable: true, get: function () { return contract_js_1.ProposeContractRequest; } });
Object.defineProperty(exports, "AcceptContractRequest", { enumerable: true, get: function () { return contract_js_1.AcceptContractRequest; } });
Object.defineProperty(exports, "CompleteContractRequest", { enumerable: true, get: function () { return contract_js_1.CompleteContractRequest; } });
Object.defineProperty(exports, "RejectContractRequest", { enumerable: true, get: function () { return contract_js_1.RejectContractRequest; } });
Object.defineProperty(exports, "DisputeContractRequest", { enumerable: true, get: function () { return contract_js_1.DisputeContractRequest; } });
Object.defineProperty(exports, "ContractDefinition", { enumerable: true, get: function () { return contract_js_1.ContractDefinition; } });
// App: Markets
var market_js_1 = require("./ottochain/apps/markets/v1/market.js");
Object.defineProperty(exports, "MarketType", { enumerable: true, get: function () { return market_js_1.MarketType; } });
Object.defineProperty(exports, "MarketState", { enumerable: true, get: function () { return market_js_1.MarketState; } });
Object.defineProperty(exports, "Commitment", { enumerable: true, get: function () { return market_js_1.Commitment; } });
Object.defineProperty(exports, "Resolution", { enumerable: true, get: function () { return market_js_1.Resolution; } });
Object.defineProperty(exports, "Market", { enumerable: true, get: function () { return market_js_1.Market; } });
Object.defineProperty(exports, "CreateMarketRequest", { enumerable: true, get: function () { return market_js_1.CreateMarketRequest; } });
Object.defineProperty(exports, "CommitToMarketRequest", { enumerable: true, get: function () { return market_js_1.CommitToMarketRequest; } });
Object.defineProperty(exports, "SubmitResolutionRequest", { enumerable: true, get: function () { return market_js_1.SubmitResolutionRequest; } });
Object.defineProperty(exports, "CancelMarketRequest", { enumerable: true, get: function () { return market_js_1.CancelMarketRequest; } });
Object.defineProperty(exports, "MarketDefinition", { enumerable: true, get: function () { return market_js_1.MarketDefinition; } });
// App: Oracles
var oracle_js_1 = require("./ottochain/apps/oracles/v1/oracle.js");
Object.defineProperty(exports, "OracleState", { enumerable: true, get: function () { return oracle_js_1.OracleState; } });
Object.defineProperty(exports, "OracleReputation", { enumerable: true, get: function () { return oracle_js_1.OracleReputation; } });
Object.defineProperty(exports, "SlashingEvent", { enumerable: true, get: function () { return oracle_js_1.SlashingEvent; } });
Object.defineProperty(exports, "Oracle", { enumerable: true, get: function () { return oracle_js_1.Oracle; } });
Object.defineProperty(exports, "RegisterOracleRequest", { enumerable: true, get: function () { return oracle_js_1.RegisterOracleRequest; } });
Object.defineProperty(exports, "ActivateOracleRequest", { enumerable: true, get: function () { return oracle_js_1.ActivateOracleRequest; } });
Object.defineProperty(exports, "AddStakeRequest", { enumerable: true, get: function () { return oracle_js_1.AddStakeRequest; } });
Object.defineProperty(exports, "WithdrawStakeRequest", { enumerable: true, get: function () { return oracle_js_1.WithdrawStakeRequest; } });
Object.defineProperty(exports, "SlashOracleRequest", { enumerable: true, get: function () { return oracle_js_1.SlashOracleRequest; } });
Object.defineProperty(exports, "WithdrawOracleRequest", { enumerable: true, get: function () { return oracle_js_1.WithdrawOracleRequest; } });
Object.defineProperty(exports, "OracleDefinition", { enumerable: true, get: function () { return oracle_js_1.OracleDefinition; } });
// App: Governance
var governance_js_1 = require("./ottochain/apps/governance/v1/governance.js");
Object.defineProperty(exports, "DAOType", { enumerable: true, get: function () { return governance_js_1.DAOType; } });
Object.defineProperty(exports, "DAOStatus", { enumerable: true, get: function () { return governance_js_1.DAOStatus; } });
Object.defineProperty(exports, "ProposalStatus", { enumerable: true, get: function () { return governance_js_1.ProposalStatus; } });
Object.defineProperty(exports, "VoteChoice", { enumerable: true, get: function () { return governance_js_1.VoteChoice; } });
Object.defineProperty(exports, "DAOMetadata", { enumerable: true, get: function () { return governance_js_1.DAOMetadata; } });
Object.defineProperty(exports, "Proposal", { enumerable: true, get: function () { return governance_js_1.Proposal; } });
Object.defineProperty(exports, "Vote", { enumerable: true, get: function () { return governance_js_1.Vote; } });
Object.defineProperty(exports, "VoteTally", { enumerable: true, get: function () { return governance_js_1.VoteTally; } });
Object.defineProperty(exports, "SingleOwnerDAO", { enumerable: true, get: function () { return governance_js_1.SingleOwnerDAO; } });
Object.defineProperty(exports, "SingleOwnerAction", { enumerable: true, get: function () { return governance_js_1.SingleOwnerAction; } });
Object.defineProperty(exports, "OwnershipTransfer", { enumerable: true, get: function () { return governance_js_1.OwnershipTransfer; } });
Object.defineProperty(exports, "MultisigDAO", { enumerable: true, get: function () { return governance_js_1.MultisigDAO; } });
Object.defineProperty(exports, "MultisigAction", { enumerable: true, get: function () { return governance_js_1.MultisigAction; } });
Object.defineProperty(exports, "TokenDAO", { enumerable: true, get: function () { return governance_js_1.TokenDAO; } });
Object.defineProperty(exports, "TokenProposalResult", { enumerable: true, get: function () { return governance_js_1.TokenProposalResult; } });
Object.defineProperty(exports, "ThresholdDAO", { enumerable: true, get: function () { return governance_js_1.ThresholdDAO; } });
Object.defineProperty(exports, "ThresholdVotes", { enumerable: true, get: function () { return governance_js_1.ThresholdVotes; } });
Object.defineProperty(exports, "ThresholdHistoryEntry", { enumerable: true, get: function () { return governance_js_1.ThresholdHistoryEntry; } });
Object.defineProperty(exports, "CreateDAORequest", { enumerable: true, get: function () { return governance_js_1.CreateDAORequest; } });
Object.defineProperty(exports, "ProposeRequest", { enumerable: true, get: function () { return governance_js_1.ProposeRequest; } });
Object.defineProperty(exports, "VoteRequest", { enumerable: true, get: function () { return governance_js_1.VoteRequest; } });
Object.defineProperty(exports, "ExecuteRequest", { enumerable: true, get: function () { return governance_js_1.ExecuteRequest; } });
// App: Corporate
var corporate_js_1 = require("./ottochain/apps/corporate/v1/corporate.js");
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return corporate_js_1.EntityType; } });
Object.defineProperty(exports, "EntityState", { enumerable: true, get: function () { return corporate_js_1.EntityState; } });
Object.defineProperty(exports, "DirectorStatus", { enumerable: true, get: function () { return corporate_js_1.DirectorStatus; } });
Object.defineProperty(exports, "OfficerStatus", { enumerable: true, get: function () { return corporate_js_1.OfficerStatus; } });
Object.defineProperty(exports, "BoardMeetingType", { enumerable: true, get: function () { return corporate_js_1.BoardMeetingType; } });
Object.defineProperty(exports, "ResolutionStatus", { enumerable: true, get: function () { return corporate_js_1.ResolutionStatus; } });
Object.defineProperty(exports, "Jurisdiction", { enumerable: true, get: function () { return corporate_js_1.Jurisdiction; } });
Object.defineProperty(exports, "ShareClass", { enumerable: true, get: function () { return corporate_js_1.ShareClass; } });
Object.defineProperty(exports, "CorporateEntity", { enumerable: true, get: function () { return corporate_js_1.CorporateEntity; } });
Object.defineProperty(exports, "RegisteredAgent", { enumerable: true, get: function () { return corporate_js_1.RegisteredAgent; } });
Object.defineProperty(exports, "Incorporator", { enumerable: true, get: function () { return corporate_js_1.Incorporator; } });
Object.defineProperty(exports, "ShareStructure", { enumerable: true, get: function () { return corporate_js_1.ShareStructure; } });
Object.defineProperty(exports, "CorporateBoard", { enumerable: true, get: function () { return corporate_js_1.CorporateBoard; } });
Object.defineProperty(exports, "Director", { enumerable: true, get: function () { return corporate_js_1.Director; } });
Object.defineProperty(exports, "SeatInfo", { enumerable: true, get: function () { return corporate_js_1.SeatInfo; } });
Object.defineProperty(exports, "QuorumRules", { enumerable: true, get: function () { return corporate_js_1.QuorumRules; } });
Object.defineProperty(exports, "BoardMeeting", { enumerable: true, get: function () { return corporate_js_1.BoardMeeting; } });
Object.defineProperty(exports, "MeetingAttendee", { enumerable: true, get: function () { return corporate_js_1.MeetingAttendee; } });
Object.defineProperty(exports, "CorporateOfficers", { enumerable: true, get: function () { return corporate_js_1.CorporateOfficers; } });
Object.defineProperty(exports, "Officer", { enumerable: true, get: function () { return corporate_js_1.Officer; } });
Object.defineProperty(exports, "OfficerAction", { enumerable: true, get: function () { return corporate_js_1.OfficerAction; } });
Object.defineProperty(exports, "CorporateShareholders", { enumerable: true, get: function () { return corporate_js_1.CorporateShareholders; } });
Object.defineProperty(exports, "Shareholder", { enumerable: true, get: function () { return corporate_js_1.Shareholder; } });
Object.defineProperty(exports, "ShareHolding", { enumerable: true, get: function () { return corporate_js_1.ShareHolding; } });
Object.defineProperty(exports, "CorporateResolution", { enumerable: true, get: function () { return corporate_js_1.CorporateResolution; } });
Object.defineProperty(exports, "ResolutionVote", { enumerable: true, get: function () { return corporate_js_1.ResolutionVote; } });
Object.defineProperty(exports, "CorporateSecurities", { enumerable: true, get: function () { return corporate_js_1.CorporateSecurities; } });
Object.defineProperty(exports, "SecurityIssuance", { enumerable: true, get: function () { return corporate_js_1.SecurityIssuance; } });
Object.defineProperty(exports, "SecurityTransfer", { enumerable: true, get: function () { return corporate_js_1.SecurityTransfer; } });
Object.defineProperty(exports, "CorporateCompliance", { enumerable: true, get: function () { return corporate_js_1.CorporateCompliance; } });
Object.defineProperty(exports, "FilingRecord", { enumerable: true, get: function () { return corporate_js_1.FilingRecord; } });
Object.defineProperty(exports, "ComplianceRequirement", { enumerable: true, get: function () { return corporate_js_1.ComplianceRequirement; } });
Object.defineProperty(exports, "CreateEntityRequest", { enumerable: true, get: function () { return corporate_js_1.CreateEntityRequest; } });
Object.defineProperty(exports, "AppointDirectorRequest", { enumerable: true, get: function () { return corporate_js_1.AppointDirectorRequest; } });
Object.defineProperty(exports, "IssueSharesRequest", { enumerable: true, get: function () { return corporate_js_1.IssueSharesRequest; } });
Object.defineProperty(exports, "ProposeResolutionRequest", { enumerable: true, get: function () { return corporate_js_1.ProposeResolutionRequest; } });
