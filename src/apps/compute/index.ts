/**
 * Compute Application — bare computation substrates.
 *
 * Turing-complete JLVM substrates with no parties, assets, or governance: pure
 * in-place state evolution. The flagship is `rule110`, an in-place Rule-110
 * cellular automaton that proves the account layer is Turing-complete.
 *
 * @example
 * ```typescript
 * import { getComputeDefinition, COMPUTE_DEFINITIONS } from '@ottochain/sdk/apps/compute';
 *
 * const rule110Def = getComputeDefinition('rule110');
 * ```
 *
 * @packageDocumentation
 */

import { computeRule110Def } from "./state-machines/index.js";
import type { FiberAppDefinition } from "../../schema/fiber-app.js";

export { computeRule110Def };

/** All compute (bare-computation) state machine definitions. */
export const COMPUTE_DEFINITIONS = {
  rule110: computeRule110Def,
} as const;

export type ComputeDefType = keyof typeof COMPUTE_DEFINITIONS;

/**
 * Get a compute state machine definition by type.
 * @param type - 'rule110' (default).
 */
export function getComputeDefinition(
  type: ComputeDefType = "rule110",
): FiberAppDefinition {
  return COMPUTE_DEFINITIONS[type];
}
