/**
 * Domain Test Fixtures
 * 
 * Shared test data and utilities for domain integration tests.
 * Provides reusable mock data, addresses, and helper functions.
 */

// Test wallet addresses (consistent across all tests)
export const TEST_ADDRESSES = {
  ALICE: 'DAGabc123...alice',
  BOB: 'DAGdef456...bob',
  CHARLIE: 'DAGghi789...charlie',
  DAO_TREASURY: 'DAGdao111...treasury',
  ORACLE_NODE: 'DAGora222...oracle',
  MARKET_MAKER: 'DAGmkt333...maker',
} as const;

// Test private keys (for testing only - never use in production)
export const TEST_PRIVATE_KEYS = {
  ALICE: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  BOB: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  CHARLIE: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
} as const;

// Identity domain fixtures
export const IDENTITY_FIXTURES = {
  newAgent: {
    walletAddress: TEST_ADDRESSES.ALICE,
    platformLinks: [
      { platform: 'github', username: 'alice_dev' },
      { platform: 'linkedin', username: 'alice-professional' },
    ],
    reputation: 10,
    attestations: [],
    violations: 0,
    capabilities: ['ml_classify', 'data_process'],
  },
  
  attestation: {
    type: 'VOUCH',
    from: TEST_ADDRESSES.BOB,
    to: TEST_ADDRESSES.ALICE,
    confidence: 0.9,
    metadata: { context: 'successful project collaboration' },
  },
} as const;

// Contracts domain fixtures
export const CONTRACT_FIXTURES = {
  simpleContract: {
    id: 'contract_001',
    parties: [TEST_ADDRESSES.ALICE, TEST_ADDRESSES.BOB],
    terms: 'Alice will deliver software module by 2026-03-01. Bob will pay 1000 DAG upon completion.',
    escrowAmount: '1000',
    deadline: '2026-03-01T00:00:00Z',
    state: 'DRAFT',
    signatures: [],
  },
  
  escrowHolding: {
    id: 'escrow_001',
    contractId: 'contract_001',
    amount: '1000',
    currency: 'DAG',
    holder: TEST_ADDRESSES.BOB,
    beneficiary: TEST_ADDRESSES.ALICE,
    conditions: ['contract_fulfilled'],
  },
} as const;

// Markets domain fixtures
export const MARKET_FIXTURES = {
  demoMarket: {
    id: 'market_001',
    name: 'DAG/USDC Trading Pair',
    baseAsset: 'DAG',
    quoteAsset: 'USDC',
    tickSize: '0.001',
    minOrderSize: '1',
    makerFee: '0.001', // 0.1%
    takerFee: '0.002', // 0.2%
    tradingHours: { start: '00:00', end: '23:59', timezone: 'UTC' },
  },
  
  limitOrder: {
    id: 'order_001',
    marketId: 'market_001',
    trader: TEST_ADDRESSES.ALICE,
    side: 'BUY',
    orderType: 'LIMIT',
    quantity: '100',
    price: '0.50',
    timeInForce: 'GTC', // Good Till Cancelled
  },
} as const;

// Governance domain fixtures
export const GOVERNANCE_FIXTURES = {
  multisigDAO: {
    id: 'dao_001',
    name: 'OttoChain Development DAO',
    type: 'MULTISIG',
    members: [TEST_ADDRESSES.ALICE, TEST_ADDRESSES.BOB, TEST_ADDRESSES.CHARLIE],
    quorum: 2, // 2 out of 3
    treasuryAddress: TEST_ADDRESSES.DAO_TREASURY,
  },
  
  proposal: {
    id: 'proposal_001',
    daoId: 'dao_001',
    title: 'Fund smart contract audit',
    description: 'Allocate 5000 DAG for security audit of core contracts',
    proposer: TEST_ADDRESSES.ALICE,
    requestedAmount: '5000',
    recipient: 'DAGaudit789...auditor',
    votingPeriod: { start: '2026-03-01T00:00:00Z', end: '2026-03-08T00:00:00Z' },
  },
} as const;

// Corporate domain fixtures
export const CORPORATE_FIXTURES = {
  entity: {
    id: 'corp_001',
    name: 'OttoChain Technologies Inc.',
    jurisdiction: 'Delaware',
    entityType: 'C-Corporation',
    registeredAgent: TEST_ADDRESSES.ALICE,
    incorporationDate: '2026-01-01',
    authorizedShares: 1000000,
    outstandingShares: 750000,
  },
  
  boardMember: {
    address: TEST_ADDRESSES.ALICE,
    name: 'Alice Johnson',
    title: 'Chief Technology Officer',
    appointmentDate: '2026-01-01',
    termExpires: '2027-01-01',
  },
} as const;

// Oracle domain fixtures
export const ORACLE_FIXTURES = {
  priceOracle: {
    id: 'oracle_001',
    name: 'DAG/USD Price Feed',
    operator: TEST_ADDRESSES.ORACLE_NODE,
    dataType: 'PRICE',
    baseCurrency: 'DAG',
    quoteCurrency: 'USD',
    updateFrequency: 300, // 5 minutes in seconds
    stakeAmount: '10000',
    reputation: 95.5,
  },
  
  attestation: {
    id: 'attestation_001',
    oracleId: 'oracle_001',
    dataPoint: {
      value: '0.525',
      timestamp: '2026-02-25T19:00:00Z',
      confidence: 0.98,
      sources: ['coinbase', 'binance', 'kraken'],
    },
    signature: '0xabc123...signature',
  },
} as const;

// Test utilities
export const TEST_UTILS = {
  /**
   * Generate a mock timestamp for testing
   */
  mockTimestamp: (offsetMinutes: number = 0): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + offsetMinutes);
    return now.toISOString();
  },
  
  /**
   * Generate a mock UUID for testing
   */
  mockUUID: (prefix: string = 'test'): string => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Sleep for testing async operations
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Create a mock signature for testing
   */
  mockSignature: (data: string): string => {
    return `0x${Buffer.from(`signature_of_${data}`).toString('hex')}`;
  },
} as const;

// Environment configuration helpers
export const TEST_CONFIG = {
  /**
   * Should skip integration tests that require a running metagraph
   */
  shouldSkipIntegration: (): boolean => {
    return process.env.SKIP_INTEGRATION === 'true';
  },
  
  /**
   * Get test metagraph endpoint
   */
  getMetagraphEndpoint: (): string => {
    return process.env.TEST_METAGRAPH_URL || 'http://localhost:9000';
  },
  
  /**
   * Get test timeout for integration tests
   */
  getTestTimeout: (): number => {
    return parseInt(process.env.TEST_TIMEOUT || '30000', 10);
  },
} as const;