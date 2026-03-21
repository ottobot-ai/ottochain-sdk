import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Token-weighted voting. Voting power proportional to token holdings.
 */
export const daoTokenDef = defineFiberApp({
  metadata: {
    name: 'TokenDAO',
    app: 'governance',
    type: 'daoToken',
    version: '1.0.0',
    description: 'Token-weighted voting. Voting power proportional to token holdings.',
    category: 'governance/dao',
    crossReferences: {
      Identity: 'voter verification',
      Token: 'balance snapshots',
      Contract: 'action execution',
      Treasury: 'fund management',
    },
  },

  createSchema: {
    required: ['balances', 'proposalThreshold', 'quorum', 'votingPeriodMs', 'timelockMs'] as const,
    properties: {
      balances: { type: 'object', description: 'Initial token balances by address' },
      proposalThreshold: { type: 'number', description: 'Min token balance to submit a proposal' },
      quorum: { type: 'number', description: 'Min total votes (weighted) to pass' },
      votingPeriodMs: { type: 'number', description: 'Voting window in milliseconds' },
      timelockMs: { type: 'number', description: 'Time-lock delay before execution' },
    },
  },

  stateSchema: {
    properties: {
      balances: { type: 'object' },
      delegations: { type: 'object', computed: true },
      proposalThreshold: { type: 'number' },
      quorum: { type: 'number' },
      votingPeriodMs: { type: 'number' },
      timelockMs: { type: 'number' },
      proposal: { type: 'object' },
      votes: { type: 'object', computed: true },
      executedProposals: { type: 'array', computed: true },
      rejectedProposals: { type: 'array', computed: true },
      cancelledProposals: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    propose: {
      description: 'Submit a proposal (requires >= proposalThreshold tokens)',
      required: ['proposalId', 'title', 'description', 'actionType', 'payload'] as const,
      properties: {
        agent: { type: 'address' },
        proposalId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        actionType: { type: 'string' },
        payload: { type: 'object' },
        snapshotBlock: { type: 'string' },
      },
    },
    vote: {
      description: 'Cast a token-weighted vote (must hold tokens, no double-vote, within window)',
      required: ['vote'] as const,
      properties: {
        agent: { type: 'address' },
        vote: { type: 'string', description: '"for" | "against" | "abstain"' },
      },
    },
    queue: {
      description: 'Queue passing proposal into timelock (voting ended, for > against, quorum met)',
      properties: {},
    },
    execute: {
      description: 'Execute queued proposal after timelock expires',
      properties: {},
    },
    reject: {
      description: 'Formally reject a failed proposal (voting ended, failed conditions)',
      properties: {},
    },
    cancel: {
      description: 'Cancel a queued proposal (proposer only)',
      properties: {
        agent: { type: 'address' },
      },
    },
    delegate: {
      description: 'Delegate voting power to another address',
      required: ['delegateTo'] as const,
      properties: {
        agent: { type: 'address' },
        delegateTo: { type: 'address' },
      },
    },
    undelegate: {
      description: 'Revoke delegation',
      properties: {
        agent: { type: 'address' },
      },
    },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false, metadata: null },
    VOTING: { id: 'VOTING', isFinal: false, metadata: null },
    QUEUED: { id: 'QUEUED', isFinal: false, metadata: null },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true, metadata: null },
  },

  initialState: 'ACTIVE',

  transitions: [
    // ACTIVE → VOTING: propose (enough tokens)
    {
      from: 'ACTIVE',
      to: 'VOTING',
      eventName: 'propose',
      guard: {
        '>=': [
          { getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] },
          { var: 'state.proposalThreshold' },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            proposal: {
              id: { var: 'event.proposalId' },
              title: { var: 'event.title' },
              description: { var: 'event.description' },
              actionType: { var: 'event.actionType' },
              payload: { var: 'event.payload' },
              proposer: { var: 'event.agent' },
              proposedAt: { var: '$timestamp' },
              votingEndsAt: { '+': [{ var: '$timestamp' }, { var: 'state.votingPeriodMs' }] },
              snapshotBlock: { var: 'event.snapshotBlock' },
            },
            votes: { for: 0, against: 0, abstain: 0, voters: {} },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → VOTING: vote (token holder, no double-vote, within window)
    {
      from: 'VOTING',
      to: 'VOTING',
      eventName: 'vote',
      guard: {
        and: [
          { '>': [{ getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] }, 0] },
          { '!': [{ getKey: [{ var: 'state.votes.voters' }, { var: 'event.agent' }] }] },
          { '<=': [{ var: '$timestamp' }, { var: 'state.proposal.votingEndsAt' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            votes: {
              merge: [
                { var: 'state.votes' },
                {
                  if: [
                    { '===': [{ var: 'event.vote' }, 'for'] },
                    { for: { '+': [{ var: 'state.votes.for' }, { getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] }] } },
                    { '===': [{ var: 'event.vote' }, 'against'] },
                    { against: { '+': [{ var: 'state.votes.against' }, { getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] }] } },
                    { abstain: { '+': [{ var: 'state.votes.abstain' }, { getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] }] } },
                  ],
                },
                {
                  voters: {
                    setKey: [
                      { var: 'state.votes.voters' },
                      { var: 'event.agent' },
                      {
                        vote: { var: 'event.vote' },
                        weight: { getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] },
                        votedAt: { var: '$timestamp' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → QUEUED: queue (voting ended, for > against, quorum met)
    {
      from: 'VOTING',
      to: 'QUEUED',
      eventName: 'queue',
      guard: {
        and: [
          { '>': [{ var: '$timestamp' }, { var: 'state.proposal.votingEndsAt' }] },
          { '>': [{ var: 'state.votes.for' }, { var: 'state.votes.against' }] },
          {
            '>=': [
              { '+': [{ var: 'state.votes.for' }, { var: 'state.votes.against' }, { var: 'state.votes.abstain' }] },
              { var: 'state.quorum' },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            proposal: {
              merge: [
                { var: 'state.proposal' },
                {
                  queuedAt: { var: '$timestamp' },
                  executableAt: { '+': [{ var: '$timestamp' }, { var: 'state.timelockMs' }] },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // QUEUED → ACTIVE: execute (timelock expired)
    {
      from: 'QUEUED',
      to: 'ACTIVE',
      eventName: 'execute',
      guard: { '>=': [{ var: '$timestamp' }, { var: 'state.proposal.executableAt' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            executedProposals: {
              cat: [
                { var: 'state.executedProposals' },
                [
                  {
                    merge: [
                      { var: 'state.proposal' },
                      { votes: { var: 'state.votes' }, executedAt: { var: '$timestamp' } },
                    ],
                  },
                ],
              ],
            },
            proposal: null,
            votes: null,
          },
        ],
      },
      emits: [{ event: 'proposal_executed', to: 'external' }],
      dependencies: [],
    },
    // VOTING → ACTIVE: reject (voting ended, failed quorum or for <= against)
    {
      from: 'VOTING',
      to: 'ACTIVE',
      eventName: 'reject',
      guard: {
        and: [
          { '>': [{ var: '$timestamp' }, { var: 'state.proposal.votingEndsAt' }] },
          {
            or: [
              { '<=': [{ var: 'state.votes.for' }, { var: 'state.votes.against' }] },
              {
                '<': [
                  { '+': [{ var: 'state.votes.for' }, { var: 'state.votes.against' }, { var: 'state.votes.abstain' }] },
                  { var: 'state.quorum' },
                ],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            rejectedProposals: {
              cat: [
                { var: 'state.rejectedProposals' },
                [
                  {
                    merge: [
                      { var: 'state.proposal' },
                      { votes: { var: 'state.votes' }, rejectedAt: { var: '$timestamp' } },
                    ],
                  },
                ],
              ],
            },
            proposal: null,
            votes: null,
          },
        ],
      },
      dependencies: [],
    },
    // QUEUED → ACTIVE: cancel (proposer only)
    {
      from: 'QUEUED',
      to: 'ACTIVE',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.proposal.proposer' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            cancelledProposals: {
              cat: [
                { var: 'state.cancelledProposals' },
                [
                  {
                    merge: [
                      { var: 'state.proposal' },
                      { cancelledAt: { var: '$timestamp' } },
                    ],
                  },
                ],
              ],
            },
            proposal: null,
            votes: null,
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: delegate
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'delegate',
      guard: { '>': [{ getKey: [{ var: 'state.balances' }, { var: 'event.agent' }] }, 0] },
      effect: {
        merge: [
          { var: 'state' },
          {
            delegations: {
              setKey: [{ var: 'state.delegations' }, { var: 'event.agent' }, { var: 'event.delegateTo' }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: undelegate
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'undelegate',
      guard: { getKey: [{ var: 'state.delegations' }, { var: 'event.agent' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            delegations: {
              deleteKey: [{ var: 'state.delegations' }, { var: 'event.agent' }],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
