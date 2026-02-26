# OttoChain SDK Integration Tests

This directory contains comprehensive integration tests for all OttoChain domain applications.

## Test Structure

```
tests/
├── domains/                          # Domain-specific integration tests
│   ├── identity.integration.test.ts  # Agent identity & reputation (12 tests)
│   ├── contracts.integration.test.ts # Smart contracts & escrow (15 tests)
│   ├── markets.integration.test.ts   # Trading & order books (14 tests)
│   ├── governance.integration.test.ts# DAO governance & voting (17 tests)
│   ├── corporate.integration.test.ts # Corporate entities & boards (14 tests)
│   └── oracles.integration.test.ts   # Data oracles & attestation (15 tests)
├── cross-domain/                     # Cross-domain workflows
│   └── multi-domain.integration.test.ts # Complex multi-domain scenarios (5 tests)
├── fixtures/                         # Shared test data
│   └── domain-fixtures.ts           # Mock addresses, data, utilities
└── README.md                        # This file
```

## Test Categories

### Domain Integration Tests (87 tests)
Full lifecycle tests for each OttoChain domain application:

- **Identity Domain** (12 tests): Agent registration, reputation, attestations
- **Contracts Domain** (15 tests): Contract lifecycle, multi-party signing, escrow
- **Markets Domain** (14 tests): Order placement, matching, settlement
- **Governance Domain** (17 tests): DAO creation, proposals, voting, treasury
- **Corporate Domain** (14 tests): Entity formation, board governance, shareholders
- **Oracles Domain** (15 tests): Registration, data attestation, reputation

### Cross-Domain Tests (5 tests)
Complex workflows spanning multiple domains:

- Oracle data feeding contract conditions
- DAO treasury payments to contractors  
- Identity verification for market access
- Governance approval for corporate actions
- Agent reputation affecting oracle stakes

## Prerequisites

### Required Environment
- Node.js 18+ with npm/pnpm
- OttoChain SDK dependencies installed (`pnpm install`)
- Jest test framework configured

### Optional: Running Metagraph
For full integration testing against a live metagraph:

1. **Local Development Setup:**
   ```bash
   # Start local tessellation cluster with OttoChain metagraph
   cd /path/to/ottochain
   just up --metagraph --dl1 --data
   ```

2. **Remote Cluster (Scratch Environment):**
   ```bash
   export TEST_METAGRAPH_URL=https://services-scratch.ottochain.network
   ```

## Running Tests

### Run All Domain Tests
```bash
pnpm test tests/domains/
```

### Run Specific Domain
```bash
pnpm test tests/domains/identity.integration.test.ts
pnpm test tests/domains/contracts.integration.test.ts
# ... etc
```

### Run Cross-Domain Tests
```bash
pnpm test tests/cross-domain/
```

### Skip Integration Tests
If you don't have a running metagraph or want to run only unit tests:

```bash
export SKIP_INTEGRATION=true
pnpm test
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKIP_INTEGRATION` | `false` | Skip integration tests requiring metagraph |
| `TEST_METAGRAPH_URL` | `http://localhost:9000` | Metagraph endpoint for integration tests |
| `TEST_TIMEOUT` | `30000` | Test timeout in milliseconds |

## Test Data

### Fixed Test Addresses
All tests use consistent mock addresses from `fixtures/domain-fixtures.ts`:

- `ALICE`: `DAGabc123...alice` - Primary test agent
- `BOB`: `DAGdef456...bob` - Secondary test agent  
- `CHARLIE`: `DAGghi789...charlie` - Third test agent
- `DAO_TREASURY`: `DAGdao111...treasury` - DAO treasury address
- `ORACLE_NODE`: `DAGora222...oracle` - Oracle operator
- `MARKET_MAKER`: `DAGmkt333...maker` - Market maker

### Mock Private Keys
⚠️ **Test keys only** - never use these in production:
- Provided in `TEST_PRIVATE_KEYS` for signing test transactions
- Used for creating valid signatures in integration tests

## Test Development Guidelines

### TDD Approach
These tests follow strict Test-Driven Development:

1. **Red Phase**: Tests are written to FAIL first
2. **Green Phase**: Implement minimum code to make tests pass  
3. **Refactor Phase**: Improve code while keeping tests green

### Adding New Tests

1. **Domain Tests**: Add to appropriate `domains/*.integration.test.ts`
2. **Cross-Domain Tests**: Add to `cross-domain/multi-domain.integration.test.ts`
3. **Test Data**: Add fixtures to `fixtures/domain-fixtures.ts`

### Test Patterns

```typescript
// Use conditional skip for integration tests
const testOrSkip = skipIntegration ? it.skip : it;

testOrSkip('should test feature', async () => {
  // Arrange
  const fixture = DOMAIN_FIXTURES.exampleData;
  
  // Act  
  const result = await domainMethod(fixture);
  
  // Assert - Initially FAIL for TDD
  expect(result).toBeDefined();
  expect(true).toBe(false); // Force failure until implemented
});
```

## CI/CD Integration

### GitHub Actions
Add to `.github/workflows/test.yml`:

```yaml
- name: Run Unit Tests
  run: pnpm test --testPathIgnorePatterns=integration

- name: Run Integration Tests
  if: matrix.test-type == 'integration'  
  env:
    TEST_METAGRAPH_URL: ${{ secrets.SCRATCH_METAGRAPH_URL }}
  run: pnpm test tests/domains/ tests/cross-domain/
```

### Local Development
```bash
# Quick unit tests (no metagraph required)
pnpm test:unit

# Full integration tests (requires metagraph)  
pnpm test:integration

# Watch mode for development
pnpm test:watch
```

## Implementation Status

### Current Status: TDD Red Phase
All 92 tests are currently **FAILING** by design. This is the TDD "Red" phase.

### Implementation Order
Recommended implementation sequence:

1. **Identity Domain** (12 tests) - Foundation for other domains
2. **Contracts Domain** (15 tests) - Core business logic
3. **Markets Domain** (14 tests) - Trading functionality  
4. **Governance Domain** (17 tests) - DAO operations
5. **Corporate Domain** (14 tests) - Entity management
6. **Oracles Domain** (15 tests) - External data integration
7. **Cross-Domain** (5 tests) - Complex integrations

### Token Domain
Token domain tests are blocked pending PR #45 merge. Once available:
- Add `tokens.integration.test.ts` (estimated 16 tests)
- Update cross-domain tests to include token workflows

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase `TEST_TIMEOUT` environment variable
2. **Metagraph connection**: Verify `TEST_METAGRAPH_URL` is accessible
3. **Import errors**: Ensure SDK build is current (`pnpm build`)

### Debug Mode
```bash
# Run with debug output
DEBUG=ottochain:* pnpm test tests/domains/identity.integration.test.ts

# Increase test timeout for debugging
TEST_TIMEOUT=60000 pnpm test
```

## Contributing

1. **Before implementation**: Ensure tests FAIL (Red phase)
2. **During implementation**: Make tests pass incrementally (Green phase)  
3. **After implementation**: Refactor while maintaining test coverage
4. **Documentation**: Update this README with any new patterns or requirements