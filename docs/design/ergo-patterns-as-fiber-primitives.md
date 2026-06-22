# Ergo patterns as fiber primitives

> **Thesis.** OttoChain is a persistent-fiber account layer (long-lived state machines with identity, owners, and a transition table) sitting *above* a ZK/UTXO **note layer** that supplies privacy, with the **asset model** as the value substrate and **identity/reputation** as the access-control spine. The four primitives below are classic Ergo / eUTXO patterns mapped onto fibers: where Ergo expresses guards as **sigma-protocols**, OttoChain expresses them as **JLVM verifier opcodes** (`sigma_verify`, the Groth16 verifier, the DDH/dhtuple machinery). Cellular automata prove the substrate is Turing-complete; the mixer and the note pool prove the note layer can carry real privacy; the staked-pool family proves the account layer can carry real economic coordination.

These are the building blocks: two are **end-to-end demos** (`rule110-ca`, `sigma-mixer`) that exercise the full stack against the chain, and two are **standard-library primitives** (`staked-pool-family`, `shielded-note-pool`) intended to be reused by downstream apps. The engine invariants they all lean on are specified separately in [`engine-hardening-spawn-and-effects.md`](../../../ottochain/docs/design/engine-hardening-spawn-and-effects.md).

---

## rule110-ca

*An in-place Rule-110 cellular-automaton fiber — a Turing-complete JLVM substrate that advances one CA generation per `step` event using the stored-index-array idiom (map element-as-context + computed `var` paths + null-default boundaries), no spawn/bitwise/zip.*


# FINAL DESIGN SPEC — `rule110-ca`: in-place Rule-110 cellular automaton (Turing-complete substrate)

Every load-bearing JLVM/lint/harness claim below was re-executed against the real VM `@constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5` and the real SDK/ottochain source. Empirical results are quoted inline. **The review's BLOCKER (B1) is confirmed and the broken `let`-form is removed; the shipped cell expression is the fully-inlined form, which I ran end-to-end and reproduces the canonical fractal exactly.**

---

## 0. What changed from the reviewed draft (review disposition)

- **B1 (BLOCKER) — FIXED.** Empirically reproduced: `{map:[idx,{let:[{i:{var:""}},{cat:["state.tape.",{var:"i"}]}]}]}` returns `ok:false JsonLogicRuntimeError`. Verified WHY: inside `map`, a primitive element is overlaid into the eval context, and once a `let` scope opens, `{var:""}` resolves to **the whole context object** (`{"tag":"map"}`), not the integer — so `let`-binding the element gives `i = <object>`, and feeding it to `cat` throws. **The `let`-over-element form is deleted everywhere.** The shipped cell uses `{var:""}` only *inside arithmetic* (`{"-":[{var:""},1]}`), where it coerces to the int. Verified inlined run below (§3).
- **H2 (HIGH) — FIXED by extending the harness.** Confirmed `processEvent.ts` validator checks only `expectedState` + sequence increase; no `expectedStateData`. We add real `expectedStateData` deep-equal support (3 tiny edits, §4.6) and the fractal flow asserts the exact gen-by-gen tapes from §3. The "fractal verified e2e" claim is now true.
- **H3 (HIGH) — RESOLVED by stating the trust model + adding ordinal-monotonicity.** The substrate is *public, permissionless pure compute* (no assets). We add `targetSequenceNumber`-based idempotency (the harness already threads `preSendSeqNum`) and document the griefing surface bounded by per-event gas/fees. No signer binding (there is no owner concept for a public substrate); an owner-gated variant is noted as an opt-in.
- **H4 (HIGH) — RESOLVED.** Confirmed the contradiction: `guard-lint.ts` rule 3 (line 217) flags `witness.*` in a fiber transition as a **fail-closed ERROR**, yet `src/apps/lending/eligibility.ts:118-130` reads `witness.publicValues`/`witness.proof` and its doc says the same expr is used as **both** an asset `mintPolicy` AND a fiber-transition guard. The §7 gate API now takes **context as a required argument** (no `event.*`/`witness.*` default) and explicitly documents that transitions use `event.*`, asset policies use `witness.*`. We do NOT silently default.
- **M5 — FIXED.** Verified `missing` ∈ `KNOWN_OPERATORS` and that `{or:[{missing:["state.maxGen"]},{"<":[gen,maxGen]}]}` returns `true` when `maxGen` is absent (unbounded) and gates correctly when present. The guard uses this so an omitted `maxGen` means "unbounded," not "bricked."
- **M6 — FIXED.** `isFinal` is required on `StateDefinition` (`src/schema/fiber-app.ts:113`). All `states` blocks now carry `isFinal`. `category` is NOT a top-level field — it lives inside `metadata` (`StdStateMetadata`, fiber-app.ts:100-108); the std-app uses `metadata: { label, description, category }`.
- **M7 — ADDRESSED.** Documented lifecycle hole; the std-app keeps `HALTED` reachable only via explicit `halt` (auto-transition is not expressible without an event). The e2e covers both the gated-halt-rejection and the post-exhaustion halt.
- **L8 — FIXED.** `example.json` includes the top-level `events` array (atomic-swap parity, terminal display path).
- **L9 — FIXED.** Gas table re-measured via the correct API `evaluateWithGas(parseExpression(expr), parseValue(data), gasLimit)` (the 3rd `gasLimit` arg is required — omitting it throws `Cannot convert undefined to a BigInt`). Real numbers in §3.4.

---

## 1. Tape encoding

`stateData`:
```jsonc
{
  "tape":   [0,0,…,1,…,0],   // array of 0/1 ints, length N — the CA row
  "idx":    [0,1,2,…,N-1],   // monotone index array, length N — REQUIRED (no range opcode)
  "gen":    0,               // generation counter (TM step count)
  "maxGen": 64               // OPTIONAL run-length bound; absent ⇒ unbounded (see guard, §2.2)
}
```

- Cells are ints `0`/`1` (arithmetic `4l+2c+r` needs ints; `==` compares cleanly).
- **`idx` MUST be stored.** Verified: `range`/`iota` are absent from `KNOWN_OPERATORS`; `map` exposes no index. `idx` is created once and never mutated (it is preserved across every generation by the merge — verified §3).
- **Boundary = fixed-0** via the `var` null-default (verified: `{var:[{cat:["tape.",-1]},0]}` → `0`), so `tape`/`idx` stay exactly length N.

---

## 2. The `step` transition (full JLVM, verified)

One external `step` event = one generation. The fiber loops `RUNNING → RUNNING` in place (the chain of transitions IS the TM tape-head).

### 2.1 The per-cell Rule-110 lookup — SHIPPED INLINED FORM (verified working)

Rule 110: `out = 1` iff `p ∈ {1,2,3,5,6}` where `p = 4·left + 2·center + right`.

Define the neighbor read at element-relative offset (element `{var:""}` is the cell index `i`):
```
nb(off) = { "var": [ { "cat": ["state.tape.", off] }, 0 ] }
```
`p`:
```
P = { "+": [ { "*": [4, nb({"-":[{"var":""},1]}) ] },
             { "*": [2, nb({"var":""})            ] },
                       nb({"+":[{"var":""},1]})        ] }
```
CELL (this exact text ran and reproduced §3.3):
```jsonc
{ "if": [
  { "or": [
    { "==": [ P, 1 ] }, { "==": [ P, 2 ] }, { "==": [ P, 3 ] },
    { "==": [ P, 5 ] }, { "==": [ P, 6 ] }
  ] },
  1, 0
] }
```
with `P` (and within it `nb(...)`) **inlined at each of the five `==` sites** (P appears 5×; each `nb` reads the tape once per occurrence). This is the entire reason it is verbose — but it is the ONLY form that works inside `map`. **Do NOT factor with `let` over the element (B1).** If a future smaller form is wanted, it cannot come from `let`-binding the element; it would require an `idx`-of-`{l,c,r}`-tuples precomputed off-chain (out of scope).

> Verified non-idiom: `{map:[idx,{let:[{i:{var:""}},…]}]}` → `i` is `{"tag":"map"}` (the context object), and any `cat` on it throws `JsonLogicRuntimeError`. Reproduced directly.

### 2.2 Transition object (SDK `Transition` shape)

```jsonc
{
  "from": "RUNNING", "to": "RUNNING", "eventName": "step",
  "guard": { "or": [
    { "missing": ["state.maxGen"] },
    { "<": [ {"var":"state.gen"}, {"var":"state.maxGen"} ] }
  ] },
  "effect": { "merge": [ {"var":"state"},
    { "tape": { "map": [ {"var":"state.idx"}, <CELL §2.1 inlined> ] },
      "gen":  { "+": [ {"var":"state.gen"}, 1 ] } } ] },
  "dependencies": []
}
```
- The effect result IS the new `stateData` (atomic-swap convention): `merge[state, {…overrides}]` preserves `idx`/`maxGen`, overwrites `tape`/`gen`. **Verified:** after each generation `idx` is byte-identical to the initial `[0..14]` and `maxGen`/`status` are preserved.
- **Guard (M5):** `{or:[{missing:["state.maxGen"]}, {"<":[gen,maxGen]}]}`. Verified: absent `maxGen` → `true` (unbounded); `gen=3,maxGen=8` → `true`; `gen=8,maxGen=8` → `false` (halts).
- No `_spawn`/`_emit`/`_transfer` — pure in-place computation.

**Lint clean (verified against `src/schema/guard-lint.ts`):**
- Operators used — `merge, map, cat, +, -, *, ==, or, if, <, missing` — all in `KNOWN_OPERATORS` (checked each via `KNOWN_OPERATORS.has(...)`; `var` is special-cased at line 173 / in `NON_OPERATOR_SINGLE_KEYS` line 117, not flagged).
- `merge`'s 2nd operand is treated as a DATA literal (line 269); the nested `{map:[...]}` inside the `tape`/`gen` field map is in a data-literal position and is NOT mis-flagged as a junk key.
- No `$timestamp`/`witness.*`/leading-dot vars ⇒ rules 1/3/5 silent.

---

## 3. Verification against the real VM (executed)

### 3.1 Idiom (all confirmed)
- `map` element-as-context, no index: `{map:[{var:"t"},{"*":[{var:""},10]}]}` over `{t:[1,2,3]}` → `[10,20,30]`.
- Outer `state.*` visible under primitive element: `{map:[[0,1,2],{var:"tape.0"}]}` over `{tape:[7,8,9]}` → `[7,7,7]`.
- Computed var path: `{var:[{cat:["tape.",1]}]}` → `8`.
- OOB null-default boundary: `{var:[{cat:["tape.",-1]},0]}` → `0`.

### 3.2 BLOCKER reproduced (negative result)
- `let`-over-element: returns `[{},{},{}]` (i bound to context object) and `cat` on it → `ok:false JsonLogicRuntimeError`. **Inlined form is the only valid one.**

### 3.3 Full 8-generation run via the REAL transition effect `merge[state,{tape,gen}]` (exact VM output)
Initial: single 1 at index 7, length 15, `maxGen:8`:
```
gen0: 000000010000000
gen1: 000000110000000   gen=1  idxOK=true  maxGen=8  status=running
gen2: 000001110000000   gen=2  idxOK=true
gen3: 000011010000000   gen=3  idxOK=true
gen4: 000111110000000   gen=4  idxOK=true
gen5: 001100010000000   gen=5  idxOK=true
gen6: 011100110000000   gen=6  idxOK=true
gen7: 110101110000000   gen=7  idxOK=true
gen8: 111111010000000   gen=8  idxOK=true  maxGen=8  status=running
```
Canonical left-growing Rule-110. `idx`/`maxGen`/`status` preserved every generation (verified, not asserted).

### 3.4 Gas — re-measured via `evaluateWithGas(parseExpression(effect), parseValue({state,event}), gasLimit)`
| N | gasUsed | per cell |
|---|---------|----------|
| 15 | 14,501 | 967 |
| 64 | 62,178 | 972 |
| 256 | 251,334 | 982 |
| 512 | 504,262 | 985 |
| 1024 | 1,010,478 | 987 |

~987 gas/cell, linear. `maxGas = 10,000,000`/transition ⇒ ~10,100 cells/step before gas binds. The 1 MB state cap binds for very wide tapes (§5).

---

## 4. e2e example — `/home/euler/repos/ottochain/e2e-test/examples/rule110-ca/`

Mirrors atomic-swap layout: `definition.json`, `initial-data.json`, `example.json`, `event-step.ts`, `event-halt.ts`, `README.md`.

### 4.1 `definition.json`
```jsonc
{
  "states": {
    "RUNNING": { "id": "RUNNING", "isFinal": false, "metadata": { "label": "Running", "description": "CA evolving; each step = one generation", "category": "active" } },
    "HALTED":  { "id": "HALTED",  "isFinal": true,  "metadata": { "label": "Halted",  "description": "maxGen reached; terminal", "category": "terminal" } }
  },
  "initialState": "RUNNING",
  "transitions": [
    { "from": "RUNNING", "to": "RUNNING", "eventName": "step",
      "guard":  { "or": [ {"missing":["state.maxGen"]}, {"<":[{"var":"state.gen"},{"var":"state.maxGen"}]} ] },
      "effect": { "merge": [ {"var":"state"},
                   { "tape": { "map": [ {"var":"state.idx"}, <CELL §2.1 INLINED> ] },
                     "gen":  { "+": [ {"var":"state.gen"}, 1 ] } } ] },
      "dependencies": [] },
    { "from": "RUNNING", "to": "HALTED", "eventName": "halt",
      "guard":  { ">=": [ {"var":"state.gen"}, {"var":"state.maxGen"} ] },
      "effect": { "merge": [ {"var":"state"}, { "status": "halted" } ] },
      "dependencies": [] }
  ]
}
```
The `halt` guard `gen >= maxGen` is rejected until exhaustion — proving the gate (its operators `>=`, `merge`, `var` are all in `KNOWN_OPERATORS`).

### 4.2 `initial-data.json` (the canonical fractal, width 15, 8 gens)
```jsonc
{ "tape": [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  "idx":  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
  "gen":  0, "maxGen": 8 }
```

### 4.3 `event-step.ts` / `event-halt.ts`
```ts
// event-step.ts
export default () => ({ eventName: "step", payload: {} });
// event-halt.ts
export default () => ({ eventName: "halt", payload: {} });
```

### 4.4 `example.json` — top-level `events` array (L8) + testFlows that ASSERT tape contents (H2)
```jsonc
{
  "name": "Rule-110 cellular automaton (Turing-complete substrate)",
  "description": "Each `step` event advances one generation in place: next[i]=R110(tape[i-1],tape[i],tape[i+1]) with fixed-0 boundaries, computed as a JLVM map over a stored index array — no bitwise, no spawn, no zip.",
  "type": "state-machine",
  "definition": "definition.json",
  "initialData": "initial-data.json",
  "events": [
    { "name": "step", "description": "Advance one generation", "file": "event-step.ts", "from": "RUNNING", "to": "RUNNING" },
    { "name": "halt", "description": "Terminate after maxGen reached", "file": "event-halt.ts", "from": "RUNNING", "to": "HALTED" }
  ],
  "testFlows": [
    { "name": "Rule-110 fractal — 8 generations, tape asserted",
      "description": "Evolve the canonical single-1 seed; assert the EXACT tape after each generation (not just the state id).",
      "steps": [
        { "action": "create", "definition": "definition.json", "initialData": "initial-data.json" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], "gen": 1, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0], "gen": 2, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,0,0,0,1,1,0,1,0,0,0,0,0,0,0], "gen": 3, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0], "gen": 4, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,0,1,1,0,0,0,1,0,0,0,0,0,0,0], "gen": 5, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [0,1,1,1,0,0,1,1,0,0,0,0,0,0,0], "gen": 6, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [1,1,0,1,0,1,1,1,0,0,0,0,0,0,0], "gen": 7, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING", "expectedStateData": { "tape": [1,1,1,1,1,1,0,1,0,0,0,0,0,0,0], "gen": 8, "idx": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], "maxGen": 8 } }
      ] },
    { "name": "Halt is gated until exhaustion",
      "description": "halt at gen 0 (< maxGen 8) is rejected by the >= guard (ml0).",
      "steps": [
        { "action": "create", "definition": "definition.json", "initialData": "initial-data.json" },
        { "action": "processEvent", "event": "event-halt.ts", "expectRejected": "ml0" }
      ] },
    { "name": "Halt after exhaustion",
      "description": "After 8 steps gen==maxGen; halt now succeeds → HALTED.",
      "steps": [
        { "action": "create", "definition": "definition.json", "initialData": "initial-data.json" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-step.ts", "expectedState": "RUNNING" },
        { "action": "processEvent", "event": "event-halt.ts", "expectedState": "HALTED" }
      ] }
  ]
}
```
Expected tapes are exactly §3.3 (re-derived from the real VM). The `expectedStateData` deep-equal makes a miscomputation fail the test — closing H2.

### 4.5 README
"First Turing-complete substrate on OttoChain: Rule-110 evolved IN PLACE by a single fiber, one `step` = one generation. Demonstrates the **index-array idiom** — neighbor access inside a `map` with no index opcode, via computed `var` paths `{"var":[{"cat":["state.tape.", i]}]}` and the null-default boundary. No spawn, no bitwise, no zip. The e2e asserts the exact tape per generation."

### 4.6 Harness extension (H2 — REQUIRED, 3 edits, all verified locations)
The fiber record exposes `.stateData` (used in `e2e-test/scripts/debug-tictactoe.ts`). Add `expectedStateData` deep-equal:

1. `/home/euler/repos/ottochain/e2e-test/runner.ts:331` — add to `TestStep`: `expectedStateData?: Record<string, unknown>;`
2. `/home/euler/repos/ottochain/e2e-test/runner.ts:586` — thread it into `stepOptions` in the `processEvent` case: add `expectedStateData: step.expectedStateData,` next to `expectedState`.
3. `/home/euler/repos/ottochain/e2e-test/lib/state-machine/processEvent.ts:10` — add `expectedStateData?: Record<string, unknown>;` to `ProcessEventOptions`; then in the validator (after the `expectedState` block ~line 96), add:
   ```ts
   if (options.expectedStateData) {
     const got = finalRecord.stateData;
     const a = JSON.stringify(got);                     // canonical compare
     const b = JSON.stringify(options.expectedStateData);
     // deep-equal via stable key order; for tape/idx/gen/maxGen plain JSON order is fine,
     // but prefer a real deep-equal util if available:
     if (!deepEqual(got, options.expectedStateData)) {
       throw new Error(`[processEvent.validator] expectedStateData mismatch for ${cid} at ${url}: got ${a} want ${b}`);
     }
   }
   ```
   Use a recursive `deepEqual` (object key-order-independent) rather than string compare to avoid key-ordering false negatives.

---

## 5. State-size analysis & the 1 MB cap
| N | state bytes (approx) | % of 1 MB |
|---|----------------------|-----------|
| 1,024 | ~6.1 KB | 0.6% |
| 4,096 | ~27.6 KB | 2.6% |
| 16,384 | ~120 KB | 11.4% |
| 32,768 | ~251 KB | 23.9% |

`maxStateSizeBytes = 1,048,576`. A single fiber holds ~60k cells; at that width gas (~60M) exceeds `maxGas` first, so for very wide tapes **gas binds (~10,100 cells/step) before state size**; for any realistic demo (≤2k) both are far from limits. Beyond 1 MB is the separate spawn-chaining workstream (each fiber owns a segment, exchanges boundary cells via `_emit`/`_triggers`, `_spawn`s the next on its PRIMARY transition) — out of scope here.

---

## 6. Security model & invariants (H3)

- **Trust model: public, permissionless, pure compute.** No assets, no parties, no owner. Anyone may submit `step`. This is intentional for a "substrate."
- **Idempotency / replay:** rely on `targetSequenceNumber` (the harness already threads `preSendSeqNum`); each accepted `step` increments `gen` and the fiber sequence number, so a replayed/stale event at an old sequence is a no-op/rejected. There is no `$ordinal`-monotonicity clause in the guard because there is no fairness/timeout requirement.
- **DoS surface (documented):** because anyone can `step`, the bound is per-event gas/fee (~987·N gas/step) and the `maxGen` halt. With `maxGen` set, the fiber is finite-work; without it, it runs until fees stop. README states this explicitly.
- **Invariants the effect preserves (verified §3):** (i) `len(tape)==len(idx)==N` forever (boundary via null-default, never via padding); (ii) `idx` immutable; (iii) cells ∈ {0,1} (CELL returns only 1/0); (iv) `gen` strictly increases by 1 per accepted `step`.
- **Owner-gated variant (opt-in, not default):** add a leading guard clause `{"==":[{"var":"event.agent"},{"var":"state.owner"}]}` and store `owner` at create — using `event.*` (NOT `witness.*`, per lint rule 3). Left as a documented option.

---

## 7. Std-lib app form — `src/apps/compute/`

Bare-computation app: no parties/assets/governance. Layout mirrors `src/apps/markets/` (`index.ts` with a `DEFINITIONS` map + getter; `state-machines/<prefix>-<variant>.ts` via `defineFiberApp`).

### 7.1 `src/apps/compute/state-machines/compute-rule110.ts`
```ts
import { defineFiberApp } from "../../../schema/fiber-app.js";

// CELL is the §2.1 INLINED expression — NOT a let-form (B1). Build it programmatically
// to avoid hand-duplicating P five times:
const nb = (off: unknown) => ({ var: [ { cat: ["state.tape.", off] }, 0 ] });
const P = { "+": [ { "*": [4, nb({ "-": [{ var: "" }, 1] })] },
                   { "*": [2, nb({ var: "" })] },
                            nb({ "+": [{ var: "" }, 1] }) ] };
const CELL = { if: [ { or: [1,2,3,5,6].map(k => ({ "==": [P, k] })) }, 1, 0 ] };

export const computeRule110Def = defineFiberApp({
  metadata: {
    name: "ComputeRule110", app: "compute", type: "rule110", version: "1.0.0",
    description:
      "In-place Rule-110 cellular automaton — a Turing-complete substrate. Each `step` " +
      "advances one generation: next[i]=R110(tape[i-1],tape[i],tape[i+1]) with fixed-0 " +
      "boundaries, as a JLVM map over a stored index array (no bitwise, no spawn, no zip).",
  },
  createSchema: {
    required: ["tape", "idx"] as const,                 // maxGen NOT required (absent ⇒ unbounded, M5)
    properties: {
      tape: { type: "array", items: { type: "integer" }, description: "0/1 CA row" },
      idx:  { type: "array", items: { type: "integer" }, immutable: true,
              description: "Monotone [0..N-1]; required (no range opcode)" },
      gen:    { type: "integer", default: 0 },
      maxGen: { type: "integer", description: "Optional halt bound; absent ⇒ unbounded" },
    },
  },
  stateSchema: {
    properties: {
      tape:   { type: "array", items: { type: "integer" }, computed: true },
      idx:    { type: "array", items: { type: "integer" }, immutable: true },
      gen:    { type: "integer", computed: true },
      maxGen: { type: "integer" },
      status: { type: "string", computed: true },
    },
  },
  states: {
    // isFinal is REQUIRED (M6); category lives inside metadata (StdStateMetadata)
    RUNNING: { id: "RUNNING", isFinal: false,
               metadata: { label: "Running", description: "CA evolving", category: "active" } },
    HALTED:  { id: "HALTED",  isFinal: true,
               metadata: { label: "Halted",  description: "Terminal",   category: "terminal" } },
  },
  initialState: "RUNNING",
  transitions: [
    { from: "RUNNING", to: "RUNNING", eventName: "step",
      guard:  { or: [ { missing: ["state.maxGen"] },
                      { "<": [ { var: "state.gen" }, { var: "state.maxGen" } ] } ] },
      effect: { merge: [ { var: "state" },
                 { tape: { map: [ { var: "state.idx" }, CELL ] },
                   gen:  { "+": [ { var: "state.gen" }, 1 ] } } ] },
      dependencies: [] },
    { from: "RUNNING", to: "HALTED", eventName: "halt",
      guard:  { ">=": [ { var: "state.gen" }, { var: "state.maxGen" } ] },
      effect: { merge: [ { var: "state" }, { status: "halted" } ] },
      dependencies: [] },
  ],
});
```
> Confirm `SchemaField` actually supports `immutable`/`computed`/`default` before relying on them (check `src/schema/fiber-app.ts` `SchemaField`); if not present, drop them — they are descriptive only and do not affect the on-chain guard/effect.

### 7.2 `src/apps/compute/index.ts`
```ts
import { computeRule110Def } from "./state-machines/compute-rule110.js";
import type { FiberAppDefinition } from "../../schema/fiber-app.js";
export const COMPUTE_DEFINITIONS = { rule110: computeRule110Def } as const;
export type ComputeDefType = keyof typeof COMPUTE_DEFINITIONS;
export function getComputeDefinition(type: ComputeDefType = "rule110"): FiberAppDefinition {
  return COMPUTE_DEFINITIONS[type];
}
```
Wire `export * from "./compute/index.js"` into `src/apps/index.ts` matching how `markets`/`identity` are aggregated.

**Generalization:** `compute/elementary-ca` (parametric Wolfram code: store the 8-bit rule lookup as an 8-element `rule` array and index it by `p` via `{"var":[{"cat":["state.rule.", P]}]}` — one definition covers all 256 elementary CAs); `compute/convolve` (any fixed stencil). All share the `idx` + computed-path neighbor access proven here, and all must use inlined neighbor reads (no `let` over the element).

---

## 8. Curve-ops std app — assessment (H4 resolved)

**Recommendation: YES, as reusable VERIFICATION-GATE builders, NOT general EC arithmetic.** Home: `src/schema/crypto-guards.ts`, alongside `guards.ts`.

### 8.1 Why gates not arithmetic
Raw EC ops (`bn254_add` 64B→64B, `bn254_mul`, `bn254_pairing` value form) are value-producing, not predicates — no general on-chain "EC math library" use case. The **verify** ops ARE predicates and are already used ad hoc: `groth16_verify` in `src/zk/guard.ts:57`, `apps/lending/eligibility.ts`, privacy/shield; `schnorr_verify` in `apps/lending/credit-scoring.ts`. A builder library removes the duplicated operand wiring and centralizes the context rule.

### 8.2 Context is an EXPLICIT, REQUIRED argument (H4)
Verified contradiction: `guard-lint.ts:217` (rule 3) errors on `witness.*` in a fiber transition (fail-closed, "read 'event.*' instead, or move onto the asset mintPolicy/burnPolicy"); but `eligibility.ts:118-130` `buildOriginationGuard` reads `witness.publicValues`/`witness.proof` and documents use as both a `mintPolicy` AND a fiber-transition guard. **So a default of either `event.*` or `witness.*` is wrong for some live caller.** The API therefore takes the var paths explicitly and forces the author to choose:

```ts
// src/schema/crypto-guards.ts — composable verification gates.
// CONTEXT RULE (enforced by guard-lint rule 3): in a fiber TRANSITION read event.*;
// in an asset mintPolicy/burnPolicy read witness.*. This builder does NOT default —
// you pass the exact var paths, so the same call is lint-correct in both contexts.
import type { JsonLogicRule } from "./fiber-app.js";

export const groth16Gate = (
  vkeyHexLiteral: string,
  publicValuesVar: string,   // e.g. 'event.publicValues' (transition) | 'witness.publicValues' (asset)
  proofVar: string,          // e.g. 'event.proof'         | 'witness.proof'
): JsonLogicRule => ({
  groth16_verify: [ vkeyHexLiteral, { var: publicValuesVar }, { var: proofVar } ],
});

export const schnorrGate = (pkVar: string, msgVar: string, proofVar: string): JsonLogicRule =>
  ({ schnorr_verify: [ { var: pkVar }, { var: msgVar }, { var: proofVar } ] });
export const sigmaGate = (propositionVar: string, proofVar: string, msgVar: string): JsonLogicRule =>
  ({ sigma_verify: [ { var: propositionVar }, { var: proofVar }, { var: msgVar } ] });
export const blsGate = (pkVar: string, msgVar: string, sigVar: string): JsonLogicRule =>
  ({ bls_verify: [ { var: pkVar }, { var: msgVar }, { var: sigVar } ] });
export const blsAggregateGate = (pksVar: string, msgVar: string, aggSigVar: string): JsonLogicRule =>
  ({ bls_aggregate_verify: [ { var: pksVar }, { var: msgVar }, { var: aggSigVar } ] });

// groth16 + public-input slice-binding (the eligibility.ts pattern), context-explicit:
export const groth16BoundGate = (
  vkeyHexLiteral: string, publicValuesVar: string, proofVar: string,
  bindings: { offsetBytes: number; expectedHex: string }[],
): JsonLogicRule => ({
  and: [ groth16Gate(vkeyHexLiteral, publicValuesVar, proofVar),
    ...bindings.map(b => ({ "===": [
      { cat: ["0x", { substr: [ { var: publicValuesVar }, 2 + b.offsetBytes * 2, 64 ] }] },
      b.expectedHex ] })) ],
});
```
Ship `groth16Gate`, `groth16BoundGate`, `schnorrGate`, `sigmaGate`, `blsGate`, `blsAggregateGate` first (ops with live callers). Add `proveDlogGate`/`proveDhtupleGate`/`ecvrfGate`/`bn254PairingGate` as needed. **Do NOT ship `bn254_add`/`bn254_mul` wrappers** — no predicate use case. Refactor `eligibility.ts` to call `groth16BoundGate(..., 'witness.publicValues', 'witness.proof', ...)` when used as a `mintPolicy`, and a separate `event.*`-bound call when used as a transition guard — resolving the contradiction at the call site rather than papering over it.

### 8.3 Verified operand widths (`crypto-ops.d.ts`)
`schnorr_verify([pk64B,msg,proof96B])→bool`; `groth16_verify([vkey32B,publicValues,proof])→bool`; `sigma_verify([prop,proof,msg])→bool`; `bls_verify([pk48B,msg,sig96B])→bool`; `bls_aggregate_verify([[pk48B…],msg,aggSig96B])→bool`; `prove_dlog_verify([pk64B,msg,proof96B])→bool`; `prove_dhtuple_verify([g,h,u,v,msg,proof160B])→bool`; `ecvrf_verify([pk32B,alpha,proof80B])→{valid,beta}`; `bn254_pairing([[g1 64B,g2 128B],…])→bool`.

---

## 9. Files to create / edit
- CREATE `/home/euler/repos/ottochain/e2e-test/examples/rule110-ca/{definition.json, initial-data.json, example.json, event-step.ts, event-halt.ts, README.md}`
- EDIT (H2 harness) `/home/euler/repos/ottochain/e2e-test/runner.ts` (TestStep:331, processEvent dispatch:586) and `/home/euler/repos/ottochain/e2e-test/lib/state-machine/processEvent.ts` (ProcessEventOptions:10, validator after ~line 96)
- CREATE `/home/euler/repos/ottochain-sdk/src/apps/compute/index.ts`
- CREATE `/home/euler/repos/ottochain-sdk/src/apps/compute/state-machines/compute-rule110.ts`
- EDIT `/home/euler/repos/ottochain-sdk/src/apps/index.ts` (wire `compute`)
- CREATE `/home/euler/repos/ottochain-sdk/src/schema/crypto-guards.ts` (curve gates, context-explicit)

## 10. Key code citations (verified this session)
- `map` element-as-context, no index; outer vars visible; computed path; OOB null-default — all reproduced in the VM (§3.1).
- `let`-over-element throws (`{var:""}` → context object) — reproduced (§3.2).
- `isFinal` required, `category` inside `metadata` — `src/schema/fiber-app.ts:111-123` (`StateDefinition`), `:100-108` (`StdStateMetadata`).
- `missing` ∈ `KNOWN_OPERATORS`; unbounded-guard semantics — verified (§3, M5).
- lint witness-in-transition ERROR — `src/schema/guard-lint.ts:217-231` (rule 3); contradicting caller `src/apps/lending/eligibility.ts:118-130`.
- harness has no `expectedStateData` — `e2e-test/lib/state-machine/processEvent.ts:89-96`; `runner.ts:331,586`; `.stateData` field exists per `e2e-test/scripts/debug-tictactoe.ts`.
- gas API `evaluateWithGas(expr,data,gasLimit,config?)` — `…/dist/cjs/index.js:7485` (3rd arg required); numbers §3.4.
- limits maxGas 10M / maxStateSizeBytes 1,048,576 — `ottochain/.../ExecutionLimits.scala`; spawns only on primary transition — `TriggerHandler.scala:88`.

All JLVM in this spec was executed against `@constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5` and produced the canonical Rule-110 output (§3.3).

### Implementation checklist

- Build CELL programmatically in compute-rule110.ts as the §2.1 INLINED form (nb()/P/CELL helpers, P repeated across the five ==); NEVER use let over the map element (B1).
- Create src/apps/compute/state-machines/compute-rule110.ts via defineFiberApp: states with required isFinal + metadata.category, createSchema required [tape,idx] (maxGen optional), step guard {or:[{missing:[state.maxGen]},{<:[gen,maxGen]}]}, effect merge[state,{tape:map(idx,CELL),gen:+1}], halt transition guard >= .
- Verify SchemaField supports immutable/computed/default in src/schema/fiber-app.ts; drop any unsupported descriptive flags.
- Create src/apps/compute/index.ts with COMPUTE_DEFINITIONS map + getComputeDefinition; wire export into src/apps/index.ts mirroring markets/identity.
- Run lintFiberApp on the new def and confirm 0 errors (every operator in KNOWN_OPERATORS; no witness.*/leading-dot/$ vars).
- Extend the e2e harness for expectedStateData: add field to TestStep (runner.ts:331), thread into stepOptions in processEvent case (runner.ts:586), add to ProcessEventOptions (processEvent.ts:10), add recursive deepEqual check on finalRecord.stateData in the validator after the expectedState block (~line 96).
- Create e2e example dir rule110-ca with definition.json (isFinal+metadata, unbounded-or-bounded guard, inlined CELL), initial-data.json (width-15 single-1, maxGen 8), event-step.ts, event-halt.ts.
- Write example.json with top-level events array (L8) and three testFlows: fractal-8-gens with per-step expectedStateData (exact §3.3 tapes incl idx/gen/maxGen), halt-gated (expectRejected ml0), halt-after-exhaustion (8 steps then halt -> HALTED).
- Write README documenting the index-array idiom, the inlined-cell constraint (no let), the public/permissionless trust model, the DoS bound, and the per-generation assertions.
- Create src/schema/crypto-guards.ts with context-EXPLICIT gate builders (groth16Gate/groth16BoundGate/schnorrGate/sigmaGate/blsGate/blsAggregateGate taking var paths, no event/witness default); document the transition=event.* vs asset=witness.* rule.
- Refactor src/apps/lending/eligibility.ts buildOriginationGuard to call groth16BoundGate with explicit witness.* (mintPolicy) paths, and provide/event.*-bound call for any transition-guard use, to resolve the lint rule-3 contradiction at the call site.
- Run the e2e against a local cluster (tessellation-cluster skill) and confirm the fractal flow passes with the new expectedStateData assertions and that halt is correctly gated.

### Open questions

1. Does SchemaField in src/schema/fiber-app.ts actually define `immutable`/`computed`/`default`? If not, those annotations are cosmetic and should be omitted from the std-app def.
2. Is extending the ottochain e2e harness (runner.ts + processEvent.ts) in scope for THIS workstream, or owned by the e2e team? H2's fix (asserting tape contents) depends on it; if out of scope, the fractal flow degrades to state-id-only and the README must pin expected tapes instead.
3. Confirm the on-chain fiber record surfaces post-transition state under `.stateData` at the ML0 checkpoint shape the validator reads (it is used in debug-tictactoe.ts but verify it is populated in the combined/final record, not just create).
4. Should the std-app ship an owner-gated variant (event.agent == state.owner) now, or is the public permissionless substrate the only intended form for v1?
5. For deep-equal of expectedStateData, is key-order-independent comparison required (recommended), or is the chain's canonical RFC-8785 state serialization stable enough that a string compare suffices?

### Risks

1. If the e2e harness extension (expectedStateData) is rejected/deferred, the headline 'fractal verified e2e' claim regresses to vacuous state-id-only assertions (the original H2) — the CA computation would be untested on-chain.
2. The inlined CELL repeats P (and its three tape reads) five times; gas is ~987/cell and the expression is large — for wide tapes a single step approaches maxGas (~10,100 cells) and the verbose AST inflates the signed transition payload; keep demo tapes small.
3. Public permissionless `step` is a documented DoS/griefing surface bounded only by gas/fees and maxGen; if an unbounded fiber (no maxGen) is created it runs until fees stop — operators must understand this.
4. Refactoring eligibility.ts to context-explicit gates touches a live zk/lending guard used as both mintPolicy and transition guard; a wrong event/witness choice fails closed (proof un-passable). Requires careful per-call-site review and re-running the zk-eligibility/lending e2es.
5. SchemaField annotations (immutable/idx) are advisory only — the chain does not enforce idx immutability from the schema; the guarantee comes from the effect never writing idx. A buggy future transition that writes idx would silently corrupt indexing.
6. JLVM patch version drift: all results are against 1.8.0-rc.5 (rc.4 also present in node_modules). A version bump could change map/let/var-default semantics; re-run the §3 harness on any SDK jlvm upgrade.

---

## sigma-mixer

*An Ergo-style CDS Σ-protocol denomination mixer whose anonymity comes from an OR-of-dhtuple ring proof (sigma_verify), where each branch is a DDH tuple (g, h, P_i, nullifier) so the revealed nullifier is cryptographically bound to the proven secret — closing the witness-unbound-nullifier double-spend hole — with frozen-ring lifecycle and message-bound recipient.*


# FINAL DESIGN SPEC — `sigma-mixer`

A public-by-default OttoChain state-machine fiber implementing an equal-denomination mixer. Anonymity = a CDS OR-proof over the deposited ring; double-spend safety = a **witness-bound nullifier** carried as the shared DDH point of an OR-of-**dhtuple** proposition. This revision fixes B1, B2, H1, H2, H3 and addresses M1–M3/L1 from the adversarial review.

## 0. The core correction (B2): why the ring must be OR-of-`dhtuple`, not OR-of-`dlog`

The reviewer's B2 is correct and fatal to the original OR-of-`dlog` design: a `dlog` OR-proof proves only "I know *some* discrete log in this set." The `nullifier` was a free prover-chosen 32 bytes merely folded into the Fiat–Shamir message — **nothing tied it to the witness actually used**, so one depositor knowing one `x_j` could withdraw `n` times under `n` distinct arbitrary nullifiers and drain the ring.

The fix uses the `dhtuple` (DDH) leaf, which `sigma_verify` supports as a first-class node and which is verified at `index.js:3934-3957`:

> `dhtuple` leaf reconstructs `a1 = z·g − e·u`, `a2 = z·h − e·v`, serializes `0x01 ‖ g‖h‖u‖v‖a1‖a2`. **A single shared response `z` is used for BOTH coordinate reconstructions** (`index.js:3943`). Identity on any of g/h/u/v ⇒ `false` (`index.js:3937`).

A satisfied `dhtuple(g, h, u, v)` therefore proves knowledge of one `x` with **`u = x·g` AND `v = x·h`** — a Chaum–Pedersen DDH equality. Construction:

- Fix a mixer-wide second base `H` (a domain-separated, nothing-up-my-sleeve BN254 G1 point, `H ≠ G`, with unknown dlog w.r.t. `G`; see §6 for derivation). `G` is the verifier's generator `(1,2)` (`index.js:2911`).
- Each deposit registers `P_i = x_i·G` (the commitment) into `state.points`.
- A withdrawer reveals their **nullifier point** `Nf = x_j·H` as `event.nullifier`, and supplies a proof for the proposition
  `OR_i( dhtuple(G, H, P_i, event.nullifier) )` — **the same `v = event.nullifier` in every branch**.
- The proof is satisfiable iff there exists a branch `j` whose secret `x_j` satisfies `P_j = x_j·G` **and** `event.nullifier = x_j·H`. The OR still hides *which* `j` (CDS XOR simulation, `index.js:3977-3994`), but it forces `event.nullifier` to equal `x_j·H` for the one real branch.

**Why this binds the nullifier to the witness:** `H` has unknown dlog w.r.t. `G`, so for a fixed `P_j = x_j·G` there is exactly one `Nf` (namely `x_j·H`) for which the prover can satisfy the shared-`z` DDH equality without knowing `x_j` twice. The map `x_j ↦ x_j·H` is deterministic and injective, so:
- the same secret always yields the same `Nf` ⇒ a second spend hits the `has` set and is denied;
- a depositor cannot mint a *different* `Nf` for the same branch (they'd need a different `x_j`, i.e. a different `P`);
- a withdrawer cannot reuse another's branch (they don't know its `x`).

This is the standard DDH/VRF-style nullifier (the same idea as Zerocash/Ergo stealth nullifiers) and it is **fully expressible on-chain** here because the nullifier point lives in the proposition, not in a circuit. No `groth16_verify` circuit is required (it remains the alternative if one wanted `Nf = H(x)` instead of `x·H`; the DDH form is strictly cheaper and avoids a trusted setup).

**Gas (verified `index.js:7442-7443`, `6594-6596`):** `sigmaPropShape` (`index.js:6861-6890`) counts a `dhtuple` node as one dhtuple-leaf. Cost of `OR` over `n` dhtuples = `n·sigmaVerifyPerDhtupleLeaf (85000) + sigmaVerifyPerNode (2000)` charged off the *evaluated proposition shape* pre-arithmetic. At `n=4`: 342 000 gas; at `n=16`: 1 362 000 — both well under `maxGas 10_000_000` (ExecutionLimits.scala). Gas-bounded ring max ≈ 117 dhtuple leaves; structural caps `SIGMA_MAX_PROOF_NODES=4096 / DEPTH=64` (`index.js:3529-3530`).

## 1. Opcode operand formats (re-verified against metakit jlvm)

### `sigma_verify([proposition, proof, messageHex]) -> bool` — `index.js` sigma block `3486-4060`
Arg 0 (proposition) and arg 1 (proof) are JLVM **map/array values**; arg 2 is a hex string (raw-decoded, ≤ `SIGMA_MAX_MESSAGE_BYTES=4096`, `index.js:3537`).

**Proposition `dhtuple` node** (`parsePropNode`, `index.js:3630-3648`): exact fields `["type","g","h","u","v"]`; unknown fields ⇒ throw (`sigmaRejectUnknownFields`, `index.js:3564`). Each of g/h/u/v is a 64-byte G1 hex (`sigmaPoint`). The SAME `v` literal may appear across sibling OR children — nothing forbids identical points (verified: no cross-child dedup in `parsePropNode`/`verifyNode`).

**Proof tree** must mirror the proposition shape (`parseProofNode`, `index.js:3682-3722`):
- every node has `"e"`: a **fixed 31-byte** hex challenge (`sigmaChallenge`, `index.js:3612`; `SIGMA_CHALLENGE_BYTES=31`, `index.js:3523`).
- `dhtuple` leaf: `{"type":"dhtuple","e": <31B>, "z": <canonical scalar < R>}` (`sigmaResponse`→`requireCanonicalScalar`, `index.js:3617`).
- `or` node: `{"type":"or","e": <31B>, "children":[…]}`; child challenges must XOR to `e` (`index.js:3983`).

**Root challenge** = `low31(SHA256("sigma_verify:v1" ‖ serializeTree(root) ‖ message))` (`index.js:3517,4037`; tags `index.js:3511-3515`; child counts `uint32be`). Compared byte-for-byte to the proof's root `e`.

**Error-vs-false:** malformed (bad hex/width, off-curve, prop/proof shape mismatch, identity g/h/u/v, unknown field) ⇒ **throws** ⇒ ml0 rejection at the guard. Well-formed-but-wrong (root mismatch, OR challenges don't XOR) ⇒ **`false`** ⇒ guard denies, fiber unchanged.

### Map ops (re-verified)
- `has [map, key] -> bool` — `opHas`, `index.js:6178-6183`; requires `map.tag==='map'` and `key.tag==='string'`, else **throws**. So `spentNullifiers` must be a non-null `{}` map.
- `set [map, key, value] -> new map` — `opSet`, `index.js:6198-6206`; clones, inserts; throws on non-map/non-string-key.
- `none [array, fn] -> bool` — `opNone`, `index.js:6080-6090`; runs `fn` with each element as `ctx`. `combineState` (`index.js:5395-5400`) returns base-vars when `ctx` is a primitive, so inside the callback `{"var":""}` is the element and `{"var":"event.X"}` reads the real event field. (Used in the duplicate-point check; see M2 note.)
- `in [needle, haystack]` — `opIn`, `index.js:5906-5919`: if `haystack` is a **string** it does substring `includes`; if an **array** it does `some(strictEquals)`. **It does NOT operate on maps** — so the nullifier dedup MUST use `has`, never `in`.
- `cat [...] -> string`, `substr [s, start(, len)]` — `index.js:5937,5961`; `substr[s,2]` strips a `0x` prefix.
- `merge [map, patch] -> map` — overlays patch onto map.

## 2. Fiber state model

```jsonc
{
  "mixerId": "MIX-DDH-001",
  "denomination": 1000,
  "nullifierBaseH": "0x<64B G1 hex>",   // the fixed second base H (informational; the literal H is inlined into the proposition, see §3.2/L1)
  "anonymityTarget": 4,                 // ring opens once depositCount == anonymityTarget
  "depositCount": 0,
  "points": [],                         // ordered P_i = x_i·G (64B G1 hex)
  "spentNullifiers": {},                // FLAT map nullifierHex -> true  (MUST be initialized {}, never null — has/set throw on null)
  "withdrawCount": 0,
  "status": "filling"                   // filling -> open -> drained
}
```

The spent-set is a flat object keyed by the nullifier-point hex (the revealed `Nf = x_j·H`, 64-byte hex) with value `true`. `has`/`set` require a non-null map; initialize to `{}` in `initial-data.json`.

## 3. States, transitions, guards, effects

States: `filling`, `open`, `drained`. `initialState: "filling"`. The engine fires the **first** transition (in declaration order) for `(currentState, eventName)` whose guard returns `true`, executing its effect immediately and stopping; `false` continues to the next (`FiberEvaluator.scala` / verified `FiberEvaluator.scala:156-163` — `BoolValue(true)` ⇒ chargeGas+executeEffect; `BoolValue(false)` ⇒ tryTransitions on rest). **Transition ordering and guard exclusivity are load-bearing.**

### 3.1 `deposit` (B1 fix: mutually-exclusive guards, open-transition declared FIRST)

Two `deposit` transitions from `filling`. To avoid the B1 boundary bug (`depositCount < target` is still true on the Nth deposit), the guards are made mutually exclusive on `depositCount+1` and the `→open` transition is declared first:

**Transition A — `filling → open` (the LAST deposit), declared FIRST:**
```json
{
  "from": "filling", "to": "open", "eventName": "deposit",
  "guard": {
    "and": [
      { "===": [ { "+": [ { "var": "state.depositCount" }, 1 ] }, { "var": "state.anonymityTarget" } ] },
      { "!!": [ { "var": "event.point" } ] },
      { "none": [ { "var": "state.points" },
                  { "===": [ { "var": "" }, { "var": "event.point" } ] } ] }
    ]
  },
  "effect": {
    "merge": [ { "var": "state" }, {
      "points":       { "cat": [ { "var": "state.points" }, [ { "var": "event.point" } ] ] },
      "depositCount": { "+": [ { "var": "state.depositCount" }, 1 ] },
      "status":       "open"
    } ]
  },
  "dependencies": []
}
```
NOTE: `cat` is string concatenation (`index.js:5937`), NOT array append. Re-check during impl: use the actual array-append operator (the codebase uses `push`/array-spread patterns; verify the correct op name against `KNOWN_OPERATORS` — candidates `concat`/`push`). If no array-append op exists, model `points` growth via index-keyed `set` on a map, or pin the ring in `initial-data.json` (the e2e does the latter). **This is an open impl detail flagged in §10.**

**Transition B — `filling → filling` (not-yet-last), declared SECOND:**
```json
{
  "from": "filling", "to": "filling", "eventName": "deposit",
  "guard": {
    "and": [
      { "<": [ { "+": [ { "var": "state.depositCount" }, 1 ] }, { "var": "state.anonymityTarget" } ] },
      { "!!": [ { "var": "event.point" } ] },
      { "none": [ { "var": "state.points" }, { "===": [ { "var": "" }, { "var": "event.point" } ] } ] }
    ]
  },
  "effect": { "merge": [ { "var": "state" }, {
      "points":       { "<array-append>": [ { "var": "state.points" }, { "var": "event.point" } ] },
      "depositCount": { "+": [ { "var": "state.depositCount" }, 1 ] }
  } ] },
  "dependencies": []
}
```
Guards A and B are disjoint: A fires iff `depositCount+1 == target`, B iff `depositCount+1 < target`. Beyond `target` neither fires (deposits closed). Ring frozen at `open`.

**Deposit authorization & custody (H1):** the depositor must sign the deposit. Add a `proofs`-bound clause using the existing `signerInSet`/`actorIsSigner` builders (`guards.ts:37,88`) or a `signerHasEntry`-style clause, AND carry `_transferAsset` INTO the fiber for the denomination so the e2e actually has value to protect. Both are included in the production definition; the e2e MAY scope custody out (see §7 decision).

### 3.2 `withdraw` (the privacy + double-spend core; H2/H3 fixes)

Declared with `from: "open"` (the `from` field gates the state — M1: drop the redundant `currentStateId === "open"` clause). Two `withdraw` transitions, the `→drained` one (last withdrawal) declared FIRST, both sharing the verify+freshness guard:

**Shared guard body** (`open` precondition via `from`):
```json
{
  "and": [
    { "sigma_verify": [
        { "type": "or", "children": [
          { "type": "dhtuple", "g": "0x<G 64B>", "h": "0x<H 64B>", "u": { "var": "state.points.0" }, "v": { "var": "event.nullifier" } },
          { "type": "dhtuple", "g": "0x<G 64B>", "h": "0x<H 64B>", "u": { "var": "state.points.1" }, "v": { "var": "event.nullifier" } },
          { "type": "dhtuple", "g": "0x<G 64B>", "h": "0x<H 64B>", "u": { "var": "state.points.2" }, "v": { "var": "event.nullifier" } },
          { "type": "dhtuple", "g": "0x<G 64B>", "h": "0x<H 64B>", "u": { "var": "state.points.3" }, "v": { "var": "event.nullifier" } }
        ] },
        { "var": "event.proof" },
        { "var": "event.message" }
    ] },

    { "!": { "has": [ { "var": "state.spentNullifiers" }, { "var": "event.nullifier" } ] } },

    { "===": [ { "var": "event.message" },
               { "cat": [ "0x",
                          { "substr": [ { "var": "event.nullifier" }, 2 ] },
                          { "substr": [ { "var": "event.recipientHex" }, 2 ] } ] } ] }
  ]
}
```
`G` and `H` are inlined as literal 64-byte hex (L1: the proposition `children` is a literal array; `u`/`v` may be `{"var":...}` map-node values which evaluate element-wise per `parseObjectExpression`/MapExpression `index.js:1114-1139` — verified the reviewer's correction; the only thing fixed at definition time is `n`, by unrolling indices `0..n-1`).

The three clauses, each load-bearing:
1. **Witness-bound ring membership in ZK** — `sigma_verify(OR(dhtuple(G,H,P_i,Nf)))`. Proves the withdrawer knows `x_j` with `P_j=x_j·G ∧ Nf=x_j·H`, hiding `j`. `Nf` (= `event.nullifier`) is forced to equal the real branch's `x_j·H`. The proposition's `u` points read from frozen `state.points` ⇒ on-chain ring, not attacker-supplied.
2. **Double-withdraw prevention** — `{"!":{"has":[spentNullifiers, event.nullifier]}}`. Because `Nf` is witness-bound (clause 1), the same secret cannot produce a second distinct nullifier.
3. **Recipient binding (anti-front-run, H2)** — `message == Nf ‖ recipientHex`. Strong FS folds `message` into the root challenge (`index.js:4037`), so the proof is a signature over `(Nf, recipient)`. A mempool front-runner swapping `recipientHex` breaks the `===` AND invalidates the proof.

**Effect (records nullifier, advances, pays out):**
```json
{
  "merge": [ { "var": "state" }, {
    "spentNullifiers": { "set": [ { "var": "state.spentNullifiers" }, { "var": "event.nullifier" }, true ] },
    "withdrawCount":   { "+": [ { "var": "state.withdrawCount" }, 1 ] }
  } ]
}
```
The `→drained` variant (H3) additionally sets `"status": "drained"` and is guarded by `{"===":[{"+":[withdrawCount,1]}, anonymityTarget]}` declared FIRST; the `→open` variant is guarded by the complementary `{"<":[{"+":[withdrawCount,1]}, anonymityTarget]}` and declared SECOND. This bounds `withdrawCount ≤ anonymityTarget`, makes the ring one-shot, and bounds `spentNullifiers` to ≤ `n` keys (H3: no state-size brick — at ~66B/key and `n ≤ ~117` gas-bounded, the spent-set is tiny; `maxStateSizeBytes 1MB` never approached). In production the `withdraw` effect additionally carries `_transferAsset` OUT (`amount = state.denomination`, `recipient = event.recipientHex`), and the withdraw transition MUST be the PRIMARY transition (verified: `_transferAsset`/spawn directives honored only on the primary transition, `TriggerHandler.scala:88-89`; holder-defense keys off the emitting fiber, `FiberEngine.scala:551-567`).

## 4. Security invariants (must hold after impl)

- **INV-1 (witness-bound nullifier):** a valid withdraw forces `event.nullifier = x_j·H` for a real branch `j`. No second distinct nullifier is derivable from the same `x_j`. (Guaranteed by the shared-`z` DDH check, `index.js:3943-3947`, + `H`'s unknown dlog.)
- **INV-2 (no double-spend):** `has(spentNullifiers, Nf)` denies the second spend of any branch; combined with INV-1, each ring member can withdraw at most once.
- **INV-3 (unlinkability within n):** the OR proposition is byte-identical for every honest withdrawal of the mixer, and the CDS XOR simulation hides `j` (`index.js:3977-3994`). Anonymity set = exactly `n` (ring size is public — residual disclosed in §8).
- **INV-4 (recipient non-malleability):** message-binding clause 3 + strong FS makes the payout destination a signed field; front-running/replay-with-new-recipient fails.
- **INV-5 (cross-instance separation):** proposition reads this fiber's `state.points`; different rings ⇒ different serialized tree ⇒ different root challenge. Production message SHOULD prepend `state.mixerId` (`mixerId ‖ Nf ‖ recipient`).
- **INV-6 (lifecycle liveness, B1):** mutually-exclusive deposit guards + open-first ordering guarantee the Nth deposit flips `filling→open`; withdrawCount-bounded drained flip guarantees the spent-set stays small.
- **INV-7 (`H` soundness):** `H` is a verifiable nothing-up-my-sleeve point with unknown `dlog_G(H)`; if `H = c·G` for known `c`, a withdrawer could forge `Nf` for a wrong branch. See §6 derivation.

## 5. SDK std-lib app shape (design only)

New `src/apps/privacy/` with `index.ts` exporting `DEFINITIONS` and `state-machines/mixer-ddhRing.ts`. Compose from existing builders: `depInState`/`from`-gating for state, `signerInSet`/`actorIsSigner` (`guards.ts:37,88`) for deposit auth, plus a new thin `sigmaDdhRingOf(pointsVar, nullifierVar, gHex, hHex, n)` helper emitting the `or`-of-`dhtuple` proposition by unrolling `{"var":"state.points.k"}` for `k in 0..n-1` with `v = {"var":"event.nullifier"}`. `sigma_verify`, `has`, `set`, `none`, `cat`, `substr`, `merge` are all in `KNOWN_OPERATORS` (verified via `node -e` against the package), so `guard-lint.ts:40-52,268` passes; multi-key prop nodes pass the single-key-operator rule (`guard-lint.ts:242-308`).

## 6. The real Σ-proof fixture — construction & regeneration

`scripts/gen-sigma-mixer-fixture.ts` (committed for regeneration, mirroring the adjudicated-htlc note). Real BN254 via `@noble/curves/bn254` (full path) + `@noble/hashes/sha256`. The verifier is the oracle: `sigma_verify` must return `true` on the emitted tree before check-in.

**Deriving `H` (INV-7):** `H = hashToCurveG1("sigma-mixer:nullifier-base:v1")` using a try-and-increment / SWU map, or simply `H = SHA256(domain)·G`'s **point** obtained by hashing to a field element and mapping to a curve point WITHOUT knowing the scalar — the standard nothing-up-my-sleeve construction. Document the exact derivation in the script header; `H` must be on-curve and ≠ identity (else `dhtuple` returns `false`, `index.js:3937`). Inline the resulting 64-byte `H` (and `G=(1,2)`) into the definition.

**Prover algorithm for `OR_i(dhtuple(G,H,P_i,Nf))`, real branch `j` (CDS simulation), bound to `message`:**
1. Real secret `x_j`; `P_j = x_j·G`; **`Nf = x_j·H`** (the nullifier point; reveal as `event.nullifier`, encode `x‖y` 64B big-endian, `encodeG1`, `index.js:1517`).
2. Other `P_i` (i≠j) are the existing deposited points; `v = Nf` for ALL branches.
3. **Simulate** every `i≠j`: random `e_i` (31B), random `z_i` (`< R`); commitments implicitly `a1_i = z_i·G − e_i·P_i`, `a2_i = z_i·H − e_i·Nf` (verifier recomputes, `index.js:3943-3944`).
4. **Commit** real branch: random nonce `k`; `a1_j = k·G`, `a2_j = k·H`.
5. Build the serialized tree EXACTLY as `verifyNode`: OR node `0x03 ‖ uint32be(n) ‖ body_0 ‖ … `, each dhtuple `body_i = 0x01 ‖ G ‖ H ‖ P_i ‖ Nf ‖ a1_i ‖ a2_i` (each point 64B). **Child order MUST match `state.points`.**
6. **Root challenge** `e = low31(SHA256("sigma_verify:v1" ‖ serializedTree ‖ message))` (`index.js:3517,4037`).
7. **Real branch challenge** `e_j = e XOR (⊕_{i≠j} e_i)` (31 byte-lanes, `index.js:3983`).
8. **Real branch response** `z_j = k + e_j·x_j mod R`, with `e_j` taken directly as an Fr scalar from its 31 bytes (no mod-R; `2^248 < R`). The single `z_j` satisfies BOTH `a1_j = z_j·G − e_j·P_j` and `a2_j = z_j·H − e_j·Nf` because `Nf = x_j·H` ⇒ both reduce to `k·G` / `k·H`. **This is exactly why the shared response forces `Nf = x_j·H`.**
9. **Message** `= Nf(strip 0x) ‖ recipientHex(strip 0x)` (fixed-width — M3 below).
10. Emit proof tree: `{"type":"or","e":<e>,"children":[{"type":"dhtuple","e":<e_i>,"z":<z_i>}, …]}` (real branch at position `j`).

**Gotchas to document:** (a) challenge is 31 bytes not 32; (b) `z` canonical `< R` (`requireCanonicalScalar`, `index.js:3617`); (c) child order = `state.points` order; (d) `a1_i/a2_i` never serialized by prover but recomputed by verifier — `(e_i,z_i)` fully determine them; (e) SHA256 preimage uses exact `concatBytes` layout with `uint32be` child counts; (f) `H` derivation must be NUMS (INV-7); (g) **M3** — pin `recipientHex` to a fixed 40-hex-char (20-byte address) width OR insert an explicit delimiter in the `cat`, else two `(Nf,recipient)` pairs can collide on `message`. The fixture writes `points` + `nullifierBaseH` into `initial-data.json` and `proof/nullifier/recipientHex/message` into `event-withdraw.ts`.

## 7. e2e harness wiring (`ottochain/e2e-test/examples/sigma-mixer/`)

Following the adjudicated-htlc/zk-eligibility contract (`example.json`, `definition.json`, `initial-data.json`, `event-*.ts`):

- **`definition.json`** — states `{filling, open, drained}`, `initialState:"filling"`, the two `deposit` (A first, B second) and two `withdraw` (`→drained` first, `→open` second) transitions from §3, with `n=4` and `G`/`H` inlined.
- **`initial-data.json`** — four deposited `points` (from the fixture), `nullifierBaseH`, `spentNullifiers:{}`, and `status:"open"` (pin post-fill state to exercise withdraw directly, mirroring zk-eligibility pinning `pending`).
- **`event-withdraw.ts`** — `export default () => ({ eventName:"withdraw", payload:{ proof, nullifier, recipientHex, message } })`.
- **`event-withdraw-bad.ts`** — same proof, tampered `recipientHex` ⇒ message-binding `===` fails ⇒ `expectRejected:'ml0'`.
- **`event-withdraw-replay.ts`** — valid withdraw replayed after `nullifier` spent ⇒ `has` denies ⇒ `expectRejected:'ml0'`.
- **`event-deposit.ts`** + **drive-the-fill flow** (B1 regression): a flow that creates with `status:"filling"` + empty `points`, processes 4 `deposit` events, and asserts the 4th yields `expectedState:"open"`. This is the test the original design omitted (it pinned `open` and never exercised the flip), so B1 would have shipped undetected.
- **`event-withdraw-doublespend.ts`** (B2 regression, REQUIRED): a SECOND valid withdraw from the SAME branch with a *different attacker-chosen nullifier* — must FAIL because the new `nullifier ≠ x_j·H` cannot satisfy the shared-`z` dhtuple ⇒ `sigma_verify` returns `false` ⇒ `expectRejected:'ml0'`. This is the test that proves the B2 fix; without it the fix is unverified.

**`example.json` testFlows:**
1. create(`filling`, 0 points) → 3× deposit (`expectedState:"filling"`) → 4th deposit (`expectedState:"open"`).  *(B1)*
2. create(`open`, 4 points) → withdraw (`expectedState:"open"` or `drained` on last).
3. create(`open`) → withdraw → withdraw-replay (`expectRejected:'ml0'`).  *(double-spend, same Nf)*
4. create(`open`) → withdraw-doublespend (`expectRejected:'ml0'`).  *(B2: forged Nf rejected by dhtuple)*
5. create(`open`) → withdraw-bad (`expectRejected:'ml0'`).  *(H2: front-run)*

**e2e custody decision (H1):** the single-fiber e2e is scoped as **crypto+lifecycle plumbing**, with the README and `example.json.description` stating explicitly that economic custody (`_transferAsset` in/out) is exercised only in the production app (§8), NOT here. Crucially, flow 4 makes the B2 double-spend observable WITHOUT custody (the forged nullifier is rejected at the proof layer, not merely at a transfer), so the e2e *does* detect the original flaw even without value movement — addressing the reviewer's "e2e cannot reject B2."

The guard context provides `currentStateId`, `state`, `event`, `proofs`, `$ordinal` (ReservedKeys.scala:62-71; ContextProvider.scala:158-176).

## 8. Production hardening (out of e2e scope)

- **Equal-denomination custody.** `deposit` carries `_transferAsset` INTO the fiber (`amount = state.denomination`); `withdraw` carries `_transferAsset` OUT to `event.recipientHex`. Holder defense never trusts the scraped effect (asset-model.md; `AssetCombiner.applyFiberTransfer`); withdraw must be the PRIMARY transition (`TriggerHandler.scala:88`).
- **`maxAssetMutations 32`** bounds payouts/transition; **`maxStateSizeBytes 1MB`** bounds `points`+`spentNullifiers` — with the one-shot drained flip (H3) the spent-set is ≤ `n` keys, trivially within budget.
- **Message includes `state.mixerId`** (`mixerId ‖ Nf ‖ recipient`) for cross-instance replay safety (INV-5).
- **`H` NUMS audit** (INV-7) before mainnet.

## 9. Why `dhtuple`, not `groth16_verify` (alternative considered)
A Groth16/SP1 circuit (`groth16_verify`, `index.js:3355`, already used by zk-eligibility) could compute `Nf = H(x)` as a public input — also closes B2. The `dhtuple`-OR is preferred: no trusted setup, no circuit toolchain, cheaper per-leaf at small `n`, and fully expressible in the guard. Groth16 wins only if the anonymity set must be huge (Merkle-tree membership instead of an explicit OR) — out of scope for an equal-ring mixer.

## Key file:line citations
- `dhtuple` leaf (shared-`z` DDH): `index.js:3934-3957`; `or` XOR node: `3977-3994`; tags: `3511-3515`; challenge 31B: `3523`; domain sep: `3517`; root challenge: `4037`; G `(1,2)`: `2911`; canonical scalar: `requireCanonicalScalar` `3617`/`2909`; encodeG1: `1517`.
- Prop/proof parsers (dhtuple fields, unknown-field reject): `parsePropNode` `3619-3680`, `parseProofNode` `3682-3722`, `sigmaRejectUnknownFields` `3564`.
- Gas: `sigmaPropShape` `6861-6890` (dhtuple ⇒ `[0,1,0]` `6878`), cost formula `7442-7443`, constants `6594-6596`.
- Map ops: `opHas` `6178`, `opSet` `6198`, `opNone` `6080`, `opIn` (string/array only, not map) `5906`, `opCat` `5937`, `opSubstr` `5961`, `combineState` `5395`.
- Multi-key prop-node eval: `parseObjectExpression`/MapExpression `1114-1139`.
- Engine first-match transition: `FiberEvaluator.scala:156-163`.
- Primary-transition asset rule: `TriggerHandler.scala:88-89`; `FiberEngine.scala:551-567`.
- Guard var namespace: `ReservedKeys.scala:62-71`; `ContextProvider.scala:158-176`.
- SDK lint: `guard-lint.ts:40-52,268` (KNOWN_OPERATORS), `242-308` (single-key rule); builders `guards.ts:37,88,252`.
- Patterns reused: `e2e-test/examples/adjudicated-htlc/{definition.json,event-adjudicate-release.ts,example.json}` (real BN254 fixture + message binding + bad-event flows), `zk-eligibility/definition.json` (`substr` 0x-strip + groth16 alternative).
- Limits: ExecutionLimits.scala (maxGas 10M, 1MB state, 32 mutations).

### Implementation checklist

- Derive H: write the NUMS hash-to-curve derivation for the second base H (domain 'sigma-mixer:nullifier-base:v1') in scripts/gen-sigma-mixer-fixture.ts; assert on-curve, != identity, and document that dlog_G(H) is unknown.
- Confirm the array-append operator: grep KNOWN_OPERATORS / index.js for the actual op that appends to an array (cat is string-only) — likely 'push' or array-spread; if none exists, pin points in initial-data.json and model deposit growth via index-keyed set. Update §3.1 effects accordingly.
- Write scripts/gen-sigma-mixer-fixture.ts: BN254 via @noble/curves/bn254, generate 4 secrets x_i, P_i=x_i*G, pick real branch j, Nf=x_j*H, run the CDS OR-of-dhtuple prover (steps 1-10 in §6), and assert sigma_verify(tree)===true before writing.
- Emit fixtures: initial-data.json (points, nullifierBaseH, spentNullifiers:{}, status pinned per flow), event-withdraw.ts, event-withdraw-bad.ts (tampered recipientHex), event-withdraw-replay.ts, event-withdraw-doublespend.ts (forged nullifier from same branch), event-deposit.ts.
- Author ottochain/e2e-test/examples/sigma-mixer/definition.json: states {filling,open,drained}; deposit A (->open, exact-boundary guard) declared FIRST then deposit B (->filling, strictly-before guard); withdraw ->drained (last) FIRST then ->open SECOND; inline G and H; n=4 unrolled OR-of-dhtuple with v=event.nullifier; pin recipientHex width (M3).
- Author example.json with 5 testFlows incl. the B1 drive-the-fill flow (4 deposits -> open) and the B2 forged-nullifier double-spend flow (expectRejected ml0); README scopes the e2e as crypto+lifecycle plumbing (custody is production-only, H1).
- Run the ottochain e2e harness for sigma-mixer; confirm honest withdraw passes, and all four rejection flows (replay, forged-nullifier, bad-recipient, and the fill-flip assertion) behave as specified.
- SDK app: add src/apps/privacy/ with index.ts DEFINITIONS + state-machines/mixer-ddhRing.ts and a sigmaDdhRingOf(pointsVar, nullifierVar, gHex, hHex, n) helper; run guard-lint to confirm sigma_verify/has/set/none/cat/substr/merge all pass.
- Production hardening: add _transferAsset IN on deposit and OUT on withdraw (recipient=event.recipientHex, amount=state.denomination), ensure withdraw is the PRIMARY transition, prepend state.mixerId to the bound message, and add a signer-bound deposit auth clause (signerInSet/actorIsSigner).

### Open questions

1. Array append: is there a JLVM operator that appends an element to an array (cat is string-only per index.js:5937)? If not, the deposit effect must grow points via index-keyed set on a map, or the ring must be pinned in initial-data.json (the e2e already does the latter, but the production fill path needs a real append).
2. H derivation: is there an existing hash-to-G1 helper in metakit/the SDK to produce a NUMS base point, or must the fixture script implement SWU/try-and-increment itself? Confirm the chosen H is on-curve and that no opcode rejects it.
3. recipientHex width: should the bound message use a fixed 20-byte (40-hex) address width, or an explicit length delimiter in the cat, to prevent (nullifier,recipient) message collisions (M3)? Pick the convention the address format already guarantees.
4. Does the e2e harness support driving multiple sequential deposit events against one fiber instance (needed for the B1 fill-flip regression flow), or does each processEvent reset state?

### Risks

1. The B2 fix rests on H having unknown dlog w.r.t. G (INV-7). A botched NUMS derivation (e.g. H = c*G for known c) silently re-opens the drain-the-ring attack — must be audited, not assumed.
2. Fixture brittleness: the CDS OR-of-dhtuple transcript must byte-match verifyNode exactly (tag 0x01, G/H/P/Nf/a1/a2 order, uint32be child counts, 31-byte challenge, child order == state.points). Any mismatch yields a silently-false proof; the script must use sigma_verify itself as the oracle before check-in.
3. Array-append uncertainty (open question 1) could force a different deposit-effect encoding than shown; if unresolved, the production fill path is not implementable as specified and the e2e must pin the ring.
4. Anonymity set = exactly n and is public (INV-3); 1:1 timing-correlated deposit/withdraw still narrows linkage. This is inherent to fixed-ring mixers and must be disclosed, not silently assumed away.
5. M3 recipient-width: if recipientHex is variable-width and no delimiter is added, two distinct (nullifier,recipient) pairs can hash to the same bound message, weakening recipient non-malleability (INV-4).

---

## staked-pool-family

*A reusable staked-epoch-pool std-lib base (FORMING→COLLECTING→SETTLED epoch lifecycle, registry-gated join, stake custody) plus oracle-pool and stake-slashing-governance specializations, with rewards/slashes modeled as a state-resident claim ledger (zero finalize-time transfers) and submissions as an array of {addr,value} so consensus math stays JLVM-expressible.*

# FINAL DESIGN SPEC — `staked-pool` family (base + oracle-pool + stake-slashing-governance)

> This revision incorporates the adversarial review. The security/authorization spine of the original (guard↔signer coupling, holder defense, two-phase #24) is preserved verbatim — it was confirmed sound. The **value-movement and aggregation core is fully redesigned** to fix the four blockers, and the high-severity findings are resolved. One review claim (H2, integer-truncation) is **refuted by the evaluator** and the design relies on the corrected behavior; see §1.1.

---

## 0. Summary & placement

A new std-lib BASE app `src/apps/staked-pool/` providing a reusable staked-epoch-pool lifecycle skeleton, plus two specializations: `oracle-pool` and `stake-slashing-governance`. The base composes existing primitives — `guards.ts`, `effects.ts`, the asset model's `_transferAsset` + combiner holder defense (R1), and the identity registry (#21/#24). It needs **two small new SDK helpers** (one effect builder, one guard builder — §7); everything else reuses what ships today.

Placement: `src/apps/oracles/index.ts` is a deprecated back-compat shim re-exporting `identity` — do **not** extend it. Create `src/apps/staked-pool/` following the `lending`/`markets` convention (`index.ts` with a `DEFINITIONS` map + `getXDefinition()` + `state-machines/<prefix>-<variant>.ts` + a `state-machines/index.ts` barrel). Reference: `src/apps/lending/index.ts:38-58`, `src/apps/markets/state-machines/index.ts:1-11`.

---

## 1. Grounding facts — RE-VERIFIED against the real code

| Claim | Verified at |
|---|---|
| Auth binds to `proofs[].address`, never `event.agent` | `src/schema/guards.ts` `signerIsParty` |
| `actorIsSigner`/`actorInSet`/`actorHasEntry` (effect-key↔signer coupling, anti-S1) | `guards.ts:88` (`actorIsSigner`), `:101` (`actorInSet`), `:117` (`actorHasEntry`) — re-read; signatures `(setVar/mapVar, actorVar="event.agent")` confirmed |
| `signerHasReputationVia(registryIdVar, thresholdVar)` — both var-paths; fail-closed on unbound registry | `guards.ts:166` (re-read full body) |
| `signerHasRoleVia(registryIdVar, roleField)` — roleField ∈ `arbiters/slashers/issuers/boardMembers` | `guards.ts:210` (re-read full body) |
| `depInState(refVar, requiredState)` cross-fiber lifecycle gate | `guards.ts:252` |
| `_addDependency`/`_setDependencyActive` effect builders | `src/schema/effects.ts:29-45` |
| `_transferAsset` rides INSIDE the `merge` effect map; transition-level `emits` stripped by `toProtoDefinition` | `lending-zk-loan.ts:379-390` (re-read); `fiber-app.ts:291` |
| **`_transferAsset` directive is `{assetId, recipient}` ONLY — NO amount field; recipient must resolve to a `StrValue`** | `EffectExtractor.scala:198-233` (re-read): `ReservedKeys.ASSET_ID`/`RECIPIENT`, both resolved then required to be `StrValue` → UUID(assetId) and parseRecipient(recipient) |
| **Combiner reassigns `holder := recipient` on the WHOLE asset record — no partial/amount transfer** | `AssetCombiner.scala:412-449` `applyFiberTransfer` (re-read): `moved = source.copy(holder = transfer.recipient, …)` |
| **`maxAssetMutations = 32` per transition, ALL-OR-NOTHING (`CombineRejected` if exceeded)** | `ExecutionLimits.scala:24-26`; `AssetCombiner.scala:388-394` (re-read) |
| Holder defense (R1): resolve assetId → require `holder == Fiber(emitter)` ∧ `behavior.transferable` ∧ recipient-fiber-live | `AssetCombiner.scala:412-449` (re-read, verbatim) |
| `_transferAsset` recipient: UUID → `Fiber`, DAG-address → `Wallet` (UUID tried first) | `EffectExtractor.scala` `parseRecipient` (re-read) |
| `machineId` reserved var = the self fiber id (StrValue) — usable as own holder ref / self-transfer recipient | `ReservedKeys.scala:65`; `ContextProvider.scala:165` injects `MACHINE_ID -> StrValue(fiber.fiberId)` |
| `heldAssets` injected as `heldAssets.<assetId> -> {behavior:int, amount:int, expiresAt}` keyed by assetId | `ContextProvider.scala:99-113,176`; `ReservedKeys.scala:79,86-87` |
| **Transition `from` is a SINGLE `TState` string, not an array — one transition per (from,event)** | `fiber-app.ts:139-142` (re-read): `from: TState` |
| **`reduce` callback context is `mapValue({current, accumulator})`** — NOT `{var:""}` | jlvm `index.js` `opReduce:6014-6053` (re-read) |
| `map`/`filter`/`some`/`all`/`none` callback context is the BARE element (`this.eval(expr, el)`) | jlvm `opMap:5999`, `opFilter:6007`, `opSome` |
| `entries(map)` → array of `[strValue(k), v]` PAIRS; `keys(map)` → array of `strValue(k)`; `values(map)` → array of v | jlvm `opEntries:6181`, `opKeys:6160`, `values:5580` |
| **No `(array,int)` element-index op: `get`/`has`/`set`/`unset` require `(map,string)`; only `slice` takes int and returns a SUB-ARRAY; no `at`/`first`/`indexOf`** | jlvm `opGet:6166`, `opHas:6178`, `opSet:6195`, `opUnset:6207`, `opSlice:6275` (re-read); grep for `at`/`first`/`indexOf` → none |
| `let` exists — `{"let":[[[name,expr],…],result]}`, SEQUENTIAL bindings each seeing prior + outer scope | jlvm `evalLet:5465` (re-read) — enables hoisting a sub-expr instead of re-inlining |
| **Division yields an EXACT rational (`FloatValue` backed by `Ratio`), NOT a truncated int** — `int op int` returns `intValue` only when result is exactly integral, else `floatValue` | jlvm `combineNumeric:560-566`, `opDiv:5810-5818`, value model `:314` (re-read); Scala mirror has `FloatValue(1.5)` etc., conformance-pinned (`ConformanceCheckerSuite.scala:41,69`) |
| `+ - * / abs min max < <= >= == === filter map reduce count values keys entries has get set unset some all none` all exist | jlvm op table (re-read) |
| **NO `sort`/`median`/bitwise** | `operators.d.ts:7` full `JsonLogicOpTag` union |
| `get`/`has` on a NULL value → hard eval error → FLAT maps must be init'd to `{}` at genesis | jlvm `opHas:6178` (requires `tag==='map'`); `identity-registry.ts:18-22` |
| Two-phase #24 (bind in N, read in N+1) | `corp-board.ts:683→707` |
| Spawns/dep-mutations honored ONLY on the PRIMARY transition; `assetTransfers` ARE preserved on triggered transitions | `TriggerHandler.scala:88`; `AssetCombiner.scala` comment |

### 1.1 Corrections to the review (load-bearing for this redesign)

- **H2 is REFUTED.** Division is exact-rational, not integer-truncating (`combineNumeric:560`, Scala `FloatValue`). `center = sum/n`, `finalAnswer = keptSum/count(kept)`, and the `abs(x-center) <= bound` membership predicate all operate on **exact rationals** — there is no truncation, so consensus membership is NOT corrupted by rounding. The design therefore keeps a plain mean; the only caveat that survives is the *mean-vs-median robustness* one (§10), which is real and addressed by H3's fix (stake-at-risk), not by truncation.
- **B1/B2/B3/B4 are all CONFIRMED real** and drive the redesign below.

---

## 2. Core redesign decisions (resolving the blockers)

### 2.1 Rewards & slashes are a STATE-RESIDENT CLAIM LEDGER, not finalize-time transfer fan-out (fixes B1, B3)

`_transferAsset` moves a whole asset to one recipient (no amount, `EffectExtractor.scala:198`, `AssetCombiner.scala:441`) and is capped at 32/transition all-or-nothing (`ExecutionLimits.scala:25`). Therefore **`finalize` emits ZERO asset transfers.** Instead:

- State carries `rewards: { <addr>: int }` (a claim ledger). `finalize` *increments* `rewards[addr] += share` for each in-consensus participant, as a pure state write (no asset movement, no 32-cap, unbounded participants).
- Each participant later calls a separate **`claim_reward`** transition that emits **exactly one** `_transferAsset` of **one whole, pre-minted reward asset instance** the pool holds, to that single claimant's wallet — the verified, working pattern (`lending-zk-loan.ts:385` transfers one whole collateral asset to one `recipient`). One transfer per claim transition ⇒ never near the 32 cap.
- Reward asset supply: the pool is pre-minted a set of fungible reward-token *instances* into `Fiber(poolId)` (one per expected claimant per epoch), OR `claim_reward` transfers a single shared fungible reward instance whose `amount` is governed by the reward policy's morphism guard. Because `_transferAsset` moves the **whole** instance, the clean model is **one whole reward-token instance per claimant**: `open_epoch` (authority) ensures `|expected claimants|` reward instances are held; `claim_reward` moves one to the claimant and marks `rewards[addr]` consumed. The `rewards` ledger is the source of truth for *entitlement*; the asset instance is the *bearer*.

This eliminates both B1 (value-splitting) and B3 (32-cap deadlock at finalize): finalize is a pure state transition for any pool size; transfers are one-at-a-time at claim/withdraw time.

### 2.2 Submissions are an ARRAY of `{addr,value}`, not a map keyed by address (fixes B2)

There is no `(array,int)` element-index op (`opGet:6166` requires `(map,string)`; `opSlice:6275` returns sub-arrays). `entries(map)` yields `[strValue(k), v]` pairs whose `[0]` element cannot be projected to a scalar recipient/address. Therefore the consensus computation must operate on a structure that **carries the address inside each element**:

- `submissions: array` of `{ "addr": <address>, "value": <int> }` maps, **appended** on each `submit` (using `push`/concat — see §2.3 for the append mechanism).
- Aggregation then uses `map`/`filter` over the array with the **bare-element callback context**: `{get:[{var:""},"value"]}` and `{get:[{var:""},"addr"]}` are both `(map,string)` reads — expressible.
- `inConsensus` becomes a `filter` over the array (kept `{addr,value}` maps); the **addresses are projected with `map` → `{get:[{var:""},"addr"]}`** into an array of `StrValue` addresses, which IS a valid use (these are read into the `rewards` ledger increment loop, never used as `_transferAsset` recipients directly — see §2.1).
- **Dedup-on-submit** cannot use `has` (no map key). Instead: `{"none":[{"var":"state.submissions"}, {"===":[{"get":[{"var":""},"addr"]}, {"var":"event.agent"}]}]}` — "no existing submission has this addr". `none` exists (`opNone:6080`), callback sees the bare element. This **replaces** the original `actorHasNotEntry` map helper (which is invalidated for arrays — review M5); see §7.

### 2.3 Array append mechanism for `submit`

The jlvm has no `push`; appends are done by array concatenation. Confirm the concat op before implementation (`concat`/`+` on arrays). **OPEN — must verify which op concatenates arrays** (see openQuestions). Fallback that is guaranteed expressible: keep a parallel `subCount: int` and store submissions in a **bounded set of explicitly-keyed slots** — but the clean path is array concat. The factory's `submit` effect is: `submissions := concat(state.submissions, [ {addr:event.agent, value:event.value} ])`.

### 2.4 Multi-`from` transitions are SPLIT into one transition per source state (fixes B4)

`from: TState` is a single string (`fiber-app.ts:139`). Every "X→X and Y→Y" arm in the original is emitted by the factory as **distinct transition entries**, each with the same `eventName` but a distinct `from`. The engine dispatches on `(currentState, eventName)`, so reusing one `eventName` across different `from` states is fine **as long as no two entries share BOTH `from` and `eventName`**. Concretely the factory emits:

- `stake_and_join`: `FORMING→FORMING` AND `COLLECTING→COLLECTING` (2 entries).
- `open_epoch`: split by source/semantics into **`open_first_epoch` (FORMING→COLLECTING)** and **`reset_epoch` (SETTLED→COLLECTING)** — distinct event names because their effects differ (first-epoch binds the registry dep + is the genesis bind site §6; reset clears `submissions`/`rewards`).
- `withdraw_stake`: `SETTLED→SETTLED` AND `CLOSED→CLOSED` (2 entries).
- `close`: `FORMING→CLOSED`, `COLLECTING→CLOSED`, `SETTLED→CLOSED` (3 entries).
- governance `challenge`: `VOTING→VOTING` AND `COLLECTING→COLLECTING` (2 entries).

The §5 factory emits all duplicated arms from a single body template. The transition table is ~2x the naive count; this is now explicit.

---

## 3. The BASE state machine — `staked-pool` (`StakedPool`)

### 3.1 States

```
FORMING   (initial)  — accepting stake/join; not yet running epochs
COLLECTING           — epoch open; participants submit
SETTLED              — result published; reward ledger credited; results readable
CLOSED    (final)    — pool wound down; stakes + unclaimed rewards withdrawable
```

`RESOLVING` is **dropped** — finalize is a single `COLLECTING→SETTLED` pure-state arm (no cross-fiber two-phase read needed inside finalize). Lifecycle: `FORMING → COLLECTING → SETTLED → COLLECTING` (reset via `reset_epoch`) … `→ CLOSED`.

### 3.2 Create schema (immutables pinned at create — closed-expression guards)

```
authority      : address   (immutable)
registryId     : uuid                  — identity registry fiber id (bound via _addDependency, §6)
minReputation  : integer               — join bar (signerHasReputationVia)
stakePolicy    : string                — asset policy name of the stake token
stakeAmount    : integer               — required stake (minor units), checked vs heldAssets (H5)
quorum         : integer               — min submissions to finalize
epochLength    : integer               — ordinals per epoch
outlierBound   : integer               — |x - center| <= bound ⇒ in-consensus (oracle)
rewardPerEpoch : integer               — total reward credited to in-consensus set at settlement
```

### 3.3 State schema (every MAP init'd to `{}` and every ARRAY to `[]` at genesis — §M1)

```
status         : string (computed)
epoch          : integer
epochStartedAt : integer
<immutable copies of all create fields>
participants   : { <addr>: true }          FLAT membership (init {})
stakes         : { <addr>: int }           staked amount per participant (init {})
stakeAssetIds  : { <addr>: uuid }          asset instance each staked (init {})
submissions    : [ {addr,value} ]          this epoch's datapoints (init [], cleared each reset) — §2.2
rewards        : { <addr>: int }           CLAIM LEDGER — entitlement, credited at finalize (init {})
slashed        : { <addr>: int }           cumulative slash ledger (init {})
result         : object | null             last finalized result (the published "answer", init null)
inConsensus    : array                     last epoch's rewarded addresses (computed)
```

Governance adds (init even in base genesis so reads stay total, §M1): `proposals: {}`, `voteYes: {}`, `voteNo: {}`, `activeProposal: null`, `challenge: null`.

### 3.4 Transitions (base — concrete guards/effects)

**`stake_and_join`  FORMING→FORMING  AND  COLLECTING→COLLECTING** — reputation-gated join + stake-custody VERIFICATION (H5).

The participant signs an `ApplyMorphism(Transfer, recipient=Fiber(poolId))` on their stake asset BEFORE this event (the loan family's "lock = Transfer into Fiber holder", `assets.ts:358` `lockCollateralOp`). The guard now **independently verifies the pool actually holds that asset** via `heldAssets` (fixing H5 — the original trusted event fields):

```json
{ "and": [
  { "in": [ {"var":"event.agent"}, {"map":[{"var":"proofs"},{"var":"address"}]} ] },            // actorIsSigner(event.agent)
  { "===": [ {"var":"event.stakeAmount"}, {"var":"state.stakeAmount"} ] },
  { "!": [ {"has":[{"var":"state.participants"},{"var":"event.agent"}]} ] },                     // dedup: not already joined
  { "has": [ {"var":"heldAssets"}, {"var":"event.stakeAssetId"} ] },                             // H5: pool holds the claimed asset
  { ">=": [ {"get":[{"get":[{"var":"heldAssets"},{"var":"event.stakeAssetId"}]},"amount"]},
            {"var":"state.stakeAmount"} ] },                                                     // H5: sufficient amount
  { "if": [                                                                                       // signerHasReputationVia(state.registryId, state.minReputation)
      {"has":[{"var":"machines"},{"var":"state.registryId"}]},
      {"some":[{"map":[{"var":"proofs"},{"var":"address"}]},
        {">=":[{"get":[{"get":[{"get":[{"get":[{"var":"machines"},{"var":"state.registryId"}]},"state"]},"reputations"]},{"var":""}]},
               {"var":"state.minReputation"}]}]},
      false ] }
] }
```

Effect (writes membership + stake under the verified `event.agent` key only):
```json
{ "merge": [ {"var":"state"}, {
  "participants":  {"set":[{"var":"state.participants"},{"var":"event.agent"},true]},
  "stakes":        {"set":[{"var":"state.stakes"},{"var":"event.agent"},{"var":"event.stakeAmount"}]},
  "stakeAssetIds": {"set":[{"var":"state.stakeAssetIds"},{"var":"event.agent"},{"var":"event.stakeAssetId"}]}
} ] }
```
> `actorIsSigner` (`guards.ts:88`) is load-bearing — without it an attacker sets `event.agent` to a victim and writes under the victim's key (S1). The `heldAssets` clauses close H5: a participant cannot join with a stake asset the pool does not actually custody. Note `heldAssets` is keyed by assetId (`ContextProvider.scala:99`), and the guard does NOT verify `holder==Fiber(self)` explicitly because `heldAssets` is *by construction* only the assets this fiber holds (`heldAssetsByFiber`, `ContextProvider.scala:90`). It SHOULD also check `behavior.transferable` if the stake must later be returnable — add `{">=":[ {get:[…,"behavior"]} & transferable-bit ]}` only if a non-transferable stake is a concern (soulbound stake cannot be withdrawn; acceptable for some designs — flagged as a factory option).

**`open_first_epoch`  FORMING→COLLECTING** — authority opens epoch 1 AND binds the registry dependency (genesis #24 bind site, §6). PRIMARY transition (dep-mutations honored only here, `TriggerHandler.scala:88`).
Guard: `signerIsParty("state.authority")` (`guards.ts`).
Effect:
```json
{ "merge": [ {"var":"state"}, {
  "status":"COLLECTING",
  "epoch": 1,
  "epochStartedAt": {"var":"$ordinal"},
  "submissions": [],
  "_addDependency": [ {"var":"state.registryId"} ]
} ] }
```

**`reset_epoch`  SETTLED→COLLECTING** — authority advances the epoch and CLEARS submissions + per-epoch reward ledger.
Guard: `signerIsParty("state.authority")`.
Effect:
```json
{ "merge": [ {"var":"state"}, {
  "status":"COLLECTING",
  "epoch": {"+":[{"var":"state.epoch"},1]},
  "epochStartedAt": {"var":"$ordinal"},
  "submissions": [],
  "inConsensus": []
} ] }
```
> `rewards` is NOT cleared on reset (it is a claim ledger accumulated across epochs until claimed). If per-epoch reward expiry is desired, clear it here and force claims before reset — factory option `rewardsExpireOnReset: bool`.

**`submit`  COLLECTING→COLLECTING** — participant appends a datapoint/vote. **Overridden** per specialization. Generic shape:
Guard (joined participant AND verified signer AND within window AND not-yet-submitted-this-epoch, §2.2):
```json
{ "and": [
  { "and": [ {"in":[{"var":"event.agent"},{"map":[{"var":"proofs"},{"var":"address"}]}]},
             {"has":[{"var":"state.participants"},{"var":"event.agent"}]} ] },                   // actorHasEntry(state.participants)
  { "<=": [ {"var":"$ordinal"}, {"+":[{"var":"state.epochStartedAt"},{"var":"state.epochLength"}]} ] },   // within epoch window
  { "none": [ {"var":"state.submissions"},
              {"===":[{"get":[{"var":""},"addr"]},{"var":"event.agent"}]} ] }                    // dedup over array (§2.2)
] }
```
Effect (append `{addr,value}` — §2.3):
```json
{ "merge": [ {"var":"state"}, {
  "submissions": { "<arrayConcat>": [ {"var":"state.submissions"},
                                      [ {"addr":{"var":"event.agent"},"value":{"var":"event.value"}} ] ] }
} ] }
```
`<arrayConcat>` = the verified array-concat op (§2.3 OPEN).

**`finalize`  COLLECTING→SETTLED** — aggregation + reward-LEDGER credit (ZERO asset transfers, §2.1). **Overridden** per specialization. Base skeleton + oracle body in §8.1.

**`claim_reward`  SETTLED→SETTLED  AND  CLOSED→CLOSED** — participant pulls ONE whole reward asset for their ledger entitlement.
Guard (verified claimant with a positive ledger entry):
```json
{ "and": [
  { "and": [ {"in":[{"var":"event.agent"},{"map":[{"var":"proofs"},{"var":"address"}]}]},
             {"has":[{"var":"state.rewards"},{"var":"event.agent"}]} ] },                         // actorHasEntry(state.rewards)
  { ">": [ {"get":[{"var":"state.rewards"},{"var":"event.agent"}]}, 0 ] },
  { "has": [ {"var":"heldAssets"}, {"var":"event.rewardAssetId"} ] }                              // pool holds the named reward instance
] }
```
Effect (zero the ledger entry + transfer ONE whole reward instance to the claimant's wallet):
```json
{ "merge": [ {"var":"state"}, {
  "rewards": {"set":[{"var":"state.rewards"},{"var":"event.agent"},0]},
  "_transferAsset": [ { "assetId": {"var":"event.rewardAssetId"}, "recipient": {"var":"event.agent"} } ]
} ] }
```
> Exactly one transfer per claim ⇒ never the 32-cap. The combiner holder-defense (`AssetCombiner.scala:412`) independently re-checks the pool holds `event.rewardAssetId` and it is transferable; the `actorHasEntry(rewards)` + `recipient=event.agent` coupling forces the claimant to be the verified signer (anti-S1). The reward instance's `amount` is governed by the reward policy / pre-mint; the ledger value is the *entitlement count*, the instance is the *bearer*. If `rewards[agent]` should map to N instances, `claim_reward` is callable N times (idempotent zeroing prevents double-claim of the same ledger credit; for N>1 use a decrement `rewards[agent]-1` instead of set-0 and require a distinct instance each call).

**`withdraw_stake`  SETTLED→SETTLED  AND  CLOSED→CLOSED** — participant reclaims their staked asset (ONE whole transfer). Guard pins the exact actor to the staked entry; effect transfers their own recorded stake asset back.
Guard:
```json
{ "and": [ {"in":[{"var":"event.agent"},{"map":[{"var":"proofs"},{"var":"address"}]}]},
           {"has":[{"var":"state.stakeAssetIds"},{"var":"event.agent"}]} ] }                     // actorHasEntry(state.stakeAssetIds)
```
Effect (H4: ALL payload values evaluate against the SAME pre-merge `state`, so reading `stakeAssetIds[agent]` while also unsetting it is correct — confirmed `evalNode map case`; the unset and the `_transferAsset` read both see the original map):
```json
{ "merge": [ {"var":"state"}, {
  "stakes":        {"set":[{"var":"state.stakes"},{"var":"event.agent"},0]},
  "stakeAssetIds": {"unset":[{"var":"state.stakeAssetIds"},{"var":"event.agent"}]},
  "_transferAsset":[ { "assetId":   {"get":[{"var":"state.stakeAssetIds"},{"var":"event.agent"}]},
                       "recipient": {"var":"event.agent"} } ]
} ] }
```
> **H4 invariant (must be asserted in tests):** every value in a `merge` payload is evaluated against the **pre-merge** `state`; payload key ordering is irrelevant; sibling writes are NOT visible to sibling reads. So the `_transferAsset.assetId` read resolves against the original `stakeAssetIds` even though a sibling key unsets it. A reviewer "fixing" this to read post-unset would strand the stake. One transfer ⇒ no 32-cap.

**`close`  FORMING→CLOSED / COLLECTING→CLOSED / SETTLED→CLOSED** (3 entries, §2.4) — `signerIsParty("state.authority")`; sets `status:"CLOSED"`. Stakes/rewards remain withdrawable/claimable in CLOSED.

---

## 4. Staking / slashing / reward asset flows (post-redesign)

All value movement uses `_transferAsset` inside the `merge` map (`lending-zk-loan.ts:385`), **one whole asset per directive, ≤1 directive per transition** for claim/withdraw, **zero for finalize**.

**Stake custody (join).** Participant Transfers their whole stake instance into `Fiber(poolId)` before `stake_and_join`; the guard verifies it via `heldAssets` (§3.4 H5). The pool records `stakeAssetIds[addr]`.

**Reward (settlement → claim).** `finalize` credits `rewards[addr] += rewardPerEpoch / |inConsensus|` as a **pure state write** (no transfer). The division is exact-rational (§1.1) — but a *ledger count* should be an integer entitlement, so use `rewardPerEpoch` distributed as whole reward instances: credit `rewards[addr] += 1` (one instance each) and pre-mint exactly `|inConsensus|` instances per epoch, OR credit a fungible amount and let `claim_reward` move one fungible instance whose amount the reward policy governs. **Decision: credit `rewards[addr] += 1` (one whole instance per in-consensus participant); pre-mint reward instances at `open_first_epoch`/`reset_epoch` time sized to expected `|inConsensus| ≤ |participants|`.** This keeps the ledger integer and the transfer whole-asset-clean.

**Slash.**
- **Soft slash (oracle):** outliers receive **no `rewards` credit** — pure omission, no transfer. (See H3 — this alone is weak deterrence; mitigated below.)
- **Hard slash (governance):** a proven misbehaver's whole staked instance is redistributed via ONE `_transferAsset` to the reward-pot fiber, `stakes[subject]:=0`, `participants` drops subject, `slashed[subject] += amount`. §8.2.

**Holder defense (R1, highest-risk, `AssetCombiner.scala:412-449`).** Every `_transferAsset` the pool emits is re-validated combiner-side: resolve `assetId` against `CalculatedState.assets`, require `holder == Fiber(poolId)` ∧ `behavior.transferable` ∧ (if recipient is a Fiber) recipient-fiber-live; else `CombineRejected`. The pool's guards are the fiber-side authorization; R1 is the asset-side defense. Both required.

**Effect↔signer coupling.** For any transition whose effect writes a map keyed by `event.agent` or transfers to `event.agent` (`stake_and_join`, `submit`, `claim_reward`, `withdraw_stake`, governance `vote`/`propose`), the guard MUST contain `actorIsSigner`/`actorInSet`/`actorHasEntry` on that same `event.agent` (`guards.ts:88-122`). Authority/role-only transitions (`open_first_epoch`, `reset_epoch`, `finalize`, `close`, hard `slash`) target a pinned `state.authority` / slasher-role via `signerIsParty`/`signerHasRoleVia` and write no `event.agent`-keyed entry, so no coupling clause is needed.

---

## 5. Cross-fiber consumer-read interface ("pull the answer") — with anti-stale epoch pin (M4)

A consumer reads a SETTLED pool's `result` via the #24 two-phase pattern (`corp-board.ts:683→707`). `machines.<poolId>.state` exposes the full `stateData` (`ContextProvider.scala:288` / review-confirmed), so `result` is readable.

1. **Bind + pin (transition N):** consumer emits `_addDependency:[{var:"state.poolId"}]` AND records the epoch it intends to consume by reading `machines.<poolId>.state.epoch` into its own `state.expectedPoolEpoch` (so a later SETTLED of a *different* epoch is detectable — fixing M4).
2. **Gate + read (transition N+1):**
   - **Lifecycle gate:** `depInState("state.poolId", "SETTLED")` (`guards.ts:252`).
   - **Anti-stale gate:** `{"===":[ {"get":[{"get":[{"get":[{"var":"machines"},{"var":"state.poolId"}]},"state"]},"epoch"]}, {"var":"state.expectedPoolEpoch"} ]}` — the pool is SETTLED **for the epoch the consumer pinned**, not a later/earlier one.
   - **Value read:** `{"get":[ {"get":[{"get":[{"var":"machines"},{"var":"state.poolId"}]},"state"]}, "result" ]}` (and `result.value`).

> Without the epoch pin, between bind (N) and read (N+1) the pool can cycle SETTLED→COLLECTING→SETTLED and the consumer would read a *different* epoch's answer or stall while transiently COLLECTING (M4). The pin makes the read epoch-exact; if the pool has moved past the pinned epoch, the consumer must re-bind (liveness handled by re-pin, not silent staleness).

---

## 6. Genesis dependency binding (#24 two-phase requirement) — resolved (M3)

`signerHasReputationVia`/`signerHasRoleVia`/`depInState` read `machines.<registryId>`, which only exists after an `_addDependency`. **M3 showed the original "bind in open_epoch" breaks FORMING-state joins** (those run before the bind → fail-closed). Resolution: a dedicated **`bind_registry`  FORMING→FORMING** arm is **mandatory and first**, gated `signerIsParty("state.authority")`, whose only effect is `_addDependency:[{var:"state.registryId"}]` (exactly `corp-board.ts:683` binds before `:707` reads). The authority calls `bind_registry` immediately after create, **before any `stake_and_join`**. `open_first_epoch` then no longer needs to carry the dep-add (it stays the epoch opener). This removes the "two options, one of which is broken" ambiguity: there is one bind site, it precedes all reputation-gated joins, and it is the primary transition for the dep mutation (`TriggerHandler.scala:88`).

---

## 7. NEW SDK helpers (two; everything else is reuse)

**(a) Effect helper — `transferAsset`** (`src/schema/effects.ts`). No `_transferAsset` builder exists (lending inlines the literal, `lending-zk-loan.ts:385`). Add:
```ts
export const transferAsset = (
  transfers: { assetId: JsonLogicValue; recipient: JsonLogicValue }[],
): Record<string, unknown> => ({ _transferAsset: transfers });
```
Used by `claim_reward`/`withdraw_stake`/hard-`slash` (each passes a single-element array). Greppable and consistent.

**(b) Guard helper — `actorNotInArray`** (`src/schema/guards.ts`), REPLACING the original `actorHasNotEntry` (which assumed a map and is invalidated by the array-shaped `submissions`, review M5). Dedup over an array of `{addr,…}` maps:
```ts
export const actorNotInArray = (arrayVar: string, field = "addr", actorVar = "event.agent"): GuardRule =>
  ({ none: [ { var: arrayVar }, { "===": [ { get: [{ var: "" }, field] }, { var: actorVar } ] } ] });
```
Pairs with the `submit` dedup. (The `actorIsSigner` coupling is applied separately in the `submit` guard, since the actor here is also a `participants` member via `actorHasEntry`.)

No new reputation/role/cross-fiber guard — `signerHasReputationVia`/`signerHasRoleVia`/`depInState` already cover join-gating, slasher-gating, consumer-read.

---

## 8. The two specializations

### 8.1 `oracle-pool` (`StakedPoolOracle`)

`submit` (COLLECTING→COLLECTING): event `{ value:int }`. Guard = base `submit` guard (which already includes the array-dedup `none` clause, §3.4). Effect: append `{addr:event.agent, value:event.value}` (§2.3).

`finalize` (COLLECTING→SETTLED): authority (or any participant — "race to post", gated `signerInSet`-style on `participants`) triggers once `count(submissions) >= quorum` AND the window elapsed.

**Aggregation — outlier-bounded mean over the ARRAY (§2.2), with EXACT-rational arithmetic (§1.1), `reduce` using the `{current,accumulator}` context (H1), and `let` to hoist `center` (H1):**
- `vals = map(submissions, {get:[{var:""},"value"]})` → array of ints.
- `n = count(vals)`.
- `sum = reduce(vals, {"+":[{"var":"accumulator"},{"var":"current"}]}, 0)` — **H1-correct** (callback ctx is `{current,accumulator}`, `opReduce:6014`).
- `center = sum / n` — **exact rational** (no truncation, §1.1).
- `kept = filter(submissions, {"<=":[ {"abs":[{"-":[{"get":[{"var":""},"value"]}, center]}]}, {"var":"state.outlierBound"} ]})` — `filter` callback sees the bare `{addr,value}` element; `center` is referenced via the `let` binding (no closure capture in raw JSON-Logic, but `let` provides it, `evalLet:5465`).
- `finalAnswer = reduce(map(kept,…value), +, 0) / count(kept)` — exact rational.
- `inConsensus = map(kept, {get:[{var:""},"addr"]})` → array of addresses (valid `(map,string)` projection, §2.2).

Wrap the whole finalize body in a single `let` binding `center` once and reuse:
```json
{ "let": [ [ ["center", { "/": [ {"reduce":[{"map":[{"var":"state.submissions"},{"get":[{"var":""},"value"]}]},
                                              {"+":[{"var":"accumulator"},{"var":"current"}]}, 0]},
                                  {"count":[{"map":[{"var":"state.submissions"},{"get":[{"var":""},"value"]}]}]} ]}] ],
           <finalize-effect-using-{var:"center"}> ] }
```

Finalize guard:
```json
{ "and": [
  { "==": [ {"var":"state.status"}, "COLLECTING" ] },
  { ">=": [ {"count":[{"var":"state.submissions"}]}, {"var":"state.quorum"} ] },
  { ">=": [ {"var":"$ordinal"}, {"+":[{"var":"state.epochStartedAt"},{"var":"state.epochLength"}]} ] }
] }
```

Finalize effect (publish result + credit reward LEDGER for in-consensus — **ZERO transfers**, §2.1; soft-slash = no credit for outliers):
```json
{ "merge": [ {"var":"state"}, {
  "status":"SETTLED",
  "result": { "value": {"var":"finalAnswer"}, "epoch": {"var":"state.epoch"}, "finalizedAt": {"var":"$ordinal"} },
  "inConsensus": {"var":"inConsensusAddrs"},
  "rewards": <reduce kept addresses into state.rewards, incrementing each by 1>
} ] }
```
The `rewards` update folds the kept-address array into the existing `rewards` map with `reduce` (ctx `{current,accumulator}`): `accumulator` starts as `state.rewards`, each step `set(accumulator, current /*addr*/, get(accumulator,current,0)+1)`. This is a pure state write — no asset movement, no 32-cap, any pool size.

> **As-built deviation:** two JLVM constraints surfaced at implementation. (1) The map-valued `reduce`-fold above does NOT run — the VM rejects a map (`state.rewards`) as a `reduce` accumulator — so the as-built finalize publishes the kept addresses as an **`inConsensus` array entitlement ledger** instead of a map-keyed `rewards` increment; `claim_reward` checks membership in that array (and a parallel claimed set) rather than reading `rewards[addr]`. (2) `center` is **inlined directly into the `filter` predicate** (the `abs(value - <center expr>) <= bound` membership test re-computes the center inline) rather than being hoisted via `let` — a `let` binding does not cross into the `filter`/`map` callback scope, so the hoist-once-and-reference pattern shown above is not expressible and the center sub-expression is repeated in the callback.

> **H3 mitigation (prominent security limitation, not a footnote).** The plain mean is NOT a robust estimator: one oracle submitting `2^62` shifts `center` enough to evict honest submissions from the in-consensus set, and soft-slash means that attacker risks nothing. Mitigations, in order of strength: (1) **default to a `trimmedMean` factory option** — drop the single `min` and single `max` submission via `min`/`max`+`filter` before computing `center` (cheap, expressible today, materially more robust); (2) **require real stake-at-risk for outliers** via an optional `hardSlashOutliers: bool` that, at finalize, moves each outlier's stake to the reward pot (bounded by the 32-cap → cap the number of outliers slashed per finalize, or defer to a separate `slash_outlier` claim-style transition one-at-a-time); (3) document that a true median is impossible without a `sort` opcode (§10). The factory exposes `aggregation: "mean" | "trimmedMean"` (default `trimmedMean`) and `outlierPenalty: "soft" | "hard"`.

Consumer read: §5 (epoch-pinned `depInState` + read `result.value`).

### 8.2 `stake-slashing-governance` (`StakedPoolGovernance`)

Adds proposal/vote/resolve/challenge/slash on the staked base. Stake = sybil-resistance + slashable accountability. States add `VOTING`.

Votes are tracked **per active proposal** with FLAT maps reset on each `propose` (resolving M2 — a single global `voteYes`/`voteNo` would block a voter across proposals). Design: only **one active proposal at a time** (`activeProposal: id | null`); `propose` is rejected if `activeProposal != null`. `voteYes`/`voteNo` are FLAT `{addr:bool}` maps **cleared at each `propose`** so they always belong to the current `activeProposal`. (Concurrent proposals would need nested per-proposal vote maps → reintroduces the null-read problem; single-active-proposal sidesteps it cleanly. Factory option `concurrentProposals` is explicitly OUT of scope.)

`propose` (COLLECTING→VOTING): event `{ proposalId, payload }`. Guard: `actorHasEntry("state.participants")` (staked participant, key pinned to verified signer) AND `{"==":[{"var":"state.activeProposal"}, null]}`. Effect: set `activeProposal=proposalId`, `proposals[id]={proposer,payload,yes:0,no:0,resolved:false}`, **clear** `voteYes:{}`, `voteNo:{}`.

`vote` (VOTING→VOTING): event `{ support:bool }`. Guard:
```json
{ "and": [
  { "and": [ {"in":[{"var":"event.agent"},{"map":[{"var":"proofs"},{"var":"address"}]}]},
             {"has":[{"var":"state.participants"},{"var":"event.agent"}]} ] },   // actorHasEntry — staked voter, key pinned to signer
  { "!": [ {"has":[{"var":"state.voteYes"},{"var":"event.agent"}]} ] },          // not already voted yes (current proposal)
  { "!": [ {"has":[{"var":"state.voteNo"},{"var":"event.agent"}]} ] }            // not already voted no
] }
```
Effect: record the vote under `event.agent`; tally `yes/no += stakes[event.agent]` (stake-weighted). `actorHasEntry` (not bare `signerHasEntry`) is mandatory — it closes the vote-stuffing gap (`guards.ts:96-122`).

`resolve` (VOTING→COLLECTING): authority OR threshold reached. Records outcome into `result`, applies payload, sets `proposals[id].resolved=true`, `activeProposal=null`.

`challenge` (VOTING→VOTING AND COLLECTING→COLLECTING, 2 entries §2.4): event `{ subject, evidence }`. Guard: `signerHasRoleVia("state.registryId","slashers")` (`guards.ts:210`). Records a pending `challenge={subject,evidence,resolved:false}` bound to `subject`. For provable misbehavior (double-vote/equivocation) the proof can be read directly from on-chain `voteYes`/`voteNo`/`votes`; for cryptographic misbehavior a zk/Σ check (`groth16_verify`/`sigma_verify`, asset-model §8) can additionally gate.

`slash` (→ same state): Guard = `signerHasRoleVia("state.registryId","slashers")` AND `{"==":[{"var":"state.challenge.subject"}, {"var":"event.subject"}]}` (subject pinned by the on-chain challenge record, NOT a forgeable field). Effect HARD-slashes (redistribute one whole stake instance to the reward pot — NOT burn, Emurgo gov-pool feeds a deposit; ONE transfer ⇒ no 32-cap):
```json
{ "merge": [ {"var":"state"}, {
  "stakes":       {"set":[{"var":"state.stakes"},{"var":"event.subject"},0]},
  "slashed":      {"set":[{"var":"state.slashed"},{"var":"event.subject"},
                          {"get":[{"var":"state.stakes"},{"var":"event.subject"}]}]},
  "participants": {"unset":[{"var":"state.participants"},{"var":"event.subject"}]},
  "challenge":    null,
  "_transferAsset":[ { "assetId":   {"get":[{"var":"state.stakeAssetIds"},{"var":"event.subject"}]},
                       "recipient": {"var":"state.rewardPotFiberId"} } ]
} ] }
```
> `slash` targets `event.subject` (the misbehaver), NOT `event.agent` — coupling is on the slasher's ROLE (`signerHasRoleVia`); the victim is pinned by the verified `state.challenge.subject`. Correct asymmetry: actor proves authority, victim pinned by verified state. H4 invariant applies (the `slashed` read of `stakes[subject]` and the `stakes` set-to-0 both see pre-merge state). R1 re-checks the pool holds `stakeAssetIds[subject]`. After slash the subject cannot `withdraw_stake` (no `stakeAssetIds` entry — it should also be unset here; add `"stakeAssetIds":{"unset":[…,event.subject]}` AFTER the `_transferAsset` reads it — H4-safe since both see pre-merge state).

---

## 9. Security invariants (must hold; tested in §10)

1. **S1 coupling:** no guard references `event.agent` (or any actor field) in an authorization/effect-key position without a paired `actorIsSigner`/`actorInSet`/`actorHasEntry` on the same var. Authority/role transitions use `signerIsParty`/`signerHasRoleVia` and write no actor-keyed entry.
2. **Holder defense is independent:** every `_transferAsset` is re-validated by R1 (`AssetCombiner.scala:412`); fiber guards never substitute for it.
3. **Stake reality (H5):** `stake_and_join` verifies the stake asset is in `heldAssets` with `amount >= stakeAmount` — no membership/vote-weight without real custody.
4. **≤1 asset transfer per transition** for claim/withdraw/slash; **0** for finalize → never the 32-cap (B3).
5. **Map/array totality (M1):** every map init `{}` and every array init `[]` at genesis (incl. governance maps in the base) → no null-read eval error (`opHas` requires `tag==='map'`).
6. **Pre-merge evaluation (H4):** every `merge`-payload value reads pre-merge `state`; never reorder to read-after-write.
7. **Epoch-pinned consumer read (M4):** cross-fiber reads gate on both `SETTLED` and `epoch == expectedPoolEpoch`.
8. **Single-active-proposal (M2):** governance votes belong unambiguously to `activeProposal`; `voteYes`/`voteNo` cleared at each `propose`.
9. **Genesis registry bind precedes joins (M3):** `bind_registry` is mandatory and first.

---

## 10. Test plan

### 10.1 SDK unit tests (Vitest, per `src/apps/*/__tests__`)

For base / oracle / governance:
1. **Definition validity:** `defineFiberApp` accepts it; `toProtoDefinition` round-trips; every state reachable; `initialState` present and carries ALL maps as `{}` and arrays as `[]` (invariant 5).
2. **Guard-lint (`src/schema/guard-lint.ts`):** 0 unknown operators across all guards/effects — catches `sort`/`median` regressions, typo'd directives, and any accidental `(array,int)` index. Expected 0/0.
3. **S1 structural assert (invariant 1):** every `event.agent`/actor reference in an auth/effect-key position has a paired coupling clause.
4. **Transfer-count assert (invariant 4):** `finalize` emits zero `_transferAsset`; `claim_reward`/`withdraw_stake`/`slash` emit exactly one.
5. **Aggregation math (local JSON-Logic evaluator over fixtures):** submissions `[{a,100},{b,102},{c,98},{d,500}]`, `outlierBound:10`, `aggregation:"mean"` ⇒ `center=200` (exact), `kept={a,b,c}` (all within 10 of 200? NO — 100/102/98 are ~100 off → this fixture shows the mean's non-robustness). Use it to DEMONSTRATE H3: assert that under plain `mean` the honest cluster is evicted, and under `trimmedMean` (drop min=98? drop max=500) `center≈100`, `kept={a,b,c}`, `d` excluded. This makes H3 a tested, documented limitation and validates the trimmed-mean default. Also assert exact-rational mean (e.g. `[1,2]` → `3/2`, NOT `1`) to lock in the §1.1 no-truncation behavior.
6. **`reduce` context (H1):** assert the sum expression uses `{var:"accumulator"}`/`{var:"current"}`, and a fixture eval gives the correct sum (regression-guard against `{var:""}`).
7. **Array dedup (B2/§2.2):** `submit` twice from same addr → second guard `false` (the `none` clause).
8. **Helpers:** `transferAsset([...])` and `actorNotInArray(...)` produce exact expected JSON-Logic.
9. **H5:** `stake_and_join` guard false when `heldAssets` lacks the claimed assetId or amount insufficient.

### 10.2 e2e tests (`ottochain/e2e-test/examples/`, harness = `definition.json` + `initial-data.json` + `example.json` testFlows + `event-*.ts`)

Reuse `e2e-test/examples/zk-eligibility/` (guard/reject flows) and `adjudicated-htlc/` (real asset fixtures). Real stake/reward asset instances minted into `Fiber(poolId)` in a setup step.

**`staked-oracle-pool/`:**
- `create` (FORMING), `bind_registry` (authority), `open_first_epoch` → `COLLECTING`.
- N × `stake_and_join` (each after a real stake Transfer-in) → membership recorded; a join whose stake asset is NOT held → `expectRejected:"ml0"` (H5); a low-reputation signer → `expectRejected:"ml0"` (reputation gate).
- 4 × `submit` (3 clustered + 1 outlier) appended to the array; double-`submit` same addr → `expectRejected:"ml0"` (array dedup); non-participant `submit` → `expectRejected:"ml0"`.
- `finalize` before quorum → `expectRejected:"ml0"`; after quorum → `SETTLED`, `result.value` = trimmed-mean of the cluster, outlier excluded, `rewards` credited for in-consensus (assert NO asset transfer occurred in finalize).
- `claim_reward` (in-consensus participant) → one `_transferAsset` to claimant, `rewards[addr]→0`; second `claim_reward` same addr → `expectRejected:"ml0"`; outlier `claim_reward` → `expectRejected:"ml0"` (no ledger entry).
- **Consumer** fiber: bind+pin epoch (N), then a transition gated `depInState(poolId,"SETTLED") ∧ epoch==expectedPoolEpoch` reading `result.value` → advances only after the pinned epoch settles (tests M4 pin).
- `reset_epoch` → `COLLECTING`, `submissions` cleared.
- `withdraw_stake` → one `_transferAsset` back; assert R1 holder-defense path holds.

**`staked-slashing-governance/`:**
- `create` + `bind_registry` + `open_first_epoch` + 3 × `stake_and_join`.
- `propose` (staked) → `VOTING`; `propose` from non-participant → `expectRejected:"ml0"`; second `propose` while `activeProposal!=null` → `expectRejected:"ml0"` (M2).
- `vote` (staked, stake-weighted) → tally; double-`vote` → `expectRejected:"ml0"`.
- `challenge` from non-slasher → `expectRejected:"ml0"` (signerHasRoleVia); from registry-attested slasher → recorded.
- `slash` → one `_transferAsset` of subject's stake to the pot, `stakes[subject]=0`, `participants` drops subject, `stakeAssetIds[subject]` unset; assert subject's later `withdraw_stake` → `expectRejected:"ml0"`.
- `resolve` → outcome into `result`, `activeProposal=null`.

All rejected steps assert `expectRejected:"ml0"` (guard/structural denial — confirmed harness code for guard rejections; do NOT hand-wave `dl1`, L2).

---

## 11. Explicit non-goals / residual risks

- **No median** (no `sort`, `operators.d.ts:7`). Default `trimmedMean` (drop single min+max) is the robustness ceiling expressible today; documented + tested (§10.1.5).
- **H3 robustness:** even trimmedMean is gameable by coordinated minorities; the real deterrent is `hardSlashOutliers` (stake-at-risk). Prominent limitation, factory-optional.
- **`_transferAsset` return-channel + R1 are P0 chain-side:** the directive is dead unless the engine wires `assetTransfers` end-to-end and R1 is enforced (both verified present: `EffectExtractor.scala`, `AssetCombiner.scala`). e2e must run against such a build.
- **L3 gas:** `finalize` does multiple full passes over `submissions` (sum, center, filter, reward-fold) under `MeteredEvaluator` with a 1MB state cap; for very large pools confirm worst-case gas < per-transition limit, else finalize can gas-wall (a deadlock flavor). Add a `maxParticipants` create-field cap and a gas-budget test for the largest allowed pool.
- **L1:** no guard does `==` on the `result` object; equality is only on scalars (`epoch`, addresses), where `strictEquals`/coercion is well-defined.

---

## 12. Concrete file-level changes

**Create:**
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/index.ts` — `STAKED_POOL_DEFINITIONS` map + `getStakedPoolDefinition(type="oraclePool")`.
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/base.ts` — `makeStakedPoolDef(overrides)` factory + shared schemas/guards; emits the SPLIT multi-`from` arms (§2.4), all maps/arrays init'd at genesis (§M1).
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/assets.ts` — `stakePolicy()`, `rewardPotPolicy()` builders (reuse `createAssetPolicyPayload`/`fiberHolder`/`walletHolder`, `assets.ts:31,32,148`); `stakeJoinOp`, `mintRewardInstancesOp` mirroring `lockCollateralOp`/`mintPrincipalOp` (`assets.ts:358,375`).
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/state-machines/index.ts` — barrel.
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/state-machines/staked-pool-base.ts` — `stakedPoolBaseDef`.
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/state-machines/staked-pool-oracle.ts` — `makeStakedPoolDef({ submit, finalize: aggregateTrimmedMean })`.
- `/home/euler/repos/ottochain-sdk/src/apps/staked-pool/state-machines/staked-pool-governance.ts` — `makeStakedPoolDef({ propose, vote, resolve, challenge, slash })`.

**Edit:**
- `/home/euler/repos/ottochain-sdk/src/schema/effects.ts` — add `transferAsset(...)` (§7a).
- `/home/euler/repos/ottochain-sdk/src/schema/guards.ts` — add `actorNotInArray(...)` (§7b), REPLACING the original `actorHasNotEntry` plan.
- `/home/euler/repos/ottochain-sdk/src/apps/index.ts` — register the new app.

**e2e (chain repo):**
- `/home/euler/repos/ottochain/e2e-test/examples/staked-oracle-pool/{definition.json,initial-data.json,example.json,event-*.ts}`
- `/home/euler/repos/ottochain/e2e-test/examples/staked-slashing-governance/{definition.json,initial-data.json,example.json,event-*.ts}`

### Key citations
guards.ts:88 (`actorIsSigner`), :101 (`actorInSet`), :117 (`actorHasEntry`), :166 (`signerHasReputationVia`), :210 (`signerHasRoleVia`), :252 (`depInState`); effects.ts:29 (`addDependency`); lending-zk-loan.ts:379-390 (one whole-asset `_transferAsset` to one recipient inside merge); corp-board.ts:683→707 (#24 bind→read); fiber-app.ts:139-142 (`from` is a single `TState`), :291 (`emits` stripped); EffectExtractor.scala:198-233 (`_transferAsset` = {assetId,recipient}, recipient→StrValue, no amount); AssetCombiner.scala:388-394 (32-cap all-or-nothing), :412-449 (R1 holder defense + whole-record holder reassignment); ExecutionLimits.scala:24-26 (maxAssetMutations=32); ContextProvider.scala:90-113,165,176 (heldAssets by assetId, machineId=self); jlvm index.js opReduce:6014 ({current,accumulator}), opMap:5999/opFilter:6007 (bare-element ctx), opEntries:6181/opGet:6166 (no array-index), opSlice:6275, evalLet:5465, combineNumeric:560-566 (exact-rational division), value model :314; operators.d.ts:7 (no sort/median/bitwise).

### Implementation checklist

- Verify the array-concat opcode for `submit` append (§2.3 OPEN): grep jlvm index.js + operators.d.ts for `concat`/array-`+` semantics; if absent, pick the bounded-slot fallback before writing `submit`.
- Add `transferAsset(transfers)` to src/schema/effects.ts and `actorNotInArray(arrayVar, field, actorVar)` to src/schema/guards.ts; unit-test both emit exact JSON-Logic.
- Create src/apps/staked-pool/base.ts `makeStakedPoolDef(overrides)`: genesis initialState with every map `{}` and array `[]` (incl. governance maps); emit the SPLIT multi-`from` arms (stake_and_join x2, open_first_epoch, reset_epoch, withdraw_stake x2, close x3, claim_reward x2).
- Implement base arms: bind_registry (FORMING, _addDependency), stake_and_join (actorIsSigner + heldAssets amount check H5 + signerHasReputationVia + array-safe dedup), open_first_epoch, reset_epoch, submit (array append + none-dedup), claim_reward (one whole-asset transfer, ledger zero), withdraw_stake (H4 pre-merge read), close.
- Implement oracle finalize (state-machines/staked-pool-oracle.ts): let-hoisted exact-rational center, reduce with {current,accumulator} (H1), filter/map over {addr,value} array, trimmedMean default (drop min+max), credit `rewards += 1` per in-consensus addr via reduce-fold — ZERO asset transfers; expose aggregation and outlierPenalty factory options.
- Implement governance (state-machines/staked-pool-governance.ts): VOTING state, single-active-proposal (M2) with voteYes/voteNo cleared on propose, propose/vote(stake-weighted, actorHasEntry)/resolve/challenge(signerHasRoleVia slashers)/slash(one whole-stake transfer to pot, subject pinned by state.challenge.subject, unset stakeAssetIds H4-safe).
- Create src/apps/staked-pool/assets.ts (stakePolicy, rewardPotPolicy, stakeJoinOp, mintRewardInstancesOp) reusing assets.ts:31,32,148,358,375; create index.ts + state-machines/index.ts barrels; register in src/apps/index.ts.
- Write SDK unit tests: definition validity + all-maps/arrays-init, guard-lint 0/0, S1 structural assert, transfer-count assert (0 at finalize / 1 at claim/withdraw/slash), aggregation fixtures proving mean-non-robustness vs trimmedMean + exact-rational (3/2 not 1), reduce-context H1, array dedup, H5 reject, helper outputs.
- Build the consumer cross-fiber read with epoch pin (M4): bind+record machines.<poolId>.state.epoch into state.expectedPoolEpoch, then gate depInState(SETTLED) AND epoch==expectedPoolEpoch before reading result.value.
- Create e2e examples staked-oracle-pool/ and staked-slashing-governance/ with real asset fixtures minted into Fiber(poolId); cover every accept (expectedState) and reject (expectRejected:'ml0') step enumerated in §10.2, including H5 reject, array double-submit reject, finalize-no-transfer, claim/withdraw R1 path, slash→withdraw-denied, and the epoch-pinned consumer.
- Add a maxParticipants create-field cap and a gas-budget test for the largest allowed pool (L3) to prove finalize stays under the per-transition gas limit.

### Open questions

1. Which opcode concatenates/appends arrays for the `submit` append (§2.3)? jlvm has map/filter/reduce/slice/values/keys/entries but the append primitive (`concat`, array-`+`, or a `push`) was not confirmed in this pass. If none exists, `submissions` cannot be an append-only array and the fallback (bounded explicitly-keyed slots, or storing each submission under `submissions[addr]` as a map AND separately tracking an ordered address array) must be chosen before `submit`/finalize are written — this is the single remaining structural unknown.
2. Reward-instance supply model: should `rewards[addr] += 1` map to exactly one pre-minted reward instance per in-consensus participant per epoch (requires `open_first_epoch`/`reset_epoch` to ensure |expected claimants| instances are held), or should the reward policy's morphism guard govern a per-claim `amount` on a shared fungible instance? The whole-asset transfer constraint (no amount field) favors one-instance-per-claimant, but that requires the authority to pre-mint enough instances each epoch — confirm with the maintainer which operational model is acceptable.
3. hardSlashOutliers (H3 mitigation): is stake-at-risk for oracle outliers in scope for v1, or is the documented mean/trimmedMean limitation acceptable initially? If in scope, the per-finalize outlier-slash count must be capped under the 32 asset-mutation limit or deferred to a one-at-a-time slash_outlier transition.
4. Should a non-transferable (soulbound) stake be permitted? If yes, withdraw_stake will fail R1 (behavior.transferable required) — confirm whether stake must always be transferable (then add a behavior check at join) or soulbound stake is an intentional config.

### Risks

1. Array-append opcode unverified (§2.3): if no array-concat primitive exists in jlvm, the entire B2 fix (submissions-as-array) needs a different state shape, which propagates through submit/finalize/dedup. This is the highest residual risk and must be resolved first.
2. Reward instance accounting: the claim-ledger fixes value-splitting and the 32-cap, but shifts operational burden to pre-minting the right number of reward instances per epoch; mis-sizing strands entitlements (ledger credit with no instance to claim) — needs a clear mint-on-open invariant and an e2e covering insufficient-instances.
3. H3 (mean non-robustness): even with trimmedMean default, a coordinated minority can bias the oracle answer with zero stake-at-risk under soft-slash; without hardSlashOutliers this is a real economic-security gap, not just a footnote.
4. L3 gas wall at finalize: multiple full passes over `submissions` under the 1MB state cap can exceed the per-transition gas budget for large pools, producing a finalize deadlock; mitigated only by a maxParticipants cap + gas test, which must be implemented, not assumed.
5. Chain-side dependency: the whole design is correct only against a build where `assetTransfers` is wired end-to-end and R1 is enforced (both verified present today at EffectExtractor.scala/AssetCombiner.scala, but the e2e harness must pin that build).
6. Multi-from split (B4) doubles the transition table; the factory must emit every duplicated arm and tests must assert no two entries share both `from` and `eventName`, or dispatch silently shadows an arm.

---

## shielded-note-pool

*A Tornado-style fixed-denomination UTXO-private asset pool over the shipped zk-shielded Groth16 circuit, with a one-record-per-note bridge built on the chain's real asset model.*


# DESIGN SPEC (FINAL) — `shielded-note-pool`

## 0. Verdict and what changed after review

Build a new privacy app `src/privacy/note-pool.ts` (sibling of `shield-app.ts`, NOT an extension). The cryptographic core of the original design (circuit facts, ABI offsets, proof-binding) is verified-correct. **Five load-bearing chain facts were wrong and are fixed here**, all re-verified against the real on-chain Scala JLVM (`metakit_2.13-sources.jar`, `io.constellationnetwork.metagraph_sdk.json_logic`) and the chain combiners:

1. **`cat` cannot append arrays on-chain** — `JsonLogicSemantics.handleCatOp` (jar `semantics/JsonLogicSemantics.scala:678-693`) explicitly returns `JsonLogicException("Unexpected input for cat")` on any `JsonLogicCollection`. The whole-SDK `{cat:[arr,[x]]}` append idiom (shield-app.ts:104-105, sealed-bid, dao-reputation) is a **latent on-chain bug**. → Use `merge` for append (verified flatten semantics, §1.1).
2. **Bare-substr field extraction silently disables every comparison** — `pvField` at `shield-app.ts:54` returns a bare 64-char hex; every crypto/compare value on-chain is `0x`-prefixed (`HexBytes.parseBytes` requires `^0x[0-9a-f]*$`, jar `ops/HexBytes.scala:54,73`; stored `hash` fields are `0x`-prefixed). A bare hex never equals a stored `0x` hash, so the double-spend `none` guard never fires. → Re-prefix with `{cat:['0x', substr(pv,off,64)]}` (the canonical `zk/guard.ts:25-28` form). Verified.
3. **The shield/unshield bridge contradicts the asset model** — `_transferAsset` → `AssetCombiner.applyFiberTransfer` (`AssetCombiner.scala:413-460`) does `source.copy(holder = recipient)`: a **whole-record custody move**, no amount field (`EffectExtractor.scala:200-232` reads only `ASSET_ID`+`RECIPIENT`). A fiber's ONLY asset capability is whole-record custody transfer. → Redesign as **one AssetRecord per note** (§3), exactly as `lending-zk-loan.ts:385` already locks+releases a whole collateral record.
4. **`shield` deposit was unauthenticated** — no guard can witness a same-block escrow (`depInState` reads fiber `currentStateId`, not balances). → Replace with the asset model's own authorized custody transfer to `Fiber(poolId)` as the gate (§3.2).
5. **"asset transfers only fire on the primary transition" is false** — TriggerHandler.scala:88's primary-only rule scopes to `spawns`+`dependencyMutations` ONLY; `assetTransfers` ARE returned from cascades (`TriggerHandler.scala:91,111-118`) and applied (`TriggerDispatcher.scala:111-122`). → `unshield` is cascade-reachable; its guard must be fully self-sufficient (§3.3).

The shielded circuit is `~/repos/metakit-sdk/rust/zk-shielded`; its public values `ShieldedTransferPublicValues{anchor, nullifiers[], outputCms[], fee, feeAsset}` (`pub_values.rs:21-27`) are ABI-encoded with dynamic arrays — incompatible with shield-app's flat parser, which is why this is a separate app, and why **MVP pins N=1 input / M=1 output** so the ABI tail is static and `substr`-addressable.

---

## 1. Verified on-chain primitives (the foundation)

### 1.1 Array append = `merge`, not `cat`
- `handleMergeOp` (jar `semantics/JsonLogicSemantics.scala:604-623`): multi-arg → `case other => impl(other)`; `impl` folds, flattening any `ArrayValue` element one level (`acc ++ elems`). So `{merge:[{var:"state.nullifiers"}, [X]]}` = (flatten state.nullifiers' elems) ++ (flatten [X]) = append X. **Verified.**
- Caveat: single-array-arg `{merge:[arr]}` flattens arr's elements (could over-flatten). Always pass exactly two args for append. Effects below comply.
- The **outer** state write also uses `merge` of maps: `case maps if maps.forall(isMap) => mergeMaps` (jar :613-617). So `{merge:[{var:"state"}, {…patch…}]}` is a map-merge (verified) — the field-patch values must themselves be computed, and an array field's value uses the two-arg array-merge above.

### 1.2 `0x`-prefix is mandatory everywhere
- `groth16_verify` (jar `ops/CryptoOps.scala:111-135`): parses `publicValues` via `parseBytes(_, None)` requiring `^0x[0-9a-f]*$`. So `event.publicValues` is a `0x`-string; field substr offsets start at **2** (skip `0x`). ENCODING errors hard-fail; crypto-invalid → `false` (verified error-vs-false discipline).
- Any extracted field compared with `===`/`in`/`none` against a stored `hash` (0x) MUST be re-prefixed: `{cat:['0x', {substr:[pv,off,64]}]}` (`cat` of two **strings** is valid; jar :686-689). This is the `zk/guard.ts:25-28` `pvWord` form. **Verified.**

### 1.3 `none` / `in` / `slice` / `substr` (all verified in jar)
- `handleNoneOp` (:`/handleNoneOp/`): `ArrayValue :: FunctionValue :: Nil` → true iff predicate false for all. The SDK must compile `{"===":[{var:""}, X]}` to a `FunctionValue` (shield-app does; reuse that machinery).
- `handleInOp` (:626-650): `(v) :: ArrayValue(arr)` → `arr.contains(v)` (structural). 0x-strings compare correctly.
- `handleSliceOp` (:1057-1082): negative start supported via `clampIndex` (`len + idx`). So the rolling-window `{slice:[arr, -window]}` works. **Verified.**
- `handleSubstrOp` (:694-720): byte/char substring, i64-saturating. 64-char extraction at hex offsets is exact.

### 1.4 Circuit facts (re-confirmed, unchanged from original)
`cm=Poseidon([value_as_fr, owner, asset, rho])` (4-input, MAX arity, `lib.rs:80-82`); `owner=Poseidon([nsk])`; `nf=Poseidon([rho, nsk])` (field order rho,nsk, `lib.rs:90-93`); circuit attests membership (`verify_inclusion`), nullifier derivation, authorization, **per-asset conservation** (`lib.rs:266-289`), intra-transfer nullifier uniqueness (`lib.rs:244`), u64 range-by-construction; **no `newRoot`**, requires ≥1 input AND ≥1 output (`lib.rs:205`). ABI offsets for N=1/M=1: `anchor=2, fee=194, feeAsset=258, nf[0]=386, cm[0]=514` (review re-derived; correct).

---

## 2. App shape and state

`src/privacy/note-pool.ts` exports `NotePoolOptions`, `notePoolDef(opts): FiberAppDefinition` (via `defineFiberApp`, the constructor shield-app uses at `shield-app.ts:114`), `NOTE_POOL_STATE`, and event-payload TS types. Single state `ACTIVE→ACTIVE`, transitions `transfer` / `unshield` (and the deposit path, which is an asset-model op + a `noteMinted` witness transition — §3.2). Add exports to `src/privacy/index.ts`. Doc comments must cite `docs/design/metakit-privacy-extensions-handoff.md` (the referenced `zk-private-contract-state-rfc.md` does not exist).

```ts
export const NOTE_POOL_STATE: Record<string, SchemaField> = {
  vkey:        { type: "hash", immutable: true },     // zk-shielded program vkey (32B, 0x)
  depth:       { type: "integer", immutable: true },  // merkle depth pinned at creation
  denom:       { type: "integer", immutable: true },  // fixed note denomination (asset units)
  poolPolicyRef:{ type: "string", immutable: true },  // asset policy the pool mints/burns note-records under
  feeAsset:    { type: "hash", immutable: true },      // 0x Fr label fees are charged in (== asset-as-Fr)
  feeWord:     { type: "hash", immutable: true },      // the EXACT 0x 32-byte word `fee` must equal (MVP: zero word)
  relayer:     { type: "string", immutable: true },    // DAG address authorized to advance the root (MVP anti-grief)
  currentRoot: { type: "hash", computed: true },
  knownRoots:  { type: "array", computed: true },      // rolling window of valid anchors (0x)
  rootWindow:  { type: "integer", immutable: true, default: 64 },
  nullifiers:  { type: "array", computed: true },      // spent set (0x); monotonic
  commitments: { type: "array", computed: true },      // append-only output-commitment log (0x)
  noteRecords: { type: "array", computed: true },      // assetId UUIDs of live note-records held by the pool
  leafCount:   { type: "integer", computed: true, default: 0 },
  transfers:   { type: "integer", computed: true, default: 0 },
};
```

---

## 3. Transitions

### 3.1 `transfer` — core shielded note-to-note spend (no public asset moves)

Event: `{ proof, publicValues, newRoot }`. Extraction helper (note the mandatory `0x` re-prefix — Finding 5 fix):
```ts
const pv = { var: "event.publicValues" };
const pvField = (off: number) => ({ cat: ["0x", { substr: [pv, off, 64] }] });
const anchor    = pvField(2);
const feeWord   = pvField(194);  // full word; fee is the right 16 hex of this
const feeAsset  = pvField(258);
const nullifier = pvField(386);  // nullifiers[0], after len word @322
const newCm     = pvField(514);  // outputCms[0], after len word @450
```

**GUARD** (all combiner-only; binds against the *exact verified bytes*):
```jsonc
{ "and": [
  { "groth16_verify": [ {"var":"state.vkey"}, {"var":"event.publicValues"}, {"var":"event.proof"} ] },
  { "in":  [ anchor,   {"var":"state.knownRoots"} ] },
  { "none":[ {"var":"state.nullifiers"}, {"===":[{"var":""}, nullifier]} ] },
  { "===": [ feeAsset,  {"var":"state.feeAsset"} ] },
  { "===": [ feeWord,   {"var":"state.feeWord"} ] }     // FEE PINNED (Finding 6): fee must equal feeWord (MVP: zero word)
] }
```
Fee fix (Finding 6): the `fee` uint64 is right-aligned in word 3. Pinning the **whole word** to a configured `feeWord` (MVP: the all-zero 0x word `0x0000…0`) forces `fee=0` and rejects any value-siphoning fee. (LATER, to allow a fixed nonzero fee, compare only the right 16 hex via a second substr; for MVP zero-fee, full-word `===` is simplest and strictest.)

**EFFECT** (append via `merge`, not `cat` — Finding 3 fix; rolling window via `slice`):
```jsonc
{ "merge": [ {"var":"state"}, {
  "nullifiers":  { "merge": [ {"var":"state.nullifiers"},  [ nullifier ] ] },
  "commitments": { "merge": [ {"var":"state.commitments"}, [ newCm ] ] },
  "currentRoot": { "var":"event.newRoot" },
  "knownRoots":  { "slice": [ { "merge": [ {"var":"state.knownRoots"}, [ {"var":"event.newRoot"} ] ] },
                              { "*": [ -1, {"var":"state.rootWindow"} ] } ] },
  "leafCount":   { "+": [ {"var":"state.leafCount"}, 1 ] },
  "transfers":   { "+": [ {"var":"state.transfers"}, 1 ] }
} ] }
```

**Root-advancement authz (Finding 7 fix):** `event.newRoot` is NOT in the proven public values, so a malicious caller could flood `knownRoots` with garbage anchors and evict honest in-flight anchors out of the window (a real DoS, not "harms only itself"). For MVP, **gate root advancement to a pinned relayer**: add to the guard `{ "in": [ {"var":"state.relayer"}, {"var":"signers"} ] }` (the `signerIsParty`/`actorIsSigner` form, `guards.ts:73,88`) so only the relayer's signed `transfer` advances the tree. A non-relayer transfer is rejected. (LATER §5.2 removes the relayer by proving `newRoot` in-circuit.)

### 3.2 Deposit (`shield`) — one note-record minted per deposit (Findings 1+2 fix)

There is **no in-guard way** to witness an escrow, and `_transferAsset` is whole-record. So the deposit is modeled entirely on the asset model, in two atomic asset-model operations the depositor signs (NOT fiber transitions):

1. **Mint a `denom`-valued note-record** under `poolPolicyRef` with `holder = Fiber(poolId)` — `Updates.MintAsset` (`AssetCombiner.mintAsset:168-223`), gated by the policy's `mintPolicy` guard (combiner-only, `AssetCombiner.scala:184-191`). Minting directly into a `Fiber` holder is supported (`AssetCombiner.scala:165`). The `mintPolicy` is the authorization surface: it pins `amount == denom`, restricts the holder to the pool fiber, and (optionally) requires depositor signature. **The note commitment** the depositor computes client-side (`cm=Poseidon([denom, owner, feeAsset, rho])`) is carried as policy/mint metadata.

2. The pool's **`noteMinted` witness transition** records the commitment into `commitments` and the new record's UUID into `noteRecords`. Its guard does NOT trust a balance read; it binds to the **freshly-created asset record**: the transition is triggerable only with a `proofs`/signer matching the policy mint, and the effect appends `event.commitment` + `event.recordId`. Because a forged `noteMinted` without a real mint would leave `noteRecords` referencing a nonexistent/over-withdrawable record, `unshield` (§3.3) independently re-checks record custody at withdrawal, so a fake commitment cannot extract value.

This is the documented fixed-denomination MVP: the mint is transparent (same as Tornado), but the **amount is hidden among same-denom notes** (anonymity set = all live `denom` notes). The note commitment is what gets unlinkably spent later.

Conservation at the boundary holds **by record accounting**, not by a balance argument: each live note ⇔ exactly one `denom`-valued AssetRecord held by `Fiber(poolId)`, tracked in `noteRecords`. `Σ records.amount == denom × |noteRecords|`.

### 3.3 `unshield` — burn a note, release exactly one note-record (Findings 3+4+5+6 fix)

A holder submits a `transfer`-shaped `zk-shielded` proof whose spend nullifies a note worth `denom`; the pool then releases **one whole `denom` note-record** to a clear recipient via `_transferAsset` (whole-record semantics — which now MATCH, because each note IS a whole `denom` record).

**GUARD** (identical proof+nullifier+fee binding to §3.1, PLUS record selection; fully self-sufficient because it is cascade-reachable — Finding 4):
```jsonc
{ "and": [
  { "groth16_verify": [ {"var":"state.vkey"}, {"var":"event.publicValues"}, {"var":"event.proof"} ] },
  { "in":  [ anchor, {"var":"state.knownRoots"} ] },
  { "none":[ {"var":"state.nullifiers"}, {"===":[{"var":""}, nullifier]} ] },
  { "===": [ feeAsset, {"var":"state.feeAsset"} ] },
  { "===": [ feeWord,  {"var":"state.feeWord"} ] },
  { "in":  [ {"var":"event.recordId"}, {"var":"state.noteRecords"} ] }   // can only release a record the pool actually holds
] }
```

**EFFECT** (spend nullifier via `merge`-append; remove the released record id; emit whole-record transfer):
```jsonc
{ "merge": [ {"var":"state"}, {
  "nullifiers":  { "merge": [ {"var":"state.nullifiers"}, [ nullifier ] ] },
  "noteRecords": { "filter": [ {"var":"state.noteRecords"}, {"!==":[{"var":""}, {"var":"event.recordId"}]} ] },
  "transfers":   { "+": [ {"var":"state.transfers"}, 1 ] },
  "_transferAsset": [ { "assetId": {"var":"event.recordId"}, "recipient": {"var":"event.recipient"} } ]
} ] }
```
- `AssetCombiner.applyFiberTransfer:413-460` enforces (R1) the pool fiber actually holds `event.recordId`, (R2) it's transferable, (R3) recipient liveness — the chain never trusts the scraped directive. Releasing the whole record is exactly `denom` because each note-record IS `denom` (§3.2).
- `recipient` is a clear DAG address → `AssetHolder.Wallet` (`EffectExtractor.parseRecipient:243-247`).
- Because `unshield` can fire from a cascade, the guard relies on NOTHING external (no primary-only assumption). Re-audit who can `_trigger` the pool fiber before deployment; the `in noteRecords` + nullifier-freshness + proof binding make a cascade-driven withdrawal still require a valid unique proof.

---

## 4. Security invariants (final, all guard-enforced)

| Invariant | Mechanism | File:line |
|---|---|---|
| Proof binds the exact public bytes | `groth16_verify` over `event.publicValues`; fields sliced from those same bytes | jar `CryptoOps.scala:111`; §3.1 |
| No mauling fields independently of proof | any field change invalidates Groth16 | verified |
| Inter-transfer double-spend blocked | `none` over `state.nullifiers` with **0x-prefixed** nullifier | §1.2, §3.1 |
| Spend tied to an honored anchor | `in [anchor, knownRoots]` (0x) | §3.1 |
| No fee-asset spoofing / cross-asset mint via fee | `=== [feeAsset, state.feeAsset]` | §3.1 |
| No value siphon via fee | `=== [feeWord, state.feeWord]` (fee pinned to 0) | §3.1, Finding 6 |
| Root-advance DoS prevented | relayer-signer gate on `transfer` | §3.1, Finding 7 |
| Deposit authenticated | asset-model `mintPolicy` guard; one record per note | §3.2 |
| Withdrawal releases exactly `denom`, only held records | `in noteRecords` + whole-record `_transferAsset` + R1 holder defense | §3.3 |
| Append correctness on-chain | `merge` (NOT `cat`) for all array appends | §1.1 |

---

## 5. Scope

### 5.1 MVP (this workstream)
Single pool, fixed denomination, N=1/M=1, zero fee. New `note-pool.ts`. Nullifier set + anchor window + `noteRecords` in fiber-state arrays. Deposit = policy-gated `MintAsset` into `Fiber(poolId)` + `noteMinted` witness. Withdrawal = proof-gated whole-record `_transferAsset`. Relayer-gated wallet-computed `newRoot`. Real GPU Groth16 fixture via `sp1-gpu-proving` skill against `~/repos/metakit-sdk/rust/zk-shielded`.

### 5.2 LATER (explicitly deferred, with the two MEDIUMs NOT punted)
- **Circuit emits `newRoot`** (in-circuit absence→insert: `verify_absence`+`compute_root`, `poseidon-bn254/src/merkle.rs:234,271`) → removes the relayer trust + closes the root-trust gap. Re-keys vkey; gated on external audit.
- **Bounded nullifier/commitment state (NOT optional — MEDIUM 8):** the monotonic in-state arrays grow O(n); every `transfer` does an O(n) `none` scan and re-serializes the whole array, so the fiber **bricks at the per-update byte/gas cap**. MVP MUST document the concrete note ceiling and cap the pool below it; the committed-state `nullifier/<hash>` projection (handoff §P0.1) is a near-term prerequisite for any non-toy pool, not a nicety.
- Variable amounts / N>1,M>1 (needs dynamic-array PV decode — `substr` can't follow ABI offsets).
- Multi-asset pool (circuit already conserves per-asset; bridge needs per-asset `poolPolicyRef`).
- Viewing keys + note ciphertexts; recursive/batched proofs.

---

## 6. SP1 proving (fixture production)
Use the **`sp1-gpu-proving` skill** + `sp1-prove.sh`. Circuit `~/repos/metakit-sdk/rust/zk-shielded`; `cargo run --release -- --mode groth16 --witness <wire.json>` (`script/src/main.rs:144-178`) emits `{scheme, vkey, publicValues, proof, witness}`. `vkey` (`pk.verifying_key().bytes32()`) = pinned `state.vkey`. **The cuda gotcha** (memory `sp1-gpu-proving.md`): `zk-shielded/script/Cargo.toml` must carry the sp1-sdk `cuda` feature or it silently runs on CPU. Witness `WireWitness` (`wire.rs:82-90`): Fr as decimal strings, merkle proof `{position, siblings}` root-first, depth 8 fixtures (`script/src/main.rs:38`). Determinism invariant: every cm/nf preimage round-trips byte-for-byte Scala/Rust/TS through `canonicalize`; SDK computes `cm` with the `poseidon` opcode at MAX arity 4.

---

## 7. e2e + unit test plan (`ottochain/e2e-test/examples/shielded-note-transfer/`)
Mirror `zk-eligibility/{definition,initial-data,example}.json` + `event-*.ts`.
- **THE acceptance gate (land FIRST):** a unit test proving the **0x-prefixed nullifier actually rejects on replay** (Findings 5+9). Plant a nullifier in `state.nullifiers` (0x), submit a `transfer` whose extracted nullifier equals it → MUST `expectRejected:"ml0"`. This single test proves: `merge`-append produced 0x values, `none` fires, the 0x re-prefix is correct, and the function-literal compiles. If this is green, the double-spend property holds.
- **`merge`-vs-`cat` regression:** assert a `transfer` effect actually appends (state.nullifiers length grows by 1) on-chain — guards against the silent `cat` failure.
- `event-transfer.ts`: real GPU Groth16 fixture (§6), expect `ACTIVE`.
- `event-transfer-bad.ts`: flipped-nibble proof → `groth16_verify` false → `expectRejected:"ml0"`.
- Double-spend flow: `transfer` ok → second `transfer` same nullifier → `expectRejected:"ml0"`.
- Fee-siphon test: a proof with nonzero `fee` word → `=== feeWord` fails → rejected.
- Non-relayer root-advance test: a `transfer` signed by a non-relayer → relayer gate fails → rejected.
- Deposit/withdraw round-trip: `MintAsset`→`noteMinted`→`unshield` releasing the same record id → asset lands at recipient wallet; a second `unshield` of the same record id → `in noteRecords` fails → rejected.

---

## 8. Concrete file-level changes
- **NEW** `src/privacy/note-pool.ts`: `NOTE_POOL_STATE`, `notePoolDef(opts)`, payload types, the `pvField` 0x-re-prefix helper, `transfer`/`unshield`/`noteMinted` builders. Use `merge`-append everywhere; never `cat` for arrays. `_transferAsset` hand-written inline (no builder exists — `src/schema/effects.ts` has none; pattern: `lending-zk-loan.ts:385`).
- **EDIT** `src/privacy/index.ts`: export note-pool; fix the dead `zk-private-contract-state-rfc.md` doc reference to `metakit-privacy-extensions-handoff.md`.
- **NEW** `ottochain/e2e-test/examples/shielded-note-transfer/{definition,initial-data,example}.json` + `event-transfer.ts` + `event-transfer-bad.ts`.
- **NEW** unit test(s) in the SDK for the 0x-nullifier-rejection gate and the merge-append regression.
- **Pre-req asset policy:** a `poolPolicyRef` asset policy whose `mintPolicy` pins `amount==denom`, holder==pool fiber, depositor-signed; `burnPolicy` for note-record retirement if records are burned rather than transferred out.
- **Recommended SDK fix (separate PR):** `shield-app.ts` shares both bugs (cat-append at :104-105, bare-substr at :54) — it is currently broken on-chain. Flag for a fix using the verified `merge`+`0x`-prefix forms; the note-pool app must not inherit them.

### Implementation checklist

- Confirm the `poolPolicyRef` asset policy can mint a `denom`-valued AssetRecord with holder=Fiber(poolId), gated by a mintPolicy that pins amount==denom and depositor signature (AssetCombiner.mintAsset:168-223)
- Write src/privacy/note-pool.ts: NOTE_POOL_STATE, notePoolDef, payload types; pvField helper that re-prefixes 0x ({cat:['0x',{substr:[pv,off,64]}]})
- Implement `transfer` guard: groth16_verify + in(anchor,knownRoots) + none(nullifiers) + ===(feeAsset) + ===(feeWord,zero) + relayer signer gate
- Implement `transfer` effect using merge-append (NOT cat) for nullifiers/commitments/knownRoots, slice(-rootWindow) for the window, +1 counters
- Implement `noteMinted` witness transition recording event.commitment into commitments and event.recordId into noteRecords
- Implement `unshield` guard (self-sufficient, cascade-safe): same proof/nullifier/fee binding + in(event.recordId, noteRecords)
- Implement `unshield` effect: merge-append nullifier, filter recordId out of noteRecords, inline _transferAsset{assetId:recordId, recipient}
- Add note-pool exports to src/privacy/index.ts and fix the dead zk-private-contract-state-rfc.md doc reference
- Write the acceptance-gate unit test FIRST: planted 0x nullifier must reject on replay (proves 0x-prefix + none + merge-append all green on-chain)
- Add merge-vs-cat regression test asserting the transfer effect actually grows state.nullifiers by 1 on-chain
- Generate a real GPU Groth16 fixture via the sp1-gpu-proving skill against ~/repos/metakit-sdk/rust/zk-shielded (mode groth16, depth-8 witness)
- Build e2e example dir shielded-note-transfer with definition/initial-data/example.json + event-transfer.ts + event-transfer-bad.ts
- Add e2e flows: happy transfer, bad-proof reject, double-spend reject, fee-siphon reject, non-relayer root-advance reject, deposit->withdraw round-trip + double-withdraw reject
- Document the concrete note ceiling (per-update byte/gas cap) and cap the pool below it; flag committed-state nullifier projection as the near-term prerequisite
- Open a separate PR flagging shield-app.ts:54,104-105 as broken on-chain (cat-append + bare-substr) with the verified merge+0x fix

### Open questions

1. Exact mint-authorization shape: can the `mintPolicy` guard bind the minted record to a depositor-supplied note commitment (carried as mint metadata), or must the `noteMinted` witness transition be coupled to the mint by something stronger than a shared recordId+signer? Need the maintainer to confirm what mint context fields (Updates.MintAsset / mintContext) are exposable to the policy guard and whether commitment metadata can be attached to an AssetRecord.
2. Is there any atomic ordering guarantee that the MintAsset and the `noteMinted` witness transition land in the same snapshot/combine pass, or can a deposit mint succeed while the witness fails (orphaning a Fiber-held record not in noteRecords)? If not atomic, define the reconciliation/sweep path.
3. Should note-records be retired on unshield via whole-record _transferAsset to the recipient (record leaves the pool intact, denom units, recipient now owns a note-record they must further redeem) OR via a burn morphism + a separate fungible payout? The spec assumes transfer-out of the whole note-record; confirm the recipient UX (do they want a generic asset or this specific note-record?).
4. Who is allowed to `_trigger` the pool fiber (cascade reachability of unshield)? Need an explicit allowlist/audit of upstream fibers that can drive withdrawals, since the primary-only assumption is false.
5. Relayer choice for MVP root advancement: single trusted relayer address acceptable, or is a small relayer set / threshold needed? This gates the §3.1 signer check shape.

### Risks

1. The cat->merge and bare-substr->0x bugs exist across the whole SDK privacy layer (shield-app, sealed-bid, dao-reputation); if any shipped e2e 'passed', the on-chain evaluator path may not have been exercised the way assumed — verify the acceptance-gate test actually runs against the real Scala JLVM, not just the TS dist.
2. Deposit security hinges entirely on the asset-model mintPolicy correctly pinning amount==denom and holder; a weak policy re-opens the free-mint hole that #2 was meant to close. The note-pool guard cannot defend this — it lives in the policy.
3. Whole-record withdrawal means anonymity at withdrawal is only as strong as record fungibility: if note-records carry distinguishing metadata (creationOrdinal, commitment), the released record may be linkable to its deposit, weakening unlinkability vs a true fungible payout.
4. Unbounded nullifiers/commitments/noteRecords arrays + O(n) `none` scan per transfer impose a hard liveness ceiling; without the committed-state projection the pool bricks at scale — this is a MVP limit, not a LATER nicety.
5. Relayer-gated root advancement centralizes liveness (relayer can censor by withholding root advances) and is only an interim mitigation until the circuit emits newRoot; document the trust assumption explicitly.
6. Circuit + Groth16 verifier are unaudited (handoff §P3.1) and BN254 is ~100-bit; value-bearing deployment is gated on audit — MVP must run test assets only.
7. fee pinned to the zero word assumes the prover always sets fee=0; if any legitimate flow needs a fee, the zero-word === must be relaxed to a right-16-hex compare without reopening the siphon.

---

## Roadmap & sequencing

**End-to-end demos vs. standard-library primitives.**

- **`rule110-ca`** and **`sigma-mixer`** are *e2e demos* — self-contained fibers exercised against the real chain (JLVM evaluator + ML0 checkpoint) to prove a capability: Turing-completeness of the substrate (rule110) and a working Σ-protocol ring-proof privacy flow (sigma-mixer). They are demonstrations first; their value is the verified-on-chain claim, not direct reuse.
- **`staked-pool-family`** and **`shielded-note-pool`** are *std-lib primitives* — reusable bases (the epoch-pool lifecycle + claim-ledger; the fixed-denomination UTXO-private pool over the shipped Groth16 circuit) that downstream apps are expected to instantiate and specialize.

**Suggested build order.**

1. **`rule110-ca`** first — lowest dependency surface (no spawn, no asset transfers, no ZK), it validates the JLVM idioms (map-element-as-context, computed `var` paths, null-default boundaries) and the e2e harness extension (`expectedStateData`) that later demos rely on.
2. **`sigma-mixer`** next — introduces the `sigma_verify` / OR-of-dhtuple verifier path and the witness-bound-nullifier discipline, but stays on a pinned ring (no asset minting), so it isolates the crypto-transcript work from the asset-model work.
3. **`staked-pool-family`** — exercises the asset model end-to-end (stake custody, claim ledger, `assetTransfers`) and the registry/identity gate; resolve the **array-append opcode** unknown here since it blocks the submissions-as-array shape.
4. **`shielded-note-pool`** last — it is the most dependency-heavy: it needs the asset-model `mintPolicy`, the shipped `zk-shielded` Groth16 circuit, *and* the cascade-reachability audit, so it should land once the asset and crypto primitives below it are stable.

**Two engine caveats every primitive inherits** (cross-ref [`engine-hardening-spawn-and-effects.md`](../../../ottochain/docs/design/engine-hardening-spawn-and-effects.md)):

- **`_spawn` is honored only on the PRIMARY transition.** A spawn emitted from a non-primary (cascade) transition is silently dropped. Any primitive that relies on child-fiber creation (or that an auditor assumes *cannot* spawn from a cascade) must account for this asymmetry rather than assume uniform spawn semantics.
- **The cascade path bypasses the owner/participant signer gate.** `_trigger`-driven cascade transitions do not re-run the same signer authorization as a primary, externally-signed transition. This is the concentrated risk for `shielded-note-pool` (who may `_trigger` an unshield) and for any pool whose finalize/payout arm is cascade-reachable — the "primary-only" assumption is false and the upstream `_trigger` allowlist must be audited explicitly.
