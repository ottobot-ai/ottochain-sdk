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
  in: [{ var: partyVar }, { map: [{ var: "proofs" }, { var: "address" }] }],
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
  some: [
    { map: [{ var: "proofs" }, { var: "address" }] },
    { in: [{ var: "" }, { var: setVar }] },
  ],
});

/**
 * FIBER-transition ANTI-SELF guard: NO verified signer is the pinned party (e.g. a proposal author may
 * not vote on their own proposal). The replay-safe replacement for `{"!==":[{"var":"event.agent"}, {"var":partyVar}]}`.
 */
export const signerIsNotParty = (partyVar: string): GuardRule => ({
  "!": [signerIsParty(partyVar)],
});

/**
 * FIBER-transition authorization / dedup over a state MAP keyed by address: at least one VERIFIED signer
 * is a key in `mapVar` (e.g. `"state.members"`, `"state.balances"`). The replay-safe replacement for the
 * forgeable `{"getKey":[{"var":mapVar}, {"var":"event.agent"}]}` membership/presence check (note metakit
 * has no `getKey`; use `get`/`has`). For a "no signer has acted yet" dedup, negate: `{"!":[signerHasEntry(...)]}`.
 * For a per-actor VALUE threshold (e.g. balance >= N), build the `some` directly:
 * `{"some":[{"map":[proofs,address]},{">=":[{"get":[mapVar,{"var":""}]}, N]}]}`.
 */
export const signerHasEntry = (mapVar: string): GuardRule => ({
  some: [
    { map: [{ var: "proofs" }, { var: "address" }] },
    { has: [{ var: mapVar }, { var: "" }] },
  ],
});

/**
 * ASSET-op authorization (mintPolicy / burnPolicy / MorphismSpec.guard): the address at `addressVar`
 * (e.g. `"holder.Wallet.address"`) MUST be among the op's verified `signers`. The asset context has no
 * `event` or `proofs` — it injects `signers` directly.
 */
export const assetSignerIs = (addressVar: string): GuardRule => ({
  in: [{ var: addressVar }, { var: "signers" }],
});

/**
 * EFFECT-KEY BINDING: prove the event's claimed actor (`actorVar`, default `event.agent`) is a
 * CHAIN-VERIFIED signer, so that field is SAFE to use as a dynamic map key / array element in the
 * EFFECT (`{"set":[map,{"var":"event.agent"},v]}`, `{"cat":[arr,[{"var":"event.agent"}]]}`).
 *
 * This is the coupling clause for the map-write remediation: a guard may authorize via membership /
 * balance / reputation, but if the EFFECT writes under `event.agent` WITHOUT this clause, an attacker
 * sets `event.agent` to a victim's address and writes under the victim's key (security class S1).
 * Pair it with the authorization check expressed on the SAME `actorVar` — together they prove the actor
 * both signed and is authorized, and the effect can only write under that one verified key.
 * Structurally identical to {@link signerIsParty}; named for intent + greppability at write sites.
 */
export const actorIsSigner = (actorVar = "event.agent"): GuardRule =>
  signerIsParty(actorVar);

/**
 * EFFECT-KEY-BINDING membership: the event's claimed actor (`actorVar`, default `event.agent`) is BOTH
 * a CHAIN-VERIFIED signer AND a member of the pinned set `setVar` (e.g. `"state.signers"`,
 * `"state.members"`). Use when the EFFECT writes a map/array keyed by that actor and authorization is
 * set-membership. It proves the EXACT actor whose key is written both signed and is authorized — closing
 * the S1 forge AND the subtler gap {@link signerInSet} leaves open: `signerInSet` only proves SOME
 * verified signer is a member, so an op co-signed by an authorized signer could still write a DIFFERENT
 * verified-but-unauthorized address as the key (padding a signature/vote tally). `actorInSet` pins both
 * to the same `actorVar`.
 */
export const actorInSet = (
  setVar: string,
  actorVar = "event.agent",
): GuardRule => ({
  and: [actorIsSigner(actorVar), { in: [{ var: actorVar }, { var: setVar }] }],
});

/**
 * EFFECT-KEY-BINDING map membership: the claimed actor (`actorVar`, default `event.agent`) is BOTH a
 * CHAIN-VERIFIED signer AND a key in the pinned state MAP `mapVar` (e.g. `"state.members"`,
 * `"state.balances"`). The map analog of {@link actorInSet} — use it when the membership set is a dict
 * keyed by address, where `in` does not apply and `has` checks key presence. Use when the EFFECT writes
 * `mapVar` (or a per-actor tally) keyed by that actor: it proves the EXACT written key both signed and
 * is an authorized member, closing the vote/signature-stuffing gap that bare {@link signerHasEntry}
 * leaves open (which only proves SOME verified signer is a key, not that the written key is).
 */
export const actorHasEntry = (
  mapVar: string,
  actorVar = "event.agent",
): GuardRule => ({
  and: [actorIsSigner(actorVar), { has: [{ var: mapVar }, { var: actorVar }] }],
});

/**
 * IDENTITY-REGISTRY reputation gate: at least one VERIFIED signer has a reputation in the registry map
 * at `repMapVar` (a declared-dependency read, e.g. `"machines.<registryDep>.state.reputations"`, shaped
 * `{ <address>: int }`) that is `>=` the bar read from `thresholdVar` (a state path, e.g.
 * `"state.voteThreshold"`). A missing entry reads as null → 0 numerically, so unregistered signers
 * fail-closed for any positive bar. The replay-safe replacement for the forgeable
 * `{">=":[{"var":"event.agentReputation"}, bar]}` (security class S1). See
 * docs/design/app-hardening-identity-integration.md §3–§4.1.
 */
export const signerHasReputation = (
  repMapVar: string,
  thresholdVar: string,
): GuardRule => ({
  some: [
    { map: [{ var: "proofs" }, { var: "address" }] },
    {
      ">=": [{ get: [{ var: repMapVar }, { var: "" }] }, { var: thresholdVar }],
    },
  ],
});

/**
 * IDENTITY-REGISTRY role gate: at least one VERIFIED signer holds an active role attestation, i.e. is a
 * key in the registry's flat per-role map at `roleMapVar` (a declared-dependency read, e.g.
 * `"machines.<registryDep>.state.arbiters"` / `".slashers"` / `".issuers"` / `".boardMembers"`, each
 * shaped `{ <address>: true }`). The replay-safe replacement for bare `event.judicialRuling` / role
 * escapes and `{"==":[1,1]}` missing-auth (security class S2). Roles are FLAT per-role maps (not a
 * nested `roles[addr][ROLE]`) because metakit `get`/`has` on a null inner map ERROR rather than
 * returning null; a flat map keeps the read total + fail-closed. See app-hardening §4.2.
 */
export const signerHasRole = (roleMapVar: string): GuardRule =>
  signerHasEntry(roleMapVar);

/**
 * DYNAMIC identity-registry reputation gate — for when the registry instance is bound at RUNTIME via the
 * fiber-engine `_addDependency` directive (#24) rather than hardcoded into the `machines.<uuid>` path.
 * `registryIdVar` is a state/event path holding the registry fiber id (e.g. `"state.registryId"`); the
 * read addresses `machines[<that id>].state.reputations[<signer>]` with dynamic `get`s. Guarded by a
 * presence check so an UNBOUND registry yields a clean `false` (fail-closed) instead of an evaluation
 * error. REQUIRES the registry dependency to have been added in a PRIOR transition (`_addDependency`),
 * because the `machines` context is built before the effect runs (two-phase: bind, then read).
 */
export const signerHasReputationVia = (
  registryIdVar: string,
  thresholdVar: string,
): GuardRule => ({
  if: [
    { has: [{ var: "machines" }, { var: registryIdVar }] },
    {
      some: [
        { map: [{ var: "proofs" }, { var: "address" }] },
        {
          ">=": [
            {
              get: [
                {
                  get: [
                    {
                      get: [
                        { get: [{ var: "machines" }, { var: registryIdVar }] },
                        "state",
                      ],
                    },
                    "reputations",
                  ],
                },
                { var: "" },
              ],
            },
            { var: thresholdVar },
          ],
        },
      ],
    },
    false,
  ],
});

/**
 * DYNAMIC identity-registry role gate — the runtime-bound (`_addDependency`, #24) counterpart of
 * {@link signerHasRole}. `registryIdVar` is a state/event path holding the registry fiber id;
 * `roleField` is the registry's flat per-role state map name (`"arbiters"` / `"slashers"` / `"issuers"` /
 * `"boardMembers"` — see REGISTRY_ROLE_MAP). Reads `machines[<id>].state.<roleField>[<signer>]`, guarded
 * by a presence check so an UNBOUND registry yields a clean `false`. Same two-phase requirement as
 * {@link signerHasReputationVia}.
 */
export const signerHasRoleVia = (
  registryIdVar: string,
  roleField: string,
): GuardRule => ({
  if: [
    { has: [{ var: "machines" }, { var: registryIdVar }] },
    {
      some: [
        { map: [{ var: "proofs" }, { var: "address" }] },
        {
          has: [
            {
              get: [
                {
                  get: [
                    { get: [{ var: "machines" }, { var: registryIdVar }] },
                    "state",
                  ],
                },
                roleField,
              ],
            },
            { var: "" },
          ],
        },
      ],
    },
    false,
  ],
});

/**
 * CROSS-FIBER STATE GATE — assert a RUNTIME-bound dependency fiber is in a required lifecycle state. The
 * replay-safe replacement for the dropped object-form dependency
 * `{machine, instanceRef, requiredState}` (which the chain silently drops — `requiredState` gating never
 * happens). `refVar` is a state/event path holding the dependency's fiber id; reads
 * `machines[<refVar>].currentStateId == requiredState`, guarded by a presence check so an UNBOUND
 * dependency yields a clean `false` (fail-closed). TWO-PHASE (#24): the dependency fiber must have been
 * bound by an `_addDependency` in a PRIOR transition (the `machines` context is built before the effect),
 * so a single gated transition is split into a bind step then this assert step. See
 * docs/design/app-hardening-identity-integration.md §5–§6.
 */
export const depInState = (refVar: string, requiredState: string): GuardRule => ({
  if: [
    { has: [{ var: "machines" }, { var: refVar }] },
    {
      "==": [
        { get: [{ get: [{ var: "machines" }, { var: refVar }] }, "currentStateId"] },
        requiredState,
      ],
    },
    false,
  ],
});
