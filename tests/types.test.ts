import { isValidAddress, isValidFiberId } from '../src/types';

describe('Type utilities', () => {
  describe('isValidAddress', () => {
    it('accepts valid DAG addresses', () => {
      expect(isValidAddress('DAG4o8VX63jPFLQ6pZ5XE7qT8vGp8gkgBHj1QL5c')).toBe(true);
      expect(isValidAddress('DAGabc123')).toBe(true);
    });

    it('rejects addresses without DAG prefix', () => {
      expect(isValidAddress('ABC123')).toBe(false);
      expect(isValidAddress('dag123')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidAddress('')).toBe(false);
    });

    it('rejects DAG prefix only', () => {
      expect(isValidAddress('DAG')).toBe(false);
    });

    it('rejects addresses with special characters', () => {
      expect(isValidAddress('DAG!@#$')).toBe(false);
      expect(isValidAddress('DAG abc')).toBe(false);
    });
  });

  describe('isValidFiberId', () => {
    it('accepts valid UUIDs', () => {
      expect(isValidFiberId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidFiberId('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('accepts uppercase UUIDs', () => {
      expect(isValidFiberId('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects non-UUID strings', () => {
      expect(isValidFiberId('not-a-uuid')).toBe(false);
      expect(isValidFiberId('')).toBe(false);
      expect(isValidFiberId('550e8400e29b41d4a716446655440000')).toBe(false);
    });

    it('rejects UUIDs with wrong segment lengths', () => {
      expect(isValidFiberId('550e840-e29b-41d4-a716-446655440000')).toBe(false);
      expect(isValidFiberId('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    });
  });
});
