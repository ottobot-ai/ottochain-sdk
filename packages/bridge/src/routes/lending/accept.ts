/**
 * Lending domain — accept route
 * POST /api/lending/loans/:loanId/accept
 */

export type RouterLike = { post: (path: string, handler: Function) => void };
export type ClientLike = { submitDataUpdate: (params: unknown) => Promise<{ ordinal: number }> };

export function acceptLoanRoute(router: RouterLike, client: ClientLike): void {
  router.post('/api/lending/loans/:loanId/accept', async (req: any, res: any) => {
    const { loanId } = req.params ?? {};
    const privateKey = req.headers['x-private-key'];

    if (!loanId || !privateKey) {
      res.status(400).json({ error: 'Missing loanId or x-private-key header' });
      return;
    }

    const result = await client.submitDataUpdate({
      fiberId: loanId,
      event: 'accept',
      data: {},
      privateKey,
    });

    res.status(200).json({ loanId, ordinal: result.ordinal });
  });
}
