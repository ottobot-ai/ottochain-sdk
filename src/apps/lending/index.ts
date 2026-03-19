/**
 * Lending domain SDK client — stub implementation.
 * Full lending protocol for proposing, accepting, and repaying loans on OttoChain.
 */

export interface ProposeLoanParams {
  borrowerAddress: string;
  principalAmount: number;
  interestRateBps: number;
  dueAtOrdinal?: number;
}

export interface LendingClientOptions {
  bridgeBaseUrl: string;
}

export interface LoanResult {
  loanId: string;
  ordinal: number;
}

export async function proposeLoan(params: ProposeLoanParams, opts: LendingClientOptions): Promise<LoanResult> {
  const res = await fetch(`${opts.bridgeBaseUrl}/api/lending/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json() as { loanId: string; ordinal: number; error?: string };
  if (!res.ok) {
    throw new Error(`ProposeLoan failed: ${data.error ?? res.statusText}`);
  }
  return { loanId: data.loanId, ordinal: data.ordinal };
}

export async function acceptLoan(loanId: string, opts: LendingClientOptions): Promise<LoanResult> {
  const res = await fetch(`${opts.bridgeBaseUrl}/api/lending/loans/${loanId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loanId }),
  });
  const data = await res.json() as LoanResult;
  return data;
}

export async function getLoan(loanId: string, opts: LendingClientOptions): Promise<unknown> {
  const res = await fetch(`${opts.bridgeBaseUrl}/api/lending/loans/${loanId}`);
  return res.json();
}

export async function listLoans(opts: LendingClientOptions, params?: { status?: string; limit?: number }): Promise<unknown[]> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${opts.bridgeBaseUrl}/api/lending/loans?${qs}`);
  const data = await res.json() as { loans: unknown[] };
  return data.loans;
}
