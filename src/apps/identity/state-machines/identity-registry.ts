import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty } from '../../../schema/guards.js';

/**
 * Identity Registry — the ecosystem authority & reputation source.
 *
 * Aggregates, under a single authority-governed fiber:
 *  - `reputations: { <address>: int }`  — the public reputation read by reputation-gated apps
 *    (dao-reputation, credit-scoring) via a declared dependency + the `signerHasReputation` helper.
 *  - role attestations (ARBITER / SLASHER / ISSUER / BOARD_MEMBER) as FLAT per-role maps
 *    `{ <address>: true }`, read via the `signerHasRole` helper for judicial / issuance / governance
 *    authority gates.
 *
 * Writes are gated to the registry's pinned `authority` (immutable, set at create) and bound to the
 * CHAIN-VERIFIED signer via `signerIsParty("state.authority")` — never `event.agent`. Reads happen
 * cross-fiber: a consumer app declares this registry as a dependency and reads
 * `machines.<registryDep>.state.reputations` / `.arbiters` / … bound to `proofs[].address`.
 *
 * Roles are flat per-role maps rather than a nested `roles[addr][ROLE]` map on purpose: metakit
 * `get`/`has` on a NULL inner map throw (they are not null-total), so a nested read would error for
 * any signer with no roles entry — the common case. Flat maps keep both the write (`set`/`unset`) and
 * the read (`has`) total and fail-closed. New role types are added as new state maps + a cascade arm.
 *
 * See docs/design/app-hardening-identity-integration.md §3–§4 and src/schema/guards.ts
 * (signerHasReputation / signerHasRole).
 */
export const identityRegistryDef = defineFiberApp({
  metadata: {
    name: 'IdentityRegistry',
    app: 'identity',
    type: 'registry',
    version: '1.0.0',
    description: 'Ecosystem reputation + role-attestation registry; authority-gated writes, dependency reads.',
    crossReferences: {
      IdentityAgent: 'per-agent reputation source',
      Governance: 'reputation-gated participation',
      Contracts: 'ARBITER-gated dispute settlement',
      Corporate: 'ISSUER / BOARD_MEMBER authority',
    },
  },

  createSchema: {
    required: ['authority'] as const,
    properties: {
      authority: {
        type: 'address',
        description: 'DAG address authorized to write reputation + role attestations (immutable)',
        immutable: true,
      },
    },
  },

  stateSchema: {
    properties: {
      authority: { type: 'address', immutable: true },
      // { <address>: int } — public reputation, read via signerHasReputation
      reputations: { type: 'object', computed: true },
      // FLAT per-role attestation maps { <address>: true }, read via signerHasRole
      arbiters: { type: 'object', computed: true },
      slashers: { type: 'object', computed: true },
      issuers: { type: 'object', computed: true },
      boardMembers: { type: 'object', computed: true },
    },
  },

  eventSchemas: {
    set_reputation: {
      description: "Authority sets an address's reputation to an absolute score",
      required: ['subject', 'score'] as const,
      properties: {
        subject: { type: 'address' },
        score: { type: 'integer' },
      },
    },
    adjust_reputation: {
      description: "Authority adjusts an address's reputation by a signed delta",
      required: ['subject', 'delta'] as const,
      properties: {
        subject: { type: 'address' },
        delta: { type: 'integer' },
      },
    },
    grant_role: {
      description: 'Authority grants a role attestation (ARBITER|SLASHER|ISSUER|BOARD_MEMBER) to an address',
      required: ['subject', 'role'] as const,
      properties: {
        subject: { type: 'address' },
        role: {
          type: 'string',
          enum: ['ARBITER', 'SLASHER', 'ISSUER', 'BOARD_MEMBER'] as const,
        },
      },
    },
    revoke_role: {
      description: 'Authority revokes a role attestation from an address',
      required: ['subject', 'role'] as const,
      properties: {
        subject: { type: 'address' },
        role: {
          type: 'string',
          enum: ['ARBITER', 'SLASHER', 'ISSUER', 'BOARD_MEMBER'] as const,
        },
      },
    },
  },

  states: {
    ACTIVE: {
      id: 'ACTIVE',
      isFinal: false,
      metadata: {
        label: 'Active',
        description: 'Registry accepting authority writes',
        category: 'active',
      },
    },
  },

  initialState: 'ACTIVE',

  transitions: [
    // ACTIVE → ACTIVE: set_reputation (absolute)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'set_reputation',
      guard: signerIsParty('state.authority'),
      effect: {
        merge: [
          { var: 'state' },
          {
            reputations: {
              set: [{ var: 'state.reputations' }, { var: 'event.subject' }, { var: 'event.score' }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: adjust_reputation (signed delta; absent subject starts from 0)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'adjust_reputation',
      guard: signerIsParty('state.authority'),
      effect: {
        merge: [
          { var: 'state' },
          {
            reputations: {
              set: [
                { var: 'state.reputations' },
                { var: 'event.subject' },
                {
                  '+': [
                    {
                      get: [{ var: 'state.reputations' }, { var: 'event.subject' }],
                    },
                    { var: 'event.delta' },
                  ],
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: grant_role (cascade selects the flat per-role map)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'grant_role',
      guard: signerIsParty('state.authority'),
      effect: {
        merge: [
          { var: 'state' },
          {
            arbiters: {
              if: [
                { '==': [{ var: 'event.role' }, 'ARBITER'] },
                {
                  set: [{ var: 'state.arbiters' }, { var: 'event.subject' }, true],
                },
                { var: 'state.arbiters' },
              ],
            },
            slashers: {
              if: [
                { '==': [{ var: 'event.role' }, 'SLASHER'] },
                {
                  set: [{ var: 'state.slashers' }, { var: 'event.subject' }, true],
                },
                { var: 'state.slashers' },
              ],
            },
            issuers: {
              if: [
                { '==': [{ var: 'event.role' }, 'ISSUER'] },
                {
                  set: [{ var: 'state.issuers' }, { var: 'event.subject' }, true],
                },
                { var: 'state.issuers' },
              ],
            },
            boardMembers: {
              if: [
                { '==': [{ var: 'event.role' }, 'BOARD_MEMBER'] },
                {
                  set: [{ var: 'state.boardMembers' }, { var: 'event.subject' }, true],
                },
                { var: 'state.boardMembers' },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: revoke_role (cascade unsets from the flat per-role map)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'revoke_role',
      guard: signerIsParty('state.authority'),
      effect: {
        merge: [
          { var: 'state' },
          {
            arbiters: {
              if: [
                { '==': [{ var: 'event.role' }, 'ARBITER'] },
                { unset: [{ var: 'state.arbiters' }, { var: 'event.subject' }] },
                { var: 'state.arbiters' },
              ],
            },
            slashers: {
              if: [
                { '==': [{ var: 'event.role' }, 'SLASHER'] },
                { unset: [{ var: 'state.slashers' }, { var: 'event.subject' }] },
                { var: 'state.slashers' },
              ],
            },
            issuers: {
              if: [
                { '==': [{ var: 'event.role' }, 'ISSUER'] },
                { unset: [{ var: 'state.issuers' }, { var: 'event.subject' }] },
                { var: 'state.issuers' },
              ],
            },
            boardMembers: {
              if: [
                { '==': [{ var: 'event.role' }, 'BOARD_MEMBER'] },
                {
                  unset: [{ var: 'state.boardMembers' }, { var: 'event.subject' }],
                },
                { var: 'state.boardMembers' },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
});

// Derived types for consumers
export type RegistryState = keyof typeof identityRegistryDef.states;
export type RegistryEvent = (typeof identityRegistryDef.transitions)[number]['eventName'];
