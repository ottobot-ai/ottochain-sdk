/**
 * DataUpdate signing applies dropNulls internally.
 *
 * Content-hash rule (metakit JsonBinaryCodec): recursively drop null OBJECT
 * fields, PRESERVE array nulls, then RFC 8785 canonicalize. Absent and
 * explicit-null optional fields must produce identical signatures.
 */
import { signDataUpdate, createSignedObject, addSignature, batchSign } from '../src/signing.js';
import { verify } from '../src/verify.js';
import { signTransaction, addTransactionSignature, createTransitionPayload } from '../src/ottochain/transaction.js';
import { dropNulls } from '../src/ottochain/drop-nulls.js';
import {
  generateKeyPair,
  sign as baseSign,
  signDataUpdate as baseSignDataUpdate,
} from '@constellation-network/metagraph-sdk';

const keyPair = generateKeyPair();
const otherKeyPair = generateKeyPair();

const withNulls = {
  fiberId: 'fiber-1',
  parentFiberId: null,
  metadata: null,
  payload: { note: null, amount: 5 },
  tags: [1, null, 3],
};
const withoutNulls = {
  fiberId: 'fiber-1',
  payload: { amount: 5 },
  tags: [1, null, 3],
};

describe('signDataUpdate (wrapped)', () => {
  it('signs over the null-dropped bytes', () => {
    const proof = signDataUpdate(withNulls, keyPair.privateKey);
    const expected = baseSignDataUpdate(dropNulls(withNulls), keyPair.privateKey);
    expect(proof.signature).toBe(expected.signature);
  });

  it('absent and explicit-null fields produce identical signatures', () => {
    const a = signDataUpdate(withNulls, keyPair.privateKey);
    const b = signDataUpdate(withoutNulls, keyPair.privateKey);
    expect(a.signature).toBe(b.signature);
  });

  it('preserves array nulls (different array => different signature)', () => {
    const a = signDataUpdate({ tags: [1, null, 3] }, keyPair.privateKey);
    const b = signDataUpdate({ tags: [1, 3] }, keyPair.privateKey);
    expect(a.signature).not.toBe(b.signature);
  });
});

describe('signTransaction / addTransactionSignature', () => {
  it('signs a null-containing payload over dropped bytes', async () => {
    const message = {
      TransitionStateMachine: {
        fiberId: 'fiber-1',
        eventName: 'go',
        payload: { note: null, amount: 5 },
        targetSequenceNumber: 0,
      },
    };
    const signed = await signTransaction(message, keyPair.privateKey);
    const expected = baseSignDataUpdate(dropNulls(message), keyPair.privateKey);
    expect(signed.proofs[0].signature).toBe(expected.signature);
    // value is preserved as given
    expect(signed.value).toEqual(message);
    // and the SDK's own verify accepts it in dataUpdate mode
    expect(verify(signed, true).isValid).toBe(true);
  });

  it('absent ≡ explicit-null: identical signatures', async () => {
    const explicitNull = createTransitionPayload({
      fiberId: 'fiber-1',
      eventName: 'go',
      payload: { note: null, amount: 5 },
      targetSequenceNumber: 0,
    });
    const absent = createTransitionPayload({
      fiberId: 'fiber-1',
      eventName: 'go',
      payload: { amount: 5 },
      targetSequenceNumber: 0,
    });
    const a = await signTransaction(explicitNull, keyPair.privateKey);
    const b = await signTransaction(absent, keyPair.privateKey);
    expect(a.proofs[0].signature).toBe(b.proofs[0].signature);
  });

  it('addTransactionSignature signs over dropped bytes too', async () => {
    const message = { InvokeScript: { fiberId: 'f', method: 'm', args: { x: null }, targetSequenceNumber: 1 } };
    const signed = await signTransaction(message, keyPair.privateKey);
    const multi = await addTransactionSignature(signed, otherKeyPair.privateKey);
    const expected = baseSignDataUpdate(dropNulls(message), otherKeyPair.privateKey);
    expect(multi.proofs).toHaveLength(2);
    expect(multi.proofs[1].signature).toBe(expected.signature);
    expect(verify(multi, true).isValid).toBe(true);
  });
});

describe('createSignedObject / addSignature / batchSign (wrapped)', () => {
  it('dataUpdate mode drops nulls; value is preserved', () => {
    const signed = createSignedObject(withNulls, keyPair.privateKey, { mode: 'dataUpdate' });
    const expected = baseSignDataUpdate(dropNulls(withNulls), keyPair.privateKey);
    expect(signed.proofs[0].signature).toBe(expected.signature);
    expect(signed.value).toEqual(withNulls);
    expect(verify(signed, true).isValid).toBe(true);
  });

  it('legacy isDataUpdate flag also drops nulls', () => {
    const signed = createSignedObject(withNulls, keyPair.privateKey, { isDataUpdate: true });
    const expected = baseSignDataUpdate(dropNulls(withNulls), keyPair.privateKey);
    expect(signed.proofs[0].signature).toBe(expected.signature);
  });

  it('standard mode is passed through unchanged (nulls kept)', () => {
    const signed = createSignedObject(withNulls, keyPair.privateKey);
    const expected = baseSign(withNulls, keyPair.privateKey);
    expect(signed.proofs[0].signature).toBe(expected.signature);
  });

  it('addSignature inherits dataUpdate mode and drops nulls', () => {
    const signed = createSignedObject(withNulls, keyPair.privateKey, { mode: 'dataUpdate' });
    const multi = addSignature(signed, otherKeyPair.privateKey);
    const expected = baseSignDataUpdate(dropNulls(withNulls), otherKeyPair.privateKey);
    expect(multi.proofs[1].signature).toBe(expected.signature);
    expect(multi.value).toEqual(withNulls);
  });

  it('batchSign in dataUpdate mode drops nulls for every proof', () => {
    const signed = batchSign(withNulls, [keyPair.privateKey, otherKeyPair.privateKey], { mode: 'dataUpdate' });
    const e1 = baseSignDataUpdate(dropNulls(withNulls), keyPair.privateKey);
    const e2 = baseSignDataUpdate(dropNulls(withNulls), otherKeyPair.privateKey);
    expect(signed.proofs.map((p) => p.signature)).toEqual([e1.signature, e2.signature]);
    expect(signed.value).toEqual(withNulls);
  });

  it('batchSign absent ≡ explicit-null', () => {
    const a = batchSign(withNulls, [keyPair.privateKey], { mode: 'dataUpdate' });
    const b = batchSign(withoutNulls, [keyPair.privateKey], { mode: 'dataUpdate' });
    expect(a.proofs[0].signature).toBe(b.proofs[0].signature);
  });
});

describe('verify (wrapped) over null-containing dataUpdate payloads', () => {
  it('verifies over dropped bytes when isDataUpdate=true', () => {
    const proof = baseSignDataUpdate(dropNulls(withNulls), keyPair.privateKey);
    const result = verify({ value: withNulls, proofs: [proof] }, true);
    expect(result.isValid).toBe(true);
  });

  it('falls back to embedded mode when isDataUpdate is omitted', () => {
    const signed = createSignedObject(withNulls, keyPair.privateKey, { mode: 'dataUpdate' });
    expect(verify(signed).isValid).toBe(true);
  });
});
