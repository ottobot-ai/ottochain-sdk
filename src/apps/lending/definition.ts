/**
 * Lending domain state machine definition
 */

const definition = {
  states: {
    proposed: { isFinal: false, description: 'Loan proposed, awaiting counterparty acceptance' },
    active: { isFinal: false, description: 'Loan accepted and active' },
    repaid: { isFinal: true, description: 'Loan fully repaid' },
    defaulted: { isFinal: true, description: 'Loan defaulted' },
  },
  initialState: 'proposed',
  transitions: [
    {
      from: { value: 'proposed' },
      to: { value: 'active' },
      eventName: 'accept',
      guard: { '===': [{ var: 'proofs.0.address' }, { var: 'state.lenderAddress' }] },
      effect: { merge: { status: 'active', lenderAddress: { var: 'proofs.0.address' } } },
    },
    {
      from: { value: 'active' },
      to: { value: 'repaid' },
      eventName: 'repay',
      guard: {
        '>=': [{ var: 'event.amount' }, { var: 'fiber.data.principalAmount' }],
      },
    },
    {
      from: { value: 'active' },
      to: { value: 'defaulted' },
      eventName: 'mark_default',
      guard: { '>': [{ var: 'fiber.data.dueAtOrdinal' }, { var: 'chain.ordinal' }] },
    },
  ],
  metadata: {
    domain: 'lending',
    version: '1.0.0',
    description: 'Peer-to-peer lending protocol',
  },
};

export default definition;
module.exports = definition;
