/**
 * Lending domain — repay route
 * POST /api/lending/loans/:loanId/repay
 */

export type RouterLike = { post: (path: string, handler: Function) => void };
export type ClientLike = { submitDataUpdate: (params: unknown) => Promise<{ ordinal: number }> };

export function repayLoanRoute(router: RouterLike, client: ClientLike): void {
  router.post('/api/lending/loans/:loanId/repay', async (req: any, res: any) => {
    const { loanId } = req.params ?? {};
    const { amount } = req.body ?? {};
    const privateKey = req.headers['x-private-key'];

    if (!loanId || !privateKey) {
      res.status(400).json({ error: 'Missing loanId or x-private-key header' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Missing or invalid amount' });
      return;
    }

    const result = await client.submitDataUpdate({
      fiberId: loanId,
      event: 'repay',
      data: { amount },
      privateKey,
    });

    res.status(200).json({ loanId, ordinal: result.ordinal });
  });
}
