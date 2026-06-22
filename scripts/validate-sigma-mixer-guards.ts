/**
 * validate-sigma-mixer-guards.ts — VM-validation of the sigma-mixer guards.
 *
 * NOT the live metagraph e2e (CI owns that). This evaluates the EXACT guard
 * expressions from definition.json against the REAL JLVM evaluator
 * (metagraph-sdk-jlvm) using each e2e event fixture + the pinned initial-data,
 * mirroring the engine's first-match transition order
 * (FiberEvaluator.scala:156-163). It asserts:
 *   - honest withdraw  -> a transition guard returns true  (accept)
 *   - bad-recipient     -> NO withdraw guard returns true   (ml0 reject)
 *   - forged-nullifier  -> NO withdraw guard returns true   (ml0 reject, B2)
 *   - replay (post-spend)-> NO withdraw guard returns true  (ml0 reject)
 *   - deposit fill-flip -> 3x deposit stays filling, 4th flips to open (B1)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jlvm = require("@constellation-network/metagraph-sdk-jlvm");
const { evaluate, parseExpression, parseValue } = jlvm;

const here = dirname(fileURLToPath(import.meta.url));
const EX = join(here, "..", "..", "ottochain", "e2e-test", "examples", "sigma-mixer");

const def = JSON.parse(readFileSync(join(EX, "definition.json"), "utf8"));
const initOpen = JSON.parse(readFileSync(join(EX, "initial-data.json"), "utf8"));
const initFilling = JSON.parse(readFileSync(join(EX, "initial-data-filling.json"), "utf8"));

// Load an event-*.ts fixture by extracting its payload (avoids a TS loader).
function loadEvent(file: string): { eventName: string; payload: any } {
  const src = readFileSync(join(EX, file), "utf8");
  // Strip the comment header + the arrow wrapper; eval the object literal.
  const body = src.replace(/^\/\/.*$/gm, "").trim();
  // body is: export default () => ({ ... });
  const objText = body.replace(/^export default \(\) => \(/, "").replace(/\);?\s*$/, "");
  // eslint-disable-next-line no-eval
  return eval("(" + objText + ")");
}

// Evaluate a guard expression against {state, event} via the real VM.
const DEBUG = process.env.DEBUG === "1";
function guardTrue(guard: any, state: any, event: any): boolean {
  try {
    const data = parseValue({ state, event, currentStateId: state.status, proofs: [], $ordinal: 1 });
    const r = evaluate(parseExpression(guard), data);
    return r.ok && r.value.tag === "bool" && r.value.value === true;
  } catch (e) {
    if (DEBUG) console.log("    [guard throw]", (e as Error).message);
    return false; // a throw is an ml0 rejection at the guard
  }
}

// Engine first-match: fire the FIRST transition (declaration order) for
// (state.status, eventName) whose guard is true; return {to, effect} or null.
// `event` is the full {eventName, payload}; guards see the PAYLOAD as `event.*`.
function fire(state: any, event: any): { to: string; effect: any } | null {
  for (const t of def.transitions) {
    if (t.from !== state.status) continue;
    if (t.eventName !== event.eventName) continue;
    if (guardTrue(t.guard, state, event.payload)) return { to: t.to, effect: t.effect };
  }
  return null;
}

// Apply an effect via the VM to produce the next stateData. `event` is the payload.
function applyEffect(effect: any, state: any, event: any): any {
  const data = parseValue({ state, event, currentStateId: state.status, proofs: [], $ordinal: 1 });
  const r = evaluate(parseExpression(effect), data);
  if (!r.ok) throw new Error("effect eval failed");
  return jlvmToPlain(r.value);
}

function jlvmToPlain(v: any): any {
  switch (v.tag) {
    case "map": {
      const o: any = {};
      for (const [k, val] of v.value) o[k] = jlvmToPlain(val);
      return o;
    }
    case "array":
      return v.value.map(jlvmToPlain);
    case "int":
      return Number(v.value);
    case "bool":
    case "string":
    case "float":
      return v.value;
    case "null":
      return null;
    default:
      return v.value;
  }
}

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`);
  }
};

console.log("=== sigma-mixer guard VM-validation ===\n");

// ── FLOW 1 (B1): create(filling, 0 pts) -> 4 deposits, 4th flips to open. ────
console.log("Flow 1 — B1 fill-flip (deposit lifecycle):");
{
  let state = JSON.parse(JSON.stringify(initFilling));
  for (let i = 0; i < 4; i++) {
    const ev = loadEvent(`event-deposit-${i}.ts`);
    const fired = fire(state, ev);
    check(`deposit ${i + 1} fires`, fired !== null);
    if (!fired) break;
    state = applyEffect(fired.effect, state, ev.payload);
    const expected = i < 3 ? "filling" : "open";
    check(`  after deposit ${i + 1}: state=${state.status} (expect ${expected})`, state.status === expected);
    check(`  points length == ${i + 1}`, Array.isArray(state.points) && state.points.length === i + 1);
  }
}

// ── FLOW 2: honest withdraw from open. ───────────────────────────────────────
console.log("\nFlow 2 — honest withdraw (open -> drained on last):");
{
  const state = JSON.parse(JSON.stringify(initOpen)); // withdrawCount 0, target 4
  const ev = loadEvent("event-withdraw.ts");
  const fired = fire(state, ev);
  check("honest withdraw fires a transition", fired !== null);
  // withdrawCount 0 +1 = 1 < 4 -> the ->open variant fires (not last).
  check("honest withdraw -> open (1st of 4)", fired?.to === "open");
  if (fired) {
    const next = applyEffect(fired.effect, state, ev.payload);
    check("nullifier recorded in spentNullifiers", !!next.spentNullifiers[ev.payload.nullifier]);
    check("withdrawCount incremented to 1", next.withdrawCount === 1);
  }
}

// ── FLOW 3: replay after spend -> has() denies. ──────────────────────────────
console.log("\nFlow 3 — replay (same Nf) after spend rejected:");
{
  const state = JSON.parse(JSON.stringify(initOpen));
  const ev = loadEvent("event-withdraw.ts");
  // simulate the first spend having recorded the nullifier:
  state.spentNullifiers = { [ev.payload.nullifier]: true };
  state.withdrawCount = 1;
  const replay = loadEvent("event-withdraw-replay.ts");
  const fired = fire(state, replay);
  check("replay fires NO transition (has denies)", fired === null);
}

// ── FLOW 4 (B2): forged-nullifier rejected by dhtuple. ───────────────────────
console.log("\nFlow 4 — B2 forged nullifier rejected at the proof layer:");
{
  const state = JSON.parse(JSON.stringify(initOpen));
  const forged = loadEvent("event-withdraw-doublespend.ts");
  const fired = fire(state, forged);
  check("forged-nullifier fires NO transition (sigma_verify false)", fired === null);
}

// ── FLOW 5 (H2): bad recipient -> message-binding === fails. ─────────────────
console.log("\nFlow 5 — H2 bad recipient (front-run) rejected:");
{
  const state = JSON.parse(JSON.stringify(initOpen));
  const bad = loadEvent("event-withdraw-bad.ts");
  const fired = fire(state, bad);
  check("bad-recipient fires NO transition (message-bind fails)", fired === null);
}

// ── Last-withdraw drained flip: withdrawCount 3 -> 4 flips to drained. ────────
console.log("\nExtra — last withdraw flips open -> drained:");
{
  const ev = loadEvent("event-withdraw.ts");
  const state = JSON.parse(JSON.stringify(initOpen));
  state.withdrawCount = 3; // next is the 4th == target
  const fired = fire(state, ev);
  check("last withdraw -> drained", fired?.to === "drained");
  if (fired) {
    const next = applyEffect(fired.effect, state, ev.payload);
    check("status drained", next.status === "drained");
    check("withdrawCount == 4", next.withdrawCount === 4);
  }
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
