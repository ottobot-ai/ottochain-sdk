# Lending — privacy-preserving credit

The semi-private tier in action: a borrower proves they qualify for a collateralized loan **without
revealing their collateral or exact credit score**. The credit score is the borrower's on-chain
identity reputation; the proof binds it to a public, pinned lending rule.

| Example | What it shows |
|---------|---------------|
| [`zk-loan.ts`](./zk-loan.ts) | reputation → pinned rule → private data context → SP1-Groth16 eligibility proof → client-side verify (accept + tamper-reject) → origination guard + witness → proof-gated debt mint |

```bash
npx tsx examples/lending/zk-loan.ts
```

Steps 1–3 and 6–7 are pure construction (no network). Steps 4–5 verify a **real** SP1-Groth16 proof
entirely client-side — no cluster, no prover toolchain. To prove a fresh rule live, swap the bundled
fixture for `new SubprocessProver({ cargoManifestPath }).proveGroth16({ expr: rule, data })` (drives
`rust/zk-jlvm --mode groth16`; canonicalizes first so the proof's `exprHash` matches the rule's `logicHash`).

## How it maps on-chain

The client-side `verifySemiPrivate` is the exact mirror of the on-chain guard: `groth16_verify` over the
proof, then binding the public-values words (`exprHash == logicHash`, `outputHash == keccak256("true")`)
parsed with native `substr`/`cat`. See `@ottochain/sdk/zk` and the ottochain `SemiPrivateGuard`.

> **Audit:** metakit's `groth16_verify` is unaudited — a semi-private guard must not protect real value until it is.
