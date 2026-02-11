import {
  verify,
  verifyDataUpdate,
  verifySignedObject,
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
        proofs: [proof]
      };
      
      // Modify the public key ID to be invalid
      signedObject.proofs[0].id = '0'.repeat(128);
      
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
        proofs: [proof]
      };
      
      // Modify the signature to be malformed
      signedObject.proofs[0].signature = 'invalid-signature';
      
      const result = await verify(signedObject, false);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });
  });

  describe('verifyDataUpdate', () => {
    it('returns true for valid DataUpdate signature', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };
      
      const proof = await signDataUpdate(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };
      
      const result = await verifyDataUpdate(signedObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(0);
    });

    it('returns false for tampered data', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };
      
      const proof = await signDataUpdate(data, keyPair.privateKey);
      const signedObject = {
        value: data,
        proofs: [proof]
      };
      
      // Tamper with the data
      const tamperedObject = {
        ...signedObject,
        value: { test: 'tampered' }
      };
      
      const result = await verifyDataUpdate(tamperedObject);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });

    it('roundtrips with signDataUpdate', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };
      
      const signedObject = await createSignedObject(data, keyPair.privateKey, { isDataUpdate: true });
      
      const result = await verifyDataUpdate(signedObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(0);
    });
  });

  describe('verifySignedObject', () => {
    it('validates all proofs in signed object', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };
      
      const signedObject = await createSignedObject(data, keyPair.privateKey);
      
      const result = await verifySignedObject(signedObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(1);
      expect(result.invalidProofs.length).toBe(0);
    });

    it('returns false if any proof is invalid', async () => {
      const keyPair = generateKeyPair();
      const data = { test: 'data' };
      
      const signedObject = await createSignedObject(data, keyPair.privateKey);
      
      // Tamper with the signature
      signedObject.proofs[0].signature = 'invalid-signature';
      
      const result = await verifySignedObject(signedObject);
      expect(result.isValid).toBe(false);
      expect(result.validProofs.length).toBe(0);
      expect(result.invalidProofs.length).toBe(1);
    });

    it('handles multi-signature objects', async () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      const data = { test: 'data' };
      
      // Create signed object with first signature
      let signedObject = await createSignedObject(data, keyPair1.privateKey);
      
      // Add second signature
      signedObject = await createSignedObject(data, keyPair2.privateKey);
      
      // Create a multi-sig object manually
      const multiSigObject = {
        value: data,
        proofs: [
          await sign(data, keyPair1.privateKey),
          await sign(data, keyPair2.privateKey)
        ]
      };
      
      const result = await verifySignedObject(multiSigObject);
      expect(result.isValid).toBe(true);
      expect(result.validProofs.length).toBe(2);
      expect(result.invalidProofs.length).toBe(0);
    });
  });
});
