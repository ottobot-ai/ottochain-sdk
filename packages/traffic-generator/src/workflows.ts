/**
 * Traffic generator workflow definitions — stub for lending domain
 */

export interface WorkflowDefinition {
  type: string;
  name: string;
  states: string[];
  finalStates: string[];
  frequency: number;
  stateMachineDefinition: { states: Record<string, unknown>; transitions: unknown[] };
  transitions: Array<{
    event: string;
    from: string;
    to: string;
    actor: string;
    weight: number;
    payloadFn?: (ctx: unknown) => unknown;
  }>;
  initialDataFn: (ctx: { fiberId: string; participants: string[]; ownerAddress: string; generation: number }) => unknown;
}

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    type: 'Lending',
    name: 'Lending Protocol',
    states: ['proposed', 'active', 'repaid', 'defaulted'],
    finalStates: ['repaid', 'defaulted'],
    frequency: 0.3,
    stateMachineDefinition: {
      states: { proposed: {}, active: {}, repaid: { isFinal: true }, defaulted: { isFinal: true } },
      transitions: [],
    },
    transitions: [
      { event: 'accept', from: 'proposed', to: 'active', actor: 'counterparty', weight: 0.8 },
      {
        event: 'repay',
        from: 'active',
        to: 'repaid',
        actor: 'borrower',
        weight: 0.7,
        payloadFn: (ctx: unknown) => ({ amount: 1000, ctx }),
      },
      { event: 'mark_default', from: 'active', to: 'defaulted', actor: 'system', weight: 0.1 },
    ],
    initialDataFn: (ctx) => ({
      loanId: ctx.fiberId,
      borrowerAddress: ctx.participants[0] ?? ctx.ownerAddress,
      lenderAddress: ctx.participants[1] ?? ctx.ownerAddress,
      principalAmount: 1000 + ctx.generation * 100,
      interestRateBps: 500,
      dueAtOrdinal: 9999999,
    }),
  },
];
