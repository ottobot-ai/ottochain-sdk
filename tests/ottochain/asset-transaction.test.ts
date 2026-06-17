import { describe, it, expect } from '@jest/globals';
import {
  createAssetPolicyPayload,
  createMintAssetPayload,
  createApplyMorphismPayload,
  createAuthorizeComposePayload,
} from '../../src/ottochain/transaction.js';

describe('asset operation payloads', () => {
  it('createMintAssetPayload wraps a MintAsset', () => {
    const r = createMintAssetPayload({
      assetId: 'a',
      policyRef: { name: 'p.asset', version: { Latest: {} } },
      holder: { Wallet: { address: 'DAG1' } },
      amount: 100,
    });
    expect(r).toEqual({
      MintAsset: {
        assetId: 'a',
        policyRef: { name: 'p.asset', version: { Latest: {} } },
        holder: { Wallet: { address: 'DAG1' } },
        amount: 100,
      },
    });
  });

  it('createApplyMorphismPayload wraps an ApplyMorphism and keeps the kind', () => {
    const r = createApplyMorphismPayload({
      assetId: 'a',
      kind: 'TRANSFER',
      targetSequenceNumber: 1,
      recipient: { Wallet: { address: 'DAG2' } },
    });
    expect(r.ApplyMorphism.kind).toBe('TRANSFER');
    expect(r).toHaveProperty(['ApplyMorphism', 'recipient', 'Wallet', 'address'], 'DAG2');
  });

  it('createAuthorizeComposePayload wraps an AuthorizeCompose', () => {
    const r = createAuthorizeComposePayload({
      assetId: 'a',
      partnerPolicyId: 'q.asset',
      nonce: 7,
      expiresAt: 100,
      targetSequenceNumber: 2,
    });
    expect(r).toEqual({
      AuthorizeCompose: {
        assetId: 'a',
        partnerPolicyId: 'q.asset',
        nonce: 7,
        expiresAt: 100,
        targetSequenceNumber: 2,
      },
    });
  });

  it('createAssetPolicyPayload wraps a CreateAssetPolicy (packed behavior + morphisms)', () => {
    const r = createAssetPolicyPayload({
      name: 'p.asset',
      version: '1.0.0',
      behavior: 28, // TSC-- (Fungible)
      supply: {},
      morphisms: { TRANSFER: { visibility: 'PUBLIC' } },
      stateShape: { typeName: 'X', fields: [] },
    });
    expect(r.CreateAssetPolicy.behavior).toBe(28);
    expect(r.CreateAssetPolicy.morphisms.TRANSFER.visibility).toBe('PUBLIC');
  });
});
