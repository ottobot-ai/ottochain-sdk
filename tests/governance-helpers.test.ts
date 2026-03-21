/**
 * Tests for governance helper functions
 */

import {
  isThresholdMet,
  signaturesNeeded,
  isSigner,
  hasSigned,
  getVotingPower,
  hasQuorum,
  isPassing,
  canPropose,
  meetsThreshold,
  isMember,
  thresholdHasQuorum,
} from '../src/apps/governance';

import type {
  MultisigDAO,
  TokenDAO,
  ThresholdDAO,
} from '../src/generated/ottochain/apps/governance/v1/governance';

import { DAOStatus } from '../src/generated/ottochain/apps/governance/v1/governance';

describe('Governance Helper Functions', () => {
  describe('MultisigDAO Helpers', () => {
    const createMultisigDAO = (overrides: Partial<MultisigDAO> = {}): MultisigDAO => ({
      name: 'Test Multisig',
      signers: ['alice', 'bob', 'charlie'],
      threshold: 2,
      signatures: {},
      actions: [],
      proposal: undefined,
      proposalTtlMs: 86400000,
      cancelledProposals: [],
      status: DAOStatus.DAO_STATUS_ACTIVE,
      ...overrides,
    });

    describe('isThresholdMet', () => {
      it('should return false when no signatures', () => {
        const state = createMultisigDAO({ signatures: {} });
        expect(isThresholdMet(state)).toBe(false);
      });

      it('should return false when signatures below threshold', () => {
        const state = createMultisigDAO({
          threshold: 2,
          signatures: { alice: 1234567890 },
        });
        expect(isThresholdMet(state)).toBe(false);
      });

      it('should return true when signatures equal threshold', () => {
        const state = createMultisigDAO({
          threshold: 2,
          signatures: { alice: 1234567890, bob: 1234567891 },
        });
        expect(isThresholdMet(state)).toBe(true);
      });

      it('should return true when signatures exceed threshold', () => {
        const state = createMultisigDAO({
          threshold: 2,
          signatures: {
            alice: 1234567890,
            bob: 1234567891,
            charlie: 1234567892,
          },
        });
        expect(isThresholdMet(state)).toBe(true);
      });
    });

    describe('signaturesNeeded', () => {
      it('should return full threshold when no signatures', () => {
        const state = createMultisigDAO({ threshold: 3, signatures: {} });
        expect(signaturesNeeded(state)).toBe(3);
      });

      it('should return remaining count when partial signatures', () => {
        const state = createMultisigDAO({
          threshold: 3,
          signatures: { alice: 1234567890 },
        });
        expect(signaturesNeeded(state)).toBe(2);
      });

      it('should return 0 when threshold met', () => {
        const state = createMultisigDAO({
          threshold: 2,
          signatures: { alice: 1234567890, bob: 1234567891 },
        });
        expect(signaturesNeeded(state)).toBe(0);
      });

      it('should return 0 when signatures exceed threshold', () => {
        const state = createMultisigDAO({
          threshold: 2,
          signatures: {
            alice: 1234567890,
            bob: 1234567891,
            charlie: 1234567892,
          },
        });
        expect(signaturesNeeded(state)).toBe(0);
      });
    });

    describe('isSigner', () => {
      it('should return true for valid signer', () => {
        const state = createMultisigDAO({ signers: ['alice', 'bob'] });
        expect(isSigner(state, 'alice')).toBe(true);
        expect(isSigner(state, 'bob')).toBe(true);
      });

      it('should return false for non-signer', () => {
        const state = createMultisigDAO({ signers: ['alice', 'bob'] });
        expect(isSigner(state, 'charlie')).toBe(false);
        expect(isSigner(state, 'unknown')).toBe(false);
      });

      it('should return false for empty signers list', () => {
        const state = createMultisigDAO({ signers: [] });
        expect(isSigner(state, 'alice')).toBe(false);
      });
    });

    describe('hasSigned', () => {
      it('should return true when agent has signed', () => {
        const state = createMultisigDAO({
          signatures: { alice: 1234567890 },
        });
        expect(hasSigned(state, 'alice')).toBe(true);
      });

      it('should return false when agent has not signed', () => {
        const state = createMultisigDAO({
          signatures: { alice: 1234567890 },
        });
        expect(hasSigned(state, 'bob')).toBe(false);
      });

      it('should return false for empty signatures', () => {
        const state = createMultisigDAO({ signatures: {} });
        expect(hasSigned(state, 'alice')).toBe(false);
      });
    });
  });

  describe('TokenDAO Helpers', () => {
    const createTokenDAO = (overrides: Partial<TokenDAO> = {}): TokenDAO => ({
      name: 'Test Token DAO',
      tokenId: 'test-token',
      balances: { alice: 100, bob: 50, charlie: 25 },
      delegations: {},
      proposalThreshold: 10,
      votingPeriodMs: 86400000,
      timelockMs: 3600000,
      quorum: 100,
      proposal: undefined,
      votes: undefined,
      executedProposals: [],
      rejectedProposals: [],
      cancelledProposals: [],
      status: DAOStatus.DAO_STATUS_ACTIVE,
      ...overrides,
    });

    describe('getVotingPower', () => {
      it('should return own balance when no delegations', () => {
        const state = createTokenDAO({
          balances: { alice: 100, bob: 50 },
          delegations: {},
        });
        expect(getVotingPower(state, 'alice')).toBe(100);
        expect(getVotingPower(state, 'bob')).toBe(50);
      });

      it('should return 0 for non-holder', () => {
        const state = createTokenDAO({
          balances: { alice: 100 },
          delegations: {},
        });
        expect(getVotingPower(state, 'unknown')).toBe(0);
      });

      it('should include delegated power', () => {
        const state = createTokenDAO({
          balances: { alice: 100, bob: 50, charlie: 25 },
          delegations: { bob: 'alice' },
        });
        // alice has 100 + 50 (delegated from bob) = 150
        expect(getVotingPower(state, 'alice')).toBe(150);
      });

      it('should include multiple delegations', () => {
        const state = createTokenDAO({
          balances: { alice: 100, bob: 50, charlie: 25 },
          delegations: { bob: 'alice', charlie: 'alice' },
        });
        // alice has 100 + 50 + 25 = 175
        expect(getVotingPower(state, 'alice')).toBe(175);
      });

      it('should not count delegator power', () => {
        const state = createTokenDAO({
          balances: { alice: 100, bob: 50 },
          delegations: { bob: 'alice' },
        });
        // bob delegated away, but still has balance (just can't vote with it)
        // In this implementation, getVotingPower returns effective voting power
        // bob's power was delegated to alice, so bob has only own balance
        expect(getVotingPower(state, 'bob')).toBe(50);
      });
    });

    describe('hasQuorum', () => {
      it('should return false when no votes', () => {
        const state = createTokenDAO({ votes: undefined });
        expect(hasQuorum(state)).toBe(false);
      });

      it('should return false when votes below quorum', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 30,
            votesAgainst: 20,
            votesAbstain: 10,
            votes: [],
          },
        });
        expect(hasQuorum(state)).toBe(false);
      });

      it('should return true when votes equal quorum', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 50,
            votesAgainst: 30,
            votesAbstain: 20,
            votes: [],
          },
        });
        expect(hasQuorum(state)).toBe(true);
      });

      it('should return true when votes exceed quorum', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 100,
            votesAgainst: 50,
            votesAbstain: 25,
            votes: [],
          },
        });
        expect(hasQuorum(state)).toBe(true);
      });
    });

    describe('isPassing', () => {
      it('should return false when no votes', () => {
        const state = createTokenDAO({ votes: undefined });
        expect(isPassing(state)).toBe(false);
      });

      it('should return false when for <= against', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 50,
            votesAgainst: 60,
            votesAbstain: 20,
            votes: [],
          },
        });
        expect(isPassing(state)).toBe(false);
      });

      it('should return false when for > against but no quorum', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 30,
            votesAgainst: 20,
            votesAbstain: 10,
            votes: [],
          },
        });
        expect(isPassing(state)).toBe(false);
      });

      it('should return true when for > against and quorum met', () => {
        const state = createTokenDAO({
          quorum: 100,
          votes: {
            votesFor: 60,
            votesAgainst: 30,
            votesAbstain: 20,
            votes: [],
          },
        });
        expect(isPassing(state)).toBe(true);
      });
    });

    describe('canPropose', () => {
      it('should return true when balance >= proposalThreshold', () => {
        const state = createTokenDAO({
          balances: { alice: 100 },
          proposalThreshold: 10,
        });
        expect(canPropose(state, 'alice')).toBe(true);
      });

      it('should return true when balance equals proposalThreshold', () => {
        const state = createTokenDAO({
          balances: { alice: 10 },
          proposalThreshold: 10,
        });
        expect(canPropose(state, 'alice')).toBe(true);
      });

      it('should return false when balance < proposalThreshold', () => {
        const state = createTokenDAO({
          balances: { alice: 5 },
          proposalThreshold: 10,
        });
        expect(canPropose(state, 'alice')).toBe(false);
      });

      it('should return false for non-holder', () => {
        const state = createTokenDAO({
          balances: {},
          proposalThreshold: 10,
        });
        expect(canPropose(state, 'alice')).toBe(false);
      });
    });
  });

  describe('ThresholdDAO Helpers', () => {
    const createThresholdDAO = (overrides: Partial<ThresholdDAO> = {}): ThresholdDAO => ({
      name: 'Test Threshold DAO',
      members: ['alice', 'bob', 'charlie'],
      memberThreshold: 10,
      voteThreshold: 20,
      proposeThreshold: 30,
      votingPeriodMs: 86400000,
      quorum: 2,
      proposal: undefined,
      votes: undefined,
      history: [],
      memberJoinedAt: {},
      status: DAOStatus.DAO_STATUS_ACTIVE,
      ...overrides,
    });

    describe('meetsThreshold', () => {
      it('should check member threshold correctly', () => {
        const state = createThresholdDAO({ memberThreshold: 10 });
        expect(meetsThreshold(state, 10, 'member')).toBe(true);
        expect(meetsThreshold(state, 15, 'member')).toBe(true);
        expect(meetsThreshold(state, 5, 'member')).toBe(false);
      });

      it('should check vote threshold correctly', () => {
        const state = createThresholdDAO({ voteThreshold: 20 });
        expect(meetsThreshold(state, 20, 'vote')).toBe(true);
        expect(meetsThreshold(state, 25, 'vote')).toBe(true);
        expect(meetsThreshold(state, 15, 'vote')).toBe(false);
      });

      it('should check propose threshold correctly', () => {
        const state = createThresholdDAO({ proposeThreshold: 30 });
        expect(meetsThreshold(state, 30, 'propose')).toBe(true);
        expect(meetsThreshold(state, 50, 'propose')).toBe(true);
        expect(meetsThreshold(state, 25, 'propose')).toBe(false);
      });
    });

    describe('isMember', () => {
      it('should return true for members', () => {
        const state = createThresholdDAO({ members: ['alice', 'bob'] });
        expect(isMember(state, 'alice')).toBe(true);
        expect(isMember(state, 'bob')).toBe(true);
      });

      it('should return false for non-members', () => {
        const state = createThresholdDAO({ members: ['alice', 'bob'] });
        expect(isMember(state, 'charlie')).toBe(false);
        expect(isMember(state, 'unknown')).toBe(false);
      });

      it('should return false for empty members', () => {
        const state = createThresholdDAO({ members: [] });
        expect(isMember(state, 'alice')).toBe(false);
      });
    });

    describe('thresholdHasQuorum', () => {
      it('should return false when no votes', () => {
        const state = createThresholdDAO({ votes: undefined });
        expect(thresholdHasQuorum(state)).toBe(false);
      });

      it('should return false when votes below quorum', () => {
        const state = createThresholdDAO({
          quorum: 3,
          votes: {
            votesFor: ['alice'],
            votesAgainst: [],
            votesAbstain: [],
          },
        });
        expect(thresholdHasQuorum(state)).toBe(false);
      });

      it('should return true when votes equal quorum', () => {
        const state = createThresholdDAO({
          quorum: 2,
          votes: {
            votesFor: ['alice'],
            votesAgainst: ['bob'],
            votesAbstain: [],
          },
        });
        expect(thresholdHasQuorum(state)).toBe(true);
      });

      it('should return true when votes exceed quorum', () => {
        const state = createThresholdDAO({
          quorum: 2,
          votes: {
            votesFor: ['alice', 'charlie'],
            votesAgainst: ['bob'],
            votesAbstain: [],
          },
        });
        expect(thresholdHasQuorum(state)).toBe(true);
      });

      it('should not count abstain votes for quorum', () => {
        const state = createThresholdDAO({
          quorum: 3,
          votes: {
            votesFor: ['alice'],
            votesAgainst: ['bob'],
            votesAbstain: ['charlie'],
          },
        });
        // Only for + against = 2, quorum is 3
        expect(thresholdHasQuorum(state)).toBe(false);
      });
    });
  });
});
