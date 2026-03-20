// Auto-generated from proto/ottochain/apps/lending/v1/lending.proto
// DO NOT EDIT MANUALLY

export enum LoanStatus {
  LOAN_STATUS_UNSPECIFIED = 0,
  LOAN_STATUS_PROPOSED = 1,
  LOAN_STATUS_ACTIVE = 2,
  LOAN_STATUS_REPAID = 3,
  LOAN_STATUS_DEFAULTED = 4,
}

export interface LoanRecord {
  loanId: string;
  borrowerAddress: string;
  lenderAddress: string;
  principalAmount: number;
  interestRateBps: number;
  dueAtOrdinal: number;
  status: LoanStatus;
  createdAtOrdinal: number;
}

export interface ProposeLoan {
  borrowerAddress: string;
  principalAmount: bigint;
  interestRateBps: number;
  dueAtOrdinal: bigint;
}

export interface LoanEvent {
  loanId: string;
  eventType: string;
  amount: bigint;
  actor: string;
}
