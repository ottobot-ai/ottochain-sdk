/**
 * Examples of All 16 Token Behavior Types
 *
 * This file demonstrates practical usage of each token type in the TERV matrix
 * with realistic scenarios and complete implementation examples.
 *
 * @packageDocumentation
 */
import { TokenBehaviorType, Token } from '../../types/asset-model/token-types.js';
/**
 * Example: User Account Identifiers
 * Simple, permanent identifiers that can't be moved or duplicated
 */
export declare const UserAccountIdentifierExample: {
    tokenType: TokenBehaviorType;
    createUserAccount: (userId: string, email: string) => Token;
    useCases: string[];
};
/**
 * Example: Educational Degrees and Professional Certifications
 * Permanent, verifiable credentials bound to individuals
 */
export declare const EducationalDegreeExample: {
    tokenType: TokenBehaviorType;
    createDegree: (studentId: string, degreeType: string, university: string) => Token;
    verifyDegree: (token: Token) => Promise<boolean>;
    useCases: string[];
};
/**
 * Example: Social Media Badges and Community Achievements
 * Personal achievements that can be duplicated but not transferred
 */
export declare const SocialBadgeExample: {
    tokenType: TokenBehaviorType;
    createBadge: (userId: string, achievement: string) => Token;
    duplicateBadgeForUser: (originalToken: Token, newUserId: string) => Token;
    useCases: string[];
};
/**
 * Example: Digital Art NFTs and Rare Collectibles
 * Unique, tradeable items with cryptographic authenticity
 */
export declare const DigitalArtNFTExample: {
    tokenType: TokenBehaviorType;
    createArtwork: (artistId: string, artworkTitle: string) => Token;
    transferArtwork: (token: Token, newOwner: string) => Promise<Token>;
    useCases: string[];
};
/**
 * Example: Limited Edition Game Items
 * Tradeable items that can be consumed in gameplay with authenticity
 */
export declare const GameItemExample: {
    tokenType: TokenBehaviorType;
    createGameItem: (itemName: string, playerId: string) => Token;
    useItem: (token: Token, gameContext: Record<string, unknown>) => Promise<Token>;
    useCases: string[];
};
/**
 * Example: Complete Digital Currency Implementation
 * Full-featured currency with all capabilities
 */
export declare const DigitalCurrencyExample: {
    tokenType: TokenBehaviorType;
    createCurrency: (currencyName: string, initialSupply: number) => Token;
    transfer: (token: Token, from: string, to: string, amount: number) => Promise<Token>;
    mint: (token: Token, amount: number, recipient: string) => Promise<Token>;
    useCases: string[];
};
/**
 * TERV 0101: Secure Access Key
 * Single-use, cryptographically verified access tokens
 */
export declare const SecureAccessKeyExample: {
    tokenType: TokenBehaviorType;
    useCases: string[];
};
/**
 * TERV 1000: Simple Tradable Item
 * Basic items that can be traded but not consumed or verified
 */
export declare const SimpleTradableItemExample: {
    tokenType: TokenBehaviorType;
    useCases: string[];
};
/**
 * TERV 1110: Utility Token
 * Multi-purpose tokens for platform operations
 */
export declare const UtilityTokenExample: {
    tokenType: TokenBehaviorType;
    useCases: string[];
};
/**
 * Example: Converting between compatible token types
 */
export declare const TokenConversionExample: {
    convertUtilityToGame: (utilityToken: Token, amount: number, gameContext: string) => Promise<Token>;
};
/**
 * Example: Multi-token compositions
 */
export declare const TokenCompositionExample: {
    createCompositeAsset: (components: Token[], compositeType: TokenBehaviorType) => Promise<Token>;
};
/**
 * Complete usage example showing the token lifecycle
 */
export declare function demonstrateTokenLifecycle(): Promise<void>;
export declare const TokenBehaviorExamples: {
    UserAccountIdentifierExample: {
        tokenType: TokenBehaviorType;
        createUserAccount: (userId: string, email: string) => Token;
        useCases: string[];
    };
    EducationalDegreeExample: {
        tokenType: TokenBehaviorType;
        createDegree: (studentId: string, degreeType: string, university: string) => Token;
        verifyDegree: (token: Token) => Promise<boolean>;
        useCases: string[];
    };
    SocialBadgeExample: {
        tokenType: TokenBehaviorType;
        createBadge: (userId: string, achievement: string) => Token;
        duplicateBadgeForUser: (originalToken: Token, newUserId: string) => Token;
        useCases: string[];
    };
    DigitalArtNFTExample: {
        tokenType: TokenBehaviorType;
        createArtwork: (artistId: string, artworkTitle: string) => Token;
        transferArtwork: (token: Token, newOwner: string) => Promise<Token>;
        useCases: string[];
    };
    GameItemExample: {
        tokenType: TokenBehaviorType;
        createGameItem: (itemName: string, playerId: string) => Token;
        useItem: (token: Token, gameContext: Record<string, unknown>) => Promise<Token>;
        useCases: string[];
    };
    DigitalCurrencyExample: {
        tokenType: TokenBehaviorType;
        createCurrency: (currencyName: string, initialSupply: number) => Token;
        transfer: (token: Token, from: string, to: string, amount: number) => Promise<Token>;
        mint: (token: Token, amount: number, recipient: string) => Promise<Token>;
        useCases: string[];
    };
    SecureAccessKeyExample: {
        tokenType: TokenBehaviorType;
        useCases: string[];
    };
    SimpleTradableItemExample: {
        tokenType: TokenBehaviorType;
        useCases: string[];
    };
    UtilityTokenExample: {
        tokenType: TokenBehaviorType;
        useCases: string[];
    };
    TokenConversionExample: {
        convertUtilityToGame: (utilityToken: Token, amount: number, gameContext: string) => Promise<Token>;
    };
    TokenCompositionExample: {
        createCompositeAsset: (components: Token[], compositeType: TokenBehaviorType) => Promise<Token>;
    };
    demonstrateTokenLifecycle: typeof demonstrateTokenLifecycle;
};
