/**
 * Oracle-pool specialization of the staked-pool base (`StakedPoolOracle`).
 *
 * `submit` appends a numeric datapoint `{ addr, value }` (the base default arm).
 * `finalize` (COLLECTING→SETTLED) aggregates the array with an outlier-bounded mean and publishes the
 * answer + the in-consensus address set — emitting ZERO asset transfers (the entitlement ledger is
 * `inConsensus`; rewards are pulled per-claim via the base `claim_reward` arm).
 *
 * Aggregation (default `trimmedMean`):
 *   1. vals    = map(submissions, .value)
 *   2. trimmed = filter(submissions, value != min(vals) && value != max(vals))   — drop single min + single max
 *   3. center  = sum(trimmed.value) / count(trimmed)                              — EXACT rational (no truncation)
 *   4. kept    = filter(submissions, abs(value - center) <= outlierBound)         — the in-consensus set
 *   5. answer  = sum(kept.value) / count(kept)
 *
 * CRITICAL JLVM SCOPING (verified against @constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5):
 *   - Inside a `map`/`filter` callback the data scope is the BARE element, BUT the outer `state.*` is
 *     still readable (verified: `{cat:[addr,"|",{var:"state.epoch"}]}` reads epoch correctly).
 *   - A `let`-bound name does NOT cross into a `map`/`filter` callback. So `center` is INLINED into the
 *     `kept` predicate (it reads `state.submissions`, which IS visible) rather than `let`-hoisted — a
 *     `let`-bound `center` resolves to null inside `filter`, evicting every submission (div-by-zero).
 *   - A `reduce` with a MAP initial accumulator is rejected (`opReduce` requires `isPrimitive(init)`),
 *     so the reward ledger is NOT a folded `{addr:int}` map — it is the `inConsensus` array (membership =
 *     entitlement), consumed by `claim_reward` + a `claimed` dedup map.
 */

import type { JsonLogicRule, Transition } from '../../../schema/fiber-app.js';
import { makeStakedPoolDef } from '../base.js';

export type OracleAggregation = 'mean' | 'trimmedMean';

const sum = (arr: JsonLogicRule): JsonLogicRule => ({
  reduce: [arr, { '+': [{ var: 'accumulator' }, { var: 'current' }] }, 0],
});
const meanOf = (arr: JsonLogicRule): JsonLogicRule => ({ '/': [sum(arr), { count: [arr] }] });

/** vals = map(submissions, .value) */
const VALS: JsonLogicRule = { map: [{ var: 'state.submissions' }, { get: [{ var: '' }, 'value'] }] };

/**
 * The aggregation `center` as a CLOSED expression over `state.submissions` (must be inlined into the
 * `kept` filter — see file header). `trimmedMean` drops the single min + single max before averaging.
 */
function centerExpr(aggregation: OracleAggregation): JsonLogicRule {
  if (aggregation === 'mean') return meanOf(VALS);
  const trimmed: JsonLogicRule = {
    filter: [
      { var: 'state.submissions' },
      {
        and: [
          { '!==': [{ get: [{ var: '' }, 'value'] }, { min: [VALS] }] },
          { '!==': [{ get: [{ var: '' }, 'value'] }, { max: [VALS] }] },
        ],
      },
    ],
  };
  const trimmedVals: JsonLogicRule = { map: [trimmed, { get: [{ var: '' }, 'value'] }] };
  return meanOf(trimmedVals);
}

/** finalize COLLECTING→SETTLED — publish answer + inConsensus; ZERO asset transfers. */
function finalizeArm(aggregation: OracleAggregation): Transition {
  const center = centerExpr(aggregation);
  // kept = the in-consensus submissions; `center` is INLINED (visible state.submissions inside filter).
  const kept: JsonLogicRule = {
    filter: [
      { var: 'state.submissions' },
      {
        '<=': [{ abs: [{ '-': [{ get: [{ var: '' }, 'value'] }, center] }] }, { var: 'state.outlierBound' }],
      },
    ],
  };
  const keptVals: JsonLogicRule = { map: [kept, { get: [{ var: '' }, 'value'] }] };
  const inConsensus: JsonLogicRule = { map: [kept, { get: [{ var: '' }, 'addr'] }] };

  return {
    from: 'COLLECTING',
    to: 'SETTLED',
    eventName: 'finalize',
    // Authority finalizes once quorum is met AND the window has elapsed.
    guard: {
      and: [
        { in: [{ var: 'state.authority' }, { map: [{ var: 'proofs' }, { var: 'address' }] }] },
        { '>=': [{ count: [{ var: 'state.submissions' }] }, { var: 'state.quorum' }] },
        {
          '>=': [{ var: '$ordinal' }, { '+': [{ var: 'state.epochStartedAt' }, { var: 'state.epochLength' }] }],
        },
      ],
    },
    // ZERO _transferAsset: publish result + record the in-consensus entitlement set + reset claimed.
    effect: {
      merge: [
        { var: 'state' },
        {
          status: 'SETTLED',
          inConsensus,
          claimed: {},
          result: {
            value: meanOf(keptVals),
            epoch: { var: 'state.epoch' },
            finalizedAt: { var: '$ordinal' },
          },
        },
      ],
    },
    dependencies: [],
  };
}

export interface OraclePoolOptions {
  /** Aggregation strategy. Default `trimmedMean` (drop single min + single max — the robustness ceiling). */
  aggregation?: OracleAggregation;
}

/** Build the oracle-pool definition. `outlierPenalty` is soft-only (no-credit for outliers); hard slash is v2. */
export function makeOraclePoolDef(options: OraclePoolOptions = {}) {
  const aggregation = options.aggregation ?? 'trimmedMean';
  return makeStakedPoolDef({
    metadata: {
      name: 'StakedPoolOracle',
      type: 'oraclePool',
      description:
        'Reputation-gated staked oracle pool: participants stake + submit numeric datapoints; finalize ' +
        'publishes an outlier-bounded (default trimmed-mean) consensus answer and credits the in-consensus ' +
        'set as a claim entitlement (zero finalize-time transfers); a consumer reads the published value ' +
        'cross-fiber via an epoch-pinned depInState(SETTLED) gate.',
    },
    finalize: finalizeArm(aggregation),
    extraCreateProperties: {
      rewardPolicy: {
        type: 'string',
        description: 'Asset policy of the shared fungible reward token.',
        immutable: true,
      },
    },
    extraStateProperties: {
      rewardPolicy: { type: 'string', immutable: true },
    },
  });
}

/** Default oracle-pool definition (trimmed-mean). */
export const stakedPoolOracleDef = makeOraclePoolDef();
