/**
 * Driving the SP1 zk-jlvm host (`rust/zk-jlvm/script`, `--mode groth16`) to produce a
 * {@link Groth16Bundle} from a JLVM `expr` + `data`.
 *
 * THE load-bearing step: the host's guest hashes the RAW `--expr` / `--data` strings
 * (`exprHash = keccak256(expr_bytes)`), so this driver feeds it `canonicalForSigning(expr)` /
 * `canonicalForSigning(data)`. That makes a proof's `exprHash` word equal {@link exprHash}`(rule)`
 * equal a policy's `logicHash` — without it the binding silently never matches.
 *
 * Proving is heavy (SP1; minutes, optionally `SP1_PROVER=cuda`) and needs the Rust toolchain, so this
 * is an out-of-process driver, not an in-SDK prover. Point it at a prebuilt `binaryPath`, or at the
 * crate via `cargoManifestPath`; configure either explicitly or through `ZK_JLVM_BIN` /
 * `ZK_JLVM_MANIFEST` env vars.
 */
import { canonicalForSigning } from './preimage';
import type { Groth16Bundle } from './types';

/** A request to prove that evaluating `expr` over `data` yields a result (raw JSON — canonicalized here). */
export interface Groth16ProveRequest {
  /** The JLVM rule (plain JSON). Canonicalized before it reaches the prover. */
  expr: unknown;
  /** The (private) data context (plain JSON). Canonicalized before it reaches the prover. */
  data: unknown;
}

/** Produces SP1-Groth16 bundles for the semi-private tier. Swap implementations in tests. */
export interface ZkProver {
  proveGroth16(req: Groth16ProveRequest): Promise<Groth16Bundle>;
}

/** Configuration for {@link SubprocessProver}. Provide a binary OR a cargo manifest (binary wins). */
export interface SubprocessProverOptions {
  /** Path to a prebuilt zk-jlvm host binary. Defaults to `ZK_JLVM_BIN`. */
  binaryPath?: string;
  /** Path to the zk-jlvm `script` crate's `Cargo.toml` (run via `cargo run --release`). Defaults to `ZK_JLVM_MANIFEST`. */
  cargoManifestPath?: string;
  /** Extra environment for the child (e.g. `{ SP1_PROVER: 'cuda' }`). Merged over `process.env`. */
  env?: Record<string, string>;
  /** Working directory for the child process. */
  cwd?: string;
  /** Hard timeout in ms. Default 1_800_000 (30 min) — SP1 Groth16 wrapping is slow. */
  timeoutMs?: number;
}

const reLine = (label: string): RegExp => new RegExp(`^${label}:\\s*(0x[0-9a-fA-F]+)\\s*$`, 'm');

/** Parse the host's `vkey:` / `public values:` / `proof bytes:` stdout lines into a bundle. */
export function parseGroth16Stdout(stdout: string): Groth16Bundle {
  const grab = (label: string, key: string): `0x${string}` => {
    const m = stdout.match(reLine(label));
    if (!m) throw new Error(`zk-jlvm host produced no "${label}:" line (could not read ${key})`);
    return m[1].toLowerCase() as `0x${string}`;
  };
  return {
    vkey: grab('vkey', 'vkey'),
    publicValues: grab('public values', 'publicValues'),
    proof: grab('proof bytes', 'proof'),
  };
}

/** Drives the zk-jlvm host out-of-process. */
export class SubprocessProver implements ZkProver {
  constructor(private readonly opts: SubprocessProverOptions = {}) {}

  async proveGroth16(req: Groth16ProveRequest): Promise<Groth16Bundle> {
    // Canonicalize BEFORE proving so exprHash/dataHash bind the same bytes the chain signs over.
    const expr = canonicalForSigning(req.expr);
    const data = canonicalForSigning(req.data);
    const modeArgs = ['--mode', 'groth16', '--expr', expr, '--data', data];

    const binaryPath = this.opts.binaryPath ?? process.env.ZK_JLVM_BIN;
    const manifest = this.opts.cargoManifestPath ?? process.env.ZK_JLVM_MANIFEST;

    let command: string;
    let args: string[];
    if (binaryPath) {
      command = binaryPath;
      args = modeArgs;
    } else if (manifest) {
      command = 'cargo';
      args = ['run', '--release', '--manifest-path', manifest, '--', ...modeArgs];
    } else {
      throw new Error(
        'SubprocessProver: set `binaryPath` (or ZK_JLVM_BIN), or `cargoManifestPath` (or ZK_JLVM_MANIFEST)',
      );
    }

    const stdout = await this.run(command, args);
    return parseGroth16Stdout(stdout);
  }

  private run(command: string, args: string[]): Promise<string> {
    const { env, cwd, timeoutMs = 1_800_000 } = this.opts;
    // Lazy-load child_process so importing the zk slice stays light for non-proving consumers.
    return import('node:child_process').then(
      ({ spawn }) =>
        new Promise<string>((resolve, reject) => {
          // argv (no shell) — `expr`/`data` are JSON with quotes/braces; never interpolate into a shell.
          const child = spawn(command, args, {
            cwd,
            env: { ...process.env, ...env },
            timeout: timeoutMs,
          });
          let out = '';
          let err = '';
          child.stdout.on('data', (d) => (out += d.toString()));
          child.stderr.on('data', (d) => (err += d.toString()));
          child.on('error', reject);
          child.on('close', (code) => {
            if (code === 0) resolve(out);
            else reject(new Error(`zk-jlvm host exited ${code}: ${err.trim() || out.trim()}`));
          });
        }),
    );
  }
}
