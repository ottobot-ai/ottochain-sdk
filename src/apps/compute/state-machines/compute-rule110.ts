import { defineFiberApp } from "../../../schema/fiber-app.js";
import type { JsonLogicRule } from "../../../schema/fiber-app.js";

/**
 * Rule-110 cellular automaton — an in-place, Turing-complete JLVM substrate.
 *
 * Each `step` event advances ONE CA generation in place:
 *   next[i] = R110(tape[i-1], tape[i], tape[i+1])
 * with fixed-0 boundaries, computed as a JLVM `map` over a STORED index array
 * (`idx`) — no bitwise ops, no spawn, no zip. The fiber loops RUNNING → RUNNING;
 * the chain of transitions IS the Turing-machine tape-head.
 *
 * Rule 110: out = 1 iff p ∈ {1,2,3,5,6}, where p = 4·left + 2·center + right.
 *
 * THE INLINED-CELL CONSTRAINT (do not "simplify" with `let`)
 * ---------------------------------------------------------
 * Inside `map`, a primitive element is overlaid into the eval context, so
 * `{var:""}` coerces to the element int ONLY in arithmetic position. Opening a
 * `let` scope over the element makes `{var:""}` resolve to the whole context
 * object (`{"tag":"map"}`) and any `cat` on it throws `JsonLogicRuntimeError`.
 * Therefore the per-cell predicate P is fully INLINED at each of the five `==`
 * comparison sites (P appears 5×; each neighbour read `nb` reads the tape once
 * per occurrence). This is the only form that works inside `map`. It is built
 * programmatically below to avoid hand-duplicating P, but it expands to the
 * inlined AST — NOT a `let`-form.
 *
 * Neighbour access uses a computed `var` PATH with a null-default boundary:
 *   nb(off) = { var: [ { cat: ["state.tape.", off] }, 0 ] }
 * An out-of-bounds index (-1 or N) resolves to the default `0` (fixed-0
 * boundary), so `tape`/`idx` stay exactly length N forever.
 *
 * Verified end-to-end against `@constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5`:
 * the effect reproduces the canonical left-growing Rule-110 fractal exactly,
 * `idx` is byte-identical across every generation, and the unbounded/bounded
 * guard halts at `gen == maxGen`.
 */

// nb(off): read tape at element-relative offset, fixed-0 boundary via null-default.
const nb = (off: unknown): JsonLogicRule => ({
  var: [{ cat: ["state.tape.", off] }, 0],
});

// P = 4·left + 2·center + right  (element {var:""} is the cell index i).
const P: JsonLogicRule = {
  "+": [
    { "*": [4, nb({ "-": [{ var: "" }, 1] })] },
    { "*": [2, nb({ var: "" })] },
    nb({ "+": [{ var: "" }, 1] }),
  ],
};

// CELL: 1 iff P ∈ {1,2,3,5,6}, else 0. P is INLINED at each `==` site (B1: never
// `let` over the map element). Built from the rule-110 truth set programmatically.
const CELL: JsonLogicRule = {
  if: [{ or: [1, 2, 3, 5, 6].map((k) => ({ "==": [P, k] })) }, 1, 0],
};

/**
 * Rule-110 cellular-automaton fiber definition.
 *
 * Trust model: PUBLIC / PERMISSIONLESS / pure compute. No assets, no parties,
 * no owner — anyone may submit `step`. The DoS surface is bounded by per-event
 * gas/fee (~987 gas/cell) and the optional `maxGen` halt bound (absent ⇒
 * unbounded; runs until fees stop).
 */
export const computeRule110Def = defineFiberApp({
  metadata: {
    name: "ComputeRule110",
    app: "compute",
    type: "rule110",
    version: "1.0.0",
    description:
      "In-place Rule-110 cellular automaton — a Turing-complete substrate. Each " +
      "`step` advances one generation: next[i]=R110(tape[i-1],tape[i],tape[i+1]) " +
      "with fixed-0 boundaries, as a JLVM map over a stored index array (no " +
      "bitwise, no spawn, no zip).",
  },

  createSchema: {
    // maxGen is NOT required: absent ⇒ unbounded (the step guard uses `missing`).
    required: ["tape", "idx"] as const,
    properties: {
      tape: {
        type: "array",
        items: { type: "integer" },
        description: "0/1 CA row (length N).",
      },
      idx: {
        type: "array",
        items: { type: "integer" },
        immutable: true,
        description:
          "Monotone index array [0..N-1]; REQUIRED (no range/iota opcode). " +
          "Never mutated — the effect preserves it across every generation.",
      },
      gen: {
        type: "integer",
        default: 0,
        description: "Generation counter (TM step count).",
      },
      maxGen: {
        type: "integer",
        description: "Optional halt bound; absent ⇒ unbounded.",
      },
    },
  },

  stateSchema: {
    properties: {
      tape: { type: "array", items: { type: "integer" }, computed: true },
      idx: { type: "array", items: { type: "integer" }, immutable: true },
      gen: { type: "integer", computed: true },
      maxGen: { type: "integer" },
      status: { type: "string", computed: true },
    },
  },

  eventSchemas: {
    step: { description: "Advance one CA generation in place." },
    halt: { description: "Terminate once maxGen is reached (gated by gen >= maxGen)." },
  },

  states: {
    RUNNING: {
      id: "RUNNING",
      isFinal: false,
      metadata: {
        label: "Running",
        description: "CA evolving; each step = one generation.",
        category: "active",
      },
    },
    HALTED: {
      id: "HALTED",
      isFinal: true,
      metadata: {
        label: "Halted",
        description: "maxGen reached; terminal.",
        category: "terminal",
      },
    },
  },

  initialState: "RUNNING",

  transitions: [
    {
      // One `step` = one generation. Loops in place (the TM tape-head).
      from: "RUNNING",
      to: "RUNNING",
      eventName: "step",
      // Unbounded when maxGen is absent (`missing` → true); else gate on gen < maxGen.
      guard: {
        or: [
          { missing: ["state.maxGen"] },
          { "<": [{ var: "state.gen" }, { var: "state.maxGen" }] },
        ],
      },
      // Effect result IS the new stateData: merge[state, overrides] preserves
      // idx/maxGen and overwrites tape/gen.
      effect: {
        merge: [
          { var: "state" },
          {
            tape: { map: [{ var: "state.idx" }, CELL] },
            gen: { "+": [{ var: "state.gen" }, 1] },
          },
        ],
      },
      dependencies: [],
    },
    {
      // halt is rejected until exhaustion: gen >= maxGen.
      from: "RUNNING",
      to: "HALTED",
      eventName: "halt",
      guard: { ">=": [{ var: "state.gen" }, { var: "state.maxGen" }] },
      effect: { merge: [{ var: "state" }, { status: "halted" }] },
      dependencies: [],
    },
  ],
} as const);
