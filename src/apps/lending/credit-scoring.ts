/**
 * Credit scoring via the identity + reputation app.
 *
 * A zk-loan's `creditScore` is NOT a self-asserted number — it is the borrower's on-chain identity
 * REPUTATION, derived from their {@link Attestation} deltas (the identity app's reputation model:
 * `baseReputation + Σ delta`, floored at `minReputation`). This module is the wire between the two
 * apps: it computes the reputation-backed score, pins a lending rule that BINDS the score to a
 * specific borrower identity (so a borrower cannot prove eligibility against someone else's
 * reputation), and assembles the PRIVATE data context the borrower proves it over.
 *
 * Privacy boundary: the exact `creditScore` and `collateralValue` stay private (their keccak is the
 * proof's `dataHash`); the `subject` (borrower identity) and the bounds are PUBLIC (pinned in the
 * rule's `logicHash`). The zk proof attests "borrower X's reputation-backed score ≥ floor and
 * collateral coverage ≥ ratio" without revealing the score or the holdings.
 *
 * Trust model: the proof binds the score to the borrower's identity, but the borrower supplies the
 * score value. When reputation attestations are PUBLIC on-chain, a verifier can independently
 * recompute the score and check the proof used it; when reputation is PRIVATE (off-chain / held
 * credentials) the score is genuinely hidden. To make the score AUTHORITY-attested in zero knowledge
 * (the strongest form), have the SP1 rule additionally `schnorr_verify` the reputation issuer's
 * signature over `(subject, score)` — see {@link reputationAuthorityClause}.
 */
import {
  Attestation,
  ReputationConfig,
  DEFAULT_REPUTATION_CONFIG,
} from "../identity/index.js";
import { lendingRule, type LendingRuleParams, type JsonLogicRule } from "./eligibility.js";

/** The reputation config fields credit scoring needs (a subset of the identity {@link ReputationConfig}). */
export type CreditScoreConfig = Pick<ReputationConfig, "baseReputation" | "minReputation">;

/**
 * Derive an agent's credit score from their identity reputation attestations:
 * `baseReputation + Σ attestation.delta`, floored at `minReputation`. This IS the integration point —
 * a zk-loan's creditScore is the borrower's identity reputation, not an independent number.
 */
export function reputationScore(
  attestations: ReadonlyArray<Pick<Attestation, "delta">>,
  config: CreditScoreConfig = DEFAULT_REPUTATION_CONFIG,
): number {
  const raw = attestations.reduce((sum, a) => sum + (a.delta ?? 0), config.baseReputation);
  return Math.max(config.minReputation, raw);
}

/** Params for a reputation-bound credit rule: the lending params plus the borrower identity it pins. */
export interface ReputationCreditParams extends LendingRuleParams {
  /** The borrower's identity (agent id / DID) the proven reputation score must belong to. */
  borrowerId: string;
}

/** The PRIVATE data context a borrower proves a reputation-credit rule over (only `subject` is public). */
export interface CreditDataContext {
  /** PRIVATE — the borrower's collateral value. */
  collateralValue: number;
  /** PRIVATE — the borrower's reputation-derived credit score. */
  creditScore: number;
  /** PUBLIC — the borrower identity the score is bound to (pinned in the rule). */
  subject: string;
}

/**
 * The PUBLIC reputation-credit lending rule. Extends {@link lendingRule} (collateral coverage +
 * optional credit-score floor) with a SUBJECT binding `subject === borrowerId`, so the proven score
 * belongs to a specific identity — a borrower cannot prove eligibility against another agent's
 * reputation. `borrowerId` and all bounds are literals, so pinning the rule pins them.
 */
export function reputationCreditRule(params: ReputationCreditParams): JsonLogicRule {
  const base = lendingRule(params); // coverage, or {and:[coverage, creditScore floor]}
  const subjectBound: JsonLogicRule = { "===": [{ var: "subject" }, params.borrowerId] };
  const clauses = "and" in base ? (base.and as unknown[]) : [base];
  return { and: [...clauses, subjectBound] };
}

/**
 * Assemble the PRIVATE data context the borrower feeds to the zk-jlvm prover: the `creditScore` is
 * their identity {@link reputationScore}, the `subject` is their identity. Only its keccak (`dataHash`)
 * becomes public.
 */
export function buildCreditDataContext(args: {
  borrowerId: string;
  attestations: ReadonlyArray<Pick<Attestation, "delta">>;
  collateralValue: number;
  config?: CreditScoreConfig;
}): CreditDataContext {
  return {
    collateralValue: args.collateralValue,
    creditScore: reputationScore(args.attestations, args.config ?? DEFAULT_REPUTATION_CONFIG),
    subject: args.borrowerId,
  };
}

/**
 * OPTIONAL hardening — an authority-attested credit clause. ANDed into a rule, it makes the SP1 guest
 * verify (in zero knowledge) the reputation issuer's Schnorr signature over the score, so the score is
 * not merely borrower-supplied but ATTESTED. `pubKey`/the signed message are bound in the private data
 * context (`repPubKey`, `repSig`, and a `scoreCommit` the message covers); the issuer key is pinned
 * public. Returns the `schnorr_verify` clause to AND into {@link reputationCreditRule}'s output.
 *
 * NOTE: producing a real signature + proof is required to exercise this end-to-end; the builder pins
 * the structure so the on-chain rule and the prover agree. See the JLVM `schnorr_verify` opcode.
 */
export function reputationAuthorityClause(): JsonLogicRule {
  return {
    schnorr_verify: [
      { var: "repPubKey" }, // the reputation authority's public key (pinned in the data context)
      { var: "scoreCommit" }, // the signed message: a commitment over (subject, creditScore)
      { var: "repSig" }, // the authority's signature over scoreCommit
    ],
  };
}
