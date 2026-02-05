import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { JsonObject, Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/contracts/v1/contract.proto.
 */
export declare const file_ottochain_apps_contracts_v1_contract: GenFile;
/**
 * Contract between two agents
 *
 * @generated from message ottochain.apps.contracts.v1.Contract
 */
export type Contract = Message<"ottochain.apps.contracts.v1.Contract"> & {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * Human-readable ID
     *
     * @generated from field: string contract_id = 2;
     */
    contractId: string;
    /**
     * @generated from field: ottochain.v1.Address proposer = 3;
     */
    proposer?: Address;
    /**
     * @generated from field: ottochain.v1.Address counterparty = 4;
     */
    counterparty?: Address;
    /**
     * @generated from field: ottochain.apps.contracts.v1.ContractState state = 5;
     */
    state: ContractState;
    /**
     * Flexible terms structure
     *
     * @generated from field: google.protobuf.Struct terms = 6;
     */
    terms?: JsonObject;
    /**
     * @generated from field: google.protobuf.Timestamp proposed_at = 7;
     */
    proposedAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp accepted_at = 8;
     */
    acceptedAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp completed_at = 9;
     */
    completedAt?: Timestamp;
    /**
     * Evidence of completion
     *
     * @generated from field: string completion_proof = 10;
     */
    completionProof: string;
};
/**
 * Describes the message ottochain.apps.contracts.v1.Contract.
 * Use `create(ContractSchema)` to create a new message.
 */
export declare const ContractSchema: GenMessage<Contract>;
/**
 * Propose a new contract
 *
 * @generated from message ottochain.apps.contracts.v1.ProposeContractRequest
 */
export type ProposeContractRequest = Message<"ottochain.apps.contracts.v1.ProposeContractRequest"> & {
    /**
     * @generated from field: ottochain.v1.Address proposer = 1;
     */
    proposer?: Address;
    /**
     * @generated from field: ottochain.v1.Address counterparty = 2;
     */
    counterparty?: Address;
    /**
     * @generated from field: google.protobuf.Struct terms = 3;
     */
    terms?: JsonObject;
    /**
     * @generated from field: string description = 4;
     */
    description: string;
};
/**
 * Describes the message ottochain.apps.contracts.v1.ProposeContractRequest.
 * Use `create(ProposeContractRequestSchema)` to create a new message.
 */
export declare const ProposeContractRequestSchema: GenMessage<ProposeContractRequest>;
/**
 * Accept a proposed contract
 *
 * @generated from message ottochain.apps.contracts.v1.AcceptContractRequest
 */
export type AcceptContractRequest = Message<"ottochain.apps.contracts.v1.AcceptContractRequest"> & {
    /**
     * @generated from field: string contract_id = 1;
     */
    contractId: string;
    /**
     * @generated from field: ottochain.v1.Address acceptor = 2;
     */
    acceptor?: Address;
};
/**
 * Describes the message ottochain.apps.contracts.v1.AcceptContractRequest.
 * Use `create(AcceptContractRequestSchema)` to create a new message.
 */
export declare const AcceptContractRequestSchema: GenMessage<AcceptContractRequest>;
/**
 * Complete a contract with proof
 *
 * @generated from message ottochain.apps.contracts.v1.CompleteContractRequest
 */
export type CompleteContractRequest = Message<"ottochain.apps.contracts.v1.CompleteContractRequest"> & {
    /**
     * @generated from field: string contract_id = 1;
     */
    contractId: string;
    /**
     * @generated from field: ottochain.v1.Address completer = 2;
     */
    completer?: Address;
    /**
     * @generated from field: string proof = 3;
     */
    proof: string;
};
/**
 * Describes the message ottochain.apps.contracts.v1.CompleteContractRequest.
 * Use `create(CompleteContractRequestSchema)` to create a new message.
 */
export declare const CompleteContractRequestSchema: GenMessage<CompleteContractRequest>;
/**
 * Reject a proposed contract
 *
 * @generated from message ottochain.apps.contracts.v1.RejectContractRequest
 */
export type RejectContractRequest = Message<"ottochain.apps.contracts.v1.RejectContractRequest"> & {
    /**
     * @generated from field: string contract_id = 1;
     */
    contractId: string;
    /**
     * @generated from field: ottochain.v1.Address rejector = 2;
     */
    rejector?: Address;
    /**
     * @generated from field: string reason = 3;
     */
    reason: string;
};
/**
 * Describes the message ottochain.apps.contracts.v1.RejectContractRequest.
 * Use `create(RejectContractRequestSchema)` to create a new message.
 */
export declare const RejectContractRequestSchema: GenMessage<RejectContractRequest>;
/**
 * Dispute a contract
 *
 * @generated from message ottochain.apps.contracts.v1.DisputeContractRequest
 */
export type DisputeContractRequest = Message<"ottochain.apps.contracts.v1.DisputeContractRequest"> & {
    /**
     * @generated from field: string contract_id = 1;
     */
    contractId: string;
    /**
     * @generated from field: ottochain.v1.Address disputant = 2;
     */
    disputant?: Address;
    /**
     * @generated from field: string evidence = 3;
     */
    evidence: string;
    /**
     * @generated from field: string reason = 4;
     */
    reason: string;
};
/**
 * Describes the message ottochain.apps.contracts.v1.DisputeContractRequest.
 * Use `create(DisputeContractRequestSchema)` to create a new message.
 */
export declare const DisputeContractRequestSchema: GenMessage<DisputeContractRequest>;
/**
 * Contract state machine definition
 *
 * Valid transitions:
 *   PROPOSED -> ACTIVE (accept)
 *   PROPOSED -> REJECTED (reject)
 *   PROPOSED -> CANCELLED (cancel)
 *   ACTIVE -> COMPLETED (complete)
 *   ACTIVE -> DISPUTED (dispute)
 *   DISPUTED -> COMPLETED (resolve_for_completer)
 *   DISPUTED -> REJECTED (resolve_for_disputant)
 *
 * @generated from message ottochain.apps.contracts.v1.ContractDefinition
 */
export type ContractDefinition = Message<"ottochain.apps.contracts.v1.ContractDefinition"> & {
    /**
     * Both parties must sign completion
     *
     * @generated from field: bool require_both_signatures = 1;
     */
    requireBothSignatures: boolean;
    /**
     * How long after completion disputes allowed
     *
     * @generated from field: int32 dispute_window_epochs = 2;
     */
    disputeWindowEpochs: number;
};
/**
 * Describes the message ottochain.apps.contracts.v1.ContractDefinition.
 * Use `create(ContractDefinitionSchema)` to create a new message.
 */
export declare const ContractDefinitionSchema: GenMessage<ContractDefinition>;
/**
 * Contract lifecycle states
 *
 * @generated from enum ottochain.apps.contracts.v1.ContractState
 */
export declare enum ContractState {
    /**
     * @generated from enum value: CONTRACT_STATE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Awaiting counterparty acceptance
     *
     * @generated from enum value: CONTRACT_STATE_PROPOSED = 1;
     */
    PROPOSED = 1,
    /**
     * Both parties agreed, in progress
     *
     * @generated from enum value: CONTRACT_STATE_ACTIVE = 2;
     */
    ACTIVE = 2,
    /**
     * Successfully fulfilled (terminal)
     *
     * @generated from enum value: CONTRACT_STATE_COMPLETED = 3;
     */
    COMPLETED = 3,
    /**
     * Counterparty declined (terminal)
     *
     * @generated from enum value: CONTRACT_STATE_REJECTED = 4;
     */
    REJECTED = 4,
    /**
     * Under dispute resolution
     *
     * @generated from enum value: CONTRACT_STATE_DISPUTED = 5;
     */
    DISPUTED = 5,
    /**
     * Cancelled by proposer before acceptance (terminal)
     *
     * @generated from enum value: CONTRACT_STATE_CANCELLED = 6;
     */
    CANCELLED = 6
}
/**
 * Describes the enum ottochain.apps.contracts.v1.ContractState.
 */
export declare const ContractStateSchema: GenEnum<ContractState>;
