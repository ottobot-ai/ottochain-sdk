# `@ottochain/sdk/zk` — The Semi‑Private Tier SDK Slice

*Public readable rules, a hidden value, bound by a commitment + a zk‑jlvm proof, settled through one witness‑gated guard. A concrete TypeScript API.*

Status: design / spec. Grounded against shipped source in `ottochain-sdk`, `metakit-sdk`, and `ottochain`. This specifies the **semi‑private** tier of `docs/design/client-side-private-data.md` only — public rules, a client‑held value, proven over a commitment. It is buildable today on shipped crypto **once the `proverPreimage` glue (the §3.0 determinism fix) lands**. Every claim below is annotated with the file it was confirmed against.

> **Three corrections this spec makes to the parent design doc**, found by reading the on‑chain guard machinery (`ZkGatedMorphismSuite.scala`) rather than assuming:
> 1. **`groth16_verify` argument order is `[vkey, publicValues, proof]`** — *not* `[proof, publicValues, vkey]`. (`/home/euler/repos/ottochain/modules/shared-data/src/test/scala/xyz/kd5ujc/shared_data/ZkGatedMorphismSuite.scala:131‑139`.) The design doc §3.1 example has these reversed.
> 2. **`witness.publicValues` is an *opaque ABI‑encoded hex blob*, not a JSON object.** The guard cannot read `{"var":"witness.publicValues.exprHash"}` today — that path does not exist on‑chain. The blob is the alloy `abi_encode(JlvmPublicValues{bytes32,bytes32,bytes32,bool})`. Binding `exprHash == logicHash` requires either decoding the blob on‑chain (an unbuilt opcode) or surfacing it as a separate witness field the SDK populates and the guard re‑hashes. This spec recommends the latter and flags it honestly.
> 3. **There are two on‑wire field encodings.** JLVM crypto opcodes (`pmt_verify`, `poseidon`, `groth16_verify`) take **lowercase `0x` big‑endian hex** (`hex-bytes.ts`). The zk‑shielded prover's *wire witness* takes **base‑10 decimal strings** (`wire.rs` `BigUint::parse_bytes(.., 10)`). The SDK's `commit`/`witness` layer must keep these straight; mixing them is a silent‑failure class.

---

## 0. Module layout

A new tree‑shakeable subpath `@ottochain/sdk/zk`, alongside the existing `.`, `./core`, `./metakit`, `./apps/*` (keep the `exports` map in `package.json` in sync — `docs/signing-and-publishing.md` §"Subpath exports").

```
src/zk/
  preimage.ts     // THE one canonical path: proverPreimage = keccak256(JCS(dropNulls(x)))
  commit.ts       // Fr encoding + poseidonCommit + note commitments + salt mgmt
  witness.ts      // builders for the `witness` context object (pmt / sigma / groth16)
  prover.ts       // Prover interface + SubprocessProver (recommended) + ServiceProver
  registry.ts     // exprHash registry: published rule  ->  exprHash (the §3.1 "pin the bound" pattern)
  semi-private.ts // the end-to-end orchestrator: preExecute -> commit -> prove -> sign -> submit
  types.ts        // Groth16Bundle, JlvmPublicValues (TS mirror), WitnessPayload, ...
  index.ts        // re-exports
```

Dependencies are already in the tree (confirmed in `ottochain-sdk/package.json` and the resolved `@constellation-network/metagraph-sdk@0.2.0`):

- **RFC 8785 / JCS** — the `canonicalize` npm package (`^3.0.0`), wrapped and re‑exported by `@constellation-network/metagraph-sdk` as `canonicalize(data)` (throws if unserializable). `ottochain-sdk/src/index.ts:22` does `export * from '@constellation-network/metagraph-sdk'`, so `canonicalize` is already reachable.
- **keccak256** — `@noble/hashes/sha3` exports `keccak_256` (transitively present via metagraph‑sdk → `@noble/hashes ^2.0.1`). This is the same keccak the zk‑jlvm guest uses (`alloy_primitives::keccak256`, `zk-jlvm/program/src/main.rs:18`).
- **Poseidon / Merkle / Fr** — import directly from metakit's TS (`@ottochain/sdk/metakit` re‑exports `poseidon.ts` / `hex-bytes.ts`). **Never reimplement Poseidon** — the hard acceptance vector `poseidon([1,2]) == 0x115cc0…7189a` is the cross‑language lock (`poseidon.ts:18`).

---

## 1. The one canonical path (`preimage.ts`) — the §3.0 fix

This is the single most important file in the slice. The parent doc's "dominant failure source" (§3.0): **signing** hashes `JCS(dropNulls(payload))` (`src/signing.ts` → `dropNulls` then metagraph‑sdk's RFC‑8785), but **zk‑jlvm** hashes the **raw bytes the prover was handed** (`keccak256(expr_json.as_bytes())`, `keccak256(data_json.as_bytes())` — `zk-jlvm/program/src/main.rs:18‑19`; only the *output* is canonicalized, line 22). A payload that is signed and *also* proven binds two different byte strings → the opaque empty‑body `InvalidSignature` 400 (`docs/signing-and-publishing.md`).

The fix is to force **one** canonical step that *both* the signer and the prover‑feed share, so the bytes are identical. As of **metakit-sdk `1.8.x`** that step *is* its exported `canonicalize` — which now drops null object-fields internally (`serializeJcs(dropNullFields(x))`, server-aligned) — so there is nothing extra to add:

```ts
// src/zk/preimage.ts
import { canonicalize } from '@constellation-network/metagraph-sdk'; // 1.8.x: JCS ∘ dropNullFields
import { keccak_256 } from '@noble/hashes/sha3';

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

/**
 * THE single canonical step. `canonicalForSigning(x)` is the EXACT canonical string the chain signs
 * over (metakit-sdk `canonicalize` = JCS ∘ dropNullFields), so feeding the prover this same string
 * makes the zk-jlvm keccak preimage equal the signature preimage.
 *
 * VERSION NOTE: on metagraph-sdk `0.2.0` (the current pin) `canonicalize` does NOT drop nulls, so
 * there this is `canonicalize(dropNulls(x))` (import `dropNulls` from '../ottochain/drop-nulls.js').
 * On the `1.8.x` bump it collapses to `canonicalize(x)` and the SDK's manual dropNulls — here and in
 * signing.ts — goes away.
 */
export function canonicalForSigning(x: unknown): string {
  return canonicalize(x);                   // metakit-sdk 1.8.x drops nulls internally
}

/** keccak256 of the canonical bytes — the value zk-jlvm commits as exprHash / dataHash. */
export function proverPreimage(x: unknown): `0x${string}` {
  return `0x${Buffer.from(keccak_256(utf8(canonicalForSigning(x)))).toString('hex')}`;
}

/** exprHash for a published JLVM RULE (the expression itself, canonicalized + keccak'd). */
export const exprHash = (rule: unknown): `0x${string}` => proverPreimage(rule);

/** dataHash for a private data context (canonicalized + keccak'd) — kept private; only its hash is public. */
export const dataHash = (data: unknown): `0x${string}` => proverPreimage(data);
```

**The load‑bearing discipline: the prover must be fed `canonicalForSigning(x)`, never `JSON.stringify(x)`.** Because the guest keccaks the raw bytes it receives, the *only* way `guest.exprHash === exprHash(rule)` holds is if the host writes `stdin.write(&canonical_string)` with the **identical** string this TS produced. The `prover.ts` drivers (§4) enforce this — they accept *already‑canonical strings*, not objects.

```ts
// what the SubprocessProver receives — already canonical, no re-stringify allowed:
const exprCanon = canonicalForSigning(RULE);   //  "{\">=\":[{\"var\":\"amount\"},50]}"
const dataCanon = canonicalForSigning(data);   //  "{\"amount\":100}"
await prover.proveJlvm(exprCanon, dataCanon);  //  host does stdin.write(exprCanon); stdin.write(dataCanon)
```

### The chain‑required‑defaulted‑field rule (TS types)

`docs/signing-and-publishing.md` §rule 2: the chain's decoder **re‑fills omitted defaulted‑required fields**, and `dropNulls` removes `null` but *not* `false`/`0`/`{}`/`[]`. So a payload that omits such a field canonicalizes differently from the chain's recomputed preimage → `InvalidSignature`. The shipped signing types already encode this (`repeated: boolean`, not `repeated?: boolean`). **The zk types must do the same.** Concretely, any private‑data event type fed through `proverPreimage` makes defaulted‑required fields non‑optional:

```ts
// src/zk/types.ts — defaulted-required fields are REQUIRED (mirrors the signing types)
export interface SubmitBidEvent {
  eventName: 'submitBid';
  commitment: `0x${string}`;     // 32-byte Fr hex
  // witness rides under its own key (below); these are the chain-defaulted-required fields:
  repeated: boolean;             // NOT repeated?: — chain re-fills it, so omission diverges
  // ... any other FieldShape-style defaulted-required fields, all non-optional
}
```

A property/fuzz test (Phase 0 of the roadmap) should round‑trip `canonicalForSigning` against the actual signer over: explicit `null`s, array `null`s, hex casing, leading‑zero Fr, `0`/`false`/`{}` — the `InvalidSignature` pre‑empt suite.

---

## 2. Commitment builders (`commit.ts`)

The *only* file that encodes Fr / builds commitments. It imports metakit's Poseidon and Fr codecs directly (the field orders that match the Rust/Scala circuits) and never re‑derives them.

```ts
// src/zk/commit.ts
import { poseidonHash, R, MAX_INPUTS } from '@ottochain/sdk/metakit'; // poseidon.ts
import { encodeFr, FR_MODULUS } from '@ottochain/sdk/metakit';        // hex-bytes.ts
import { randomBytes } from '@noble/hashes/utils';

export type FrHex = `0x${string}`;   // lowercase, 0x, 32-byte big-endian (the JLVM-opcode encoding)

// R === FR_MODULUS === 21888242871839275222246405745257275088548364400416034343698204186575808495617
// (poseidon.ts:30, hex-bytes.ts:32 — same constant, asserted equal at module load)

/** Reduce an arbitrary bigint into a canonical BN254 Fr element [0, R). */
export const toFr = (x: bigint): bigint => ((x % R) + R) % R;

/**
 * Fresh random salt as a canonical Fr (rejection-sampled into [0, R)).
 * 32 random bytes, reduced — the salt blinds the commitment so cm reveals nothing.
 */
export function randomSalt(): bigint {
  // rejection-sample to avoid modulo bias near R
  for (;;) {
    const v = bytesToBig(randomBytes(32));
    if (v < FR_MODULUS) return v;
  }
}
const bytesToBig = (b: Uint8Array): bigint => b.reduce((a, x) => (a << 8n) | BigInt(x), 0n);

/**
 * Poseidon value commitment: cm = Poseidon([fieldFr, saltFr]).
 * Width t=3 (2 inputs). Returns the 32-byte 0x hex the pmt_verify / guard opcodes expect.
 * This is the commitment for an arithmetic/range-checked VALUE field (a bid, a score).
 */
export function poseidonCommit(fieldFr: bigint, saltFr: bigint): FrHex {
  const cm = poseidonHash([toFr(fieldFr), toFr(saltFr)]); // poseidon.ts, canonical-input checked
  return encodeFr(cm) as FrHex;                            // 0x + 64 lowercase hex (hex-bytes.ts:140)
}

/** Multi-field value commitment (e.g. {amount, expiry}) — Poseidon supports up to MAX_INPUTS=4. */
export function poseidonCommitN(fields: bigint[], saltFr: bigint): FrHex {
  const inputs = [...fields.map(toFr), toFr(saltFr)];
  if (inputs.length > MAX_INPUTS)                          // poseidon.ts:33 (MAX_WIDTH-1)
    throw new Error(`poseidonCommitN: at most ${MAX_INPUTS} inputs incl. salt`);
  return encodeFr(poseidonHash(inputs)) as FrHex;
}
```

### Note‑style commitments (for the asset / shielded‑value path)

The shipped shielded circuit fixes these field orders **structurally in‑circuit** (`zk-shielded/lib/src/lib.rs:51‑72`): `Note{value:u64, owner, asset, rho}`, `cm = Poseidon([value, owner, asset, rho])` (width t=5), `nf = Poseidon([rho, nsk])`, `owner = Poseidon([nsk])`. The TS builders mirror them exactly:

```ts
// src/zk/commit.ts (continued) — note primitives, field orders pinned to zk-shielded/lib/src/lib.rs
export interface Note { value: bigint; owner: bigint; asset: bigint; rho: bigint; } // value < 2^64

export const ownerFromNsk   = (nsk: bigint): FrHex => encodeFr(poseidonHash([toFr(nsk)])) as FrHex;
export const noteCommitment = (n: Note): FrHex =>
  encodeFr(poseidonHash([toFr(n.value), toFr(n.owner), toFr(n.asset), toFr(n.rho)])) as FrHex;
export const nullifier      = (rho: bigint, nsk: bigint): FrHex =>
  encodeFr(poseidonHash([toFr(rho), toFr(nsk)])) as FrHex;
```

> **u64 range is by *type*, not by *proof*.** `note.value: u64` zero‑extends into Fr (`< 2^64 ≪ R`); there is no bit‑decomposition range gadget. For a semi‑private *value* (a sealed bid), prefer either the dedicated shielded circuit (in‑circuit range + conservation) or the §5 "pin the bound into `exprHash`" pattern. The TS builder must assert `0n ≤ value < 2n**64n` before committing, to fail fast rather than ship a non‑conserving witness.

### Salt management

Salts are the client's secret opening material and live in the caller's store (the parent doc's `PrivateStore`; out of scope for this slice, but the contract is): **one fresh `randomSalt()` per committed field, persisted alongside the cleartext value.** A `Commitment` record bundles them so reveal/disclosure (§6) can recompute:

```ts
export interface Commitment {
  cm: FrHex;                 // the 32-byte commitment published on-chain
  scheme: 'poseidon' | 'note';
  opening: { fields: bigint[]; salt: bigint } | { note: Note }; // CLIENT-HELD, never published
}
export const openPoseidon = (fields: bigint[], salt = randomSalt()): Commitment =>
  ({ cm: poseidonCommitN(fields, salt), scheme: 'poseidon', opening: { fields, salt } });
```

---

## 3. Witness builders (`witness.ts`)

The guard reads a reserved context key `witness` (injected by `AssetCombiner.morphismContext` / `mintContext` as `"witness" -> op.witness.getOrElse(NullValue)` — `/home/euler/repos/ottochain/modules/shared-data/.../AssetCombiner.scala:1023‑1075`). The on‑chain `ApplyMorphism`/`MintAsset` carry `witness: Option[JsonLogicValue]` (`Updates.scala:270‑319`). These builders construct the exact JSON shape each opcode expects, **with the field encodings the Scala suite actually exercises**.

```ts
// src/zk/witness.ts
import type { FrHex } from './commit.js';

/** pmt_verify witness — fields exactly as ZkGatedMorphismSuite.merkleWitness (lines 94-103). */
export interface PmtWitness {
  leaf: FrHex;            // 0x 32-byte Fr  (StrValue(fr(leaf)))
  index: number | bigint; // tree position (IntValue)
  siblings: FrHex[];      // 0x 32-byte Fr each (ArrayValue of StrValue)
}
export const pmtWitness = (leaf: FrHex, index: bigint, siblings: FrHex[]): PmtWitness =>
  ({ leaf, index, siblings });

/** sigma_verify witness — {proof, message}, per SigmaGatedMorphismSuite (lines 114-116). */
export interface SigmaWitness { proof: unknown; message: `0x${string}`; } // proof is the recursive Σ tree
export const sigmaWitness = (proof: unknown, messageHex: `0x${string}`): SigmaWitness =>
  ({ proof, message: messageHex });

/**
 * groth16_verify witness — {publicValues, proof}, per ZkGatedMorphismSuite (lines 141-148).
 * CRITICAL: publicValues is the OPAQUE alloy-abi-encoded JlvmPublicValues blob as ONE hex
 * string. It is NOT a JSON object — the guard passes it verbatim to groth16_verify. The
 * decoded {exprHash,dataHash,outputHash,ok} are NOT individually readable on-chain today.
 */
export interface Groth16Witness {
  publicValues: `0x${string}`; // abi_encode(JlvmPublicValues{bytes32 exprHash, bytes32 dataHash, bytes32 outputHash, bool ok})
  proof: `0x${string}`;        // SP1 Groth16 proof bytes
  // SDK-side convenience for the §5 binding (populated by the SDK, re-hashed by an augmented guard):
  exprHash?: FrHex;            // surfaced separately so a guard CAN bind exprHash == logicHash
  outputHash?: FrHex;
  ok?: boolean;
}
export const groth16Witness = (b: { publicValues: `0x${string}`; proof: `0x${string}` } & Partial<DecodedPV>): Groth16Witness =>
  ({ ...b });
```

The guards these feed, **verbatim from the shipped suite** (note the argument order — this is the corrected order):

```jsonc
// pmt_verify — [root, leaf, index, siblings]   (ZkGatedMorphismSuite.scala:114-123)
{ "pmt_verify": [ "0x<root>", {"var":"witness.leaf"}, {"var":"witness.index"}, {"var":"witness.siblings"} ] }

// groth16_verify — [vkey, publicValues, proof]  (ZkGatedMorphismSuite.scala:131-139)  ← corrected order
{ "groth16_verify": [ "0x<VK_ROOT>", {"var":"witness.publicValues"}, {"var":"witness.proof"} ] }

// sigma_verify — [proposition, proof, message]  (SigmaGatedMorphismSuite.scala:143-149)
{ "sigma_verify": [ <propositionLiteral>, {"var":"witness.proof"}, {"var":"witness.message"} ] }
```

### Decoding `publicValues` client‑side (`types.ts`)

Because the blob is opaque on‑chain but the SDK *must* read `exprHash` to bind it to the registry (§5), the SDK decodes the alloy ABI layout (`JlvmPublicValues{bytes32,bytes32,bytes32,bool}` — `zk-jlvm/lib/src/lib.rs:3‑16`). The ABI head is four 32‑byte words (the `bool` right‑padded):

```ts
// src/zk/types.ts
export interface DecodedPV { exprHash: FrHex; dataHash: FrHex; outputHash: FrHex; ok: boolean; }

/** Decode abi_encode(JlvmPublicValues): 4 × 32-byte words [exprHash|dataHash|outputHash|ok]. */
export function decodeJlvmPublicValues(pv: `0x${string}`): DecodedPV {
  const b = pv.slice(2);
  const w = (i: number): FrHex => `0x${b.slice(i * 64, i * 64 + 64)}`;
  return { exprHash: w(0), dataHash: w(1), outputHash: w(2), ok: b.slice(3 * 64 + 62, 3 * 64 + 64) !== '00' };
}
```

---

## 4. Driving the prover (`prover.ts`)

SP1/Groth16 proof **generation is Rust‑only** — there is no in‑browser/TS SP1 prover (`zk-jlvm/script/src/main.rs` is the SP1 host; `SP1_PROVER=cuda` optional, CPU default). **TS never generates a proof.** The SDK *drives* the Rust host across a process/service boundary and feeds it the **canonical strings** from §1.

**Recommendation: `SubprocessProver` for Node/desktop is the default and the one to ship first.** It spawns the existing `zk-jlvm/script` binary in `--mode groth16`, keeps the witness inside the local trust boundary, and needs no network. `ServiceProver` (browser/mobile → a **self‑hosted** prover daemon) is the fallback, documented as *"a privacy boundary you run yourself — the witness contains your secrets; never a shared third party."* WASM SP1 is a future unlock, not v1.

```ts
// src/zk/prover.ts
import type { Groth16Witness } from './witness.js';

export interface Groth16Bundle {
  publicValues: `0x${string}`;  // hex of abi_encode(JlvmPublicValues) — host stdout "public values: 0x…"
  proof:        `0x${string}`;  // host stdout "proof bytes: 0x…"
  vkey:         `0x${string}`;  // host stdout "vkey: 0x…" (pk.verifying_key().bytes32())
}

export interface Prover {
  /** zk-jlvm: expr/data are ALREADY canonical strings (canonicalForSigning) — host keccaks them raw. */
  proveJlvm(exprCanonical: string, dataCanonical: string): Promise<Groth16Bundle>;
  /** zk-shielded: wire witness uses DECIMAL Fr strings (wire.rs), not hex. */
  proveShielded(wire: WireWitness): Promise<Groth16Bundle>;
}
```

### `SubprocessProver` (recommended)

The host CLI takes `--mode groth16 --expr <s> --data <s>` and prints `vkey`, `public values`, `proof bytes` (`zk-jlvm/script/src/main.rs:94‑114`). The `--expr`/`--data` are passed **verbatim** as `stdin.write(&args.expr)` (lines 50‑52), so what the SDK sends is exactly what gets keccak'd — *the canonical strings must be passed through unmodified*:

```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export class SubprocessProver implements Prover {
  constructor(private readonly opts: {
    jlvmBin: string;          // path to the built zk-jlvm/script binary
    shieldedBin?: string;     // path to zk-shielded/script binary
    cuda?: boolean;           // sets SP1_PROVER=cuda
    timeoutMs?: number;       // proofs are seconds-to-minutes — generous default
  }) {}

  async proveJlvm(exprCanonical: string, dataCanonical: string): Promise<Groth16Bundle> {
    const env = { ...process.env, ...(this.opts.cuda ? { SP1_PROVER: 'cuda' } : {}) };
    // expr/data passed as literal args -> stdin.write -> keccak256(bytes). DO NOT re-stringify.
    const { stdout } = await run(
      this.opts.jlvmBin,
      ['--mode', 'groth16', '--expr', exprCanonical, '--data', dataCanonical],
      { env, timeout: this.opts.timeoutMs ?? 600_000, maxBuffer: 64 * 1024 * 1024 },
    );
    return parseHostStdout(stdout); // greps "vkey:", "public values:", "proof bytes:"
  }

  async proveShielded(wire: WireWitness): Promise<Groth16Bundle> {
    if (!this.opts.shieldedBin) throw new Error('shieldedBin not configured');
    // zk-shielded host reads a --witness <file.json> of DECIMAL Fr strings (wire.rs / script main.rs:104).
    const path = await writeTempJson(toDecimalWire(wire)); // encode Fr as base-10, NOT hex
    try {
      const { stdout } = await run(this.opts.shieldedBin, ['--mode', 'groth16', '--witness', path],
        { timeout: this.opts.timeoutMs ?? 600_000, maxBuffer: 64 * 1024 * 1024 });
      return parseHostStdout(stdout);
    } finally { await rmTemp(path); }
  }
}

// host prints: "vkey:  0x..", "public values: 0x..", "proof bytes:   0x.." (script main.rs:109-114)
function parseHostStdout(s: string): Groth16Bundle {
  const grab = (label: RegExp) => (s.match(label)?.[1] ?? '') as `0x${string}`;
  const bundle = {
    vkey:         grab(/vkey:\s+(0x[0-9a-f]+)/),
    publicValues: grab(/public values:\s+(0x[0-9a-f]+)/),
    proof:        grab(/proof bytes:\s+(0x[0-9a-f]+)/),
  };
  if (!bundle.proof || !bundle.publicValues) throw new Error(`prover produced no proof:\n${s}`);
  return bundle;
}
```

### `ServiceProver` (fallback, self‑hosted)

```ts
export class ServiceProver implements Prover {
  constructor(private readonly endpoint: string, private readonly fetchFn = fetch) {}
  async proveJlvm(exprCanonical: string, dataCanonical: string): Promise<Groth16Bundle> {
    // POST the canonical strings to YOUR OWN prover daemon. The witness (data) is your secret.
    const r = await this.fetchFn(`${this.endpoint}/prove/jlvm`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expr: exprCanonical, data: dataCanonical }),
    });
    if (!r.ok) throw new Error(`prover service ${r.status}`);
    return (await r.json()) as Groth16Bundle;
  }
  async proveShielded(wire: WireWitness): Promise<Groth16Bundle> { /* POST toDecimalWire(wire) */ }
}
```

### The wire‑witness encoding bridge

The zk‑shielded host deserializes `WireWitness{anchor, inputs[], outputs[], fee}` where every Fr (`anchor`, `nsk`, `owner`, `asset`, `rho`, `position`, `siblings[]`) is a **base‑10 decimal string** (`wire.rs`, `BigUint::parse_bytes(s, 10)`). The SDK holds Fr as `bigint`, so the bridge is `x.toString(10)` — **not** `encodeFr` (which is hex):

```ts
// src/zk/prover.ts (continued)
export interface WireWitness {
  anchor: bigint; fee: bigint;
  inputs:  { note: Note; nsk: bigint; merkleProof: { position: bigint; siblings: bigint[] } }[];
  outputs: { note: Note }[];
}
const dec = (x: bigint) => x.toString(10);                 // base-10, matches BigUint::parse_bytes(.,10)
const decNote = (n: Note) => ({ value: Number(n.value), owner: dec(n.owner), asset: dec(n.asset), rho: dec(n.rho) });
export const toDecimalWire = (w: WireWitness) => ({
  anchor: dec(w.anchor), fee: Number(w.fee),
  inputs:  w.inputs.map(i => ({ note: decNote(i.note), nsk: dec(i.nsk),
            merkle_proof: { position: dec(i.merkleProof.position), siblings: i.merkleProof.siblings.map(dec) } })),
  outputs: w.outputs.map(o => ({ note: decNote(o.note) })),
});
```

---

## 5. End‑to‑end semi‑private flow + the "pin the bound" pattern (`semi-private.ts`, `registry.ts`)

The flow funnels through the same signing/submit tail as public, which is what makes "one contract, three disclosure levels" real:

```
pre-execute locally (TS JLVM, gas-accurate incl. groth16_verify=250k)
  -> build commitment (commit.ts)
  -> produce proof over the CANONICAL data (prover.ts; expr/data = canonicalForSigning)
  -> assemble event {commitment, ...} with {publicValues, proof} under `witness`
  -> sign via the canonical path (signing.ts: dropNulls then RFC8785 — the SAME bytes the prover keccak'd)
  -> submit
```

### The `exprHash` ⇄ `logicHash` binding, and pinning the bound

zk‑jlvm proves an **opaque keccak triple**; only `exprHash` carries meaning. A rule like *"bid ≥ minBid"* can only constrain the hidden value if **the bound is a literal baked into the expression**, so it lands inside `exprHash`. The registry maps published rules → their `exprHash` (which **equals the registry `logicHash`** because both are `keccak256(JCS(dropNulls(rule)))` — the §1 path):

```ts
// src/zk/registry.ts — the "pin the predicate into the expression" pattern (§3.1a)
import { exprHash as hashRule } from './preimage.js';

/** A published, legible rule whose ONLY free var is the secret; the bound is a LITERAL. */
export const minBidRule = (MIN_BID: number) => ({ '>=': [{ var: 'amount' }, MIN_BID] });

export class ExprRegistry {
  private byName = new Map<string, { rule: unknown; logicHash: `0x${string}` }>();
  /** Register a rule -> its exprHash; this IS the registry logicHash the guard binds to. */
  register(name: string, rule: unknown): `0x${string}` {
    const logicHash = hashRule(rule);     // keccak256(JCS(dropNulls(rule)))  == on-chain logicHash
    this.byName.set(name, { rule, logicHash });
    return logicHash;
  }
  logicHashOf(name: string): `0x${string}` { return this.byName.get(name)!.logicHash; }
}
// proof.ok==true  AND  proof.exprHash == logicHashOf('minBid')  ⇒  "hidden amount ≥ MIN_BID", value unrevealed.
```

### Honest note on the binding mechanism (the §2 correction in practice)

The clean guard the parent doc wrote — `{"==":[{"var":"witness.publicValues.exprHash"}, {"var":"$selfLogicHash"}]}` — **cannot run today**, because `witness.publicValues` is the opaque ABI blob, not an object with an `.exprHash` field. Two buildable resolutions, in preference order:

- **(A) Surface `exprHash` as a separate witness field the guard re‑checks.** The SDK puts the *decoded* `exprHash`/`outputHash`/`ok` (via `decodeJlvmPublicValues`) alongside the blob, and an **augmented guard template** binds those scalar fields while `groth16_verify` still consumes the blob. This needs the guard to *trust* that the surfaced scalars match the blob — which is exactly what an on‑chain decode would remove (see B). Until B lands, the surfaced fields are an SDK‑asserted convenience, and the *real* soundness comes from `groth16_verify` over the blob + the application pinning which `vkey` it accepts.
- **(B) Add an on‑chain `jlvm_pv_decode` accessor (small, recommended unlock).** A trivial opcode that splits the 4‑word blob so the guard can read `exprHash` directly and bind `== logicHash` with no trust gap. This is the clean form the parent doc assumed; flag it as the one‑opcode addition that makes the §3.1 binding exact.

The orchestrator, end to end:

```ts
// src/zk/semi-private.ts
import { jsonLogic } from '@ottochain/sdk/metakit';        // TS JLVM (pre-execution)
import { canonicalForSigning } from './preimage.js';
import { openPoseidon, type Commitment } from './commit.js';
import { groth16Witness } from './witness.js';
import { decodeJlvmPublicValues } from './types.js';
import { signDataUpdate } from '../signing.js';            // dropNulls ∘ RFC8785 — the SAME canonical path

export class SemiPrivate {
  constructor(private readonly deps: {
    prover: import('./prover.js').Prover;
    registry: import('./registry.js').ExprRegistry;
    submit: (signed: unknown) => Promise<{ ordinal: number }>;
    privateKey: string;
    vkRoot: `0x${string}`;       // the universal SP1 VK_ROOT the guard pins
  }) {}

  /**
   * Prove a hidden value satisfies a PUBLISHED rule, publish only its commitment + proof.
   * `ruleName` selects a registered rule whose bound is a literal (pinned into exprHash).
   */
  async provenTransition(args: {
    ruleName: string;            // e.g. 'minBid'  -> rule { ">=": [{var:'amount'}, 50] }
    secret: Record<string, unknown>;  // { amount: 100 }  (the witness; never published)
    eventName: string;
    extra?: Record<string, unknown>;  // any other defaulted-required event fields (non-optional)
  }) {
    const rule = this.deps.registry['byName'].get(args.ruleName)!.rule;

    // 1. PRE-EXECUTE locally (gas-accurate; the chain charges groth16_verify=250k on settle).
    const out = jsonLogic.apply(rule, args.secret);
    if (out !== true) throw new Error(`rule ${args.ruleName} is not satisfied by the secret; aborting`);

    // 2. COMMIT the value (Poseidon over the fixed Fr encoding) + keep the opening client-side.
    const amount = BigInt(args.secret.amount as number);
    const commitment: Commitment = openPoseidon([amount]);  // cm = Poseidon([amountFr, saltFr])

    // 3. PROVE over the CANONICAL bytes — identical to what the signer will sign.
    const exprCanon = canonicalForSigning(rule);            // bound is inside these bytes
    const dataCanon = canonicalForSigning(args.secret);     // amount stays private; only its hash is public
    const bundle = await this.deps.prover.proveJlvm(exprCanon, dataCanon);

    // 4. Sanity-bind locally before paying: exprHash must equal the registry logicHash.
    const pv = decodeJlvmPublicValues(bundle.publicValues);
    if (pv.exprHash !== this.deps.registry.logicHashOf(args.ruleName))
      throw new Error('exprHash != registry logicHash — wrong rule was proven');
    if (!pv.ok) throw new Error('proof.ok == false');

    // 5. ASSEMBLE the event; proof+publicValues ride under `witness` (the reserved key).
    const event = {
      eventName: args.eventName,
      commitment: commitment.cm,
      witness: groth16Witness({ publicValues: bundle.publicValues, proof: bundle.proof,
                                exprHash: pv.exprHash, outputHash: pv.outputHash, ok: pv.ok }),
      ...args.extra,
    };

    // 6. SIGN via the canonical path (dropNulls ∘ RFC8785) and SUBMIT.
    const signed = signDataUpdate(event, this.deps.privateKey);
    return this.deps.submit(signed);
  }
}
```

---

## 6. Worked example — sealed‑bid auction

A published auction fiber: rules public and legible, the bid value shielded. (`src/apps/markets/state-machines/market-auction.ts` already ships commit/reveal scaffolding to slot into.)

### The published guard JSON (corrected `groth16_verify` order, `outputHash == keccak(canonical true)`)

```jsonc
// BID phase — public, hash-bound on creation. $VK_ROOT, $minBidLogicHash, $keccakTrue are literals.
{ "from": "OPEN", "to": "BID_RECORDED", "eventName": "submitBid",
  "guard": { "and": [
    // groth16_verify([vkey, publicValues, proof])  — ZkGatedMorphismSuite order
    { "groth16_verify": [ "$VK_ROOT", {"var":"witness.publicValues"}, {"var":"witness.proof"} ] },
    // exprHash/outputHash binding via the SURFACED scalar fields (§5A) until jlvm_pv_decode (§5B) lands:
    { "==": [ {"var":"witness.exprHash"},   "$minBidLogicHash" ] },   // "the proven rule is bid >= minBid"
    { "==": [ {"var":"witness.outputHash"}, "$keccakTrue"      ] },   // keccak256(JCS(true))
    { "var": "witness.ok" }
  ] },
  "effect": { "merge": [ {"var":"state"},
    { "bids": { "append": [ {"var":"state.bids"}, {"var":"event.commitment"} ] } } ] } }
```

```jsonc
// REVEAL phase — winner opens (bid, salt); guard recomputes the commitment and matches it.
{ "from": "REVEALED", "to": "SETTLED", "eventName": "reveal",
  "guard": { "==": [ { "poseidon": [ {"var":"event.bidFr"}, {"var":"event.saltFr"} ] },
                     {"var":"state.winningCommitment"} ] } }
```

`$keccakTrue` is computed once with the same path: `proverPreimage(true)` = `keccak256(canonicalize(true))` = `keccak256("true")` — and pinned as a literal.

### The TS client code

```ts
import { SemiPrivate } from '@ottochain/sdk/zk';
import { ExprRegistry, minBidRule } from '@ottochain/sdk/zk';
import { SubprocessProver } from '@ottochain/sdk/zk';
import { MetagraphClient } from '@ottochain/sdk';

const MIN_BID = 50;
const VK_ROOT = '0x…';                       // the universal SP1 VK_ROOT (one setup, one root)

// 1. Register the bound-pinned rule once; its exprHash IS the on-chain $minBidLogicHash.
const registry = new ExprRegistry();
const minBidLogicHash = registry.register('minBid', minBidRule(MIN_BID)); // { ">=": [{var:'amount'}, 50] }

// 2. Wire the prover (Node/desktop subprocess to the built zk-jlvm host binary).
const prover = new SubprocessProver({ jlvmBin: '/opt/ottochain/bin/zk-jlvm', cuda: true });

const node = new MetagraphClient({ baseUrl: 'https://ml0.testnet.ottochain.xyz' });
const sdk = new SemiPrivate({
  prover, registry, privateKey: process.env.BIDDER_KEY!, vkRoot: VK_ROOT,
  submit: (signed) => node.submitDataUpdate(signed),   // existing tx path
});

// 3. Bid 100 (private). Pre-exec checks 100 >= 50 locally; commits Poseidon([100, salt]);
//    proves "the rule bid>=50 on my hidden data returned true"; signs; submits.
const { ordinal } = await sdk.provenTransition({
  ruleName: 'minBid',
  secret:   { amount: 100 },                 // never leaves the client; only keccak(canon) is public
  eventName: 'submitBid',
  extra:    { repeated: false },             // defaulted-required field, non-optional (§1)
});
// On-chain: state.bids gains a 32-byte commitment. The amount 100 is NOWHERE on-chain.
// An outsider replaying witness.exprHash sees WHICH rule (bid>=50) was proven, not the bid.

// 4. Later, reveal to settle (winner only):
const opening = /* recovered from PrivateStore */ { bidFr: 100n, saltFr: /* the salt used */ 0n };
await node.submitDataUpdate(signDataUpdate(
  { eventName: 'reveal', bidFr: '0x'+opening.bidFr.toString(16).padStart(64,'0'), saltFr: '0x…' },
  process.env.BIDDER_KEY!,
));
```

The same `provenTransition` with `registry.register('scoreGate', { '>=': [{var:'score'}, 700] })` is a **private‑score** fiber — *"prove score ≥ 700 without revealing it."*

---

## 7. Honest notes

| Concern | Reality (file‑confirmed) | Status / mitigation |
|---|---|---|
| **TS Groth16‑verify gap** | `groth16_verify` is **decodable but not implemented** in the TS evaluator — it falls through to `` `Unsupported operator: ${op}` `` (`evaluator.ts:619`; dispatch table lines 602‑617 implement only `poseidon`, `pmt_verify`, `schnorr_verify`, `bls_verify`, `bls_aggregate_verify`, `prove_dlog_verify`, `prove_dhtuple_verify`, `sigma_verify`). `smt_verify`, `mpt_verify`, `bn254_add/mul/pairing`, `ecvrf_verify` are likewise unported. **A TS client cannot verify the SNARK itself today** — it pre‑verifies Poseidon/Merkle/transcript facts and trusts the chain for the Groth16 step. | **The unlock:** port `groth16_verify` (+ the `bn254_*` pairing/G1 it needs) to the TS evaluator. Until then, semi‑private clients verify everything *except* the proof locally. Self‑contained, addable opcode — not chain machinery. |
| **`publicValues` is opaque on‑chain** | `witness.publicValues` is the abi‑encoded `JlvmPublicValues{bytes32×3, bool}` blob as **one hex string** (`ZkGatedMorphismSuite.scala:141‑148`); the guard cannot read `.exprHash`. The parent doc's `{"var":"witness.publicValues.exprHash"}` does not work today. | Surface decoded scalars as separate witness fields (§5A) **or** add a one‑opcode `jlvm_pv_decode` (§5B, recommended) for a trust‑gap‑free `exprHash == logicHash` bind. |
| **`groth16_verify` arg order** | Confirmed `[vkey, publicValues, proof]` (`ZkGatedMorphismSuite.scala:131‑139`), **opposite** to the parent doc §3.1 snippet. `pmt_verify` is `[root, leaf, index, siblings]` (lines 114‑123). | The `witness.ts` builders + guard templates here use the **confirmed** order. Getting this wrong is a silent verify‑fail. |
| **Two on‑wire encodings** | JLVM opcodes take lowercase `0x` big‑endian hex (`hex-bytes.ts encodeFr`); the zk‑shielded *wire witness* takes **base‑10 decimal** Fr strings (`wire.rs`, `BigUint::parse_bytes(.,10)`). | `commit.ts` emits hex for guards; `prover.ts toDecimalWire` emits decimal for the shielded host. Keep them in separate code paths. |
| **Determinism split (the dominant risk)** | zk‑jlvm keccaks **raw** input bytes (`main.rs:18‑19`, no dropNulls, no input canon); signing is `JCS(dropNulls)` (`signing.ts`). Two preimages → silent `InvalidSignature`/false‑verify. | The **whole §1 module exists to close this.** The prover is fed `canonicalForSigning(x)`, never `JSON.stringify`. **Must land + be cross‑language vectored before any semi‑private use.** |
| **Prover latency / cost** | SP1 Groth16 is **seconds‑to‑minutes per proof**, Rust/SP1 only (CUDA optional via `SP1_PROVER=cuda`). No in‑browser prover. | The SDK flow is **async** by construction: commit‑now / prove‑async / settle‑on‑proof. Only the 250k‑gas *verify* belongs in a guard, never inline proving. `SubprocessProver` default; `ServiceProver` must be **self‑hosted** (it sees the witness). |
| **Semi‑private leakage** | Hiding a value still leaks the proven *bound* (narrows the range), tx **timing/ordering**, **proof size**, and commitment **cardinality**. | Hides values, not necessarily participation. A Midnight‑style `reveal()`/`disclose()` taint‑check (refuse to sign if an undisclosed secret flows into the public delta) is the recommended companion; out of scope for this slice but flagged. |
| **u64 range is by type, not proof** | `note.value:u64` zero‑extends into Fr; no range gadget (`zk-shielded/lib/src/lib.rs`). | For value semantics prefer the shielded circuit; otherwise pin the bound into `exprHash` (§5). `commit.ts` asserts `0 ≤ value < 2^64`. |
| **Audit gate** | metakit's verifier + shielded circuit are unaudited (the trust root for every shielded claim). | **Semi‑private must not protect real value un‑audited.** Testnet / non‑value flows are fine now. |

**Bottom line:** the semi‑private tier is **buildable today on shipped crypto** — Poseidon commitments (`poseidon.ts`), the witness‑gated `groth16_verify` guard (PR #166, `ZkGatedMorphismSuite`), and the Rust zk‑jlvm host (`zk-jlvm/script`) all exist. The **one prerequisite** is the `proverPreimage` glue in §1 (the §3.0 unification), so a signed payload and its proven preimage bind the **same bytes**. The two follow‑on unlocks — porting `groth16_verify` to TS (client‑side SNARK verification) and a `jlvm_pv_decode` accessor (trust‑gap‑free `exprHash` binding) — are self‑contained additions, not feasibility walls.

---

### Files this spec was grounded against (all absolute)

- `/home/euler/repos/ottochain-sdk/docs/design/client-side-private-data.md` — §3.0 determinism binding, §3.1 worked example + "pin the bound" pattern.
- `/home/euler/repos/ottochain-sdk/src/signing.ts`, `/home/euler/repos/ottochain-sdk/src/ottochain/drop-nulls.ts` — the `JCS(dropNulls)` signing path; `dropNulls` preserves `false`/`0`/array‑nulls.
- `/home/euler/repos/ottochain-sdk/docs/signing-and-publishing.md` — the chain‑required‑defaulted‑field rule (make those TS fields required).
- `@constellation-network/metagraph-sdk` (resolved `@0.2.0`) — `canonicalize` (RFC 8785, the `canonicalize@^3.0.0` npm pkg), re‑exported via `/home/euler/repos/ottochain-sdk/src/index.ts:22`; `@noble/hashes@^2.0.1` provides `keccak_256`.
- `/home/euler/repos/metakit-sdk/packages/typescript/src/json-logic/poseidon.ts` — `poseidonHash`, `merkleComputeRoot`, `merkleVerifyInclusion`, `MAX_INPUTS=4`, `R`.
- `/home/euler/repos/metakit-sdk/packages/typescript/src/json-logic/hex-bytes.ts` — `encodeFr` (lowercase `0x` big‑endian 32‑byte), `FR_MODULUS`, `parseFr`.
- `/home/euler/repos/metakit-sdk/packages/typescript/src/json-logic/evaluator.ts:602‑619` + `crypto-ops.ts` — **implemented**: poseidon, pmt_verify, schnorr_verify, bls_verify, bls_aggregate_verify, prove_dlog_verify, prove_dhtuple_verify, sigma_verify; **NOT implemented (Rust/Scala‑only)**: groth16_verify, smt_verify, mpt_verify, bn254_*, ecvrf_verify (`"Unsupported operator"`).
- `/home/euler/repos/metakit-sdk/rust/zk-jlvm/program/src/main.rs` — guest: `keccak256(expr_json.as_bytes())`, `keccak256(data_json.as_bytes())`, canonical output keccak, `ok`; commits `JlvmPublicValues`.
- `/home/euler/repos/metakit-sdk/rust/zk-jlvm/lib/src/lib.rs:3‑16` — `JlvmPublicValues{bytes32 exprHash; bytes32 dataHash; bytes32 outputHash; bool ok}` (ABI layout for `decodeJlvmPublicValues`).
- `/home/euler/repos/metakit-sdk/rust/zk-jlvm/script/src/main.rs` — SP1 host; `--mode groth16`, `--expr`/`--data` → `stdin.write` verbatim; prints `vkey` / `public values` / `proof bytes`.
- `/home/euler/repos/metakit-sdk/rust/zk-shielded/lib/src/{lib.rs,pub_values.rs,wire.rs}` — `Note{value:u64,owner,asset,rho}`, `cm=Poseidon([value,owner,asset,rho])`, `nf=Poseidon([rho,nsk])`, `owner=Poseidon([nsk])`; `ShieldedTransferPublicValues{bytes32 anchor; bytes32[] nullifiers; bytes32[] outputCms; uint64 fee}`; `WireWitness` with **decimal** Fr strings; the two soundness TODOs at `lib.rs:212‑217` (intra‑transfer nullifier uniqueness) and `lib.rs:236‑242` (single‑asset conservation); `fr_to_bytes32` big‑endian 32‑byte.
- `/home/euler/repos/ottochain/modules/shared-data/src/test/scala/xyz/kd5ujc/shared_data/ZkGatedMorphismSuite.scala` — **the corrected arg orders**: `groth16_verify [vkey, witness.publicValues, witness.proof]` (131‑139), `pmt_verify [root, witness.leaf, witness.index, witness.siblings]` (114‑123); `merkleWitness{leaf,index,siblings}` (94‑103); `groth16` witness `{publicValues, proof}` as **bare hex** (141‑148).
- `/home/euler/repos/ottochain/modules/shared-data/.../AssetCombiner.scala:1023‑1075` — `"witness" -> op.witness.getOrElse(NullValue)` injection; `/home/euler/repos/ottochain/modules/models/.../Updates.scala:270‑319` — `MintAsset`/`ApplyMorphism` carry `witness: Option[JsonLogicValue]`; `MorphismSpec`/`MorphismVisibility.Governed`.
