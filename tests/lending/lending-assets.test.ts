/**
 * Tests for the lending ↔ asset-subsystem integration: policy builders, the op payload
 * wire shapes (single-key-wrapper, like src/ottochain/transaction.ts), and the lifecycle →
 * morphism drivers (lock collateral, mint principal, repay-burn, settle collateral).
 */
import { describe, expect, it } from '@jest/globals';
import {
  behaviorBits,
  TokenBehaviors,
  walletHolder,
  fiberHolder,
  collateralPolicy,
  debtPolicy,
  createMintAssetPayload,
  createApplyMorphismPayload,
  createAuthorizeComposePayload,
  createAssetPolicyPayload,
  lockCollateralOp,
  mintPrincipalOp,
  repayBurnOp,
  settleCollateralOp,
} from '../../src/apps/lending';
import { buildOriginationGuard } from '../../src/apps/lending';

describe('token behavior bit-packing', () => {
  it('packs the 5-bit lattice (T=16 S=8 C=4 E=2 G=1)', () => {
    expect(behaviorBits(TokenBehaviors.Soulbound)).toBe(0);
    expect(behaviorBits(TokenBehaviors.NFT)).toBe(16);
    expect(behaviorBits(TokenBehaviors.GovernedFungible)).toBe(29); // T+S+G = 16+8+1
  });
});

describe('holders', () => {
  it('builds the two-variant AssetHolder', () => {
    expect(walletHolder('DAG123')).toEqual({ Wallet: { address: 'DAG123' } });
    expect(fiberHolder('uuid-escrow')).toEqual({ Fiber: { fiberId: 'uuid-escrow' } });
  });
});

describe('asset op payloads (single-key wrapper)', () => {
  it('createMintAssetPayload nests under MintAsset and carries the witness', () => {
    const msg = createMintAssetPayload({
      assetId: 'debt-1',
      policyRef: { name: 'loan-debt-v1.asset', version: { Latest: {} } },
      holder: walletHolder('DAGborrower'),
      amount: 1000,
      witness: { publicValues: '0x00', proof: '0x00' },
    });
    expect(Object.keys(msg)).toEqual(['MintAsset']);
    expect(msg.MintAsset.holder).toEqual({ Wallet: { address: 'DAGborrower' } });
    expect(msg.MintAsset.amount).toBe(1000);
    expect(msg.MintAsset.witness).toEqual({ publicValues: '0x00', proof: '0x00' });
  });

  it('createApplyMorphismPayload nests under ApplyMorphism and omits empty optionals', () => {
    const msg = createApplyMorphismPayload({
      assetId: 'collat-1',
      kind: 'Transfer',
      recipient: fiberHolder('escrow-1'),
      targetSequenceNumber: 0,
    });
    expect(Object.keys(msg)).toEqual(['ApplyMorphism']);
    expect(msg.ApplyMorphism.kind).toBe('Transfer');
    expect(msg.ApplyMorphism.recipient).toEqual({ Fiber: { fiberId: 'escrow-1' } });
    // unused optionals are omitted (proposal invariant: no null defaults)
    expect(msg.ApplyMorphism).not.toHaveProperty('otherAssets');
    expect(msg.ApplyMorphism).not.toHaveProperty('compositeId');
    expect(msg.ApplyMorphism).not.toHaveProperty('witness');
  });

  it('createAuthorizeComposePayload + createAssetPolicyPayload nest under their op keys', () => {
    const auth = createAuthorizeComposePayload({
      assetId: 'a',
      partnerPolicy: 'p.asset',
      nonce: 1,
      expiresAt: 100,
      targetSequenceNumber: 0,
    });
    expect(Object.keys(auth)).toEqual(['AuthorizeCompose']);

    const pol = createAssetPolicyPayload(collateralPolicy());
    expect(Object.keys(pol)).toEqual(['CreateAssetPolicy']);
    expect(pol.CreateAssetPolicy.name).toBe('collateral-vault-v1.asset');
  });
});

describe('loan asset policies', () => {
  it('collateral policy is a governed, non-splittable custodial holding with a Governed Transfer', () => {
    const p = collateralPolicy();
    expect(p.behavior.splittable).toBe(false);
    expect(p.behavior.governable).toBe(true);
    expect(p.morphisms.Transfer?.visibility).toBe('Governed'); // escrow fiber authorizes
    expect(p.morphisms.Burn?.visibility).toBe('Disabled');
  });

  it('debt policy uses the origination guard as the proof-gated mintPolicy', () => {
    const guard = buildOriginationGuard();
    const p = debtPolicy(guard);
    expect(behaviorBits(p.behavior)).toBe(29); // GovernedFungible
    // The mintPolicy IS the eligibility gate — principal mints only if the proof verifies.
    expect(p.supply.mintPolicy).toBe(guard);
    expect(JSON.stringify(p.supply.mintPolicy)).toContain('groth16_verify');
    // Repayment burns the debt.
    expect(p.morphisms.Burn?.visibility).toBe('Public');
    expect(p.supply.burnPolicy).toBeDefined();
  });
});

describe('lifecycle → morphism drivers', () => {
  it('lockCollateralOp transfers collateral into the escrow fiber', () => {
    const op = lockCollateralOp({ collateralAssetId: 'c1', escrowFiberId: 'escrow-1', targetSequenceNumber: 0 });
    expect(op.ApplyMorphism.kind).toBe('Transfer');
    expect(op.ApplyMorphism.recipient).toEqual({ Fiber: { fiberId: 'escrow-1' } });
    expect(op.ApplyMorphism.assetId).toBe('c1');
  });

  it('mintPrincipalOp mints the debt token to the borrower with the eligibility witness', () => {
    const op = mintPrincipalOp({
      debtAssetId: 'd1',
      debtPolicyRef: { name: 'loan-debt-v1.asset', version: { Latest: {} } },
      borrower: 'DAGborrower',
      principalAmount: 1000,
      witness: { publicValues: '0xpv', proof: '0xpf' },
    });
    expect(op.MintAsset.holder).toEqual({ Wallet: { address: 'DAGborrower' } });
    expect(op.MintAsset.amount).toBe(1000);
    expect(op.MintAsset.witness).toEqual({ publicValues: '0xpv', proof: '0xpf' });
  });

  it('repayBurnOp burns the debt; settleCollateralOp transfers collateral to a recipient', () => {
    const burn = repayBurnOp({ debtAssetId: 'd1', targetSequenceNumber: 1 });
    expect(burn.ApplyMorphism.kind).toBe('Burn');
    expect(burn.ApplyMorphism.assetId).toBe('d1');

    const release = settleCollateralOp({ collateralAssetId: 'c1', recipient: 'DAGborrower', targetSequenceNumber: 2 });
    expect(release.ApplyMorphism.kind).toBe('Transfer');
    expect(release.ApplyMorphism.recipient).toEqual({ Wallet: { address: 'DAGborrower' } });

    const liquidate = settleCollateralOp({ collateralAssetId: 'c1', recipient: 'DAGlender', targetSequenceNumber: 3 });
    expect(liquidate.ApplyMorphism.recipient).toEqual({ Wallet: { address: 'DAGlender' } });
  });
});
