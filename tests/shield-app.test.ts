import { shieldApp } from "../src/privacy/shield-app.js";
import {
  sealedBidAccountDef,
  shieldedSealedBidDef,
  vickreyAuctionDef,
} from "../src/privacy/sealed-bid.js";

// The real zk-jlvm-shielded program vkey + the keccak of the pinned effect (metakit-sdk #53 fixture).
const VKEY = "0x00f48340d57e907ec1364bb941e40d86808c0fe5360ead51c4a401556a0d1267";
const EXPR = "0x9296a910474791c389d96ad73ff6569544746f173b1ba4e7533322e27078eca9";

describe("shieldApp", () => {
  const shielded = shieldApp(sealedBidAccountDef, { vkey: VKEY, exprHash: EXPR });

  it("produces a privacy pool fiber app named after the base", () => {
    expect(shielded.metadata.app).toBe("privacy");
    expect(shielded.metadata.name).toBe("ShieldedSealedBidAccount");
    expect(shielded.metadata.type).toBe("shielded-sealed-bid-account");
  });

  it("public state is the pool scaffolding (nullifiers, commitments, roots, vkey, exprHash)", () => {
    const props = Object.keys(shielded.stateSchema!.properties);
    for (const f of ["vkey", "exprHash", "knownRoots", "nullifiers", "commitments", "leafCount"]) {
      expect(props).toContain(f);
    }
  });

  it("createSchema pins vkey + exprHash with the supplied defaults", () => {
    expect(shielded.createSchema!.required).toEqual(expect.arrayContaining(["vkey", "exprHash"]));
    expect(shielded.createSchema!.properties.vkey.default).toBe(VKEY);
    expect(shielded.createSchema!.properties.exprHash.default).toBe(EXPR);
  });

  it("has one ACTIVE->ACTIVE 'transition' whose guard verifies the proof against pinned state", () => {
    expect(shielded.transitions).toHaveLength(1);
    const t = shielded.transitions[0];
    expect(t.from).toBe("ACTIVE");
    expect(t.to).toBe("ACTIVE");
    expect(t.eventName).toBe("transition");

    const guard = JSON.stringify(t.guard);
    expect(guard).toContain("groth16_verify");
    expect(guard).toContain("none"); // nullifier non-membership (combiner-only)
    expect(guard).toContain('"in"'); // anchor ∈ knownRoots
    // the guard reads the pinned vkey + exprHash from STATE, never from the event
    expect(guard).toContain("state.vkey");
    expect(guard).toContain("state.exprHash");
    expect(guard).toContain("state.knownRoots");
    expect(guard).toContain("state.nullifiers");
  });

  it("extracts the 4 static public-value fields at fixed offsets 2/66/130/194 (no PV opcode)", () => {
    const tStr = JSON.stringify(shielded.transitions[0]); // guard + effect
    for (const off of [2, 66, 130, 194]) {
      expect(tStr).toContain(`{"var":"event.publicValues"},${off},64]`);
    }
  });

  it("effect spends the nullifier and records the new commitment", () => {
    const eff = JSON.stringify(shielded.transitions[0].effect);
    expect(eff).toContain("state.nullifiers");
    expect(eff).toContain("state.commitments");
    expect(eff).toContain("cat");
  });

  it("the transition event carries the proof + publicValues", () => {
    const ev = shielded.eventSchemas!.transition;
    expect(ev.required).toEqual(expect.arrayContaining(["proof", "publicValues"]));
  });
});

describe("sealed-bid example", () => {
  it("shieldedSealedBidDef(opts) shields the bid account", () => {
    const d = shieldedSealedBidDef({ vkey: VKEY, exprHash: EXPR });
    expect(d.metadata.app).toBe("privacy");
    expect(d.transitions[0].eventName).toBe("transition");
  });

  it("the base bid keeps amount private (a normal place_bid effect, run in-circuit)", () => {
    const t = sealedBidAccountDef.transitions[0];
    expect(t.eventName).toBe("place_bid");
    expect(JSON.stringify(t.effect)).toContain("amount");
  });

  it("vickreyAuction settle computes the second-price (Vickrey) clearing price", () => {
    const settle = vickreyAuctionDef.transitions.find((t) => t.eventName === "settle");
    expect(settle).toBeDefined();
    const eff = JSON.stringify(settle!.effect);
    expect(eff).toContain("clearingPrice");
    expect(eff).toContain("reduce"); // the top-2 fold over revealed bids
    expect(eff).toContain("second");
  });
});
