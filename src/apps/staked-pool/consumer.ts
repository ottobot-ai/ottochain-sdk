/**
 * Cross-fiber consumer-read helpers for a SETTLED staked/oracle pool ("pull the answer").
 *
 * Two-phase (#24): a consumer first BINDS the pool dependency and PINS the epoch it intends to consume
 * (transition N), then GATES on lifecycle + epoch and READS `result` (transition N+1). The epoch pin
 * (M4) makes the read epoch-EXACT: between bind and read the pool can cycle SETTLED→COLLECTING→SETTLED,
 * so a bare `depInState(SETTLED)` could read a DIFFERENT epoch's answer.
 *
 * Verified against the VM: `machines.<poolId>.state.{epoch,result}` reads resolve, and
 * `depInState`/the epoch-`===` gate evaluate true only for the pinned, settled epoch.
 */

import type { JsonLogicRule } from '../../schema/fiber-app.js';
import { depInState } from '../../schema/guards.js';
import { addDependency } from '../../schema/effects.js';

const machineState = (poolIdVar: string): JsonLogicRule => ({
  get: [{ get: [{ var: 'machines' }, { var: poolIdVar }] }, 'state'],
});

/**
 * PHASE 1 effect fragment — bind the pool dependency AND pin its current epoch into `epochField`
 * (default `"expectedPoolEpoch"`). Spread into the consumer's `merge` effect on the bind transition.
 * NOTE: `machines.<poolId>` is only readable AFTER a prior `_addDependency`, so the epoch pin records the
 * value the consumer observes at bind time; on the first bind the pool dep may be unbound and the pin
 * resolves null — bind in one transition, pin in the next if the registry/pool was not yet a dependency.
 */
export function bindAndPinPoolEpoch(
  poolIdVar = 'state.poolId',
  epochField = 'expectedPoolEpoch',
): Record<string, unknown> {
  return {
    [epochField]: { get: [machineState(poolIdVar), 'epoch'] },
    ...addDependency({ var: poolIdVar }),
  };
}

/**
 * PHASE 2 guard — the pool is SETTLED for the EXACT epoch the consumer pinned. Compose into the read
 * transition's guard alongside the consumer's own auth.
 */
export function poolSettledForPinnedEpoch(
  poolIdVar = 'state.poolId',
  epochField = 'state.expectedPoolEpoch',
): JsonLogicRule {
  return {
    and: [
      depInState(poolIdVar, 'SETTLED'),
      { '===': [{ get: [machineState(poolIdVar), 'epoch'] }, { var: epochField }] },
    ],
  };
}

/** PHASE 2 value read — the published `result` object (use `.value` for the scalar answer). */
export function readPoolResult(poolIdVar = 'state.poolId'): JsonLogicRule {
  return { get: [machineState(poolIdVar), 'result'] };
}

/** PHASE 2 value read — the scalar `result.value`. */
export function readPoolResultValue(poolIdVar = 'state.poolId'): JsonLogicRule {
  return { get: [{ get: [machineState(poolIdVar), 'result'] }, 'value'] };
}
