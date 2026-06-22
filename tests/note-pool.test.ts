/**
 * shielded-note-pool — VM-validation harness.
 *
 * Validates EVERYTHING that does not need the real Groth16 proof, against the real JLVM
 * (`@constellation-network/metagraph-sdk-jlvm`), exactly the engine the chain runs:
 *   - structure: states / transitions / event schemas / PV offsets;
 *   - the non-groth16 guard logic — nullifier dedup (`none`), anchor membership (`in`),
 *     fee-asset + fee-word pinning (`===`), recordId-in-noteRecords (`unshield`);
 *   - the EFFECT — array APPEND via `merge` (NOT `cat`), rolling-window root update via
 *     `slice`, the `filter`-out of a released record id, the `_transferAsset` directive;
 *   - the `pmt_verify` operand shape (root-first siblings, leaf-position index);
 *   - the placeholder `groth16_verify` returns `false` (graceful deny) so the full guard
 *     correctly REJECTS until a real proof is dropped in.
 *
 * The fixture (tests/zk/fixtures/shielded-note-pool-transfer.placeholder.json) carries a
 * PLACEHOLDER proof. When a real SP1 zk-shielded Groth16 fixture is dropped in and
 * `realProof.enabled` is flipped to true, the `describe.each`-gated real-proof block runs
 * the FULL guard (groth16 clause included) and asserts it passes.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { jsonLogic } from "@constellation-network/metagraph-sdk-jlvm";
import {
  notePoolDef,
  NOTE_POOL_STATE,
  PV_LAYOUT,
  ZERO_WORD,
  pvField,
  pmtMembership,
  type NotePoolOptions,
} from "../src/apps/privacy/index.js";

const apply = (rule: unknown, data: unknown = {}): unknown =>
  jsonLogic.apply(rule as Record<string, unknown>, data as Record<string, unknown>);

type NotePoolFixture = {
  realProof: { enabled: boolean };
  vkey: string;
  publicValues: string;
  proof: string;
  newRoot: string;
  fields: { anchor: string; feeWord: string; feeAsset: string; nullifier: string; outputCm: string };
  pmt: { root: string; leaf: string; index: number; siblings: string[]; depth: number };
};

const loadFixture = (name: string): NotePoolFixture =>
  JSON.parse(readFileSync(resolve(__dirname, "zk/fixtures", name), "utf8")) as NotePoolFixture;

// Prefer the REAL SP1 zk-shielded Groth16 fixture (realProof.enabled) when it has been dropped in;
// fall back to the placeholder otherwise. The real fixture's publicValues aligns with the corrected
// PV_LAYOUT and its proof PASSES groth16_verify; the placeholder's proof is rejected (graceful deny).
const realFixture = (() => {
  try {
    const f = loadFixture("shielded-note-pool-transfer.json");
    return f.realProof.enabled ? f : null;
  } catch {
    return null;
  }
})();
const fixture: NotePoolFixture = realFixture ?? loadFixture("shielded-note-pool-transfer.placeholder.json");

// A proof that groth16_verify REJECTS, for the graceful-deny path: corrupt the real proof's bytes
// (a garbage bundle returns false, never throws). When only the placeholder is present its own proof
// is already a non-verifying bundle, so reuse it directly.
const denyEvent = {
  proof: realFixture ? realFixture.proof.slice(0, -8) + "deadbeef" : fixture.proof,
  publicValues: fixture.publicValues,
  newRoot: fixture.newRoot,
};

const OPTS: NotePoolOptions = {
  vkey: fixture.vkey,
  depth: 8,
  denom: 100,
  poolPolicyRef: "std.privacy.note-pool",
  feeAsset: fixture.fields.feeAsset,
  feeWord: ZERO_WORD,
  relayer: "DAG1RELAYER000000000000000000000000000000",
};

const def = notePoolDef(OPTS);
const T = (name: string) => def.transitions.find((t) => t.eventName === name)!;

/** The base public state the guards read (mirrors what the chain stores for a live pool). */
const baseState = {
  vkey: fixture.vkey,
  depth: 8,
  denom: 100,
  poolPolicyRef: "std.privacy.note-pool",
  feeAsset: fixture.fields.feeAsset,
  feeWord: ZERO_WORD,
  relayer: OPTS.relayer,
  rootWindow: 64,
  currentRoot: fixture.fields.anchor,
  knownRoots: [fixture.fields.anchor],
  nullifiers: [] as string[],
  commitments: [] as string[],
  noteRecords: [] as string[],
  leafCount: 0,
  transfers: 0,
};

const transferEvent = {
  proof: fixture.proof,
  publicValues: fixture.publicValues,
  newRoot: fixture.newRoot,
};

// A relayer-signed op: proofs[].address includes the pinned relayer.
const relayerProofs = [{ address: OPTS.relayer }];

describe("shielded-note-pool — structure", () => {
  it("is a privacy app with a single ACTIVE state", () => {
    expect(def.metadata.app).toBe("privacy");
    expect(def.metadata.type).toBe("shielded-note-pool");
    expect(Object.keys(def.states)).toEqual(["ACTIVE"]);
    expect(def.initialState).toBe("ACTIVE");
  });

  it("docstring marks it UNAUDITED / test-assets-only", () => {
    expect(def.metadata.description).toMatch(/UNAUDITED/);
    expect(def.metadata.description).toMatch(/TEST-ASSETS-ONLY/i);
  });

  it("has transfer / noteMinted / unshield transitions, all ACTIVE->ACTIVE", () => {
    const names = def.transitions.map((t) => t.eventName).sort();
    expect(names).toEqual(["noteMinted", "transfer", "unshield"]);
    for (const t of def.transitions) {
      expect(t.from).toBe("ACTIVE");
      expect(t.to).toBe("ACTIVE");
    }
  });

  it("public state = nullifier set + anchor window + commitment log + note-records", () => {
    const props = Object.keys(def.stateSchema!.properties);
    for (const f of ["vkey", "knownRoots", "nullifiers", "commitments", "noteRecords", "relayer"]) {
      expect(props).toContain(f);
    }
    expect(Object.keys(NOTE_POOL_STATE)).toEqual(Object.keys(def.stateSchema!.properties));
  });

  it("PV_LAYOUT pins the documented N=1/M=1 offsets", () => {
    // Real zk-shielded `abi_encode` emits a leading 0x20 dynamic-tuple head word, so each field is
    // one 32-byte word (64 hex) past a naive layout: anchor@66, fee@258, feeAsset@322, nf@450, cm@578.
    expect(PV_LAYOUT).toEqual({ anchor: 66, fee: 258, feeAsset: 322, nullifier: 450, outputCm: 578 });
  });

  it("pvField extracts each field at its layout offset with a 0x re-prefix", () => {
    expect(apply(pvField(PV_LAYOUT.anchor), { event: transferEvent })).toBe(fixture.fields.anchor);
    expect(apply(pvField(PV_LAYOUT.nullifier), { event: transferEvent })).toBe(fixture.fields.nullifier);
    expect(apply(pvField(PV_LAYOUT.outputCm), { event: transferEvent })).toBe(fixture.fields.outputCm);
    expect(apply(pvField(PV_LAYOUT.feeAsset), { event: transferEvent })).toBe(fixture.fields.feeAsset);
    expect(apply(pvField(PV_LAYOUT.fee), { event: transferEvent })).toBe(fixture.fields.feeWord);
  });
});

describe("shielded-note-pool — guard logic (real VM, sans groth16)", () => {
  const guard = T("transfer").guard as { and: unknown[] };
  // guard.and = [groth16, in(anchor,knownRoots), none(nullifiers), ===(feeAsset), ===(feeWord), signerIsParty(relayer)]
  const [groth16Clause, anchorClause, nullifierClause, feeAssetClause, feeWordClause, relayerClause] = guard.and;

  const ctx = (state: typeof baseState, proofs = relayerProofs) => ({ state, event: transferEvent, proofs });

  it("the groth16 clause returns FALSE on a non-verifying (corrupted/placeholder) proof — graceful deny", () => {
    expect(apply(groth16Clause, { state: baseState, event: denyEvent, proofs: relayerProofs })).toBe(false);
  });

  it("anchor ∈ knownRoots passes when the anchor is honored, fails when it is not", () => {
    expect(apply(anchorClause, ctx(baseState))).toBe(true);
    expect(apply(anchorClause, ctx({ ...baseState, knownRoots: ["0x" + "ab".repeat(32)] }))).toBe(false);
  });

  it("nullifier `none` is fresh on an empty set, REJECTS on replay (the double-spend gate)", () => {
    expect(apply(nullifierClause, ctx(baseState))).toBe(true);
    // plant the SAME 0x-prefixed nullifier the proof reveals -> none() must fire false
    expect(apply(nullifierClause, ctx({ ...baseState, nullifiers: [fixture.fields.nullifier] }))).toBe(false);
  });

  it("feeAsset and feeWord pinning: matching passes, spoof/siphon fails", () => {
    expect(apply(feeAssetClause, ctx(baseState))).toBe(true);
    expect(apply(feeWordClause, ctx(baseState))).toBe(true);
    expect(apply(feeAssetClause, ctx({ ...baseState, feeAsset: "0x" + "cd".repeat(32) }))).toBe(false);
    expect(apply(feeWordClause, ctx({ ...baseState, feeWord: "0x" + ("0".repeat(63) + "1") }))).toBe(false);
  });

  it("root-advance is relayer-gated: relayer signer passes, a non-relayer signer fails", () => {
    expect(apply(relayerClause, ctx(baseState))).toBe(true);
    expect(apply(relayerClause, ctx(baseState, [{ address: "DAGNOTTHERELAYER000000000000000000000000" }]))).toBe(false);
  });

  it("the FULL transfer guard rejects (groth16 false) on a non-verifying proof", () => {
    expect(apply(guard, { state: baseState, event: denyEvent, proofs: relayerProofs })).toBe(false);
  });

  it("with the groth16 clause stripped, every OTHER clause passes (binding logic is sound)", () => {
    const sansGroth16 = { and: [anchorClause, nullifierClause, feeAssetClause, feeWordClause, relayerClause] };
    expect(apply(sansGroth16, ctx(baseState))).toBe(true);
  });
});

describe("shielded-note-pool — effect (real VM)", () => {
  it("transfer effect APPENDS the nullifier + commitment via merge (cat would error)", () => {
    const eff = T("transfer").effect!;
    const next = apply(eff, { state: baseState, event: transferEvent }) as Record<string, unknown>;
    expect(next.nullifiers).toEqual([fixture.fields.nullifier]);
    expect(next.commitments).toEqual([fixture.fields.outputCm]);
    expect(next.leafCount).toBe(1);
    expect(next.transfers).toBe(1);
  });

  it("transfer effect advances the anchor window: appends newRoot, trims to rootWindow", () => {
    const eff = T("transfer").effect!;
    // window of 2; 2 existing roots -> after append+trim only the last 2 remain (oldest evicted)
    const state = { ...baseState, rootWindow: 2, knownRoots: ["0xaa", "0xbb"] };
    const next = apply(eff, { state, event: transferEvent }) as Record<string, unknown>;
    expect(next.currentRoot).toBe(fixture.newRoot);
    expect(next.knownRoots).toEqual(["0xbb", fixture.newRoot]);
  });

  it("unshield effect spends the nullifier, drops the released record, emits _transferAsset", () => {
    const recordId = "11111111-1111-1111-1111-111111111111";
    const unshieldEvent = {
      proof: fixture.proof,
      publicValues: fixture.publicValues,
      recordId,
      recipient: "DAGRECIPIENT0000000000000000000000000000",
    };
    const state = { ...baseState, noteRecords: [recordId, "22222222-2222-2222-2222-222222222222"] };
    const next = apply(T("unshield").effect!, { state, event: unshieldEvent }) as Record<string, unknown>;
    expect(next.nullifiers).toEqual([fixture.fields.nullifier]);
    expect(next.noteRecords).toEqual(["22222222-2222-2222-2222-222222222222"]); // released id filtered out
    expect(next._transferAsset).toEqual([{ assetId: recordId, recipient: unshieldEvent.recipient }]);
  });

  it("noteMinted records the commitment + record UUID", () => {
    const ev = {
      commitment: "0x" + "ab".repeat(32),
      recordId: "33333333-3333-3333-3333-333333333333",
      depositor: "DAGDEPOSITOR000000000000000000000000000",
    };
    const next = apply(T("noteMinted").effect!, { state: baseState, event: ev }) as Record<string, unknown>;
    expect(next.commitments).toEqual([ev.commitment]);
    expect(next.noteRecords).toEqual([ev.recordId]);
  });
});

describe("shielded-note-pool — unshield record-selection guard", () => {
  it("rejects releasing a record the pool does not hold; accepts one it does (sans groth16)", () => {
    const guard = T("unshield").guard as { and: unknown[] };
    // last clause = in(event.recordId, state.noteRecords)
    const recordClause = guard.and[guard.and.length - 1];
    const held = "11111111-1111-1111-1111-111111111111";
    const ev = { recordId: held };
    expect(apply(recordClause, { state: { ...baseState, noteRecords: [held] }, event: ev })).toBe(true);
    expect(apply(recordClause, { state: { ...baseState, noteRecords: [] }, event: ev })).toBe(false);
  });
});

describe("shielded-note-pool — pmt_verify operand shape (real VM)", () => {
  it("pmtMembership verifies a true inclusion proof (root-first siblings, leaf-position index)", () => {
    const rule = pmtMembership(
      { var: "root" } as Record<string, unknown>,
      { var: "leaf" } as Record<string, unknown>,
      { var: "index" } as Record<string, unknown>,
      { var: "siblings" } as Record<string, unknown>,
    );
    expect(apply(rule, fixture.pmt)).toBe(true);
    // a wrong leaf fails
    expect(apply(rule, { ...fixture.pmt, leaf: "0x" + "0".repeat(63) + "9" })).toBe(false);
    // a swapped (non-root-first) sibling order fails
    expect(apply(rule, { ...fixture.pmt, siblings: [...fixture.pmt.siblings].reverse() })).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────────────────
//  REAL-PROOF path — runs ONLY when a genuine SP1 zk-shielded Groth16 fixture is dropped in.
//  Until then the placeholder keeps realProof.enabled=false and this block is skipped.
// ──────────────────────────────────────────────────────────────────────────────────────────
const realProofDescribe = fixture.realProof.enabled ? describe : describe.skip;
realProofDescribe("shielded-note-pool — REAL Groth16 proof (drop-in)", () => {
  it("the full transfer guard PASSES with the real proof, fresh nullifier, honored anchor", () => {
    const guard = T("transfer").guard!;
    const state = {
      ...baseState,
      vkey: fixture.vkey,
      feeAsset: fixture.fields.feeAsset,
      knownRoots: [fixture.fields.anchor],
      nullifiers: [],
    };
    expect(apply(guard, { state, event: transferEvent, proofs: relayerProofs })).toBe(true);
  });

  it("the real proof REJECTS on a replayed nullifier", () => {
    const guard = T("transfer").guard!;
    const state = { ...baseState, nullifiers: [fixture.fields.nullifier] };
    expect(apply(guard, { state, event: transferEvent, proofs: relayerProofs })).toBe(false);
  });
});
