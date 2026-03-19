/**
 * Lending domain — query routes stub
 */

export type RouterLike = { get: (path: string, handler: Function) => void };
export type IndexerLike = { queryFibers: (params: unknown) => Promise<unknown[]> };

export function lendingQueryRoutes(router: RouterLike, indexer: IndexerLike): void {
  router.get('/api/lending/loans', async (req: any, res: any) => {
    const { status, limit } = req.query ?? {};
    const results = await indexer.queryFibers({ namespace: 'lending.*', status, limit: parseInt(limit ?? '50') });
    res.json({ loans: results });
  });
}
