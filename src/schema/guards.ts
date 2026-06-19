/**
 * Canonical authorization-guard builders — bind "who may act" to the CHAIN-VERIFIED signer of the op,
 * never to an attacker-supplied payload field.
 *
 * The forgeable anti-pattern (security audit class F1): `{"===":[{"var":"event.agent"}, {"var":"state.party"}]}`.
 * The fiber engine injects `event` as the RAW transition payload (ContextProvider: `EVENT -> payload`),
 * so `event.agent` is whatever the submitter wrote — a different party's address forges authorization.
 * The chain ALSO injects `proofs` = `[{address, id, signature}]` where `address = id.toAddress` (the
 * VERIFIED signer addresses). Authorization must bind to THAT. For ASSET ops (mint/burn/morphism) the
 * context has no `event`/`proofs`; it injects `signers` (an array of verified address strings) instead.
 *
 * Use these so the safe pattern is consistent, greppable, and impossible to get subtly wrong.
 */

/** A JSON-Logic guard expression (plain JSON). */
export type GuardRule = Record<string, unknown>;

/**
 * FIBER-transition authorization: the pinned `partyVar` (a `state` path holding an address, e.g.
 * `"state.borrower"`) MUST be among the op's verified signers (`proofs[].address`). The replay-safe
 * replacement for `{"===":[{"var":"event.agent"}, {"var":partyVar}]}`.
 */
export const signerIsParty = (partyVar: string): GuardRule => ({
  in: [{ var: partyVar }, { map: [{ var: 'proofs' }, { var: 'address' }] }],
});

/** FIBER-transition authorization where ANY of the pinned parties signed (e.g. borrower OR lender). */
export const signerIsAnyParty = (partyVars: string[]): GuardRule => ({
  or: partyVars.map(signerIsParty),
});

/**
 * FIBER-transition authorization where the actor must be a MEMBER of a pinned set: at least one
 * VERIFIED signer is in the `setVar` array (e.g. `"state.signers"`, `"state.members"`, `"state.oracles"`).
 * The replay-safe replacement for `{"in":[{"var":"event.agent"}, {"var":setVar}]}`.
 */
export const signerInSet = (setVar: string): GuardRule => ({
  some: [{ map: [{ var: 'proofs' }, { var: 'address' }] }, { in: [{ var: '' }, { var: setVar }] }],
});

/**
 * FIBER-transition ANTI-SELF guard: NO verified signer is the pinned party (e.g. a proposal author may
 * not vote on their own proposal). The replay-safe replacement for `{"!==":[{"var":"event.agent"}, {"var":partyVar}]}`.
 */
export const signerIsNotParty = (partyVar: string): GuardRule => ({ '!': [signerIsParty(partyVar)] });

/**
 * FIBER-transition authorization / dedup over a state MAP keyed by address: at least one VERIFIED signer
 * is a key in `mapVar` (e.g. `"state.members"`, `"state.balances"`). The replay-safe replacement for the
 * forgeable `{"getKey":[{"var":mapVar}, {"var":"event.agent"}]}` membership/presence check (note metakit
 * has no `getKey`; use `get`/`has`). For a "no signer has acted yet" dedup, negate: `{"!":[signerHasEntry(...)]}`.
 * For a per-actor VALUE threshold (e.g. balance >= N), build the `some` directly:
 * `{"some":[{"map":[proofs,address]},{">=":[{"get":[mapVar,{"var":""}]}, N]}]}`.
 */
export const signerHasEntry = (mapVar: string): GuardRule => ({
  some: [{ map: [{ var: 'proofs' }, { var: 'address' }] }, { has: [{ var: mapVar }, { var: '' }] }],
});

/**
 * ASSET-op authorization (mintPolicy / burnPolicy / MorphismSpec.guard): the address at `addressVar`
 * (e.g. `"holder.Wallet.address"`) MUST be among the op's verified `signers`. The asset context has no
 * `event` or `proofs` — it injects `signers` directly.
 */
export const assetSignerIs = (addressVar: string): GuardRule => ({
  in: [{ var: addressVar }, { var: 'signers' }],
});
