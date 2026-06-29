import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  triggers,
  spawn,
  emit,
  toFiber,
  toWallet,
  transferAsset,
  RESERVED_EFFECT_KEYS,
} from "../../src/schema/effects";

// The acceptance oracle: the chain-accepted riverdale golden definition (green lane). Effects are FLAT
// maps mixing `_`-directives with state-update fields; we deep-equal our builders against the exact
// `_triggers` / `_spawn` fragments the chain re-derives. Vendored fixture (see fixtures README).
const consumerDef = JSON.parse(
  readFileSync(
    resolve(
      __dirname,
      "../fixtures/riverdale-economy/consumer.definition.json",
    ),
    "utf-8",
  ),
) as {
  transitions: { eventName: string; effect: Record<string, unknown> }[];
};

const byEvent = (name: string) =>
  consumerDef.transitions.find((t) => t.eventName === name) ??
  (() => {
    throw new Error(`no transition for ${name}`);
  })();

describe("schema/effects — reserved EFFECT directives match the riverdale green-lane canonical", () => {
  it("triggers() projects {target,event,payload} → {targetMachineId,eventName,payload}, matching the `buy` transition", () => {
    const buy = byEvent("buy"); // transition index 1
    const built = triggers([
      {
        target: { var: "event.retailerId" },
        event: "process_sale",
        payload: {
          buyerId: { var: "machineId" },
          quantity: { var: "event.quantity" },
          goodsAssetId: { var: "event.goodsAssetId" },
        },
      },
    ]);
    expect(built).toEqual({
      _triggers: [(buy.effect as { _triggers: unknown[] })._triggers[0]],
    });
  });

  it("triggers() defaults an omitted payload to {} (never null)", () => {
    expect(triggers([{ target: "m1", event: "ping" }])).toEqual({
      _triggers: [{ targetMachineId: "m1", eventName: "ping", payload: {} }],
    });
  });

  it("spawn() wraps {childId,definition,initialData,owners} under _spawn, matching the `list_item` transition", () => {
    const listItem = byEvent("list_item"); // transition index 4
    const goldenSpawn = (
      listItem.effect as { _spawn: { definition: unknown }[] }
    )._spawn;

    const built = spawn([
      {
        // small leaf fields transcribed by hand (the real proof); the bulky child definition is the
        // literal ProtoStateMachineDefinition the chain reads from the effect EXPRESSION.
        childId: { var: "event.auctionId" },
        definition: goldenSpawn[0].definition as never,
        initialData: {
          reservePrice: { var: "event.reservePrice" },
          itemName: { var: "event.itemName" },
          sellerId: { var: "machineId" },
          highestBid: 0,
          status: "listed",
        },
        owners: { var: "event.auctionOwners" },
      },
    ]);
    expect(built).toEqual({ _spawn: goldenSpawn });
  });

  it("emit() passes events through under _emit and omits an absent destination", () => {
    const built = emit([
      { name: "sale_completed", data: { var: "state.highestBid" } },
    ]);
    expect(built).toEqual({
      _emit: [{ name: "sale_completed", data: { var: "state.highestBid" } }],
    });
    expect(
      (built as { _emit: Record<string, unknown>[] })._emit[0],
    ).not.toHaveProperty("destination");
  });

  it("emit() preserves an explicit destination", () => {
    expect(emit([{ name: "pinged", data: 1, destination: "fiber-1" }])).toEqual(
      {
        _emit: [{ name: "pinged", data: 1, destination: "fiber-1" }],
      },
    );
  });

  // Cross-language PIN: these MUST match the chain's reserved directive vocabulary — the `FiberDirective`
  // enum / `ReservedKeys.directiveKeys` (ottochain). The SDK can't import the Scala enum, so this golden is
  // the drift guard: if the chain adds/renames a directive, update both in lockstep. (A directive the chain
  // does not recognise is silently stripped from the effect, never executed — so drift fails silently.)
  it("RESERVED_EFFECT_KEYS exactly matches the chain's reserved directive keys (FiberDirective)", () => {
    const chainDirectives = [
      "_triggers",
      "_spawn",
      "_scriptCall",
      "_emit",
      "_transferAsset",
      "_addDependency",
      "_setDependencyActive",
    ];
    expect([...RESERVED_EFFECT_KEYS].sort()).toEqual(
      [...chainDirectives].sort(),
    );
  });

  it("toFiber / toWallet build the canonical AssetHolder object form", () => {
    const fiberId = { var: "event.retailerId" };
    const addr = "0xb0b";
    expect(toFiber(fiberId)).toEqual({ Fiber: { fiberId } });
    expect(toWallet(addr)).toEqual({ Wallet: { address: addr } });
    // the holder object rides through transferAsset unchanged
    expect(
      transferAsset([{ assetId: { var: "a" }, recipient: toFiber(fiberId) }]),
    ).toEqual({
      _transferAsset: [
        { assetId: { var: "a" }, recipient: { Fiber: { fiberId } } },
      ],
    });
  });

  it("builders are pure — identical input yields identical output", () => {
    const input = [{ target: "m", event: "e", payload: { x: 1 } }];
    expect(triggers(input)).toEqual(triggers(input));
    expect(emit([{ name: "n", data: 1 }])).toEqual(
      emit([{ name: "n", data: 1 }]),
    );
  });
});
