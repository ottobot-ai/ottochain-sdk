"use strict";
/**
 * Examples of All 16 Token Behavior Types
 *
 * This file demonstrates practical usage of each token type in the TERV matrix
 * with realistic scenarios and complete implementation examples.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBehaviorExamples = exports.demonstrateTokenLifecycle = exports.TokenCompositionExample = exports.TokenConversionExample = exports.UtilityTokenExample = exports.SimpleTradableItemExample = exports.SecureAccessKeyExample = exports.DigitalCurrencyExample = exports.GameItemExample = exports.DigitalArtNFTExample = exports.SocialBadgeExample = exports.EducationalDegreeExample = exports.UserAccountIdentifierExample = void 0;
const token_types_js_1 = require("../../types/asset-model/token-types.js");
// ---------------------------------------------------------------------------
// TERV 0000: Basic Identifier 
// Non-Transferable, Non-Expendable, Non-Replicable, Non-Verifiable
// ---------------------------------------------------------------------------
/**
 * Example: User Account Identifiers
 * Simple, permanent identifiers that can't be moved or duplicated
 */
exports.UserAccountIdentifierExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
    createUserAccount: (userId, email) => ({
        id: `user-${userId}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        currentState: token_types_js_1.TokenState.ACTIVE,
        owner: `account-${userId}`,
        balance: 1, // Always 1 for identifiers
        metadata: {
            email,
            accountType: 'standard',
            createdDate: Date.now(),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
exports.EducationalDegreeExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
    createDegree: (studentId, degreeType, university) => ({
        id: `degree-${studentId}-${degreeType.toLowerCase()}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
        currentState: token_types_js_1.TokenState.ACTIVE,
        owner: `student-${studentId}`,
        balance: 1,
        metadata: {
            degreeType,
            university,
            graduationDate: '2024-05-15',
            gpa: 3.75,
            majorField: 'Computer Science',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
    verifyDegree: async (token) => {
        // Verify university signature and accreditation (config lookup available via getTokenBehaviorConfig)
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
exports.SocialBadgeExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_0010_SOCIAL_BADGE,
    createBadge: (userId, achievement) => ({
        id: `badge-${userId}-${achievement}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_0010_SOCIAL_BADGE,
        currentState: token_types_js_1.TokenState.ACTIVE,
        owner: `user-${userId}`,
        balance: 1,
        metadata: {
            achievement,
            badgeType: 'community_contribution',
            earnedDate: Date.now(),
            category: 'social_engagement',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'social-producer-001',
    }),
    // Badge stays with user (non-transferable)
    // Permanent achievement (non-expendable)
    // Platform can create identical badges for multiple users (replicable)
    // No cryptographic verification needed (social proof)
    duplicateBadgeForUser: (originalToken, newUserId) => ({
        ...originalToken,
        id: `badge-${newUserId}-${originalToken.metadata.achievement}`,
        owner: `user-${newUserId}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
exports.DigitalArtNFTExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
    createArtwork: (artistId, artworkTitle) => ({
        id: `nft-${artistId}-${artworkTitle.toLowerCase().replace(/\s+/g, '-')}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        currentState: token_types_js_1.TokenState.ACTIVE,
        owner: `artist-${artistId}`,
        balance: 1,
        metadata: {
            title: artworkTitle,
            artist: artistId,
            description: 'Original digital artwork',
            imageURI: 'ipfs://Qm...',
            creationDate: Date.now(),
            edition: '1/1',
            medium: 'Digital Art',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
    transferArtwork: async (token, newOwner) => {
        const context = {
            token,
            operation: token_types_js_1.TokenOperation.TRANSFER,
            initiator: token.owner,
            parameters: { to: newOwner },
            timestamp: Date.now(),
            producers: {},
            validators: {},
            environment: {},
        };
        const validation = (0, token_types_js_1.validateTokenOperation)(token_types_js_1.TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE, token_types_js_1.TokenOperation.TRANSFER, context);
        if (!validation.allowed) {
            throw new Error(`Transfer not allowed: ${validation.reason}`);
        }
        return {
            ...token,
            owner: newOwner,
            updatedAt: Date.now(),
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
exports.GameItemExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
    createGameItem: (itemName, playerId) => ({
        id: `item-${itemName}-${Date.now()}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
        currentState: token_types_js_1.TokenState.ACTIVE,
        owner: `player-${playerId}`,
        balance: 1,
        metadata: {
            itemName,
            itemType: 'consumable',
            rarity: 'legendary',
            effects: ['+50 health', '+20 mana'],
            gameContext: 'rpg_adventure',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
    useItem: async (token, gameContext) => {
        const context = {
            token,
            operation: token_types_js_1.TokenOperation.CONSUME,
            initiator: token.owner,
            parameters: { gameContext },
            timestamp: Date.now(),
            producers: {},
            validators: {},
            environment: {},
        };
        const validation = (0, token_types_js_1.validateTokenOperation)(token_types_js_1.TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN, token_types_js_1.TokenOperation.CONSUME, context);
        if (!validation.allowed) {
            throw new Error(`Cannot use item: ${validation.reason}`);
        }
        return {
            ...token,
            currentState: token_types_js_1.TokenState.CONSUMED,
            balance: 0,
            updatedAt: Date.now(),
            metadata: {
                ...token.metadata,
                consumedAt: Date.now(),
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
exports.DigitalCurrencyExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
    createCurrency: (currencyName, initialSupply) => ({
        id: `currency-${currencyName.toLowerCase()}`,
        behaviorType: token_types_js_1.TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        currentState: token_types_js_1.TokenState.ACTIVE,
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
    transfer: async (token, from, to, amount) => {
        const context = {
            token,
            operation: token_types_js_1.TokenOperation.TRANSFER,
            initiator: from,
            parameters: { to, amount },
            timestamp: Date.now(),
            producers: {},
            validators: {},
            environment: {},
        };
        const validation = (0, token_types_js_1.validateTokenOperation)(token_types_js_1.TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY, token_types_js_1.TokenOperation.TRANSFER, context);
        if (!validation.allowed) {
            throw new Error(`Transfer failed: ${validation.reason}`);
        }
        // In real implementation, this would handle balance updates across accounts
        return {
            ...token,
            updatedAt: Date.now(),
            metadata: {
                ...token.metadata,
                lastTransaction: {
                    from,
                    to,
                    amount,
                    timestamp: Date.now(),
                },
            },
        };
    },
    mint: async (token, amount, recipient) => {
        const newBalance = token.balance + amount;
        const maxSupply = token.metadata.maxSupply;
        if (newBalance > maxSupply) {
            throw new Error(`Cannot mint: would exceed max supply of ${maxSupply}`);
        }
        return {
            ...token,
            balance: newBalance,
            updatedAt: Date.now(),
            metadata: {
                ...token.metadata,
                totalSupply: newBalance,
                lastMint: {
                    amount,
                    recipient,
                    timestamp: Date.now(),
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
exports.SecureAccessKeyExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_0101_SECURE_ACCESS_KEY,
    useCases: ['API keys', 'Two-factor tokens', 'Secure facility access', 'Temporary permissions'],
};
/**
 * TERV 1000: Simple Tradable Item
 * Basic items that can be traded but not consumed or verified
 */
exports.SimpleTradableItemExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_1000_SIMPLE_TRADABLE_ITEM,
    useCases: ['Basic trading cards', 'Simple inventory items', 'Virtual goods', 'In-game resources'],
};
/**
 * TERV 1110: Utility Token
 * Multi-purpose tokens for platform operations
 */
exports.UtilityTokenExample = {
    tokenType: token_types_js_1.TokenBehaviorType.TERV_1110_UTILITY_TOKEN,
    useCases: ['Platform credits', 'Service tokens', 'Reward points', 'Access credits'],
};
// ---------------------------------------------------------------------------
// Token Interaction Examples
// ---------------------------------------------------------------------------
/**
 * Example: Converting between compatible token types
 */
exports.TokenConversionExample = {
    // Convert utility tokens to game tokens for in-game purchases
    convertUtilityToGame: async (utilityToken, amount, gameContext) => {
        // Validation and conversion logic
        const gameToken = {
            id: `game-token-${Date.now()}`,
            behaviorType: token_types_js_1.TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
            currentState: token_types_js_1.TokenState.ACTIVE,
            owner: utilityToken.owner,
            balance: amount,
            metadata: {
                convertedFrom: utilityToken.id,
                gameContext,
                conversionRate: 1.0,
                convertedAt: Date.now(),
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: 'conversion-producer-001',
        };
        return gameToken;
    },
};
/**
 * Example: Multi-token compositions
 */
exports.TokenCompositionExample = {
    // Combine multiple tokens to create a composite asset
    createCompositeAsset: async (components, compositeType) => {
        const composite = {
            id: `composite-${Date.now()}`,
            behaviorType: compositeType,
            currentState: token_types_js_1.TokenState.ACTIVE,
            owner: components[0].owner,
            balance: 1,
            metadata: {
                components: components.map(t => ({
                    id: t.id,
                    type: t.behaviorType,
                    contribution: t.balance,
                })),
                compositionDate: Date.now(),
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
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
async function demonstrateTokenLifecycle() {
    console.log('=== 16-Type Token Behavior Matrix Demonstration ===\n');
    // 1. Create different token types
    const userAccount = exports.UserAccountIdentifierExample.createUserAccount('user123', 'user@example.com');
    const degree = exports.EducationalDegreeExample.createDegree('student456', 'Bachelor of Science', 'Tech University');
    const nft = exports.DigitalArtNFTExample.createArtwork('artist789', 'Digital Sunset');
    const gameItem = exports.GameItemExample.createGameItem('Magic Sword', 'player001');
    const currency = exports.DigitalCurrencyExample.createCurrency('OttoCoin', 1000000);
    console.log('1. Created tokens of different types:');
    console.log(`   - User Account: ${userAccount.id} (${userAccount.behaviorType})`);
    console.log(`   - Degree: ${degree.id} (${degree.behaviorType})`);
    console.log(`   - NFT: ${nft.id} (${nft.behaviorType})`);
    console.log(`   - Game Item: ${gameItem.id} (${gameItem.behaviorType})`);
    console.log(`   - Currency: ${currency.id} (${currency.behaviorType})\n`);
    // 2. Demonstrate TERV properties
    console.log('2. TERV Properties:');
    [userAccount, degree, nft, gameItem, currency].forEach(token => {
        const flags = (0, token_types_js_1.getTERVFlags)(token.behaviorType);
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
        const transferredNFT = await exports.DigitalArtNFTExample.transferArtwork(nft, 'collector123');
        console.log(`   ✅ NFT transferred to ${transferredNFT.owner}`);
    }
    catch (error) {
        console.log(`   ❌ NFT transfer failed: ${error.message}`);
    }
    try {
        // Use game item (should work)
        const usedItem = await exports.GameItemExample.useItem(gameItem, { level: 5, quest: 'dragon_quest' });
        console.log(`   ✅ Game item used, new state: ${usedItem.currentState}`);
    }
    catch (error) {
        console.log(`   ❌ Game item usage failed: ${error.message}`);
    }
    try {
        // Try to transfer user account (should fail - not transferable)
        const context = {
            token: userAccount,
            operation: token_types_js_1.TokenOperation.TRANSFER,
            initiator: userAccount.owner,
            parameters: { to: 'someone-else' },
            timestamp: Date.now(),
            producers: {},
            validators: {},
            environment: {},
        };
        const validation = (0, token_types_js_1.validateTokenOperation)(token_types_js_1.TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER, token_types_js_1.TokenOperation.TRANSFER, context);
        if (validation.allowed) {
            console.log('   ✅ User account transfer allowed (unexpected!)');
        }
        else {
            console.log(`   ❌ User account transfer blocked: ${validation.reason}`);
        }
    }
    catch (error) {
        console.log(`   ❌ User account transfer error: ${error.message}`);
    }
    console.log('\n=== Demonstration Complete ===');
}
exports.demonstrateTokenLifecycle = demonstrateTokenLifecycle;
// Export all examples
exports.TokenBehaviorExamples = {
    UserAccountIdentifierExample: exports.UserAccountIdentifierExample,
    EducationalDegreeExample: exports.EducationalDegreeExample,
    SocialBadgeExample: exports.SocialBadgeExample,
    DigitalArtNFTExample: exports.DigitalArtNFTExample,
    GameItemExample: exports.GameItemExample,
    DigitalCurrencyExample: exports.DigitalCurrencyExample,
    SecureAccessKeyExample: exports.SecureAccessKeyExample,
    SimpleTradableItemExample: exports.SimpleTradableItemExample,
    UtilityTokenExample: exports.UtilityTokenExample,
    TokenConversionExample: exports.TokenConversionExample,
    TokenCompositionExample: exports.TokenCompositionExample,
    demonstrateTokenLifecycle,
};
