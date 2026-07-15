/**
 * gen-health-fixtures.ts — fixture generator for the `riverdale-health` e2e
 * (ZK medical-privacy lane: shielded history + prior-auth proof + EPCS
 * threshold co-sign + anti-double-fill nullifier).
 *
 * Run from ottochain-sdk/:
 *   npx tsx scripts/gen-health-fixtures.ts prove      # GPU: 4 Groth16 proofs (RTX 5090, SP1_PROVER=cuda)
 *   npx tsx scripts/gen-health-fixtures.ts assemble   # sigma proofs + oracle checks + emit e2e files
 *   npx tsx scripts/gen-health-fixtures.ts all
 *
 * WHAT THIS PRODUCES (into ../ottochain/e2e-test/examples/riverdale-health/)
 * -------------------------------------------------------------------------
 *  Act 1 (the chart): patient-blake's medical record as a SHIELDED pool.
 *    Two private updates ("failed first-line treatment" visits) each attested by a
 *    zk-jlvm-shielded (M5) Groth16 proof: publicValues = anchor|nullifier|newCommitment|exprHash.
 *    The chain sees commitments + nullifiers, never the chart.
 *  Act 2 (prior auth): an SP1 zk-jlvm Groth16 proof that the PRIVATE history satisfies the
 *    pinned fail-first rule (>=2 failed first-line treatments AND no active opioid Rx),
 *    bound on-chain via exprHash==logicHash and outputHash==keccak256(true).
 *  Act 3 (EPCS co-sign): a CDS THRESHOLD(2-of-3 dlog) Σ-proof over the prescriber's
 *    registered EPCS factors, message-bound to (publicValues ‖ rxId) — the co-sign
 *    attests to EXACTLY this prior-auth proof for EXACTLY this prescription.
 *  Act 4 (one script, one fill): a CDS OR-of-dhtuple ring proof (sigma-mixer pattern) over
 *    the cohort of active prescription points, with a witness-bound nullifier Nf = x_rx·H.
 *    A second fill replaying Nf is denied by the spent-nullifier map.
 *
 * THE VERIFIER IS THE ORACLE (sigma-mixer discipline): every honest artifact is fed
 * through the REAL opcodes (`groth16_verify`, `sigma_verify`, `pmt_verify`, and the full
 * definition guards) via @constellation-network/metagraph-sdk-jlvm — the byte-parity port
 * of the chain's evaluator — and must verify before anything is written. Reject-path
 * artifacts must evaluate false. If any assertion fails, nothing is written.
 *
 * DETERMINISM: all secrets/salts derive from sha256 over fixed domain strings (31-byte
 * slices, always canonical Fr scalars), so regeneration is reproducible except for the
 * SP1 proof bytes themselves (Groth16 proving is randomized; re-verification is the check).
 *
 * PRIVACY NOTE: the M5 wire witnesses (the actual private chart data) are committed under
 * fixtures/ for provenance and regeneration. In production these never leave the client.
 */

import { bn254 } from "@noble/curves/bn254.js";
import { sha256 } from "@noble/hashes/sha256.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { canonicalize } from "@constellation-network/metagraph-sdk";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// The real verifier — the oracle. Byte-parity port of the chain's JLVM evaluator.
const { jsonLogic } = require("@constellation-network/metagraph-sdk-jlvm");

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "..", "..", "ottochain", "e2e-test", "examples", "riverdale-health");
const FIXTURES_DIR = join(OUT_DIR, "fixtures");
const METAKIT_SDK = process.env.METAKIT_SDK_DIR ?? join(here, "..", "..", "metakit-sdk");

const MODE = process.argv[2] ?? "assemble";
if (!["prove", "assemble", "all"].includes(MODE)) {
  throw new Error(`usage: gen-health-fixtures.ts prove|assemble|all (got ${MODE})`);
}

// ═════════════════════════════════════════════════════════════════════════════
// §0 helpers — hex/bigint, deterministic scalars, hashing
// ═════════════════════════════════════════════════════════════════════════════

const Fp = bn254.fields.Fp;
const Fr = bn254.fields.Fr;
const P = bn254.G1.Point;
const G = P.BASE; // (1, 2) — the verifier's G1 generator
const R = Fr.ORDER;
const p = Fp.ORDER;
const CHALLENGE_BYTES = 31; // injective-into-Fr challenge domain (sigma-verify.md §4a)
const SIGMA_DOMAIN = new TextEncoder().encode("sigma_verify:v1");

const utf8 = (s: string) => new TextEncoder().encode(s);
const toHex = (b: Uint8Array): string => "0x" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const stripHex = (h: string): string => (h.startsWith("0x") ? h.slice(2) : h);
const bytesToBig = (b: Uint8Array): bigint => b.reduce((a, x) => (a << 8n) | BigInt(x), 0n);
const bigToBytes = (v: bigint, width: number): Uint8Array => {
  const out = new Uint8Array(width);
  let t = v;
  for (let i = width - 1; i >= 0; i--) { out[i] = Number(t & 0xffn); t >>= 8n; }
  return out;
};
const hex32 = (v: bigint): string => toHex(bigToBytes(v, 32));
const uint32be = (v: number): Uint8Array =>
  new Uint8Array([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]);
const concat = (...arrs: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(arrs.reduce((s, a) => s + a.length, 0));
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
};
const hexToBytes = (h: string): Uint8Array =>
  Uint8Array.from(stripHex(h).match(/../g)!.map((x) => parseInt(x, 16)));

/** Deterministic canonical Fr scalar from a domain string: low 31 bytes of sha256 (< 2^248 < R). */
const scalarFromDomain = (domain: string): bigint => {
  const s = bytesToBig(sha256(utf8(domain)).subarray(1));
  if (s === 0n) throw new Error(`zero scalar from ${domain}`);
  return s;
};
/** Deterministic 31-byte challenge from a domain string (simulated-branch challenges). */
const challengeFromDomain = (domain: string): Uint8Array => sha256(utf8(domain)).subarray(1);

/** JCS-canonical string — the SAME canonical the signer and the zk-jlvm guest keccak. */
const canonical = (x: unknown): string => canonicalize(x);
/** keccak256(canonical(x)) — exprHash/dataHash exactly as the guest commits them. */
const keccakCanonical = (x: unknown): string => toHex(keccak_256(utf8(canonical(x))));
const KECCAK_TRUE = keccakCanonical(true);

// G1 encode: 0x ‖ x(32B BE) ‖ y(32B BE) — the fixed-width form every sigma opcode uses.
type G1 = InstanceType<typeof P>;
const encodeG1 = (pt: G1): Uint8Array => {
  const { x, y } = pt.toAffine();
  return concat(bigToBytes(x, 32), bigToBytes(y, 32));
};
const encodeG1Hex = (pt: G1): string => toHex(encodeG1(pt));

// ── the oracle ────────────────────────────────────────────────────────────────
const apply = (rule: unknown, data: unknown): unknown => jsonLogic.apply(rule, data);
const applySafe = (rule: unknown, data: unknown): unknown => {
  try { return apply(rule, data); } catch { return "__HARD_ERROR__"; }
};
const assertEq = (got: unknown, want: unknown, what: string) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) throw new Error(`ASSERT ${what}:\n  got  ${g}\n  want ${w}`);
  console.log(`  ✓ ${what}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// §1 Poseidon + fixed-depth sparse Merkle tree (byte-compatible with
//    poseidon-bn254::merkle / metakit PoseidonMerkleTree; validated in §2)
// ═════════════════════════════════════════════════════════════════════════════

const poseidonHex = (inputs: bigint[]): string =>
  apply({ poseidon: inputs.map(hex32) }, {}) as string;
const poseidon = (inputs: bigint[]): bigint => BigInt(poseidonHex(inputs));

const DEPTH = 8; // matches zk-jlvm-shielded/script DEPTH

/** zero(0)=0; zero(i)=compress(zero(i-1),zero(i-1)); root of empty tree = zero(depth). */
const zeroHashes = (() => {
  const z: bigint[] = [0n];
  for (let i = 1; i <= DEPTH; i++) z.push(poseidon([z[i - 1], z[i - 1]]));
  return z;
})();

/** Sparse incremental tree: only live leaves tracked; siblings emitted ROOT-FIRST. */
class PoseidonTree {
  leaves = new Map<number, bigint>();
  set(pos: number, leaf: bigint) { this.leaves.set(pos, leaf); }
  /** digest of the subtree at `level` whose leftmost leaf index is `index<<level`. */
  private node(level: number, index: number): bigint {
    if (level === 0) return this.leaves.get(index) ?? 0n;
    // prune: no live leaf below => zero hash
    const lo = index << level, hi = (index + 1) << level;
    let live = false;
    for (const k of this.leaves.keys()) if (k >= lo && k < hi) { live = true; break; }
    if (!live) return zeroHashes[level];
    return poseidon([this.node(level - 1, 2 * index), this.node(level - 1, 2 * index + 1)]);
  }
  root(): bigint { return this.node(DEPTH, 0); }
  /** Authentication path for `pos`, ROOT-FIRST (siblings[0] = other child of the root). */
  siblings(pos: number): bigint[] {
    const out: bigint[] = [];
    for (let level = DEPTH - 1; level >= 0; level--) {
      const idxAtLevel = pos >> level;
      out.push(this.node(level, idxAtLevel ^ 1));
    }
    return out;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// §2 M5 note algebra + SELF-TEST against the committed metakit-sdk fixture
//    (proves the TS tree/commitment math is byte-compatible before we build)
// ═════════════════════════════════════════════════════════════════════════════

const ownerFromNsk = (nsk: bigint): bigint => poseidon([nsk]);
const nullifierOf = (rho: bigint, nsk: bigint): bigint => poseidon([rho, nsk]);
/** cm = Poseidon([keccakHi, keccakLo, owner, rho]) over the JCS-canonical state. */
const noteCommitment = (state: unknown, owner: bigint, rho: bigint): bigint => {
  const k = keccak_256(utf8(canonical(state)));
  const hi = bytesToBig(k.subarray(0, 16));
  const lo = bytesToBig(k.subarray(16));
  return poseidon([hi, lo, owner, rho]);
};

function selfTestAgainstM5Fixture() {
  console.log("§2 self-test vs committed zk-jlvm-shielded fixture");
  const fx = JSON.parse(
    readFileSync(join(METAKIT_SDK, "rust/zk-jlvm-shielded/script/fixtures/transition_groth16_fixture.json"), "utf8"),
  );
  const w = fx.witness;
  const nsk = BigInt(w.nsk), rho = BigInt(w.rho);
  assertEq(ownerFromNsk(nsk).toString(), w.owner, "owner = Poseidon([nsk])");
  const cm = noteCommitment(w.old_state, BigInt(w.owner), rho);
  const tree = new PoseidonTree();
  tree.set(Number(w.merkle_proof.position), cm);
  assertEq(tree.root().toString(), w.anchor, "tree root == fixture anchor");
  assertEq(tree.siblings(Number(w.merkle_proof.position)).map(String), w.merkle_proof.siblings, "siblings (root-first)");
  // publicValues layout: 0x | anchor | nullifier | newCommitment | exprHash (4×32B)
  const pv = stripHex(fx.publicValues);
  assertEq("0x" + pv.slice(0, 64), hex32(BigInt(w.anchor)), "pv word0 == anchor");
  assertEq("0x" + pv.slice(64, 128), hex32(nullifierOf(rho, nsk)), "pv word1 == Poseidon([rho,nsk])");
  // exprHash word == keccak(JCS-canonical(effect_expr)) — settles serialization equivalence
  assertEq("0x" + pv.slice(192, 256), keccakCanonical(w.effect_expr), "pv word3 == keccak(canonical(effect))");
  // and the real groth16_verify accepts the committed bundle through the oracle
  assertEq(apply({ groth16_verify: [fx.vkey, fx.publicValues, fx.proof] }, {}), true, "groth16_verify(committed M5 fixture)");
  // pmt_verify agrees with the TS tree on an inclusion
  assertEq(
    apply({ pmt_verify: [hex32(tree.root()), hex32(cm), Number(w.merkle_proof.position), tree.siblings(Number(w.merkle_proof.position)).map(hex32)] }, {}),
    true,
    "pmt_verify(TS tree inclusion)",
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// §3 cast, story data, and the M5 witness sequence (Act 1)
// ═════════════════════════════════════════════════════════════════════════════

// Patient note keys — deterministic, demo-only.
const NSK_BLAKE = scalarFromDomain("riverdale-health:blake:nsk:v1");
const OWNER_BLAKE = () => ownerFromNsk(NSK_BLAKE);
const RHO = [0, 1, 2].map((i) => scalarFromDomain(`riverdale-health:blake:rho${i}:v1`));

// The PRIVATE chart. Kept small: M5 proving cost is O(state size).
const S0 = { activeOpioidCount: 0, failedFirstLine: 0, treatments: [] as unknown[] };
const EVT1 = { type: "treatment-outcome", drug: "gabapentin", outcome: "failed", date: "2026-05-02" };
const EVT2 = { type: "treatment-outcome", drug: "duloxetine", outcome: "failed", date: "2026-06-10" };

// The pinned medical-update logic (runs INSIDE the SP1 guest; exprHash pins it on-chain).
const MEDICAL_EFFECT = {
  merge: [
    { var: "state" },
    {
      failedFirstLine: {
        "+": [
          { var: "state.failedFirstLine" },
          { if: [{ "===": [{ var: "event.outcome" }, "failed"] }, 1, 0] },
        ],
      },
      treatments: { merge: [{ var: "state.treatments" }, [{ var: "event" }]] },
    },
  ],
};
const MEDICAL_EXPR_HASH = keccakCanonical(MEDICAL_EFFECT);

// The fail-first prior-auth rule (Act 2), proven over the private chart by zk-jlvm.
const PRIOR_AUTH_RULE = {
  and: [
    { ">=": [{ var: "failedFirstLine" }, 2] },
    { "===": [{ var: "activeOpioidCount" }, 0] },
  ],
};
const PRIOR_AUTH_LOGIC_HASH = keccakCanonical(PRIOR_AUTH_RULE);

// Prescription + parties (fixture literals; parties on-chain are e2e wallets).
const RX_ID = toHex(sha256(utf8("riverdale-health:rx:oxycodone-5mg:blake:v1")));
const PHARMACY_CORNER_HEX = toHex(sha256(utf8("riverdale-health:pharmacy-corner:addr:v1")).subarray(0, 20));

interface M5Step {
  name: string;
  witness: Record<string, unknown>;
  oldState: unknown;
  newState: unknown;
  anchor: bigint;      // root BEFORE (the proven-against anchor)
  newRoot: bigint;     // root AFTER inserting the new commitment
  newSiblings: bigint[]; // auth path of the new commitment under newRoot (root-first)
  newLeafPos: number;
  nf: bigint;
  newCm: bigint;
  predictedPv: string; // 0x + 4×64 hex — asserted against the proven bundle
}

function buildM5Sequence(): { steps: M5Step[]; root0: bigint; cm0: bigint; states: unknown[] } {
  console.log("§3 building M5 witness sequence (private chart history)");
  const owner = OWNER_BLAKE();
  const tree = new PoseidonTree();
  const states: unknown[] = [S0];
  const cms: bigint[] = [noteCommitment(S0, owner, RHO[0])];
  tree.set(0, cms[0]);
  const root0 = tree.root();

  const steps: M5Step[] = [];
  const events = [EVT1, EVT2];
  for (let i = 0; i < 2; i++) {
    const oldState = states[i];
    const anchor = tree.root();
    const siblingsOld = tree.siblings(i);
    // the guest computes newState = eval(effect, {state, event}) — predict via the parity port
    const newState = apply(MEDICAL_EFFECT, { state: oldState, event: events[i] });
    const newCm = noteCommitment(newState, owner, RHO[i + 1]);
    const nf = nullifierOf(RHO[i], NSK_BLAKE);
    tree.set(i + 1, newCm);
    const newRoot = tree.root();
    const witness = {
      anchor: anchor.toString(),
      old_state: oldState,
      owner: owner.toString(),
      nsk: NSK_BLAKE.toString(),
      rho: RHO[i].toString(),
      merkle_proof: { position: String(i), siblings: siblingsOld.map(String) },
      effect_expr: MEDICAL_EFFECT,
      event: events[i],
      new_owner: owner.toString(), // the patient keeps custody of their own chart
      new_rho: RHO[i + 1].toString(),
    };
    const predictedPv =
      "0x" + stripHex(hex32(anchor)) + stripHex(hex32(nf)) + stripHex(hex32(newCm)) + stripHex(MEDICAL_EXPR_HASH);
    steps.push({
      name: `visit-${i + 1}`,
      witness, oldState, newState, anchor,
      newRoot, newSiblings: tree.siblings(i + 1), newLeafPos: i + 1,
      nf, newCm, predictedPv,
    });
    states.push(newState);
  }
  return { steps, root0, cm0: cms[0], states };
}

// ═════════════════════════════════════════════════════════════════════════════
// §4 GPU proving (cargo shell-outs; `prove` mode) + bundle IO
// ═════════════════════════════════════════════════════════════════════════════

interface Bundle { vkey: string; publicValues: string; proof: string; [k: string]: unknown }

const bundlePath = (name: string) => join(FIXTURES_DIR, `${name}.json`);
const readBundle = (name: string): Bundle => JSON.parse(readFileSync(bundlePath(name), "utf8"));

function cargoEnv() {
  return { ...process.env, SP1_PROVER: process.env.SP1_PROVER ?? "cuda", RUST_LOG: process.env.RUST_LOG ?? "info" };
}

/**
 * sp1-cuda 6.2.x can PANIC IN A DESTRUCTOR during process teardown (GPU server drop) AFTER the
 * proof was generated, verified, and saved. So a non-zero cargo exit is not authoritative: the
 * artifact is. Run, tolerate the teardown crash, then gate on the artifact verifying through the
 * real groth16_verify oracle.
 */
function runCargoTolerant(dir: string, args: string[]): string {
  try {
    return execFileSync("cargo", ["run", "--release", "--", ...args], {
      cwd: dir, env: cargoEnv(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"],
    });
  } catch (err: any) {
    const stdout = (err.stdout ?? "").toString();
    console.warn(`  (cargo exited non-zero — checking whether the proof landed before teardown)`);
    return stdout;
  }
}

/** zk-jlvm-shielded: --witness file → fixture JSON via --fixture-out. */
function proveM5(step: M5Step) {
  const dir = join(METAKIT_SDK, "rust", "zk-jlvm-shielded", "script");
  const wPath = join(FIXTURES_DIR, `m5-${step.name}.witness.json`);
  writeFileSync(wPath, JSON.stringify(step.witness, null, 2) + "\n");
  const out = bundlePath(`m5-${step.name}`);
  console.log(`  proving M5 ${step.name} (GPU)…`);
  const stdout = runCargoTolerant(dir, ["--mode", "groth16", "--witness", wPath, "--fixture-out", out]);
  process.stdout.write(stdout);
  if (!existsSync(out)) throw new Error(`M5 ${step.name}: no fixture at ${out}`);
  const b = readBundle(`m5-${step.name}`);
  assertEq(apply({ groth16_verify: [b.vkey, b.publicValues, b.proof] }, {}), true, `M5 ${step.name} bundle verifies`);
}

/** zk-jlvm: canonical --expr/--data strings; bundle parsed from stdout. */
function proveJlvm(name: string, exprCanonical: string, dataCanonical: string) {
  const dir = join(METAKIT_SDK, "rust", "zk-jlvm", "script");
  console.log(`  proving zk-jlvm ${name} (GPU)…`);
  const stdout = runCargoTolerant(dir, ["--mode", "groth16", "--expr", exprCanonical, "--data", dataCanonical]);
  process.stdout.write(stdout);
  const grab = (label: string): string => {
    const m = stdout.match(new RegExp(`${label}\\s*(0x[0-9a-fA-F]+)`));
    if (!m) throw new Error(`could not parse '${label}' from zk-jlvm output`);
    return m[1].toLowerCase();
  };
  const bundle: Bundle = {
    scheme: "groth16-bn254",
    vkey: grab("vkey:"),
    publicValues: grab("public values:"),
    proof: grab("proof bytes:"),
    expr: JSON.parse(exprCanonical),
    data: JSON.parse(dataCanonical),
  };
  assertEq(apply({ groth16_verify: [bundle.vkey, bundle.publicValues, bundle.proof] }, {}), true, `${name} bundle verifies`);
  writeFileSync(bundlePath(name), JSON.stringify(bundle, null, 2) + "\n");
}

/** True iff the bundle already exists AND verifies — lets a crashed prove run resume. */
function bundleReady(name: string): boolean {
  if (!existsSync(bundlePath(name))) return false;
  try {
    const b = readBundle(name);
    return apply({ groth16_verify: [b.vkey, b.publicValues, b.proof] }, {}) === true;
  } catch { return false; }
}

// ═════════════════════════════════════════════════════════════════════════════
// §5 Σ-provers — CDS THRESHOLD(k,n) over dlog leaves (port of metakit
//    SigmaVectorGen.scala) and OR-of-dhtuple ring (port of gen-sigma-mixer)
// ═════════════════════════════════════════════════════════════════════════════

// GF(2^8), AES reduction poly 0x11b — byte-lane arithmetic for CTHRESHOLD.
const gfMul = (a0: number, b0: number): number => {
  let prod = 0, a = a0 & 0xff, b = b0 & 0xff;
  for (let i = 0; i < 8; i++) {
    if (b & 1) prod ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return prod & 0xff;
};
const gfInv = (a: number): number => {
  if ((a & 0xff) === 0) return 0;
  let acc = 1, base = a & 0xff;
  for (let bit = 0; bit < 8; bit++) {
    if ((254 >> bit) & 1) acc = gfMul(acc, base);
    base = gfMul(base, base);
  }
  return acc & 0xff;
};
const gfLagrange = (xs: number[], ys: number[], xEval: number): number => {
  let acc = 0;
  for (let i = 0; i < xs.length; i++) {
    let num = 1, den = 1;
    for (let j = 0; j < xs.length; j++) {
      if (j === i) continue;
      num = gfMul(num, xEval ^ xs[j]);
      den = gfMul(den, xs[i] ^ xs[j]);
    }
    acc ^= gfMul(ys[i], gfMul(num, gfInv(den)));
  }
  return acc & 0xff;
};

const TAG = { dlog: 0x00, dhtuple: 0x01, and: 0x02, or: 0x03, threshold: 0x04 } as const;
const low31 = (digest: Uint8Array): Uint8Array => digest.subarray(digest.length - CHALLENGE_BYTES);
const challengeToScalar = (e: Uint8Array): bigint => bytesToBig(e); // < 2^248 < R, no reduction

/**
 * THRESHOLD(k, n) over dlog leaves. `secrets[i] === null` ⇒ branch i is simulated
 * (exactly n−k nulls required). Returns proposition + proof JSON trees.
 */
function proveThresholdDlog(
  k: number,
  secrets: (bigint | null)[],
  pks: G1[],
  message: Uint8Array,
  domainTag: string,
): { proposition: unknown; proof: unknown } {
  const n = secrets.length;
  const simIdxs = secrets.flatMap((s, i) => (s === null ? [i] : []));
  if (simIdxs.length !== n - k) throw new Error(`threshold prover: need exactly n-k=${n - k} simulated branches`);

  // 1. simulated branches: deterministic random challenge + response; a = z·G − e·pk
  const eSim = new Map<number, Uint8Array>();
  const z = new Map<number, bigint>();
  const commitments = new Map<number, G1>();
  for (const i of simIdxs) {
    const e = challengeFromDomain(`${domainTag}:sim-e:${i}`);
    const zi = scalarFromDomain(`${domainTag}:sim-z:${i}`);
    eSim.set(i, e);
    z.set(i, zi);
    commitments.set(i, G.multiply(zi).subtract(pks[i].multiply(challengeToScalar(e))));
  }
  // 2. real branches: nonce commitments a = r·G
  const r = new Map<number, bigint>();
  for (let i = 0; i < n; i++) {
    if (secrets[i] === null) continue;
    const ri = scalarFromDomain(`${domainTag}:nonce:${i}`);
    r.set(i, ri);
    commitments.set(i, G.multiply(ri));
  }
  // 3. serialize (0x04 ‖ k ‖ n ‖ [0x00 ‖ pk ‖ a]×n) → strong-FS root challenge
  const bodies: Uint8Array[] = [];
  for (let i = 0; i < n; i++) bodies.push(concat(new Uint8Array([TAG.dlog]), encodeG1(pks[i]), encodeG1(commitments.get(i)!)));
  const serialized = concat(new Uint8Array([TAG.threshold]), uint32be(k), uint32be(n), ...bodies);
  const root = low31(sha256(concat(SIGMA_DOMAIN, serialized, message)));
  // 4. real challenges: per-lane GF(2^8) Lagrange through (0, root) + (simIdx+1, eSim)
  const xs = [0, ...simIdxs.map((i) => i + 1)];
  const eReal = new Map<number, Uint8Array>();
  for (let i = 0; i < n; i++) {
    if (secrets[i] === null) continue;
    const e = new Uint8Array(CHALLENGE_BYTES);
    for (let lane = 0; lane < CHALLENGE_BYTES; lane++) {
      const ys = [root[lane], ...simIdxs.map((s) => eSim.get(s)![lane])];
      e[lane] = gfLagrange(xs, ys, i + 1);
    }
    eReal.set(i, e);
  }
  // 5. real responses z = r + e·x mod R; sanity: recomputed commitment matches nonce commitment
  for (let i = 0; i < n; i++) {
    if (secrets[i] === null) continue;
    const e = challengeToScalar(eReal.get(i)!);
    const zi = (r.get(i)! + ((e * secrets[i]!) % R)) % R;
    z.set(i, zi);
    const recomputed = G.multiply(zi).subtract(pks[i].multiply(e));
    if (encodeG1Hex(recomputed) !== encodeG1Hex(commitments.get(i)!)) throw new Error("threshold real-branch commitment mismatch");
  }
  const eOf = (i: number) => (secrets[i] === null ? eSim.get(i)! : eReal.get(i)!);
  return {
    proposition: { type: "threshold", k, children: pks.map((pk) => ({ type: "dlog", pk: encodeG1Hex(pk) })) },
    proof: {
      type: "threshold",
      e: toHex(root),
      k,
      children: pks.map((_, i) => ({ type: "dlog", e: toHex(eOf(i)), z: hex32(z.get(i)! % R) })),
    },
  };
}

/** NUMS second base for the fill-nullifier ring (mixer construction, health domain). */
function deriveNumsH(): G1 {
  const seed0 = sha256(utf8("riverdale-health:rx-nullifier-base:v1"));
  for (let ctr = 0; ctr < 1000; ctr++) {
    const x = Fp.create(bytesToBig(sha256(concat(seed0, uint32be(ctr)))));
    const rhs = Fp.add(Fp.mul(Fp.mul(x, x), x), Fp.create(3n));
    if (Fp.pow(rhs, (p - 1n) / 2n) !== 1n) continue;
    const y = Fp.sqrt(rhs);
    const yCanon = y < p - y ? y : p - y;
    const H = P.fromAffine({ x, y: yCanon });
    H.assertValidity();
    if (H.is0() || H.equals(G)) continue;
    return H;
  }
  throw new Error("deriveNumsH: no point found");
}

/** CDS OR-of-dhtuple ring proof (straight port of gen-sigma-mixer-fixture.ts). */
function proveOrDhtuple(
  H: G1,
  points: G1[],
  realIdx: number,
  xj: bigint,
  Nf: G1,
  message: Uint8Array,
  domainTag: string,
): { proof: unknown } {
  const n = points.length;
  const eArr: Uint8Array[] = new Array(n);
  const zArr: bigint[] = new Array(n);
  const bodies: Uint8Array[] = new Array(n);
  const dhBody = (u: G1, a1: G1, a2: G1) =>
    concat(new Uint8Array([TAG.dhtuple]), encodeG1(G), encodeG1(H), encodeG1(u), encodeG1(Nf), encodeG1(a1), encodeG1(a2));
  for (let i = 0; i < n; i++) {
    if (i === realIdx) continue;
    eArr[i] = challengeFromDomain(`${domainTag}:sim-e:${i}`);
    zArr[i] = scalarFromDomain(`${domainTag}:sim-z:${i}`);
    const e = challengeToScalar(eArr[i]);
    bodies[i] = dhBody(points[i], G.multiply(zArr[i]).subtract(points[i].multiply(e)), H.multiply(zArr[i]).subtract(Nf.multiply(e)));
  }
  const k = scalarFromDomain(`${domainTag}:nonce`);
  bodies[realIdx] = dhBody(points[realIdx], G.multiply(k), H.multiply(k));
  const serialized = concat(new Uint8Array([TAG.or]), uint32be(n), ...bodies);
  const root = low31(sha256(concat(SIGMA_DOMAIN, serialized, message)));
  const ej = new Uint8Array(CHALLENGE_BYTES);
  for (let lane = 0; lane < CHALLENGE_BYTES; lane++) {
    let acc = root[lane];
    for (let i = 0; i < n; i++) if (i !== realIdx) acc ^= eArr[i][lane];
    ej[lane] = acc;
  }
  eArr[realIdx] = ej;
  zArr[realIdx] = (k + ((challengeToScalar(ej) * xj) % R)) % R;
  // sanity: real branch reconstructs to the nonce commitments
  const eS = challengeToScalar(ej);
  const a1 = G.multiply(zArr[realIdx]).subtract(points[realIdx].multiply(eS));
  const a2 = H.multiply(zArr[realIdx]).subtract(Nf.multiply(eS));
  if (encodeG1Hex(a1) !== encodeG1Hex(G.multiply(k)) || encodeG1Hex(a2) !== encodeG1Hex(H.multiply(k)))
    throw new Error("ring real-branch commitment mismatch (Nf != x_j·H?)");
  return {
    proof: {
      type: "or",
      e: toHex(root),
      children: eArr.map((e, i) => ({ type: "dhtuple", e: toHex(e), z: hex32(zArr[i] % R) })),
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// §6 definitions (single source of truth — emitted with fixture literals)
// ═════════════════════════════════════════════════════════════════════════════

/** cat("0x", substr(event.publicValues, off, 64)) — lift pv word back to 0x-hex. */
const pvWord = (off: number) => ({ cat: ["0x", { substr: [{ var: "event.publicValues" }, off, 64] }] });
const PV = { anchor: pvWord(2), nullifier: pvWord(66), newCommitment: pvWord(130), exprHash: pvWord(194) };
// zk-jlvm layout: exprHash | dataHash | outputHash | ok
const PA = { exprHash: pvWord(2), dataHash: pvWord(66), outputHash: pvWord(130) };

function recordDefinition() {
  return {
    states: { ACTIVE: { id: "ACTIVE", isFinal: false, metadata: null } },
    initialState: "ACTIVE",
    transitions: [
      {
        from: "ACTIVE",
        to: "ACTIVE",
        eventName: "update",
        guard: {
          and: [
            // 1. the M5 proof verifies: membership ∧ authorization ∧ in-guest effect ∧ new commitment
            { groth16_verify: [{ var: "state.vkey" }, { var: "event.publicValues" }, { var: "event.proof" }] },
            // 2. it ran the pinned medical-update logic (exprHash binding)
            { "===": [PV.exprHash, { var: "state.exprHash" }] },
            // 3. the spent note was proven under an anchor this record honors
            { in: [PV.anchor, { var: "state.knownRoots" }] },
            // 4. the note's nullifier is fresh (replay/double-spend of history denied)
            { "!": [{ has: [{ var: "state.nullifiers" }, PV.nullifier] }] },
            // 5. the client-advanced root really contains the new commitment at the next leaf
            { pmt_verify: [{ var: "event.newRoot" }, PV.newCommitment, { var: "state.leafCount" }, { var: "event.newSiblings" }] },
          ],
        },
        effect: {
          merge: [
            { var: "state" },
            {
              nullifiers: { set: [{ var: "state.nullifiers" }, PV.nullifier, true] },
              commitments: { merge: [{ var: "state.commitments" }, [PV.newCommitment]] },
              knownRoots: { merge: [{ var: "state.knownRoots" }, [{ var: "event.newRoot" }]] },
              currentRoot: { var: "event.newRoot" },
              leafCount: { "+": [{ var: "state.leafCount" }, 1] },
              transitions: { "+": [{ var: "state.transitions" }, 1] },
              lastUpdateAt: { var: "$ordinal" },
            },
          ],
        },
        dependencies: [],
      },
    ],
  };
}

function rxDefinition(zkJlvmVkey: string, factorPks: G1[]) {
  const cosignProposition = {
    type: "threshold",
    k: 2,
    children: factorPks.map((pk) => ({ type: "dlog", pk: encodeG1Hex(pk) })),
  };
  return {
    states: {
      draft: { id: "draft", isFinal: false, metadata: null },
      authorized: { id: "authorized", isFinal: true, metadata: null },
    },
    initialState: "draft",
    transitions: [
      {
        from: "draft",
        to: "authorized",
        eventName: "authorize",
        guard: {
          and: [
            // 1. the fail-first proof verifies (SP1 zk-jlvm over the PRIVATE chart)
            { groth16_verify: [zkJlvmVkey, { var: "event.publicValues" }, { var: "event.proof" }] },
            // 2. it ran the pinned prior-auth rule…
            { "===": [PA.exprHash, PRIOR_AUTH_LOGIC_HASH] },
            // 3. …and the rule evaluated to TRUE on the hidden history
            { "===": [PA.outputHash, KECCAK_TRUE] },
            // 4. the EPCS co-sign is bound to EXACTLY this proof and THIS prescription
            {
              "===": [
                { var: "event.cosignMessage" },
                { cat: ["0x", { substr: [{ var: "event.publicValues" }, 2] }, { substr: [{ var: "state.rxId" }, 2] }] },
              ],
            },
            // 5. THRESHOLD(2-of-3) over the prescriber's registered EPCS factors (CDS Σ-proof)
            { sigma_verify: [cosignProposition, { var: "event.cosignProof" }, { var: "event.cosignMessage" }] },
          ],
        },
        effect: {
          merge: [
            { var: "state" },
            {
              status: "authorized",
              priorAuthDataHash: PA.dataHash,
              authorizedAt: { var: "$ordinal" },
            },
          ],
        },
        dependencies: [],
      },
    ],
  };
}

function dispenseDefinition(H: G1, nRing: number) {
  const ringProposition = {
    type: "or",
    children: Array.from({ length: nRing }, (_, i) => ({
      type: "dhtuple",
      g: encodeG1Hex(G),
      h: encodeG1Hex(H),
      u: { var: `state.rxPoints.${i}` },
      v: { var: "event.nullifier" },
    })),
  };
  return {
    states: { open: { id: "open", isFinal: false, metadata: null } },
    initialState: "open",
    transitions: [
      {
        from: "open",
        to: "open",
        eventName: "fill",
        guard: {
          and: [
            // 1. the fill proves knowledge of ONE authorized prescription secret in the cohort
            //    (which one stays hidden), with a witness-bound nullifier Nf = x_rx·H
            { sigma_verify: [ringProposition, { var: "event.proof" }, { var: "event.message" }] },
            // 2. Schedule II: one script, one fill — the nullifier must be fresh
            { "!": [{ has: [{ var: "state.spentNullifiers" }, { var: "event.nullifier" }] }] },
            // 3. the dispensing pharmacy is signed into the proof (anti-hijack message binding)
            {
              "===": [
                { var: "event.message" },
                { cat: ["0x", { substr: [{ var: "event.nullifier" }, 2] }, { substr: [{ var: "event.pharmacyHex" }, 2] }] },
              ],
            },
          ],
        },
        effect: {
          merge: [
            { var: "state" },
            {
              spentNullifiers: { set: [{ var: "state.spentNullifiers" }, { var: "event.nullifier" }, true] },
              fills: { "+": [{ var: "state.fills" }, 1] },
              lastFillAt: { var: "$ordinal" },
            },
          ],
        },
        dependencies: [],
      },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// §7 assemble: sigma proofs, oracle checks, guard dress-rehearsal, emission
// ═════════════════════════════════════════════════════════════════════════════

function assemble(m5: ReturnType<typeof buildM5Sequence>) {
  console.log("§7 assemble");
  const b1 = readBundle("m5-visit-1");
  const b2 = readBundle("m5-visit-2");
  const bTrue = readBundle("prior-auth-true");
  const bFalse = readBundle("prior-auth-false");

  // ── bundle assertions: proven public values match the TS predictions ────────
  assertEq(b1.publicValues.toLowerCase(), m5.steps[0].predictedPv, "m5-visit-1 pv == prediction");
  assertEq(b2.publicValues.toLowerCase(), m5.steps[1].predictedPv, "m5-visit-2 pv == prediction");
  assertEq(b1.vkey, b2.vkey, "M5 vkey stable across transitions");
  const pvTrue = stripHex(bTrue.publicValues);
  const pvFalse = stripHex(bFalse.publicValues);
  assertEq("0x" + pvTrue.slice(0, 64), PRIOR_AUTH_LOGIC_HASH, "prior-auth-true exprHash == logicHash");
  assertEq("0x" + pvTrue.slice(64, 128), keccakCanonical(m5.states[2]), "prior-auth-true dataHash == keccak(canonical(s2))");
  assertEq("0x" + pvTrue.slice(128, 192), KECCAK_TRUE, "prior-auth-true outputHash == keccak(true)");
  assertEq("0x" + pvFalse.slice(128, 192) !== KECCAK_TRUE, true, "prior-auth-false outputHash != keccak(true)");
  assertEq(bTrue.vkey, bFalse.vkey, "zk-jlvm vkey stable across data");
  for (const [n, b] of [["m5-visit-1", b1], ["m5-visit-2", b2], ["prior-auth-true", bTrue], ["prior-auth-false", bFalse]] as const) {
    assertEq(apply({ groth16_verify: [b.vkey, b.publicValues, b.proof] }, {}), true, `groth16_verify(${n})`);
  }

  // ── Act 3: EPCS THRESHOLD(2-of-3) co-signs, bound to (publicValues ‖ rxId) ──
  const factorSecrets = [0, 1, 2].map((i) => scalarFromDomain(`riverdale-health:dr-adams:epcs-factor${i}:v1`));
  const factorPks = factorSecrets.map((f) => G.multiply(f));
  const msgGood = "0x" + pvTrue + stripHex(RX_ID);
  const msgFalseBound = "0x" + pvFalse + stripHex(RX_ID);
  // factor 2 is the prescriber's LOST factor — simulated branch (that's the point of 2-of-3)
  const secretsUsed: (bigint | null)[] = [factorSecrets[0], factorSecrets[1], null];
  const cosignGood = proveThresholdDlog(2, secretsUsed, factorPks, hexToBytes(msgGood), "riverdale-health:cosign-good:v1");
  const cosignFalseBound = proveThresholdDlog(2, secretsUsed, factorPks, hexToBytes(msgFalseBound), "riverdale-health:cosign-falsebound:v1");
  assertEq(apply({ sigma_verify: [cosignGood.proposition, cosignGood.proof, msgGood] }, {}), true, "sigma_verify(cosign good)");
  assertEq(apply({ sigma_verify: [cosignFalseBound.proposition, cosignFalseBound.proof, msgFalseBound] }, {}), true, "sigma_verify(cosign false-bound)");
  // tampered co-sign: flip the last nibble of child 0's response ⇒ must verify false
  const tampered = JSON.parse(JSON.stringify(cosignGood.proof));
  tampered.children[0].z = tampered.children[0].z.slice(0, -1) + (tampered.children[0].z.endsWith("0") ? "1" : "0");
  assertEq(applySafe({ sigma_verify: [cosignGood.proposition, tampered, msgGood] }, {}), false, "sigma_verify(cosign tampered) == false");

  // ── Act 4: dispensing ring (OR-of-dhtuple) — Nf = x_rx·H ────────────────────
  const H = deriveNumsH();
  const ringSecrets = [
    scalarFromDomain("riverdale-health:ring-decoy0:v1"),
    scalarFromDomain("riverdale-health:rx-secret:v1"), // the REAL prescription secret, j=1
    scalarFromDomain("riverdale-health:ring-decoy2:v1"),
    scalarFromDomain("riverdale-health:ring-decoy3:v1"),
  ];
  const J = 1;
  const ringPoints = ringSecrets.map((x) => G.multiply(x));
  const Nf = H.multiply(ringSecrets[J]);
  const NfHex = encodeG1Hex(Nf);
  const fillMessage = "0x" + stripHex(NfHex) + stripHex(PHARMACY_CORNER_HEX);
  const ring = proveOrDhtuple(H, ringPoints, J, ringSecrets[J], Nf, hexToBytes(fillMessage), "riverdale-health:fill:v1");
  const ringProposition = {
    type: "or",
    children: ringPoints.map((pt) => ({ type: "dhtuple", g: encodeG1Hex(G), h: encodeG1Hex(H), u: encodeG1Hex(pt), v: NfHex })),
  };
  assertEq(apply({ sigma_verify: [ringProposition, ring.proof, fillMessage] }, {}), true, "sigma_verify(fill ring)");

  // ── definitions + initial data ───────────────────────────────────────────────
  const recordDef = recordDefinition();
  const recordInitial = {
    recordId: "MRN-RIVERDALE-BLAKE-001",
    vkey: b1.vkey,
    exprHash: MEDICAL_EXPR_HASH,
    knownRoots: [hex32(m5.root0)],
    nullifiers: {},
    commitments: [hex32(m5.cm0)],
    currentRoot: hex32(m5.root0),
    leafCount: 1,
    transitions: 0,
  };
  const rxDef = rxDefinition(bTrue.vkey, factorPks);
  const rxInitial = {
    rxId: RX_ID,
    drug: "oxycodone 5mg",
    scheduleClass: "II",
    rxPubKey: encodeG1Hex(ringPoints[J]),
    status: "draft",
  };
  const dispenseDef = dispenseDefinition(H, 4);
  const dispenseInitial = {
    logId: "SCHED2-DISPENSE-RIVERDALE-001",
    scheduleClass: "II",
    nullifierBaseH: encodeG1Hex(H),
    rxPoints: ringPoints.map(encodeG1Hex),
    spentNullifiers: {},
    fills: 0,
  };

  // ── event payloads ───────────────────────────────────────────────────────────
  const visitEvent = (step: M5Step, b: Bundle) => ({
    eventName: "update",
    payload: {
      publicValues: b.publicValues,
      proof: b.proof,
      newRoot: hex32(step.newRoot),
      newSiblings: step.newSiblings.map(hex32),
    },
  });
  const ev1 = visitEvent(m5.steps[0], b1);
  const ev2 = visitEvent(m5.steps[1], b2);
  const evAuthorize = {
    eventName: "authorize",
    payload: { publicValues: bTrue.publicValues, proof: bTrue.proof, cosignMessage: msgGood, cosignProof: cosignGood.proof },
  };
  const evAuthorizeUnder = {
    eventName: "authorize",
    payload: { publicValues: bFalse.publicValues, proof: bFalse.proof, cosignMessage: msgFalseBound, cosignProof: cosignFalseBound.proof },
  };
  const evAuthorizeBadCosign = {
    eventName: "authorize",
    payload: { publicValues: bTrue.publicValues, proof: bTrue.proof, cosignMessage: msgGood, cosignProof: tampered },
  };
  const evFill = {
    eventName: "fill",
    payload: { proof: ring.proof, nullifier: NfHex, pharmacyHex: PHARMACY_CORNER_HEX, message: fillMessage },
  };

  // ── GUARD DRESS-REHEARSAL: evaluate the EXACT emitted guards/effects through
  //    the parity evaluator with the exact on-chain context shape ──────────────
  console.log("  guard dress-rehearsal (real evaluator, real guards):");
  const guardOf = (def: any) => def.transitions[0].guard;
  const effectOf = (def: any) => def.transitions[0].effect;

  // Act 1 t1 accept, then t2 accept on the EFFECT-advanced state, then t2 replay reject
  let recState: any = recordInitial;
  assertEq(apply(guardOf(recordDef), { state: recState, event: ev1.payload }), true, "record guard(visit-1)");
  recState = apply(effectOf(recordDef), { state: recState, event: ev1.payload, $ordinal: 11 });
  assertEq(recState.leafCount, 2, "record effect advanced leafCount");
  assertEq(apply(guardOf(recordDef), { state: recState, event: ev2.payload }), true, "record guard(visit-2)");
  recState = apply(effectOf(recordDef), { state: recState, event: ev2.payload, $ordinal: 12 });
  assertEq(applySafe(guardOf(recordDef), { state: recState, event: ev2.payload }), false, "record guard(visit-2 REPLAY) == false");

  // Act 2+3 accept + both rejects
  assertEq(apply(guardOf(rxDef), { state: rxInitial, event: evAuthorize.payload }), true, "rx guard(authorize)");
  assertEq(applySafe(guardOf(rxDef), { state: rxInitial, event: evAuthorizeUnder.payload }), false, "rx guard(underdocumented) == false");
  assertEq(applySafe(guardOf(rxDef), { state: rxInitial, event: evAuthorizeBadCosign.payload }), false, "rx guard(bad cosign) == false");
  const rxAfter: any = apply(effectOf(rxDef), { state: rxInitial, event: evAuthorize.payload, $ordinal: 21 });
  assertEq(rxAfter.priorAuthDataHash, "0x" + pvTrue.slice(64, 128), "rx effect pinned priorAuthDataHash");

  // Act 4 accept + double-fill reject
  assertEq(apply(guardOf(dispenseDef), { state: dispenseInitial, event: evFill.payload }), true, "dispense guard(fill)");
  const dispAfter = apply(effectOf(dispenseDef), { state: dispenseInitial, event: evFill.payload, $ordinal: 31 });
  assertEq(applySafe(guardOf(dispenseDef), { state: dispAfter, event: evFill.payload }), false, "dispense guard(DOUBLE fill) == false");

  // ── emit ─────────────────────────────────────────────────────────────────────
  console.log("  emitting e2e files…");
  const J2 = (x: unknown) => JSON.stringify(x, null, 2) + "\n";
  writeFileSync(join(OUT_DIR, "record.definition.json"), J2(recordDef));
  writeFileSync(join(OUT_DIR, "record.initial.json"), J2(recordInitial));
  writeFileSync(join(OUT_DIR, "rx.definition.json"), J2(rxDef));
  writeFileSync(join(OUT_DIR, "rx.initial.json"), J2(rxInitial));
  writeFileSync(join(OUT_DIR, "dispense.definition.json"), J2(dispenseDef));
  writeFileSync(join(OUT_DIR, "dispense.initial.json"), J2(dispenseInitial));

  const eventFile = (note: string, ev: unknown) =>
    `// AUTO-GENERATED by ottochain-sdk/scripts/gen-health-fixtures.ts — do not edit by hand.\n// ${note}\nexport default () => (${JSON.stringify(ev, null, 2)});\n`;
  writeFileSync(join(OUT_DIR, "event-visit-1.ts"), eventFile(
    "Act 1: private chart update #1 (failed gabapentin trial). zk-jlvm-shielded (M5) Groth16 proof; the chain sees only anchor|nullifier|newCommitment|exprHash.", ev1));
  writeFileSync(join(OUT_DIR, "event-visit-2.ts"), eventFile(
    "Act 1: private chart update #2 (failed duloxetine trial). Now failedFirstLine=2 in the HIDDEN state.", ev2));
  writeFileSync(join(OUT_DIR, "event-visit-2-replay.ts"), eventFile(
    "Act 1 reject: the IDENTICAL visit-2 update replayed — its note nullifier is already spent, has(nullifiers, nf) denies it => ml0 reject.", ev2));
  writeFileSync(join(OUT_DIR, "event-authorize.ts"), eventFile(
    "Acts 2+3: REAL fail-first proof over the private chart (rule true on s2) + EPCS THRESHOLD(2-of-3) co-sign bound to (publicValues ‖ rxId).", evAuthorize));
  writeFileSync(join(OUT_DIR, "event-authorize-underdocumented.ts"), eventFile(
    "Act 2 reject: proof over s1 (only ONE documented failure) — groth16_verify passes but outputHash != keccak256(true) => guard denies => ml0 reject.", evAuthorizeUnder));
  writeFileSync(join(OUT_DIR, "event-authorize-badcosign.ts"), eventFile(
    "Act 3 reject: valid prior-auth proof but a TAMPERED co-sign (flipped z nibble) — sigma_verify false => ml0 reject.", evAuthorizeBadCosign));
  writeFileSync(join(OUT_DIR, "event-fill.ts"), eventFile(
    `Act 4: pharmacy-corner fills the prescription. CDS OR-of-dhtuple ring proof over the cohort (real branch hidden, j=${J}); Nf = x_rx·H is witness-bound; message = Nf ‖ pharmacyHex.`, evFill));
  writeFileSync(join(OUT_DIR, "event-fill-double.ts"), eventFile(
    "Act 4 reject (Schedule II: one script, one fill): the SAME fill presented again (pharmacy-mainst) — has(spentNullifiers, Nf) denies it => ml0 reject.", evFill));

  // example.json — the 5-act storyline. One sequential flow: each e2e flow runs on freshly
  // created fibers and flows fan out in parallel, so the stateful storyline must be one flow
  // (the sigma-mixer lesson). Emitted here because two audit assertions pin fixture literals.
  const example = {
    name: "Riverdale Health (ZK medical privacy: shielded chart, prior-auth proof, EPCS co-sign, anti-double-fill)",
    description:
      "A controlled-substance prescription lifecycle where every guarantee is enforced on-chain: " +
      "(1) patient-blake's medical record lives as SHIELDED state — two visits update it privately via " +
      "zk-jlvm-shielded (M5) Groth16 proofs (the JLVM effect runs INSIDE the SP1 guest; the chain sees only " +
      "anchor|nullifier|newCommitment|exprHash, never the chart), with replay of a spent note denied by the " +
      "nullifier map; (2) prior authorization is a zk-jlvm proof that the HIDDEN history satisfies the pinned " +
      "fail-first rule (>=2 failed first-line treatments AND no active opioid Rx) — groth16_verify + " +
      "exprHash/outputHash binding, an under-documented chart is rejected; (3) the DEA-EPCS-style co-sign is a " +
      "CDS THRESHOLD(2-of-3 dlog) sigma_verify over the prescriber's registered factors, message-bound to " +
      "(publicValues ‖ rxId) so it attests to exactly this proof for exactly this prescription; (4) Schedule II " +
      "one-script-one-fill: the fill is an OR-of-dhtuple ring proof (which prescription stays hidden) with a " +
      "witness-bound nullifier — the second pharmacy presenting the same fill is denied by has(spentNullifiers); " +
      "(5) audit without dragnet: light-client state proofs verified via the REAL mpt_verify opcode against the " +
      "consensus-signed committed root. All SP1 bundles are REAL GPU-generated Groth16 proofs " +
      "(fixture-manifest.json records provenance); sigma proofs are real BN254 CDS transcripts verified through " +
      "the sigma_verify opcode before check-in.",
    type: "state-machine",
    definition: "record.definition.json",
    initialData: "record.initial.json",
    testFlows: [
      {
        name: "Controlled-substance lifecycle — chart, prior-auth, co-sign, fill, audit",
        description:
          "ONE sequential flow driving three fibers: the shielded medical record (patient-owned), the " +
          "prescription (doctor+patient), and the shared dispensing log (the decentralized-PDMP stand-in). " +
          "Reject paths are exercised inline: shielded-history replay, under-documented prior-auth, tampered " +
          "co-sign, and the Schedule II double-fill.",
        steps: [
          { action: "phase", label: "Act 1 — The chart: shielded medical history (Kachina-class private state)" },
          { action: "create", as: "record", definition: "record.definition.json", initialData: "record.initial.json", signers: ["patient-blake"] },
          { action: "processEvent", fiber: "record", event: "event-visit-1.ts", expectedState: "ACTIVE", signers: ["patient-blake"] },
          { action: "processEvent", fiber: "record", event: "event-visit-2.ts", expectedState: "ACTIVE", signers: ["patient-blake"] },
          { action: "processEvent", fiber: "record", event: "event-visit-2-replay.ts", expectRejected: "ml0", signers: ["patient-blake"] },
          { action: "phase", label: "Acts 2+3 — Prior auth over the HIDDEN history + EPCS THRESHOLD(2-of-3) co-sign" },
          { action: "create", as: "rx", definition: "rx.definition.json", initialData: "rx.initial.json", signers: ["dr-adams", "patient-blake"] },
          { action: "processEvent", fiber: "rx", event: "event-authorize-underdocumented.ts", expectRejected: "ml0", signers: ["dr-adams"] },
          { action: "processEvent", fiber: "rx", event: "event-authorize-badcosign.ts", expectRejected: "ml0", signers: ["dr-adams"] },
          { action: "processEvent", fiber: "rx", event: "event-authorize.ts", expectedState: "authorized", signers: ["dr-adams"] },
          { action: "phase", label: "Act 4 — One script, one fill (Schedule II nullifier; no central PDMP)" },
          { action: "create", as: "pdmp", definition: "dispense.definition.json", initialData: "dispense.initial.json", signers: ["auditor-dea"] },
          { action: "processEvent", fiber: "pdmp", event: "event-fill.ts", expectedState: "open", signers: ["pharmacy-corner"] },
          { action: "processEvent", fiber: "pdmp", event: "event-fill-double.ts", expectRejected: "ml0", signers: ["pharmacy-mainst"] },
          { action: "phase", label: "Act 5 — Audit without dragnet: light-client proofs vs the consensus-signed root" },
          { action: "assertStateProof", fiber: "rx", field: "priorAuthDataHash", expectedFieldValue: "0x" + pvTrue.slice(64, 128), label: "the prescription pins the proven history's dataHash" },
          { action: "assertStateProof", fiber: "record", field: "currentRoot", expectedFieldValue: hex32(m5.steps[1].newRoot), label: "the record's commitment-tree root is committed on-chain" },
        ],
      },
    ],
  };
  writeFileSync(join(OUT_DIR, "example.json"), J2(example));

  const gitSha = (dir: string) => {
    try { return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return "unknown"; }
  };
  writeFileSync(join(OUT_DIR, "fixture-manifest.json"), J2({
    generator: "ottochain-sdk/scripts/gen-health-fixtures.ts",
    metakitSdkCommit: gitSha(METAKIT_SDK),
    m5: {
      vkey: b1.vkey,
      exprHash: MEDICAL_EXPR_HASH,
      effectExpr: MEDICAL_EFFECT,
      treeDepth: DEPTH,
      roots: [hex32(m5.root0), hex32(m5.steps[0].newRoot), hex32(m5.steps[1].newRoot)],
      commitments: [hex32(m5.cm0), hex32(m5.steps[0].newCm), hex32(m5.steps[1].newCm)],
      nullifiers: m5.steps.map((s) => hex32(s.nf)),
      note: "wire witnesses (the private chart) committed under fixtures/ for provenance; in production these never leave the client",
    },
    priorAuth: {
      vkey: bTrue.vkey,
      rule: PRIOR_AUTH_RULE,
      logicHash: PRIOR_AUTH_LOGIC_HASH,
      keccakTrue: KECCAK_TRUE,
      dataHashTrue: "0x" + pvTrue.slice(64, 128),
      dataHashFalse: "0x" + pvFalse.slice(64, 128),
    },
    epcsCosign: {
      k: 2, n: 3,
      factorPks: factorPks.map(encodeG1Hex),
      simulatedFactor: 2,
      messageGood: msgGood,
      derivation: "factor secrets from sha256('riverdale-health:dr-adams:epcs-factor{i}:v1') low-31",
    },
    dispensing: {
      G: encodeG1Hex(G),
      H: encodeG1Hex(H),
      derivationH: "try-and-increment hash-to-curve over SHA256('riverdale-health:rx-nullifier-base:v1')",
      rxPoints: ringPoints.map(encodeG1Hex),
      realBranch: J,
      nullifier: NfHex,
      pharmacyHex: PHARMACY_CORNER_HEX,
      message: fillMessage,
    },
    rxId: RX_ID,
  }));

  console.log("\n✅ all artifacts verified through the real VM; files written to");
  console.log("  ", OUT_DIR);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

function main() {
  console.log("=== riverdale-health fixture generation ===\n");
  mkdirSync(FIXTURES_DIR, { recursive: true });
  selfTestAgainstM5Fixture();
  const m5 = buildM5Sequence();

  if (MODE === "prove" || MODE === "all") {
    console.log("§4 GPU proving");
    for (const step of m5.steps) {
      if (bundleReady(`m5-${step.name}`)) { console.log(`  m5-${step.name}: bundle already verified — skip`); continue; }
      proveM5(step);
    }
    if (bundleReady("prior-auth-true")) console.log("  prior-auth-true: bundle already verified — skip");
    else proveJlvm("prior-auth-true", canonical(PRIOR_AUTH_RULE), canonical(m5.states[2]));
    if (bundleReady("prior-auth-false")) console.log("  prior-auth-false: bundle already verified — skip");
    else proveJlvm("prior-auth-false", canonical(PRIOR_AUTH_RULE), canonical(m5.states[1]));
  }
  if (MODE === "assemble" || MODE === "all") {
    for (const n of ["m5-visit-1", "m5-visit-2", "prior-auth-true", "prior-auth-false"]) {
      if (!existsSync(bundlePath(n))) throw new Error(`missing bundle ${n}.json — run 'prove' first`);
    }
    assemble(m5);
  }
}

main();
