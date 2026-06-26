/**
 * Asset-policy preset builders (§1.1 of the SDK std-lib/templates handoff).
 *
 * Each builder is a PURE function that emits the exact {@link CreateAssetPolicy} wire body the chain
 * re-derives — no `Date.now()`/`Math.random()`/`crypto.randomUUID()`; fixed inputs → fixed output. The
 * on-chain policy `schemaHash` and `logicHash` are both `RegistryShape.AssetPolicy.computeDigest` over
 * `behavior`/`supply`/`morphisms`/`stateShape` (no JSON-Logic body), so these presets are pure data.
 *
 * Hard invariants (CLAUDE.md rule #1 — the signed canonical is frozen):
 *  - `behavior` is ALWAYS summed from {@link TOKEN_BEHAVIOR_BITS} (T=16, S=8, C=4, E=2, G=1), never a
 *    magic literal int.
 *  - `morphisms` is REQUIRED on the wire (presence required, emptiness meaningful) — emit `{}` when empty,
 *    NEVER omit it.
 *  - `supply` is REQUIRED — emit `{}` when there is no supply authority, never omit it.
 *  - Absent optionals are OMITTED, never emitted as `null`/`undefined` (the chain signs over
 *    `JCS(dropNulls(payload))`).
 *
 * @see src/ottochain/types.ts — CreateAssetPolicy, SupplyPolicy, MorphismSpec, MorphismKind, TOKEN_BEHAVIOR_BITS
 */
import {
  TOKEN_BEHAVIOR_BITS,
  type CreateAssetPolicy,
  type JsonLogicExpression,
  type MessageShape,
  type MorphismKind,
  type MorphismSpec,
  type SupplyPolicy,
} from '../ottochain/types.js';

/** A behavior-bit NAME (a key of {@link TOKEN_BEHAVIOR_BITS}) — the only legal way to spell `behavior`. */
export type BehaviorBitName = keyof typeof TOKEN_BEHAVIOR_BITS;

/** The default mint/burn guard the riverdale presets use: an always-true predicate `{"==":[1,1]}`. */
const alwaysTrue = (): JsonLogicExpression => ({ '==': [1, 1] });

/** A `PUBLIC`-visibility morphism spec (the riverdale preset visibility). Fresh object per call. */
const publicMorphism = (): MorphismSpec => ({ visibility: 'PUBLIC' });

/** Sum behavior bits from their NAMES — never a magic literal int (CLAUDE.md #1). */
export function sumBehavior(bits: readonly BehaviorBitName[]): number {
  return bits.reduce((acc, name) => acc + TOKEN_BEHAVIOR_BITS[name], 0);
}

/**
 * Derive the default `stateShape.typeName`: strip a trailing `.asset` label, PascalCase the remainder
 * (splitting on `.`/`-`/`_`/space), then append `State`.
 *   `rvd.asset` → `RvdState`, `goods.asset` → `GoodsState`, `capped.asset` → `CappedState`.
 */
export function defaultStateTypeName(name: string): string {
  const ASSET_SUFFIX = '.asset';
  const base = name.endsWith(ASSET_SUFFIX) ? name.slice(0, -ASSET_SUFFIX.length) : name;
  const pascal = base
    .split(/[.\-_\s]+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
  return `${pascal}State`;
}

/** Build a {@link SupplyPolicy}, OMITTING every absent field (no `undefined`/`null` keys). */
function buildSupply(opts: {
  maxSupply?: number;
  mintPolicy?: JsonLogicExpression;
  burnPolicy?: JsonLogicExpression;
  decimals?: number;
}): SupplyPolicy {
  const supply: SupplyPolicy = {};
  if (opts.maxSupply !== undefined) supply.maxSupply = opts.maxSupply;
  if (opts.mintPolicy !== undefined) supply.mintPolicy = opts.mintPolicy;
  if (opts.burnPolicy !== undefined) supply.burnPolicy = opts.burnPolicy;
  if (opts.decimals !== undefined) supply.decimals = opts.decimals;
  return supply;
}

/** Assemble the final {@link CreateAssetPolicy}, attaching `metadata` only when present. */
function assemble(args: {
  name: string;
  version: string;
  behavior: number;
  supply: SupplyPolicy;
  morphisms: Record<string, MorphismSpec>;
  stateTypeName?: string;
  metadata?: Record<string, string>;
}): CreateAssetPolicy {
  const stateShape: MessageShape = {
    typeName: args.stateTypeName ?? defaultStateTypeName(args.name),
    fields: [],
  };
  const policy: CreateAssetPolicy = {
    name: args.name,
    version: args.version,
    behavior: args.behavior,
    supply: args.supply,
    morphisms: args.morphisms,
    stateShape,
  };
  if (args.metadata !== undefined) policy.metadata = args.metadata;
  return policy;
}

/**
 * Fungible currency. Behavior `T|S|C = 28` (transferable + splittable + combinable). Standard morphism
 * set TRANSFER + FRACTIONALIZE + STAKE (`stakeable`, default true) + BURN (when `burnable`), all PUBLIC.
 *
 * Reproduces `riverdale-economy/rvd-policy.json` exactly via
 * `fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true })`.
 */
export function fungiblePolicy(p: {
  /** Registry name; conventionally ends `.asset`. */
  name: string;
  /** SemVer string. */
  version: string;
  /** `supply.decimals` — fractional precision; omit for whole-unit. */
  decimals?: number;
  /** `supply.maxSupply` — omit ⇒ uncapped. */
  maxSupply?: number;
  /** true ⇒ `supply.mintPolicy = {"==":[1,1]}` (open mint). */
  mintable?: boolean;
  /** true ⇒ `supply.burnPolicy = {"==":[1,1]}` AND a BURN morphism. */
  burnable?: boolean;
  /** JSON-Logic predicate that OVERRIDES `mintable`'s default mint guard (and enables minting). */
  mintGuard?: JsonLogicExpression;
  /** default true ⇒ a STAKE morphism. */
  stakeable?: boolean;
  /** `stateShape.typeName`; default `${PascalCase(name-without-.asset)}State`. */
  stateTypeName?: string;
  /** Off-chain links grab-bag; omitted when absent. */
  metadata?: Record<string, string>;
}): CreateAssetPolicy {
  const behavior = sumBehavior(['transferable', 'splittable', 'combinable']); // 28

  const morphisms: Record<string, MorphismSpec> = {
    TRANSFER: publicMorphism(),
    FRACTIONALIZE: publicMorphism(),
  };
  if (p.stakeable !== false) morphisms.STAKE = publicMorphism();
  if (p.burnable) morphisms.BURN = publicMorphism();

  let mintPolicy: JsonLogicExpression | undefined;
  if (p.mintGuard !== undefined) mintPolicy = p.mintGuard;
  else if (p.mintable) mintPolicy = alwaysTrue();

  const supply = buildSupply({
    maxSupply: p.maxSupply,
    mintPolicy,
    burnPolicy: p.burnable ? alwaysTrue() : undefined,
    decimals: p.decimals,
  });

  return assemble({
    name: p.name,
    version: p.version,
    behavior,
    supply,
    morphisms,
    stateTypeName: p.stateTypeName,
    metadata: p.metadata,
  });
}

/**
 * Non-fungible token. Behavior `T = 16`, or `T|C = 20` with `combinable: true` (the riverdale
 * `goods.asset`); `transferable: false` drops the T bit (a bound collectible). `morphisms` is `{}` by
 * default (emitted explicitly, never omitted). Mintable by default ⇒ `supply.mintPolicy = {"==":[1,1]}`.
 *
 * Reproduces `riverdale-economy/goods-policy.json` exactly via
 * `nftPolicy({ name: 'goods.asset', version: '1.0.0', combinable: true })`.
 */
export function nftPolicy(p: {
  name: string;
  version: string;
  /** `T(16)` → `T|C(20)`. */
  combinable?: boolean;
  /** default true; false ⇒ drop the T bit (bound collectible: `0`, or `4` with `combinable`). */
  transferable?: boolean;
  /** default true ⇒ `supply.mintPolicy = {"==":[1,1]}`. */
  mintable?: boolean;
  /** JSON-Logic predicate that OVERRIDES the default mint guard. */
  mintGuard?: JsonLogicExpression;
  /** `supply.maxSupply` — omit ⇒ uncapped edition. */
  maxSupply?: number;
  /** `stateShape.typeName`; default `${PascalCase(name-without-.asset)}State`. */
  stateTypeName?: string;
  metadata?: Record<string, string>;
}): CreateAssetPolicy {
  const bits: BehaviorBitName[] = [];
  if (p.transferable !== false) bits.push('transferable');
  if (p.combinable) bits.push('combinable');
  const behavior = sumBehavior(bits);

  let mintPolicy: JsonLogicExpression | undefined;
  if (p.mintGuard !== undefined) mintPolicy = p.mintGuard;
  else if (p.mintable !== false) mintPolicy = alwaysTrue();

  const supply = buildSupply({ maxSupply: p.maxSupply, mintPolicy });

  return assemble({
    name: p.name,
    version: p.version,
    behavior,
    supply,
    morphisms: {},
    stateTypeName: p.stateTypeName,
    metadata: p.metadata,
  });
}

/**
 * Soulbound token: non-transferable, governable only (`G = 1`; `+E = 3` when `expirable`). No TRANSFER
 * morphism (`morphisms: {}`); minting is closed after issue (empty `supply`).
 */
export function soulboundPolicy(p: {
  name: string;
  version: string;
  /** `+E(2)` ⇒ behavior `3`. */
  expirable?: boolean;
  /** `stateShape.typeName`; default `${PascalCase(name-without-.asset)}State`. */
  stateTypeName?: string;
  metadata?: Record<string, string>;
}): CreateAssetPolicy {
  const bits: BehaviorBitName[] = ['governable'];
  if (p.expirable) bits.push('expirable');
  const behavior = sumBehavior(bits);

  return assemble({
    name: p.name,
    version: p.version,
    behavior,
    supply: buildSupply({}), // mint closed after issue
    morphisms: {}, // non-transferable: no TRANSFER morphism
    stateTypeName: p.stateTypeName,
    metadata: p.metadata,
  });
}

/**
 * Escape hatch: declare `behavior` by NAME (summed from {@link TOKEN_BEHAVIOR_BITS}, never a magic int)
 * and pass `supply` + `morphisms` through raw. Use when no preset fits.
 *
 * Reproduces `riverdale-economy/capped-policy.json` exactly via
 * `customPolicy({ name: 'capped.asset', version: '1.0.0',
 *                 behavior: ['transferable', 'splittable', 'combinable'],
 *                 supply: { maxSupply: 100, mintPolicy: { '==': [1, 1] } }, morphisms: {} })`.
 */
export function customPolicy(p: {
  name: string;
  version: string;
  /** Behavior-bit NAMES summed to the int (e.g. `['transferable','combinable']` ⇒ 20). Never a literal. */
  behavior: readonly BehaviorBitName[];
  /** Raw supply authority, passed through verbatim. */
  supply: SupplyPolicy;
  /** Raw morphism map, passed through verbatim (emit `{}` when empty, never omit). */
  morphisms: Partial<Record<MorphismKind, MorphismSpec>>;
  /** `stateShape.typeName`; default `${PascalCase(name-without-.asset)}State`. */
  stateTypeName?: string;
  metadata?: Record<string, string>;
}): CreateAssetPolicy {
  return assemble({
    name: p.name,
    version: p.version,
    behavior: sumBehavior(p.behavior),
    supply: p.supply,
    morphisms: p.morphisms as Record<string, MorphismSpec>,
    stateTypeName: p.stateTypeName,
    metadata: p.metadata,
  });
}
