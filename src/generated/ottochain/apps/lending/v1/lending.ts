// Auto-generated from proto/ottochain/apps/lending/v1/lending.proto
// DO NOT EDIT MANUALLY

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
