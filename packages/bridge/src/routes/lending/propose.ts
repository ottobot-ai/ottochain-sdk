/**
 * Lending domain — propose loan route stub
 * Minimal implementation to satisfy TypeScript compilation; full implementation
 * lives in ottochain-services bridge package.
 */

export type RouterLike = { post: (path: string, handler: Function) => void };
export type ClientLike = { submitDataUpdate: (payload: unknown) => Promise<{ ordinal: number }> };

export function proposeLoanRoute(router: RouterLike, client: ClientLike): void {
  router.post('/api/lending/loans', async (req: any, res: any) => {
    const { borrowerAddress, principalAmount, interestRateBps, dueAtOrdinal } = req.body ?? {};
    const result = await client.submitDataUpdate({
      type: 'ProposeLoan',
      data: { borrowerAddress, principalAmount, interestRateBps, dueAtOrdinal },
    });
    const loanId = `loan-${Date.now()}`;
    res.status(201).json({ loanId, ordinal: result.ordinal });
  });
}
