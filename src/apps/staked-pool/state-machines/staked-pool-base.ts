/**
 * The generic staked-pool BASE definition (`StakedPool`) — the reusable epoch-pool skeleton with a
 * minimal pass-through `finalize` (authority settles; publishes a trivial result and an EMPTY in-consensus
 * set, zero transfers). It is the lowest-common-denominator def; downstream apps should prefer a
 * specialization (e.g. the oracle pool) that supplies real aggregation. Exposed for definition-validity
 * round-tripping and as the explicit "base, unspecialized" instance.
 */

import type { Transition } from "../../../schema/fiber-app.js";
import { makeStakedPoolDef } from "../base.js";

/** Minimal finalize: authority settles; no aggregation, empty entitlement set, zero transfers. */
const baseFinalizeArm: Transition = {
  from: "COLLECTING",
  to: "SETTLED",
  eventName: "finalize",
  guard: {
    and: [
      { in: [{ var: "state.authority" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
      { ">=": [{ count: [{ var: "state.submissions" }] }, { var: "state.quorum" }] },
    ],
  },
  effect: {
    merge: [
      { var: "state" },
      {
        status: "SETTLED",
        inConsensus: [],
        claimed: {},
        result: {
          submissionCount: { count: [{ var: "state.submissions" }] },
          epoch: { var: "state.epoch" },
          finalizedAt: { var: "$ordinal" },
        },
      },
    ],
  },
  dependencies: [],
};

export const stakedPoolBaseDef = makeStakedPoolDef({
  metadata: {
    name: "StakedPool",
    type: "base",
    description:
      "Generic staked-epoch-pool base (FORMING→COLLECTING→SETTLED→COLLECTING…→CLOSED): registry-gated " +
      "join with stake custody, append-only submissions, a state-resident claim entitlement ledger, and " +
      "one-whole-asset claim/withdraw transfers. Specialize `submit`/`finalize` for a concrete pool.",
  },
  finalize: baseFinalizeArm,
});
