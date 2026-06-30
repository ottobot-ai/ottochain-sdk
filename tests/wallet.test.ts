import {
  generateKeyPair,
  keyPairFromPrivateKey,
  isValidPrivateKey,
  getPublicKeyHex,
  getPublicKeyId,
  getAddress,
} from '@constellation-network/metagraph-sdk';

describe('Wallet Tests', () => {
  describe('generateKeyPair', () => {
    it('should generate valid key pair with correct formats', () => {
      const keyPair = generateKeyPair();

      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.privateKey).toHaveLength(64);
      expect(keyPair.privateKey).toMatch(/^[0-9a-fA-F]+$/);

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.publicKey).toHaveLength(130);
      expect(keyPair.publicKey).toMatch(/^04[0-9a-fA-F]+$/);

      expect(keyPair.address).toBeDefined();
      expect(keyPair.address).toMatch(/^DAG/);
    });
  });

  describe('keyPairFromPrivateKey', () => {
    it('should derive same key pair from same private key (deterministic)', () => {
      const privateKey = 'a'.repeat(64);
      const keyPair1 = keyPairFromPrivateKey(privateKey);
      const keyPair2 = keyPairFromPrivateKey(privateKey);

      expect(keyPair2.publicKey).toBe(keyPair1.publicKey);
      expect(keyPair2.address).toBe(keyPair1.address);
    });
  });

  describe('isValidPrivateKey', () => {
    it('should return true for valid hex string of correct length', () => {
      const validKey = 'a'.repeat(64);
      expect(isValidPrivateKey(validKey)).toBe(true);
    });

    it('should return false for wrong length', () => {
      expect(isValidPrivateKey('a'.repeat(63))).toBe(false);
      expect(isValidPrivateKey('a'.repeat(65))).toBe(false);
    });

    it('should return false for non-hex characters', () => {
      expect(isValidPrivateKey('g'.repeat(64))).toBe(false);
      expect(isValidPrivateKey('z'.repeat(64))).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidPrivateKey(123 as any)).toBe(false);
      expect(isValidPrivateKey(null as any)).toBe(false);
      expect(isValidPrivateKey(undefined as any)).toBe(false);
    });
  });

  describe('getPublicKeyId', () => {
    it('should return 128-character string without 04 prefix', () => {
      const privateKey = 'a'.repeat(64);
      const publicKeyId = getPublicKeyId(privateKey);

      expect(publicKeyId).toHaveLength(128);
      expect(publicKeyId).toMatch(/^[0-9a-fA-F]+$/);
      expect(publicKeyId).not.toMatch(/^04/);
    });
  });

  describe('getPublicKeyHex', () => {
    it('should return uncompressed public key with 04 prefix', () => {
      const privateKey = 'a'.repeat(64);
      const publicKey = getPublicKeyHex(privateKey, false);

      expect(publicKey).toHaveLength(130);
      expect(publicKey).toMatch(/^04[0-9a-fA-F]+$/);
    });

    it('should return compressed public key with 33 characters', () => {
      const privateKey = 'a'.repeat(64);
      const publicKey = getPublicKeyHex(privateKey, true);

      expect(publicKey).toHaveLength(66); // 33 bytes in hex
      expect(publicKey).toMatch(/^[0-9a-fA-F]+$/);
    });
  });

  describe('getAddress', () => {
    it('should derive valid DAG address from public key', () => {
      const privateKey = 'a'.repeat(64);
      const publicKey = getPublicKeyHex(privateKey, false);
      const address = getAddress(publicKey);

      expect(address).toBeDefined();
      expect(address).toMatch(/^DAG/);
    });
  });
});
