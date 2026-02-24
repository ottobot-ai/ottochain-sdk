/**
 * Wallet Management Example
 *
 * Demonstrates key pair generation, import, export, and validation.
 *
 * @example
 * ```bash
 * npx ts-node examples/wallet-management.ts
 * ```
 */

import {
  generateKeyPair,
  keyPairFromPrivateKey,
  getPublicKeyHex,
  getPublicKeyId,
  getAddress,
  isValidPrivateKey,
  isValidPublicKey,
  validatePrivateKey,
  validatePublicKey,
  validateAddress,
  ValidationError,
  KeyPair,
} from '../src/index.js';

/**
 * Example 1: Generate new wallet
 */
function generateNewWallet() {
  console.log('🔑 Example 1: Generate New Wallet\n');

  const keyPair = generateKeyPair();

  console.log('  New wallet generated:');
  console.log(`    Address:     ${keyPair.address}`);
  console.log(`    Public Key:  ${keyPair.publicKey.slice(0, 30)}...`);
  console.log(`    Private Key: ${keyPair.privateKey.slice(0, 16)}...`);
  console.log('');
  console.log('  ⚠️  Store the private key securely!');

  return keyPair;
}

/**
 * Example 2: Import wallet from private key
 */
function importWallet() {
  console.log('\n🔐 Example 2: Import Wallet from Private Key\n');

  // Example private key (DO NOT use in production!)
  const privateKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

  // Validate before importing
  if (!isValidPrivateKey(privateKey)) {
    console.log('  ❌ Invalid private key format');
    return null;
  }

  const keyPair = keyPairFromPrivateKey(privateKey);

  console.log('  Wallet imported:');
  console.log(`    Address:    ${keyPair.address}`);
  console.log(`    Public Key: ${keyPair.publicKey.slice(0, 30)}...`);

  return keyPair;
}

/**
 * Example 3: Key derivation utilities
 */
function keyDerivation(keyPair: KeyPair) {
  console.log('\n🔧 Example 3: Key Derivation\n');

  // Get uncompressed public key (with 04 prefix)
  const uncompressedPubKey = getPublicKeyHex(keyPair.privateKey, false);
  console.log(`  Uncompressed Public Key: ${uncompressedPubKey.slice(0, 30)}...`);
  console.log(`    Length: ${uncompressedPubKey.length} chars (130 with 04 prefix)`);

  // Get compressed public key
  const compressedPubKey = getPublicKeyHex(keyPair.privateKey, true);
  console.log(`  Compressed Public Key:   ${compressedPubKey.slice(0, 30)}...`);
  console.log(`    Length: ${compressedPubKey.length} chars (66 with prefix)`);

  // Get public key ID (for signatures)
  const pubKeyId = getPublicKeyId(keyPair.privateKey);
  console.log(`  Public Key ID:           ${pubKeyId.slice(0, 30)}...`);
  console.log(`    Length: ${pubKeyId.length} chars (128 without 04 prefix)`);

  // Derive address from public key
  const derivedAddress = getAddress(keyPair.publicKey);
  console.log(`  Derived Address:         ${derivedAddress}`);
  console.log(`    Matches original:      ${derivedAddress === keyPair.address ? '✅' : '❌'}`);
}

/**
 * Example 4: Key validation
 */
function validateKeys(keyPair: KeyPair) {
  console.log('\n✅ Example 4: Key Validation\n');

  // Quick boolean checks
  console.log('  Quick validation (boolean):');
  console.log(`    Private key valid: ${isValidPrivateKey(keyPair.privateKey) ? '✅' : '❌'}`);
  console.log(`    Public key valid:  ${isValidPublicKey(keyPair.publicKey) ? '✅' : '❌'}`);

  // Invalid examples
  console.log('\n  Invalid key examples:');
  console.log(`    "short": ${isValidPrivateKey('short') ? '✅' : '❌'} (too short)`);
  console.log(`    "0x...":  ${isValidPrivateKey('0x' + 'a'.repeat(64)) ? '✅' : '❌'} (has prefix)`);
  console.log(`    123:      ${isValidPrivateKey(123 as any) ? '✅' : '❌'} (not a string)`);

  // Zod validation with detailed errors
  console.log('\n  Zod validation (with errors):');

  try {
    validatePrivateKey(keyPair.privateKey);
    console.log('    ✅ Private key validated');
  } catch (error) {
    console.log(`    ❌ ${(error as ValidationError).message}`);
  }

  try {
    validatePrivateKey('invalid');
    console.log('    ✅ Validated');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`    ❌ Invalid key: ${error.message}`);
    }
  }

  try {
    validateAddress(keyPair.address);
    console.log('    ✅ Address validated');
  } catch (error) {
    console.log(`    ❌ ${(error as ValidationError).message}`);
  }

  try {
    validateAddress('invalid-address');
    console.log('    ✅ Validated');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`    ❌ Invalid address: ${error.message}`);
    }
  }
}

/**
 * Example 5: Export wallet for backup
 */
function exportWallet(keyPair: KeyPair) {
  console.log('\n💾 Example 5: Export Wallet\n');

  // Export as JSON (for backup)
  const walletExport = {
    version: 1,
    address: keyPair.address,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    createdAt: new Date().toISOString(),
  };

  console.log('  Wallet export (JSON):');
  console.log('  ' + JSON.stringify(walletExport, null, 2).replace(/\n/g, '\n  '));

  // Export as hex-only (minimal)
  console.log('\n  Minimal export (hex only):');
  console.log(`    ${keyPair.privateKey}`);

  console.log('\n  ⚠️  Never share your private key!');
  console.log('  ⚠️  Store backups encrypted and offline.');
}

/**
 * Example 6: Batch wallet generation
 */
function batchGeneration() {
  console.log('\n🏭 Example 6: Batch Wallet Generation\n');

  const count = 5;
  console.log(`  Generating ${count} wallets...`);

  const wallets = Array.from({ length: count }, () => generateKeyPair());

  console.log('\n  Generated wallets:');
  wallets.forEach((w, i) => {
    console.log(`    ${i + 1}. ${w.address}`);
  });

  return wallets;
}

/**
 * Run all examples
 */
function main() {
  console.log('🚀 Wallet Management Examples\n');
  console.log('═'.repeat(50) + '\n');

  const keyPair = generateNewWallet();
  importWallet();
  keyDerivation(keyPair);
  validateKeys(keyPair);
  exportWallet(keyPair);
  batchGeneration();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ All wallet examples completed!');
}

main();
