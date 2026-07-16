/**
 * Regression-prevention lint for OttoChain std-app fiber definitions.
 *
 * Purpose
 * -------
 * Catch — at *authoring* time — the classes of SDK↔chain drift that the chain
 * accepts structurally but then silently mis-parses, drops, or evaluates to a
 * dead (always-true / always-false / always-throw) guard. Without this lint
 * those mistakes ship as live, exploitable holes or as silent data corruption
 * because nothing in `defineFiberApp` / `toProtoDefinition` rejects them.
 *
 * The drift classes (cross-referenced to docs/reviews/fiber-app-alignment-audit-2026-06.md):
 *
 *   A1 — `$timestamp` (and any non-injected `$`-key). `ReservedKeys` injects ONLY
 *        `$ordinal`, `$lastSnapshotHash`, `$epochProgress`. `{"var":"$timestamp"}`
 *        resolves to null → `0` in numeric contexts → deadline guards die silently.
 *
 *   A2 — Nonexistent JLVM opcodes used as operator tags: `size`, `getKey`,
 *        `setKey`, `deleteKey`. metakit decodes an unknown single-key object as a
 *        LITERAL Map, not an operator, so the guard is always-true/false and the
 *        effect writes a junk key. (Canonical good set: `KNOWN_OPERATORS`.)
 *
 *   A3 — SDK directives the chain's `toProtoDefinition` silently drops:
 *        transition-level `emits` / `spawns`, and object-form `dependencies`
 *        entries `{machine,instanceRef,requiredState}` (chain parses `Set[UUID]`).
 *        Authors believe these gate/emit; on-chain they evaporate.
 *
 *   per-context — `{"var":"witness.*"}` in a fiber TRANSITION. `witness` is only
 *        injected in ASSET-guard contexts; a transition gets `event` (the proof
 *        rides under `event.witness.*`). Reading `witness.*` resolves to null →
 *        fail-closed (zk gate un-passable) or silently bypassed.
 *
 *   leading-dot — `{"var":".foo"}` resolves to null on chain.
 *
 *   H1 — a `_spawn` whose child `owners` are not provably a SUBSET of the spawning
 *        parent's owners. The chain now fails-closed (aborts the transition) under
 *        every spawnOwnerPolicy when child owners ⊄ parent owners; this advisory
 *        flags the strong not-subset signals (hardcoded / `event.*`-derived owners).
 *
 * This is a STANDALONE validator. It is deliberately NOT wired into
 * `defineFiberApp` / `toProtoDefinition`: doing so would break the build until
 * every app is remediated. Run it via `scripts/lint-apps.mjs`.
 */

import { KNOWN_OPERATORS as KNOWN_OPERATORS_TYPED } from '@constellation-network/metagraph-sdk-jlvm';
import type { FiberAppDefinition, Transition, JsonLogicRule } from './fiber-app.js';
import { normalizeNullifierHex } from './nullifier.js';

/**
 * Canonical set of valid JLVM operator tags, imported from metakit (the same
 * `KNOWN_OPERATORS` the on-chain evaluator is built from). Widened to
 * `ReadonlySet<string>` so we can membership-test arbitrary object keys.
 */
const KNOWN_OPERATORS: ReadonlySet<string> = KNOWN_OPERATORS_TYPED as ReadonlySet<string>;

// =============================================================================
// Public types
// =============================================================================

export type LintSeverity = 'error' | 'warn';

export interface LintViolation {
  /** App identifier (`metadata.app/metadata.type` or `metadata.name`), when known. */
  app?: string;
  /** `eventName` (or `from→to`) of the offending transition, when applicable. */
  transition?: string;
  severity: LintSeverity;
  /** Stable machine-readable rule code (see {@link LINT_CODES}). */
  code: string;
  /** Human-readable explanation including the correct alternative. */
  message: string;
  /** JSON-ish path to the offending node, e.g. `transitions[3].guard.or[0].var`. */
  path: string;
}

/** Stable rule codes — referenced by tests and by report tooling. */
export const LINT_CODES = {
  UNKNOWN_RESERVED_VAR: 'unknown-reserved-var', // rule 1 (A1)
  UNKNOWN_OPERATOR: 'unknown-operator', // rule 2 (A2)
  WITNESS_IN_TRANSITION: 'witness-in-transition', // rule 3
  DROPPED_DIRECTIVE: 'dropped-directive', // rule 4 (A3)
  LEADING_DOT_VAR: 'leading-dot-var', // rule 5
  SPAWN_OWNERS: 'spawn-owners', // rule 6 (H1) — child owners not provably ⊆ parent
  NULLIFIER_LITERAL: 'nullifier-literal-malformed', // rule 7 — _consumeNullifier literal can never normalize
} as const;

// =============================================================================
// Rule data
// =============================================================================

/**
 * The ONLY `$`-prefixed keys the engine injects (`ReservedKeys`). Anything else
 * (`$timestamp`, `$now`, ...) resolves to null on chain.
 */
export const INJECTED_RESERVED_VARS: ReadonlySet<string> = new Set(['$ordinal', '$lastSnapshotHash', '$epochProgress']);

/**
 * Tags that LOOK like opcodes and appear in real definitions but are NOT valid
 * JLVM operators — metakit mis-decodes each as a literal Map. These are always
 * flagged as errors regardless of position (they are not plausible data fields).
 * Mapped to the correct replacement opcode for the message.
 */
export const KNOWN_BAD_OPERATORS: ReadonlyMap<string, string> = new Map([
  ['size', 'length (collections) or count; for a Map use length[keys[...]]'],
  ['getKey', 'get (value) / has (membership)'],
  ['setKey', 'merge (or restructure the field as an array appended with cat/merge)'],
  ['deleteKey', 'filter the collection (model the field as an array of records)'],
]);

/**
 * Structural keys that JSON-Logic uses as single-key objects but are NOT
 * operator tags. Used to avoid false-positive "unknown operator" warnings.
 * `var` is the data-access form; the rest are common rule scaffolding seen in
 * std apps that are handled by the evaluator or are intentional literals.
 */
const NON_OPERATOR_SINGLE_KEYS: ReadonlySet<string> = new Set([
  'var', // data access — handled explicitly
]);

// =============================================================================
// Expression walker (rules 1, 2, 5 + witness detection)
// =============================================================================

interface WalkContext {
  app?: string;
  transition?: string;
  /**
   * When true, this transition expression runs in a context where `witness` is
   * NOT injected (a fiber transition guard/effect). Reading `witness.*` here is
   * a bug (rule 3). Asset-guard contexts would set this false (not walked here).
   */
  flagWitness: boolean;
}

/**
 * Recursively lint a single JSON-Logic expression (a guard or an effect, or any
 * sub-node). Walks every nested operand. Pushes a {@link LintViolation} for each
 * rule-1 / rule-2 / rule-3 / rule-5 hit found at or below `node`.
 *
 * `inDataLiteral` tracks whether `node` sits in a position the evaluator treats
 * as DATA rather than as an expression to evaluate (e.g. the 2nd operand of
 * `merge`/`cat`, or a value nested inside such an operand). In a data-literal
 * position an unknown single-key object is a legitimate field map, so the
 * *generic* unknown-operator warning is suppressed there — but `$`-var keys,
 * leading-dot vars, witness reads, and the known-BAD opcode tags are still
 * flagged (those are bugs wherever they appear).
 */
export function lintGuardExpression(
  node: unknown,
  ctx: WalkContext,
  path: string,
  inDataLiteral = false,
): LintViolation[] {
  const out: LintViolation[] = [];

  // Arrays: walk each element, preserving the data-literal flag.
  if (Array.isArray(node)) {
    node.forEach((child, i) => {
      out.push(...lintGuardExpression(child, ctx, `${path}[${i}]`, inDataLiteral));
    });
    return out;
  }

  // Primitives carry no structure to lint.
  if (node === null || typeof node !== 'object') {
    return out;
  }

  const obj = node as Record<string, unknown>;
  const keys = Object.keys(obj);

  // ---- `var` access: rules 1, 3, 5 -------------------------------------
  if (keys.length === 1 && keys[0] === 'var') {
    const ref = obj.var;
    // The reference may be a string, or `[path, default]`, or (rarely) a
    // nested expression; only string refs carry the patterns we check.
    const refStr =
      typeof ref === 'string' ? ref : Array.isArray(ref) && typeof ref[0] === 'string' ? (ref[0] as string) : undefined;

    if (refStr !== undefined) {
      // rule 1 — unknown reserved `$`-key
      if (refStr.startsWith('$') && !INJECTED_RESERVED_VARS.has(refStr)) {
        out.push({
          app: ctx.app,
          transition: ctx.transition,
          severity: 'error',
          code: LINT_CODES.UNKNOWN_RESERVED_VAR,
          message:
            `{"var":"${refStr}"} references a reserved key the engine never injects. ` +
            `Only ${[...INJECTED_RESERVED_VARS].join(', ')} are injected; ` +
            `"${refStr}" resolves to null (→ 0 in numeric contexts, defeating deadline guards). ` +
            `Use $ordinal and model time fields as ordinal deltas/bounds.`,
          path: `${path}.var`,
        });
      }

      // rule 5 — leading-dot relative path
      if (refStr.startsWith('.')) {
        out.push({
          app: ctx.app,
          transition: ctx.transition,
          severity: 'error',
          code: LINT_CODES.LEADING_DOT_VAR,
          message:
            `{"var":"${refStr}"} uses a leading-dot relative path, which resolves to null on chain. ` +
            `Use the bare element field name ("${refStr.slice(1)}") inside map/filter/some scopes.`,
          path: `${path}.var`,
        });
      }

      // rule 3 — `witness.*` read inside a fiber transition
      if (ctx.flagWitness && (refStr === 'witness' || refStr.startsWith('witness.'))) {
        out.push({
          app: ctx.app,
          transition: ctx.transition,
          severity: 'error',
          code: LINT_CODES.WITNESS_IN_TRANSITION,
          message:
            `{"var":"${refStr}"} reads the 'witness' context, which is injected ONLY in asset-guard ` +
            `contexts — never in a fiber transition (the engine injects 'event'). It resolves to null ` +
            `→ the zk gate is un-passable (fail-closed). Read 'event.${refStr}' instead, or move the ` +
            `semi-private guard onto the asset mintPolicy/burnPolicy.`,
          path: `${path}.var`,
        });
      }
    }

    // The `var` default operand (ref[1]) may itself be an expression; walk it.
    if (Array.isArray(ref) && ref.length > 1) {
      out.push(...lintGuardExpression(ref[1], ctx, `${path}.var[1]`, inDataLiteral));
    }
    return out;
  }

  // ---- single-key object: candidate operator (rule 2) ------------------
  if (keys.length === 1) {
    const tag = keys[0];
    const operand = obj[tag];

    // rule 2a — known-BAD opcode tag. Always an error (these are never plausible
    // data field names, and metakit silently mis-decodes them as a literal Map).
    if (KNOWN_BAD_OPERATORS.has(tag)) {
      out.push({
        app: ctx.app,
        transition: ctx.transition,
        severity: 'error',
        code: LINT_CODES.UNKNOWN_OPERATOR,
        message:
          `'${tag}' is not a JLVM operator — metakit decodes {"${tag}":...} as a literal Map, ` +
          `so this guard is always-true/false and any effect writes a junk key. ` +
          `Use ${KNOWN_BAD_OPERATORS.get(tag)}.`,
        path: `${path}.${tag}`,
      });
      // Still descend into the operand (it may carry further violations).
      out.push(...lintGuardExpression(operand, ctx, `${path}.${tag}`, inDataLiteral));
      return out;
    }

    // Recognized operator: descend. `merge`/`cat` 2nd+ operands are DATA literals
    // (field maps to write), so mark them to suppress the generic op warning below.
    if (KNOWN_OPERATORS.has(tag)) {
      const literalDataOp = tag === 'merge' || tag === 'cat';
      if (literalDataOp && Array.isArray(operand)) {
        operand.forEach((child, i) => {
          // First operand is the base collection (an expression); the rest are
          // the literal field maps merged/appended onto it.
          out.push(...lintGuardExpression(child, ctx, `${path}.${tag}[${i}]`, i > 0 ? true : inDataLiteral));
        });
      } else {
        out.push(...lintGuardExpression(operand, ctx, `${path}.${tag}`, inDataLiteral));
      }
      return out;
    }

    // rule 2b (heuristic warn) — an unknown single-key tag that LOOKS like an
    // operator (no spaces, not `var`, not a known data scaffold) and is NOT in a
    // data-literal position. Keep this a WARNING to hold false positives low:
    // in a data-literal position a one-key object is a legitimate `{field: ...}`.
    if (
      !inDataLiteral &&
      !NON_OPERATOR_SINGLE_KEYS.has(tag) &&
      !tag.includes(' ') &&
      !tag.startsWith('$') &&
      !tag.startsWith('_') // reserved effect directives (_emit/_spawn/...) are handled structurally
    ) {
      out.push({
        app: ctx.app,
        transition: ctx.transition,
        severity: 'warn',
        code: LINT_CODES.UNKNOWN_OPERATOR,
        message:
          `single-key object {"${tag}":...} in an expression position has a key that is not a known ` +
          `JLVM operator. If '${tag}' was meant as an operator it will mis-decode as a literal Map; ` +
          `if it is a literal field, ignore. Known operators: see KNOWN_OPERATORS.`,
        path: `${path}.${tag}`,
      });
    }
    out.push(...lintGuardExpression(operand, ctx, `${path}.${tag}`, inDataLiteral));
    return out;
  }

  // ---- multi-key object: a DATA literal (a field map). Descend into values,
  // marking children as data-literal so their inner one-key objects are not
  // mistaken for operators. (`$`/leading-dot/witness `var`s inside are still
  // flagged by the recursion.)
  for (const k of keys) {
    out.push(...lintGuardExpression(obj[k], ctx, `${path}.${k}`, true));
  }
  return out;
}

// =============================================================================
// Transition-level structural rules (rule 4 / A3)
// =============================================================================

function isObjectDependency(dep: unknown): dep is { machine?: unknown } {
  return typeof dep === 'object' && dep !== null && !Array.isArray(dep);
}

function lintTransitionStructure(
  t: Transition,
  app: string | undefined,
  transition: string,
  path: string,
): LintViolation[] {
  const out: LintViolation[] = [];
  const raw = t as unknown as Record<string, unknown>;

  // rule 4a — transition-level `emits`
  if (raw.emits !== undefined) {
    out.push({
      app,
      transition,
      severity: 'error',
      code: LINT_CODES.DROPPED_DIRECTIVE,
      message:
        `transition-level 'emits' is silently dropped by toProtoDefinition (the chain Transition has ` +
        `no such field). Emit from INSIDE the effect result under the reserved key '_emit' ` +
        `({name,data,destination}), or '_triggers' for a state-changing cross-machine call.`,
      path: `${path}.emits`,
    });
  }

  // rule 4b — transition-level `spawns`
  if (raw.spawns !== undefined) {
    out.push({
      app,
      transition,
      severity: 'error',
      code: LINT_CODES.DROPPED_DIRECTIVE,
      message:
        `transition-level 'spawns' is silently dropped by toProtoDefinition — the child machine is ` +
        `never created. Spawn from INSIDE the effect result under the reserved key '_spawn' ` +
        `(with a full inline definition, a distinct childId, and initialData).`,
      path: `${path}.spawns`,
    });
  }

  // rule 4c — object-form `dependencies` entries (chain accepts Set[UUID] only)
  if (Array.isArray(t.dependencies)) {
    t.dependencies.forEach((dep, i) => {
      if (isObjectDependency(dep)) {
        out.push({
          app,
          transition,
          severity: 'error',
          code: LINT_CODES.DROPPED_DIRECTIVE,
          message:
            `dependencies[${i}] is an object ({machine,instanceRef,requiredState}); the chain parses ` +
            `'dependencies' as Set[UUID] and drops the object, so 'requiredState' gating NEVER happens. ` +
            `Pass a bare fiber-UUID string and assert machines.<uuid>.currentStateId=="<state>" in the guard.`,
          path: `${path}.dependencies[${i}]`,
        });
      }
    });
  }

  return out;
}

// =============================================================================
// _spawn owner-subset rule (rule 6 / H1)
// =============================================================================

/** Collect every string `var` reference (path or `[path, default]` head) at or below `node`. */
function collectVarRefs(node: unknown, acc: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectVarRefs(child, acc));
    return;
  }
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 1 && keys[0] === 'var') {
    const ref = obj.var;
    if (typeof ref === 'string') acc.push(ref);
    else if (Array.isArray(ref)) {
      if (typeof ref[0] === 'string') acc.push(ref[0]);
      if (ref.length > 1) collectVarRefs(ref[1], acc);
    }
    return;
  }
  for (const k of keys) collectVarRefs(obj[k], acc);
}

/**
 * Classify a `_spawn` child `owners` expression for the H1 subset risk. Returns a short reason string when
 * the owners are NOT provably ⊆ the parent's owners from the definition alone, else `undefined`.
 *
 * The linter cannot see the parent fiber's runtime `owners` (they are set at `create()` time, not in the
 * definition), so it flags only the two STRONG "not-subset" signals — keeping false positives low:
 *   - a literal array carrying ≥1 concrete address string (a hardcoded external owner list); and
 *   - any `event.*` reference (caller-supplied — the exact H1 owner-forgery vector).
 * Owners derived purely from the parent's own `state.*` / `machineId` / `$`-context are assumed in-set and
 * are NOT flagged.
 */
function spawnOwnersRisk(owners: unknown): string | undefined {
  if (Array.isArray(owners) && owners.some((o) => typeof o === 'string' && o.length > 0)) {
    return 'a literal array with hardcoded owner address(es)';
  }
  const refs: string[] = [];
  collectVarRefs(owners, refs);
  if (refs.some((r) => r === 'event' || r.startsWith('event.'))) {
    return "an 'event' reference (caller-supplied owners)";
  }
  return undefined;
}

/**
 * rule 6 (H1) — scan a transition effect for `_spawn` directives whose child `owners` are not provably a
 * SUBSET of the spawning parent's owners. The chain now fails-closed (aborts the transition) under every
 * `spawnOwnerPolicy` when a child's resolved owners are not ⊆ the parent's. Advisory (warn): the linter
 * cannot prove the subset statically, so it flags only the strong not-subset signals (see
 * {@link spawnOwnersRisk}).
 */
function lintSpawnOwners(node: unknown, app: string | undefined, transition: string, path: string): LintViolation[] {
  const out: LintViolation[] = [];
  if (Array.isArray(node)) {
    node.forEach((child, i) => out.push(...lintSpawnOwners(child, app, transition, `${path}[${i}]`)));
    return out;
  }
  if (node === null || typeof node !== 'object') return out;
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_spawn' && Array.isArray(v)) {
      v.forEach((entry, i) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'owners' in (entry as object)) {
          const reason = spawnOwnersRisk((entry as Record<string, unknown>).owners);
          if (reason) {
            out.push({
              app,
              transition,
              severity: 'warn',
              code: LINT_CODES.SPAWN_OWNERS,
              message:
                `_spawn child 'owners' must be a SUBSET of the spawning parent fiber's owners — the chain ` +
                `now FAILS-CLOSED (aborts the transition) under every spawnOwnerPolicy if they are not ⊆ the ` +
                `parent's (audit H1). This 'owners' is ${reason} and cannot be proven ⊆ the parent. Admit ` +
                `later participants via the child's own transitions / authorizedSigners / acceptedCallers ` +
                `instead of listing non-parent owners.`,
              path: `${path}.${k}[${i}].owners`,
            });
          }
        }
      });
      // Do not descend into the spawn entry (its nested child definition's owners are relative to that
      // child, not to this parent).
      continue;
    }
    out.push(...lintSpawnOwners(v, app, transition, `${path}.${k}`));
  }
  return out;
}

// =============================================================================
// _consumeNullifier literal-shape rule (rule 7 — chain DefinitionLinter mirror)
// =============================================================================

/**
 * Classify ONE authored `_consumeNullifier` item for the static shape check (the chain's
 * `DefinitionLinter.nullifierDiagnostic` mirror). Returns the advisory message when the item
 * is a LITERAL that can never normalize, else `undefined`:
 *
 *  - a string literal that fails `normalizeNullifierHex` (not 64 hex chars) — the exact
 *    values the chain rejects at combine;
 *  - a non-string, non-expression literal (number/boolean/null/array) — can NEVER normalize.
 *
 * Objects are DYNAMIC (`{"var":…}` / computed) — the resolved value is checked at combine
 * (loud graceful reject), so they are not statically checkable here.
 */
function nullifierItemRisk(item: unknown): string | undefined {
  if (typeof item === 'string') {
    return normalizeNullifierHex(item) === null
      ? `_consumeNullifier literal "${item}" does not normalize to 64 hex chars ` +
          `(optionally 0x-prefixed); the chain rejects it at combine`
      : undefined;
  }
  if (item !== null && typeof item === 'object' && !Array.isArray(item)) return undefined; // dynamic expression
  return (
    `_consumeNullifier item must be a 64-hex string (or a dynamic expression); ` +
    `this non-string literal can never normalize and the chain rejects it at combine`
  );
}

/**
 * rule 7 — scan a transition effect for `_consumeNullifier` directives whose LITERAL items are
 * malformed (chain `nullifier-literal-malformed` advisory). Shift-left for the extractor's loud
 * `CombineRejected`: an obviously-wrong literal is flagged before the definition is signed.
 * Advisory (warn) — the chain gate is the extractor. Descends every nesting position (the
 * chain's walker descends if/merge nesting the same way).
 */
function lintConsumeNullifier(
  node: unknown,
  app: string | undefined,
  transition: string,
  path: string,
): LintViolation[] {
  const out: LintViolation[] = [];
  if (Array.isArray(node)) {
    node.forEach((child, i) => out.push(...lintConsumeNullifier(child, app, transition, `${path}[${i}]`)));
    return out;
  }
  if (node === null || typeof node !== 'object') return out;
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_consumeNullifier' && Array.isArray(v)) {
      v.forEach((item, i) => {
        const message = nullifierItemRisk(item);
        if (message) {
          out.push({
            app,
            transition,
            severity: 'warn',
            code: LINT_CODES.NULLIFIER_LITERAL,
            message,
            path: `${path}.${k}[${i}]`,
          });
        }
      });
      continue;
    }
    out.push(...lintConsumeNullifier(v, app, transition, `${path}.${k}`));
  }
  return out;
}

// =============================================================================
// Top-level entry point
// =============================================================================

function appLabel(def: FiberAppDefinition): string | undefined {
  const m = def.metadata;
  if (!m) return undefined;
  if (m.app && m.type) return `${m.app}/${m.type}`;
  return m.name ?? m.app ?? m.type ?? undefined;
}

/**
 * Lint a complete fiber app definition. Walks every transition guard + effect
 * (rules 1/2/3/5) and every transition's structural directives (rule 4), plus a
 * light pass over `states` to catch stray reserved-key / operator drift embedded
 * in state metadata. Returns ALL violations (errors and warnings); callers
 * decide the exit policy (e.g. fail on any `error`).
 */
export function lintFiberApp(def: FiberAppDefinition): LintViolation[] {
  const out: LintViolation[] = [];
  const app = appLabel(def);

  // Transitions.
  (def.transitions ?? []).forEach((t, i) => {
    const transition = t.eventName ?? `${t.from}->${t.to}`;
    const tPath = `transitions[${i}]`;
    const ctx: WalkContext = { app, transition, flagWitness: true };

    if (t.guard !== undefined) {
      out.push(...lintGuardExpression(t.guard as JsonLogicRule, ctx, `${tPath}.guard`));
    }
    if (t.effect !== undefined) {
      out.push(...lintGuardExpression(t.effect as JsonLogicRule, ctx, `${tPath}.effect`));
      out.push(...lintSpawnOwners(t.effect, app, transition, `${tPath}.effect`));
      out.push(...lintConsumeNullifier(t.effect, app, transition, `${tPath}.effect`));
    }
    out.push(...lintTransitionStructure(t, app, transition, tPath));
  });

  // States — usually inert metadata, but guard against reserved-key drift here
  // too (states never run in an asset context, so witness reads would be bugs).
  Object.entries(def.states ?? {}).forEach(([name, state]) => {
    const ctx: WalkContext = { app, transition: `state:${name}`, flagWitness: true };
    out.push(...lintGuardExpression(state, ctx, `states.${name}`));
  });

  return out;
}

/**
 * Convenience: lint many apps at once, returning a flat list. Each app's
 * violations already carry its `app` label.
 */
export function lintFiberApps(defs: readonly FiberAppDefinition[]): LintViolation[] {
  return defs.flatMap((d) => lintFiberApp(d));
}
