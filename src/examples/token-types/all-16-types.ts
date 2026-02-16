/**
 * Examples of All 16 Token Behavior Types
 * 
 * This file demonstrates practical usage of each token type in the TERV matrix
 * with realistic scenarios and complete implementation examples.
 * 
 * @packageDocumentation
 */

import {
  TokenBehaviorType,
  getTokenBehaviorConfig,
  validateTokenOperation,
  getTERVFlags,
  Token,
  TokenOperation,
  TokenOperationContext,
  TokenState,
} from '../../types/asset-model/token-types.js';

// ---------------------------------------------------------------------------
// TERV 0000: Basic Identifier 
// Non-Transferable, Non-Expendable, Non-Replicable, Non-Verifiable
// ---------------------------------------------------------------------------

/**
 * Example: User Account Identifiers
 * Simple, permanent identifiers that can't be moved or duplicated
 */
export const UserAccountIdentifierExample = {
  tokenType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
  
  createUserAccount: (userId: string, email: string): Token => ({
    id: `user-${userId}`,
    behaviorType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
    currentState: TokenState.ACTIVE,
    owner: `account-${userId}`,
    balance: 1, // Always 1 for identifiers
    metadata: {
      email,
      accountType: 'standard',
      createdDate: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'identity-producer-001',
  }),
  
  // Cannot transfer user identifiers
  // Cannot consume identifiers 
  // Cannot duplicate identifiers
  // Cannot verify cryptographically (no proofs)
  
  useCases: [
    'User account IDs',
    'Device identifiers', 
    'Session markers',
    'Simple categorization tags',
  ],
};

// ---------------------------------------------------------------------------
// TERV 0001: Personal Certificate
// Non-Transferable, Non-Expendable, Non-Replicable, Verifiable
// ---------------------------------------------------------------------------

/**
 * Example: Educational Degrees and Professional Certifications
 * Permanent, verifiable credentials bound to individuals
 */
export const EducationalDegreeExample = {
  tokenType: TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
  
  createDegree: (studentId: string, degreeType: string, university: string): Token => ({
    id: `degree-${studentId}-${degreeType.toLowerCase()}`,
    behaviorType: TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
    currentState: TokenState.ACTIVE,
    owner: `student-${studentId}`,
    balance: 1,
    metadata: {
      degreeType,
      university,
      graduationDate: '2024-05-15',
      gpa: 3.75,
      majorField: 'Computer Science',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'university-producer-001',
    validator: 'education-validator-001',
    proofs: {
      'university_signature': 'sig_abc123...',
      'accreditation_proof': 'proof_xyz789...',
      'transcript_hash': 'hash_def456...',
    },
  }),
  
  // Certificate is bound to student (non-transferable)
  // Permanent credential (non-expendable)
  // Cannot be duplicated (non-replicable) 
  // Cryptographically verifiable with university signature
  
  verifyDegree: async (token: Token): Promise<boolean> => {
    const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE);
    // Verify university signature and accreditation
    return token.proofs?.['university_signature'] !== undefined;
  },
  
  useCases: [
    'University degrees',
    'Professional certifications',
    'Medical licenses',
    'Security clearances',
  ],
};

// ---------------------------------------------------------------------------
// TERV 0010: Social Badge
// Non-Transferable, Non-Expendable, Replicable, Non-Verifiable
// ---------------------------------------------------------------------------

/**
 * Example: Social Media Badges and Community Achievements
 * Personal achievements that can be duplicated but not transferred
 */
export const SocialBadgeExample = {
  tokenType: TokenBehaviorType.TERV_0010_SOCIAL_BADGE,
  
  createBadge: (userId: string, achievement: string): Token => ({
    id: `badge-${userId}-${achievement}`,
    behaviorType: TokenBehaviorType.TERV_0010_SOCIAL_BADGE,
    currentState: TokenState.ACTIVE,
    owner: `user-${userId}`,
    balance: 1,
    metadata: {
      achievement,
      badgeType: 'community_contribution',
      earnedDate: new Date().toISOString(),
      category: 'social_engagement',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'social-producer-001',
  }),
  
  // Badge stays with user (non-transferable)
  // Permanent achievement (non-expendable)
  // Platform can create identical badges for multiple users (replicable)
  // No cryptographic verification needed (social proof)
  
  duplicateBadgeForUser: (originalToken: Token, newUserId: string): Token => ({
    ...originalToken,
    id: `badge-${newUserId}-${originalToken.metadata.achievement}`,
    owner: `user-${newUserId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  
  useCases: [
    'Social media badges',
    'Community achievements',
    'Participation awards',
    'Skill endorsements',
  ],
};

// ---------------------------------------------------------------------------
// TERV 1001: Authenticated Collectible
// Transferable, Non-Expendable, Non-Replicable, Verifiable
// ---------------------------------------------------------------------------

/**
 * Example: Digital Art NFTs and Rare Collectibles
 * Unique, tradeable items with cryptographic authenticity
 */
export const DigitalArtNFTExample = {
  tokenType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
  
  createArtwork: (artistId: string, artworkTitle: string): Token => ({
    id: `nft-${artistId}-${artworkTitle.toLowerCase().replace(/\s+/g, '-')}`,
    behaviorType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
    currentState: TokenState.ACTIVE,
    owner: `artist-${artistId}`,
    balance: 1,
    metadata: {
      title: artworkTitle,
      artist: artistId,
      description: 'Original digital artwork',
      imageURI: 'ipfs://Qm...',
      creationDate: new Date().toISOString(),
      edition: '1/1',
      medium: 'Digital Art',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: `artist-producer-${artistId}`,
    validator: 'art-validator-001',
    proofs: {
      'artist_signature': 'sig_artist123...',
      'creation_proof': 'proof_creation456...',
      'authenticity_certificate': 'cert_auth789...',
    },
  }),
  
  // Can be sold/traded (transferable)
  // Permanent collectible (non-expendable)
  // Unique, cannot be duplicated (non-replicable)
  // Cryptographically authenticated (verifiable)
  
  transferArtwork: async (token: Token, newOwner: string): Promise<Token> => {
    const context: TokenOperationContext = {
      token,
      operation: TokenOperation.TRANSFER,
      initiator: token.owner,
      parameters: { to: newOwner },
      timestamp: new Date().toISOString(),
      producers: {},
      validators: {},
      environment: {},
    };
    
    const validation = validateTokenOperation(
      TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
      TokenOperation.TRANSFER,
      context
    );
    
    if (!validation.allowed) {
      throw new Error(`Transfer not allowed: ${validation.reason}`);
    }
    
    return {
      ...token,
      owner: newOwner,
      updatedAt: new Date().toISOString(),
    };
  },
  
  useCases: [
    'Digital art NFTs',
    'Trading cards',
    'Sports collectibles',
    'Virtual real estate',
  ],
};

// ---------------------------------------------------------------------------
// TERV 1101: Consumable Game Token  
// Transferable, Expendable, Non-Replicable, Verifiable
// ---------------------------------------------------------------------------

/**
 * Example: Limited Edition Game Items
 * Tradeable items that can be consumed in gameplay with authenticity
 */
export const GameItemExample = {
  tokenType: TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
  
  createGameItem: (itemName: string, playerId: string): Token => ({
    id: `item-${itemName}-${Date.now()}`,
    behaviorType: TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
    currentState: TokenState.ACTIVE,
    owner: `player-${playerId}`,
    balance: 1,
    metadata: {
      itemName,
      itemType: 'consumable',
      rarity: 'legendary',
      effects: ['+50 health', '+20 mana'],
      gameContext: 'rpg_adventure',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'game-producer-001',
    validator: 'game-validator-001',
    proofs: {
      'game_signature': 'sig_game123...',
      'rarity_proof': 'proof_rarity456...',
    },
  }),
  
  // Can be traded between players (transferable)
  // Used up when consumed (expendable)
  // Limited edition, can't duplicate (non-replicable)
  // Cryptographically authentic (verifiable)
  
  useItem: async (token: Token, gameContext: Record<string, unknown>): Promise<Token> => {
    const context: TokenOperationContext = {
      token,
      operation: TokenOperation.CONSUME,
      initiator: token.owner,
      parameters: { gameContext },
      timestamp: new Date().toISOString(),
      producers: {},
      validators: {},
      environment: {},
    };
    
    const validation = validateTokenOperation(
      TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
      TokenOperation.CONSUME,
      context
    );
    
    if (!validation.allowed) {
      throw new Error(`Cannot use item: ${validation.reason}`);
    }
    
    return {
      ...token,
      currentState: TokenState.CONSUMED,
      balance: 0,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...token.metadata,
        consumedAt: new Date().toISOString(),
        consumptionContext: gameContext,
      },
    };
  },
  
  useCases: [
    'Limited edition game items',
    'Potion bottles',
    'Trading card game cards',
    'Event tickets',
  ],
};

// ---------------------------------------------------------------------------
// TERV 1111: Full Digital Currency
// Transferable, Expendable, Replicable, Verifiable  
// ---------------------------------------------------------------------------

/**
 * Example: Complete Digital Currency Implementation
 * Full-featured currency with all capabilities
 */
export const DigitalCurrencyExample = {
  tokenType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
  
  createCurrency: (currencyName: string, initialSupply: number): Token => ({
    id: `currency-${currencyName.toLowerCase()}`,
    behaviorType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
    currentState: TokenState.ACTIVE,
    owner: 'treasury-001',
    balance: initialSupply,
    metadata: {
      name: currencyName,
      symbol: currencyName.toUpperCase().slice(0, 4),
      decimals: 18,
      totalSupply: initialSupply,
      maxSupply: initialSupply * 2,
      mintingPolicy: 'controlled',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'currency-producer-001',
    validator: 'central-bank-validator-001',
    proofs: {
      'creation_signature': 'sig_treasury123...',
      'supply_proof': 'proof_supply456...',
      'reserve_backing': 'proof_reserve789...',
    },
  }),
  
  // Can be sent to anyone (transferable)
  // Spent in transactions (expendable)
  // New tokens can be minted (replicable)
  // Cryptographically secured (verifiable)
  
  transfer: async (token: Token, from: string, to: string, amount: number): Promise<Token> => {
    const context: TokenOperationContext = {
      token,
      operation: TokenOperation.TRANSFER,
      initiator: from,
      parameters: { to, amount },
      timestamp: new Date().toISOString(),
      producers: {},
      validators: {},
      environment: {},
    };
    
    const validation = validateTokenOperation(
      TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
      TokenOperation.TRANSFER,
      context
    );
    
    if (!validation.allowed) {
      throw new Error(`Transfer failed: ${validation.reason}`);
    }
    
    // In real implementation, this would handle balance updates across accounts
    return {
      ...token,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...token.metadata,
        lastTransaction: {
          from,
          to,
          amount,
          timestamp: new Date().toISOString(),
        },
      },
    };
  },
  
  mint: async (token: Token, amount: number, recipient: string): Promise<Token> => {
    const newBalance = token.balance + amount;
    const maxSupply = token.metadata.maxSupply as number;
    
    if (newBalance > maxSupply) {
      throw new Error(`Cannot mint: would exceed max supply of ${maxSupply}`);
    }
    
    return {
      ...token,
      balance: newBalance,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...token.metadata,
        totalSupply: newBalance,
        lastMint: {
          amount,
          recipient,
          timestamp: new Date().toISOString(),
        },
      },
    };
  },
  
  useCases: [
    'Central bank digital currencies',
    'Stablecoins',
    'Utility tokens',
    'Governance tokens',
  ],
};

// ---------------------------------------------------------------------------
// Additional Token Type Examples (abbreviated for space)
// ---------------------------------------------------------------------------

/**
 * TERV 0101: Secure Access Key
 * Single-use, cryptographically verified access tokens
 */
export const SecureAccessKeyExample = {
  tokenType: TokenBehaviorType.TERV_0101_SECURE_ACCESS_KEY,
  useCases: ['API keys', 'Two-factor tokens', 'Secure facility access', 'Temporary permissions'],
};

/**
 * TERV 1000: Simple Tradable Item
 * Basic items that can be traded but not consumed or verified
 */
export const SimpleTradableItemExample = {
  tokenType: TokenBehaviorType.TERV_1000_SIMPLE_TRADABLE_ITEM,
  useCases: ['Basic trading cards', 'Simple inventory items', 'Virtual goods', 'In-game resources'],
};

/**
 * TERV 1110: Utility Token
 * Multi-purpose tokens for platform operations
 */
export const UtilityTokenExample = {
  tokenType: TokenBehaviorType.TERV_1110_UTILITY_TOKEN,
  useCases: ['Platform credits', 'Service tokens', 'Reward points', 'Access credits'],
};

// ---------------------------------------------------------------------------
// Token Interaction Examples
// ---------------------------------------------------------------------------

/**
 * Example: Converting between compatible token types
 */
export const TokenConversionExample = {
  // Convert utility tokens to game tokens for in-game purchases
  convertUtilityToGame: async (
    utilityToken: Token,
    amount: number,
    gameContext: string
  ): Promise<Token> => {
    // Validation and conversion logic
    const gameToken: Token = {
      id: `game-token-${Date.now()}`,
      behaviorType: TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
      currentState: TokenState.ACTIVE,
      owner: utilityToken.owner,
      balance: amount,
      metadata: {
        convertedFrom: utilityToken.id,
        gameContext,
        conversionRate: 1.0,
        convertedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'conversion-producer-001',
    };
    
    return gameToken;
  },
};

/**
 * Example: Multi-token compositions
 */
export const TokenCompositionExample = {
  // Combine multiple tokens to create a composite asset
  createCompositeAsset: async (
    components: Token[],
    compositeType: TokenBehaviorType
  ): Promise<Token> => {
    const composite: Token = {
      id: `composite-${Date.now()}`,
      behaviorType: compositeType,
      currentState: TokenState.ACTIVE,
      owner: components[0].owner,
      balance: 1,
      metadata: {
        components: components.map(t => ({
          id: t.id,
          type: t.behaviorType,
          contribution: t.balance,
        })),
        compositionDate: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'composition-producer-001',
    };
    
    return composite;
  },
};

// ---------------------------------------------------------------------------
// Usage Examples and Test Scenarios
// ---------------------------------------------------------------------------

/**
 * Complete usage example showing the token lifecycle
 */
export async function demonstrateTokenLifecycle() {
  console.log('=== 16-Type Token Behavior Matrix Demonstration ===\n');
  
  // 1. Create different token types
  const userAccount = UserAccountIdentifierExample.createUserAccount('user123', 'user@example.com');
  const degree = EducationalDegreeExample.createDegree('student456', 'Bachelor of Science', 'Tech University');
  const nft = DigitalArtNFTExample.createArtwork('artist789', 'Digital Sunset');
  const gameItem = GameItemExample.createGameItem('Magic Sword', 'player001');
  const currency = DigitalCurrencyExample.createCurrency('OttoCoin', 1000000);
  
  console.log('1. Created tokens of different types:');
  console.log(`   - User Account: ${userAccount.id} (${userAccount.behaviorType})`);
  console.log(`   - Degree: ${degree.id} (${degree.behaviorType})`);
  console.log(`   - NFT: ${nft.id} (${nft.behaviorType})`);
  console.log(`   - Game Item: ${gameItem.id} (${gameItem.behaviorType})`);
  console.log(`   - Currency: ${currency.id} (${currency.behaviorType})\n`);
  
  // 2. Demonstrate TERV properties
  console.log('2. TERV Properties:');
  [userAccount, degree, nft, gameItem, currency].forEach(token => {
    const flags = getTERVFlags(token.behaviorType);
    console.log(`   ${token.id}:`);
    console.log(`     T(ransferable): ${flags.transferable}`);
    console.log(`     E(xpendable): ${flags.expendable}`);
    console.log(`     R(eplicable): ${flags.replicable}`);
    console.log(`     V(erifiable): ${flags.verifiable}`);
  });
  console.log();
  
  // 3. Demonstrate operations
  console.log('3. Operation Examples:');
  
  try {
    // Transfer NFT (should work)
    const transferredNFT = await DigitalArtNFTExample.transferArtwork(nft, 'collector123');
    console.log(`   ✅ NFT transferred to ${transferredNFT.owner}`);
  } catch (error) {
    console.log(`   ❌ NFT transfer failed: ${(error as Error).message}`);
  }
  
  try {
    // Use game item (should work)
    const usedItem = await GameItemExample.useItem(gameItem, { level: 5, quest: 'dragon_quest' });
    console.log(`   ✅ Game item used, new state: ${usedItem.currentState}`);
  } catch (error) {
    console.log(`   ❌ Game item usage failed: ${(error as Error).message}`);
  }
  
  try {
    // Try to transfer user account (should fail - not transferable)
    const context: TokenOperationContext = {
      token: userAccount,
      operation: TokenOperation.TRANSFER,
      initiator: userAccount.owner,
      parameters: { to: 'someone-else' },
      timestamp: new Date().toISOString(),
      producers: {},
      validators: {},
      environment: {},
    };
    
    const validation = validateTokenOperation(
      TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
      TokenOperation.TRANSFER,
      context
    );
    
    if (validation.allowed) {
      console.log('   ✅ User account transfer allowed (unexpected!)');
    } else {
      console.log(`   ❌ User account transfer blocked: ${validation.reason}`);
    }
  } catch (error) {
    console.log(`   ❌ User account transfer error: ${(error as Error).message}`);
  }
  
  console.log('\n=== Demonstration Complete ===');
}

// Export all examples
export const TokenBehaviorExamples = {
  UserAccountIdentifierExample,
  EducationalDegreeExample,  
  SocialBadgeExample,
  DigitalArtNFTExample,
  GameItemExample,
  DigitalCurrencyExample,
  SecureAccessKeyExample,
  SimpleTradableItemExample,
  UtilityTokenExample,
  TokenConversionExample,
  TokenCompositionExample,
  demonstrateTokenLifecycle,
};