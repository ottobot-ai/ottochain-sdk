import {
  verify,
  sign,
  signDataUpdate,
  createSignedObject,
  generateKeyPair
} from '../src/metakit';

describe('verify module', () => {
  describe('verify', () => {
    it('returns true for valid signature (sign then verify roundtrip)', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await sign(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };

      const result = await verify(signedObject, false);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(0);
    });

    it('returns false for tampered data', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await sign(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };

      // Tamper with the data
      const tamperedObject = {
        ...signedObject,
        value: { test: 'tampered' }
      };

      const result = await verify(tamperedObject, false);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });

    it('returns false for wrong public key id', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await sign(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [{ ...proof, id: '0'.repeat(128) }]
      };

      const result = await verify(signedObject, false);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });

    it('handles malformed signature gracefully', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await sign(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [{ ...proof, signature: 'invalid-signature' }]
      };

      const result = await verify(signedObject, false);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });
  });

  describe('verify with DataUpdate', () => {
    it('returns true for valid DataUpdate signature', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await signDataUpdate(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };

      // Use isDataUpdate=true
      const result = await verify(signedObject, true);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(0);
    });

    it('returns false for tampered DataUpdate', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await signDataUpdate(data, keyPair.privateKey);
      const tamperedObject = {
        value: { test: 'tampered' },
        proofs: [proof]
      };

      const result = await verify(tamperedObject, true);
      expect(result.isValid).toBe(false);
    });

    it('fails when using wrong mode (DataUpdate sig with regular verify)', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const proof = await signDataUpdate(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };

      // Use isDataUpdate=false (wrong mode)
      const result = await verify(signedObject, false);
      expect(result.isValid).toBe(false);
    });
  });

  describe('verify with createSignedObject', () => {
    it('validates signed object created with createSignedObject', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const signedObject = await createSignedObject(data, keyPair.privateKey);

      const result = await verify(signedObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
    });

    it('validates DataUpdate signed object', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const signedObject = await createSignedObject(data, keyPair.privateKey, { isDataUpdate: true });

      const result = await verify(signedObject, true);
      expect(result.isValid).toBe(true);
    });

    it('returns false if any proof is invalid', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };

      const signedObject = await createSignedObject(data, keyPair.privateKey);

      // Tamper with the signature
      const tamperedObject = {
        ...signedObject,
        proofs: [{ ...signedObject.proofs[0], signature: 'invalid-signature' }]
      };

      const result = await verify(tamperedObject);
      expect(result.isValid).toBe(false);
      expect(result.invalidProofs.length).toBe(1);
    });

    it('handles multi-signature objects', async () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      const data = { test: 'data' };

      // Create a multi-sig object manually
      const multiSigObject = {
        value: data,
        proofs: [
          await sign(data, keyPair1.privateKey),
          await sign(data, keyPair2.privateKey)
        ]
      };

      const result = await verify(multiSigObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(2);
      expect(result.invalidProofs.length).toBe(0);
    });

    it('handles mixed valid/invalid proofs', async () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      const data = { test: 'data' };

      const validProof = await sign(data, keyPair1.privateKey);
      const invalidProof = { ...await sign(data, keyPair2.privateKey), signature: 'bad' };

      const multiSigObject = {
        value: data,
        proofs: [validProof, invalidProof]
      };

      const result = await verify(multiSigObject);
      expect(result.isValid).toBe(false); // At least one invalid
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(1);
    });
  });
});
