/**
 * Example: Wallet and Key Management
 * 
 * This example demonstrates:
 * - Generating new keypairs
 * - Importing from private key
 * - Deriving addresses
 * - Secure key storage patterns
 */

import { 
  generateKeyPair, 
  keyPairFromPrivateKey,
  KeyPair 
} from '@ottochain/sdk';

async function walletManagement() {
  // 1. Generate a fresh keypair
  console.log('=== Generate New Keypair ===');
  const newKeyPair = await generateKeyPair();
  console.log('Address:', newKeyPair.address);
  console.log('Public Key:', newKeyPair.publicKey.slice(0, 32) + '...');
  console.log('Private Key:', '[REDACTED - never log in production!]');

  // 2. Import from existing private key
  console.log('\n=== Import from Private Key ===');
  const existingPrivateKey = newKeyPair.privateKey; // In reality, load from secure storage
  const importedKeyPair = await keyPairFromPrivateKey(existingPrivateKey);
  console.log('Imported address:', importedKeyPair.address);
  console.log('Addresses match:', importedKeyPair.address === newKeyPair.address);

  // 3. Generate multiple wallets (e.g., for testing)
  console.log('\n=== Generate Multiple Wallets ===');
  const wallets: KeyPair[] = [];
  for (let i = 0; i < 3; i++) {
    const wallet = await generateKeyPair();
    wallets.push(wallet);
    console.log(`Wallet ${i + 1}: ${wallet.address}`);
  }

  // 4. Secure storage pattern (conceptual)
  console.log('\n=== Secure Storage Pattern ===');
  const secureStorage = {
    // In production, encrypt with user password or HSM
    save: (keyPair: KeyPair) => {
      const encrypted = Buffer.from(JSON.stringify({
        privateKey: keyPair.privateKey,
        address: keyPair.address,
      })).toString('base64');
      console.log('Encrypted (base64):', encrypted.slice(0, 50) + '...');
      return encrypted;
    },
    
    load: async (encrypted: string) => {
      const decrypted = JSON.parse(Buffer.from(encrypted, 'base64').toString());
      return keyPairFromPrivateKey(decrypted.privateKey);
    },
  };

  const saved = secureStorage.save(newKeyPair);
  const restored = await secureStorage.load(saved);
  console.log('Restored address:', restored.address);

  return { newKeyPair, wallets };
}

// Run if executed directly
walletManagement()
  .then(result => {
    console.log('\n✅ Wallet management examples complete!');
    console.log('Generated', result.wallets.length + 1, 'wallets');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
