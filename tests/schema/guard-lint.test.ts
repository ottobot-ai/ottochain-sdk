/**
 * Tests for the std-app regression lint (src/schema/guard-lint.ts).
 *
 * Every rule gets a PASSING synthetic def (no violation of that rule) and a
 * FAILING synthetic def (exactly that rule fires). Definitions are minimal and
 * hand-built so each assertion is unambiguous.
 */

import {
  lintFiberApp,
  lintGuardExpression,
  lintFiberApps,
  LINT_CODES,
  INJECTED_RESERVED_VARS,
  KNOWN_BAD_OPERATORS,
  type LintViolation,
} from '../../src/schema/guard-lint';
import type { FiberAppDefinition } from '../../src/schema/fiber-app';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Minimal valid app scaffold; callers override `transitions`. */
function makeApp(
  transitions: FiberAppDefinition['transitions'],
  extra: Partial<FiberAppDefinition> = {},
): FiberAppDefinition {
  return {
    metadata: { name: 'Test', app: 'testapp', type: 'widget', version: '1.0.0' },
    states: {
      START: { id: 'START', isFinal: false },
      DONE: { id: 'DONE', isFinal: true },
    },
    initialState: 'START',
    transitions,
    ...extra,
  };
}

const has = (vs: LintViolation[], code: string) => vs.some((v) => v.code === code);
const errors = (vs: LintViolation[]) => vs.filter((v) => v.severity === 'error');

// ---------------------------------------------------------------------------
// Rule 1 — unknown reserved `$`-key (A1: $timestamp etc.)
// ---------------------------------------------------------------------------

describe('rule 1: unknown reserved $-var', () => {
  it('PASS: the three injected reserved vars are accepted', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: {
          and: [
            { '>=': [{ var: '$ordinal' }, { var: 'state.deadline' }] },
            { '!!': [{ var: '$lastSnapshotHash' }] },
            { '<': [{ var: '$epochProgress' }, 1] },
          ],
        },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.UNKNOWN_RESERVED_VAR)).toBe(false);
  });

  it('FAIL: $timestamp in a deadline guard is flagged as error', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'settle',
        guard: { '>=': [{ var: '$timestamp' }, { var: 'state.expiresAt' }] },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.UNKNOWN_RESERVED_VAR);
    expect(v).toBeDefined();
    expect(v!.severity).toBe('error');
    expect(v!.transition).toBe('settle');
    expect(v!.message).toContain('$timestamp');
    expect(v!.path).toContain('guard');
  });

  it('FAIL: $timestamp written in an effect field is also flagged', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'close',
        guard: { '==': [1, 1] },
        effect: { merge: [{ var: 'state' }, { closedAt: { var: '$timestamp' } }] },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    expect(has(vs, LINT_CODES.UNKNOWN_RESERVED_VAR)).toBe(true);
    expect(vs.find((v) => v.code === LINT_CODES.UNKNOWN_RESERVED_VAR)!.path).toContain('effect');
  });

  it('the injected set is exactly the three engine keys', () => {
    expect([...INJECTED_RESERVED_VARS].sort()).toEqual(
      ['$epochProgress', '$lastSnapshotHash', '$ordinal'].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// Rule 2 — unknown operator tags (A2: size/getKey/setKey/deleteKey)
// ---------------------------------------------------------------------------

describe('rule 2: unknown operator tags', () => {
  it('PASS: real opcodes (length/get/has/merge/count) are accepted', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: {
          and: [
            { '>=': [{ length: { var: 'state.signatures' } }, 2] },
            { has: [{ var: 'state.members' }, { var: 'event.id' }] },
            { '>': [{ count: { var: 'state.votes' } }, 0] },
          ],
        },
        effect: { merge: [{ var: 'state' }, { tally: { get: [{ var: 'state.m' }, 'k'] } }] },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.UNKNOWN_OPERATOR)).toBe(false);
  });

  it.each([...KNOWN_BAD_OPERATORS.keys()])(
    'FAIL: known-bad opcode %s is flagged as error',
    (badOp) => {
      const app = makeApp([
        {
          from: 'START',
          to: 'DONE',
          eventName: 'go',
          guard: { '>=': [{ [badOp]: { var: 'state.signatures' } }, 2] },
          dependencies: [],
        },
      ]);
      const vs = lintFiberApp(app);
      const v = vs.find((x) => x.code === LINT_CODES.UNKNOWN_OPERATOR && x.severity === 'error');
      expect(v).toBeDefined();
      expect(v!.message).toContain(badOp);
    },
  );

  it('FAIL: setKey inside an effect is flagged (silent junk-key write)', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'sign',
        guard: { '==': [1, 1] },
        effect: {
          merge: [
            { var: 'state' },
            { signatures: { setKey: [{ var: 'state.signatures' }, { var: 'event.agent' }, { var: '$ordinal' }] } },
          ],
        },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    expect(errors(vs).some((v) => v.code === LINT_CODES.UNKNOWN_OPERATOR)).toBe(true);
  });

  it('does NOT flag legitimate data field names that merely look custom', () => {
    // `splits` / `rulingId` are field-map keys inside a merge — DATA, not ops.
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'ruling',
        guard: { '==': [1, 1] },
        effect: {
          merge: [
            { var: 'state' },
            { splits: { var: 'event.splits' }, rulingId: { var: 'event.rulingId' } },
          ],
        },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.UNKNOWN_OPERATOR)).toBe(false);
  });

  it('warns (not errors) on an unknown single-key tag in expression position', () => {
    // `frobnicate` is not in KNOWN_OPERATORS and sits where an expression is
    // expected (a guard operand) → heuristic WARN, not error.
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: { '>': [{ frobnicate: { var: 'state.x' } }, 0] },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.UNKNOWN_OPERATOR);
    expect(v).toBeDefined();
    expect(v!.severity).toBe('warn');
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — witness.* in a fiber transition
// ---------------------------------------------------------------------------

describe('rule 3: witness.* in a transition', () => {
  it('PASS: event.witness.* (the correct transition path) is accepted', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'originate',
        guard: {
          groth16_verify: [
            { var: 'event.witness.publicValues' },
            { var: 'event.witness.proof' },
          ],
        },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.WITNESS_IN_TRANSITION)).toBe(false);
  });

  it('FAIL: bare witness.publicValues in a transition guard is flagged', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'originate',
        guard: {
          groth16_verify: [
            { var: 'witness.publicValues' },
            { var: 'witness.proof' },
          ],
        },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    const ws = vs.filter((v) => v.code === LINT_CODES.WITNESS_IN_TRANSITION);
    expect(ws.length).toBe(2); // both publicValues and proof
    expect(ws[0].severity).toBe('error');
    expect(ws[0].message).toContain('event.witness');
  });

  it('FAIL: bare "witness" (whole object) is flagged too', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: { '!!': [{ var: 'witness' }] },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.WITNESS_IN_TRANSITION)).toBe(true);
  });

  it('does NOT flag a field that merely starts with the substring "witness"', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: { '!!': [{ var: 'state.witnessCount' }] }, // not `witness` / `witness.`
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.WITNESS_IN_TRANSITION)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rule 4 — dropped structural directives (A3)
// ---------------------------------------------------------------------------

describe('rule 4: dropped structural directives', () => {
  it('PASS: bare-UUID dependencies and _emit-inside-effect are accepted', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: { '==': [1, 1] },
        effect: {
          merge: [
            { var: 'state' },
            { _emit: [{ name: 'Done', data: {}, destination: 'asset' }] },
          ],
        },
        dependencies: ['11111111-1111-1111-1111-111111111111'],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.DROPPED_DIRECTIVE)).toBe(false);
  });

  it('FAIL: transition-level emits is flagged', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'release',
        guard: { '==': [1, 1] },
        emits: [{ event: 'CollateralReleased', to: 'asset' }],
        dependencies: [],
      } as unknown as FiberAppDefinition['transitions'][number],
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.DROPPED_DIRECTIVE);
    expect(v).toBeDefined();
    expect(v!.severity).toBe('error');
    expect(v!.path).toContain('emits');
    expect(v!.message).toContain('_emit');
  });

  it('FAIL: transition-level spawns is flagged', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'dispute',
        guard: { '==': [1, 1] },
        spawns: { sm: 'Judiciary', initialData: {} },
        dependencies: [],
      } as unknown as FiberAppDefinition['transitions'][number],
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.DROPPED_DIRECTIVE);
    expect(v).toBeDefined();
    expect(v!.message).toContain('_spawn');
  });

  it('FAIL: object-form dependency {machine,instanceRef,requiredState} is flagged', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'remove',
        guard: { '==': [1, 1] },
        dependencies: [
          {
            machine: 'corporate-resolution',
            instanceRef: { var: 'event.removalResolutionRef' },
            requiredState: 'EXECUTED',
          },
        ],
      },
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.DROPPED_DIRECTIVE);
    expect(v).toBeDefined();
    expect(v!.path).toContain('dependencies[0]');
    expect(v!.message).toContain('Set[UUID]');
  });

  it('mixed dependencies: only the object entry is flagged, the UUID is fine', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: { '==': [1, 1] },
        dependencies: [
          '22222222-2222-2222-2222-222222222222',
          { machine: 'x', instanceRef: { var: 'event.r' } },
        ],
      },
    ]);
    const ds = lintFiberApp(app).filter((v) => v.code === LINT_CODES.DROPPED_DIRECTIVE);
    expect(ds.length).toBe(1);
    expect(ds[0].path).toContain('dependencies[1]');
  });
});

// ---------------------------------------------------------------------------
// Rule 5 — leading-dot var paths
// ---------------------------------------------------------------------------

describe('rule 5: leading-dot var paths', () => {
  it('PASS: bare element field names inside some/map are accepted', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: {
          some: [
            { var: 'state.directors' },
            { '==': [{ var: 'directorId' }, { var: 'event.directorId' }] },
          ],
        },
        dependencies: [],
      },
    ]);
    expect(has(lintFiberApp(app), LINT_CODES.LEADING_DOT_VAR)).toBe(false);
  });

  it('FAIL: {"var":".directorId"} is flagged as error', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'go',
        guard: {
          some: [
            { var: 'state.directors' },
            { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
          ],
        },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApp(app);
    const v = vs.find((x) => x.code === LINT_CODES.LEADING_DOT_VAR);
    expect(v).toBeDefined();
    expect(v!.severity).toBe('error');
    expect(v!.message).toContain('directorId');
  });
});

// ---------------------------------------------------------------------------
// lintGuardExpression directly (the unit-level walker)
// ---------------------------------------------------------------------------

describe('lintGuardExpression (direct)', () => {
  const ctx = { app: 'a', transition: 't', flagWitness: true };

  it('returns [] for a clean nested expression', () => {
    const expr = {
      and: [
        { '>=': [{ var: '$ordinal' }, { var: 'state.deadline' }] },
        { in: [{ var: 'state.owner' }, { map: [{ var: 'proofs' }, { var: 'address' }] }] },
      ],
    };
    expect(lintGuardExpression(expr, ctx, 'g')).toEqual([]);
  });

  it('flags var-default-operand expressions too: {"var":["x",{"$timestamp"}]}', () => {
    const expr = { var: ['state.x', { var: '$timestamp' }] };
    const vs = lintGuardExpression(expr, ctx, 'g');
    expect(has(vs, LINT_CODES.UNKNOWN_RESERVED_VAR)).toBe(true);
  });

  it('finds multiple distinct violations in one tree', () => {
    const expr = {
      or: [
        { var: '$timestamp' }, // rule 1
        { size: { var: 'state.x' } }, // rule 2
        { var: '.foo' }, // rule 5
        { var: 'witness.proof' }, // rule 3
      ],
    };
    const vs = lintGuardExpression(expr, ctx, 'g');
    expect(has(vs, LINT_CODES.UNKNOWN_RESERVED_VAR)).toBe(true);
    expect(has(vs, LINT_CODES.UNKNOWN_OPERATOR)).toBe(true);
    expect(has(vs, LINT_CODES.LEADING_DOT_VAR)).toBe(true);
    expect(has(vs, LINT_CODES.WITNESS_IN_TRANSITION)).toBe(true);
  });

  it('does not flag witness when flagWitness is false (asset context)', () => {
    const expr = { '!!': [{ var: 'witness.proof' }] };
    const vs = lintGuardExpression(expr, { ...ctx, flagWitness: false }, 'g');
    expect(has(vs, LINT_CODES.WITNESS_IN_TRANSITION)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// integration: a fully clean app and a fully dirty app
// ---------------------------------------------------------------------------

describe('lintFiberApp integration', () => {
  it('a clean app yields zero violations', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'finalize',
        guard: {
          and: [
            { in: [{ var: 'state.owner' }, { map: [{ var: 'proofs' }, { var: 'address' }] }] },
            { '>=': [{ var: '$ordinal' }, { var: 'state.deadline' }] },
            { '>=': [{ length: { var: 'state.completions' } }, 2] },
          ],
        },
        effect: { merge: [{ var: 'state' }, { finalizedAt: { var: '$ordinal' } }] },
        dependencies: ['33333333-3333-3333-3333-333333333333'],
      },
    ]);
    expect(lintFiberApp(app)).toEqual([]);
  });

  it('a dirty app surfaces every rule and carries the app label', () => {
    const app = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'bad',
        guard: {
          or: [
            { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] }, // 1
            { '>=': [{ size: { var: 'state.x' } }, 2] }, // 2
            { '==': [{ var: '.field' }, 1] }, // 5
            { '!!': [{ var: 'witness.proof' }] }, // 3
          ],
        },
        spawns: { sm: 'X' }, // 4
        dependencies: [{ machine: 'x', instanceRef: { var: 'event.r' } }], // 4
      } as unknown as FiberAppDefinition['transitions'][number],
    ]);
    const vs = lintFiberApp(app);
    expect(has(vs, LINT_CODES.UNKNOWN_RESERVED_VAR)).toBe(true);
    expect(has(vs, LINT_CODES.UNKNOWN_OPERATOR)).toBe(true);
    expect(has(vs, LINT_CODES.LEADING_DOT_VAR)).toBe(true);
    expect(has(vs, LINT_CODES.WITNESS_IN_TRANSITION)).toBe(true);
    expect(has(vs, LINT_CODES.DROPPED_DIRECTIVE)).toBe(true);
    expect(vs.every((v) => v.app === 'testapp/widget')).toBe(true);
    // both spawns and the object-dependency should fire
    expect(vs.filter((v) => v.code === LINT_CODES.DROPPED_DIRECTIVE).length).toBe(2);
  });

  it('lintFiberApps aggregates across multiple defs', () => {
    const clean = makeApp([
      { from: 'START', to: 'DONE', eventName: 'ok', guard: { '==': [1, 1] }, dependencies: [] },
    ]);
    const dirty = makeApp([
      {
        from: 'START',
        to: 'DONE',
        eventName: 'bad',
        guard: { var: '$timestamp' },
        dependencies: [],
      },
    ]);
    const vs = lintFiberApps([clean, dirty]);
    expect(vs.length).toBe(1);
    expect(vs[0].code).toBe(LINT_CODES.UNKNOWN_RESERVED_VAR);
  });
});
