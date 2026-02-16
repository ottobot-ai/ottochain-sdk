# 16-Type Token Behavior Matrix Implementation

## Overview

This implementation provides a comprehensive 4-boolean matrix token type system for deterministic asset behaviors in the Producer-Validator Framework. The system is based on the TERV matrix:

- **T**ransferable: Can tokens be transferred between accounts?
- **E**xpendable: Are tokens consumed on use?  
- **R**eplicable: Can tokens be duplicated?
- **V**erifiable: Can authenticity be cryptographically proven?

This creates 16 distinct token types (2^4 = 16 combinations), each with specific behavior patterns, state machines, and interaction rules.

## Implementation Status ✅ COMPLETE

### ✅ Core Implementation
- [x] **TokenBehaviorType enum** - All 16 TERV combinations defined
- [x] **TERV flag extraction** - Utilities to extract boolean flags from behavior types
- [x] **Token behavior configurations** - Complete configuration mapping for all types
- [x] **State machine definitions** - Lifecycle state machines for each token type
- [x] **Operation validation** - Type-safe operation validation based on TERV flags
- [x] **Interaction rules** - Compatibility and conflict rules between token types

### ✅ Token Lifecycle State Machines
Each token type has a formal state machine with:
- **States**: `CREATED`, `ACTIVE`, `LOCKED`, `FROZEN`, `CONSUMED`, `BURNED`, `INVALID`, `DISPUTED`
- **Transitions**: Formal transitions with guards, effects, and authority requirements
- **Guards**: JSON Logic conditions for state transition validation
- **Effects**: Actions executed during transitions (logging, balance updates, etc.)

### ✅ Validation Logic
- **Operation validation**: Ensures operations are allowed for token types
- **TERV constraint checking**: Validates transferable, expendable, replicable, verifiable properties
- **Validation constraints**: Cooldowns, transfer limits, proof requirements
- **Custom rules**: JSON Logic rules for complex business logic

### ✅ Examples and Documentation
- **All 16 types demonstrated**: Complete examples with realistic use cases
- **Operation examples**: Transfer, consume, duplicate, verify operations
- **Integration patterns**: Token composition and conversion examples
- **Error handling**: Comprehensive error scenarios and validation

### ✅ Comprehensive Testing
- **TERV flag validation**: Tests for all 16 combinations
- **Operation validation**: Tests for allowed/disallowed operations
- **Constraint enforcement**: Cooldown, limits, and custom rule testing
- **Real-world scenarios**: Tests using practical examples
- **Error handling**: Graceful handling of invalid operations

## File Structure

```
src/types/asset-model/
├── token-types.ts              # Core 16-type implementation
├── index.ts                    # Updated exports
├── producer-validator.ts       # Foundation framework (existing)
├── workflows.ts                # Workflow primitives (existing)
├── integration.ts              # Integration patterns (existing)
└── TOKEN-TYPES-README.md       # This documentation

src/examples/token-types/
└── all-16-types.ts             # Comprehensive examples for all 16 types

tests/token-types/
└── token-behavior-matrix.test.ts  # Complete test suite
```

## The 16 Token Types

### Non-Transferable Types (T=0)

1. **TERV_0000_BASIC_IDENTIFIER** - Simple identifiers (user IDs, labels)
2. **TERV_0001_PERSONAL_CERTIFICATE** - Verifiable credentials (degrees, licenses)
3. **TERV_0010_SOCIAL_BADGE** - Replicable achievements (social badges)
4. **TERV_0011_ACHIEVEMENT_BADGE** - Verified achievements (skill certifications)
5. **TERV_0100_PERSONAL_VOUCHER** - Single-use personal tokens (vouchers)
6. **TERV_0101_SECURE_ACCESS_KEY** - Verifiable access tokens (API keys, 2FA)
7. **TERV_0110_PERSONAL_RESOURCE** - Personal consumables (health points, energy)
8. **TERV_0111_VERIFIED_PERSONAL_ASSET** - Verified personal consumables

### Transferable Types (T=1)

9. **TERV_1000_SIMPLE_TRADABLE_ITEM** - Basic tradeable items (simple collectibles)
10. **TERV_1001_AUTHENTICATED_COLLECTIBLE** - Verified NFTs (digital art, rare items)
11. **TERV_1010_SOCIAL_TOKEN** - Tradeable social tokens (community credits)
12. **TERV_1011_VERIFIED_SOCIAL_TOKEN** - Authenticated social tokens
13. **TERV_1100_SIMPLE_CONSUMABLE** - Tradeable consumables (basic potions)
14. **TERV_1101_CONSUMABLE_GAME_TOKEN** - Verified game consumables (limited items)
15. **TERV_1110_UTILITY_TOKEN** - Platform utility tokens (service credits)
16. **TERV_1111_FULL_DIGITAL_CURRENCY** - Complete digital currency (all features)

## Usage Examples

### Basic Usage
```typescript
import { 
  TokenBehaviorType, 
  getTokenBehaviorConfig,
  validateTokenOperation 
} from '@ottochain/sdk/types/asset-model';

// Get configuration for a token type
const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE);

// Check TERV properties
const flags = config.flags;
console.log(flags.transferable); // true
console.log(flags.expendable);   // false
console.log(flags.replicable);   // false
console.log(flags.verifiable);   // true

// Validate an operation
const validation = validateTokenOperation(
  TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
  TokenOperation.TRANSFER,
  context
);

if (validation.allowed) {
  // Proceed with transfer
} else {
  console.error(validation.reason);
}
```

### Creating Token Instances
```typescript
import { TokenBehaviorExamples } from '@ottochain/sdk/examples/token-types';

// Create different token types
const nft = TokenBehaviorExamples.DigitalArtNFTExample
  .createArtwork('artist123', 'Digital Masterpiece');

const gameItem = TokenBehaviorExamples.GameItemExample
  .createGameItem('Magic Sword', 'player456');

const currency = TokenBehaviorExamples.DigitalCurrencyExample
  .createCurrency('OttoCoin', 1000000);
```

### State Machine Integration
Each token type has a formal state machine that integrates with OttoChain's fiber system:

```typescript
const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY);
const stateMachine = config.stateMachine;

// Examine available transitions
for (const transition of stateMachine.transitions) {
  console.log(`${transition.fromState} → ${transition.toState} (${transition.trigger})`);
  console.log(`Required authority: ${transition.requiredValidatorAuthorityLevel}`);
  console.log(`Required capabilities: ${transition.requiredProducerCapabilities.join(', ')}`);
}
```

## Integration with Producer-Validator Framework

The 16-type system seamlessly integrates with the existing Producer-Validator Framework:

- **Producer Capabilities**: Each operation requires specific producer capabilities
- **Validator Authority**: Transitions require minimum validator authority levels
- **Multi-party Coordination**: Complex tokens support multi-party workflows
- **JSON Logic Integration**: Business rules use JSON Logic for declarative policies

## Key Features

### 1. Type Safety
- Complete TypeScript type definitions
- Compile-time validation of token operations
- Exhaustive TERV flag checking

### 2. Extensibility
- Pluggable validation constraints
- Custom business rules via JSON Logic
- Extensible state machine definitions

### 3. Producer-Validator Integration
- Authority level requirements per operation
- Producer capability validation
- Multi-party coordination support

### 4. Real-world Examples
- Practical use cases for each token type
- Complete lifecycle demonstrations
- Error handling patterns

### 5. Comprehensive Testing
- 100% coverage of TERV combinations
- Operation validation testing
- Integration test scenarios

## Next Steps

This implementation provides the complete foundation for the 16-type token behavior system. Future enhancements could include:

1. **Scala Implementation**: Generate equivalent Scala types for OttoChain metagraph
2. **Advanced State Machines**: More complex state transition patterns
3. **Dynamic Token Types**: Runtime token type composition
4. **Cross-chain Compatibility**: Bridge patterns for multi-chain tokens
5. **Performance Optimization**: Batch operations and caching strategies

## Dependencies

- Producer-Validator Framework (existing)
- JSON Logic Virtual Machine (OttoChain integration)
- OttoChain Fiber System (state management)
- TypeScript type system (compile-time safety)

## Testing

Run the comprehensive test suite:

```bash
npm test tests/token-types/token-behavior-matrix.test.ts
```

The test suite covers:
- All 16 TERV combinations
- Operation validation logic
- Constraint enforcement
- Real-world usage scenarios
- Error handling patterns
- Integration with Producer-Validator Framework

## Documentation

Additional documentation:
- [Producer-Validator Framework](./README.md) - Foundation architecture
- [JSON Logic Guide](../../../JSONLOGIC-GUIDE.md) - Business rule definitions
- [OttoChain Integration](./integration.ts) - Fiber system integration
- [Examples](../../examples/token-types/all-16-types.ts) - Complete usage examples

---

**Status**: ✅ **COMPLETE** - All acceptance criteria met
**Implementation**: TypeScript (ready for Scala codegen)
**Test Coverage**: Comprehensive
**Documentation**: Complete
**Integration**: Producer-Validator Framework compatible