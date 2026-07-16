/**
 * normalizeNullifierHex — the byte-for-byte mirror of the chain's `NullifierHex.normalize`
 * (protocol-nullifier-set.md). Every SDK surface that accepts an nf value routes through it,
 * so these cases pin the exact accept/reject boundary the chain enforces at combine.
 */
import { normalizeNullifierHex } from '../../src/schema/nullifier';

const HEX64 = 'ab'.repeat(32);

describe('normalizeNullifierHex (chain NullifierHex.scala mirror)', () => {
  it('accepts bare lowercase 64-hex unchanged', () => {
    expect(normalizeNullifierHex(HEX64)).toBe(HEX64);
  });

  it('strips one optional 0x/0X prefix', () => {
    expect(normalizeNullifierHex(`0x${HEX64}`)).toBe(HEX64);
    expect(normalizeNullifierHex(`0X${HEX64}`)).toBe(HEX64);
  });

  it('lowercases mixed/upper case', () => {
    expect(normalizeNullifierHex(HEX64.toUpperCase())).toBe(HEX64);
    expect(normalizeNullifierHex(`0x${'Ab'.repeat(32)}`)).toBe(HEX64);
  });

  it('strips at most ONE prefix (0x0x… is 66 non-hex chars)', () => {
    expect(normalizeNullifierHex(`0x0x${'ab'.repeat(31)}`)).toBeNull();
  });

  it('rejects wrong lengths', () => {
    expect(normalizeNullifierHex('ab'.repeat(31))).toBeNull(); // 62
    expect(normalizeNullifierHex('ab'.repeat(33))).toBeNull(); // 66
    expect(normalizeNullifierHex('')).toBeNull();
    expect(normalizeNullifierHex('0x')).toBeNull();
  });

  it('rejects non-hex characters', () => {
    expect(normalizeNullifierHex('gg'.repeat(32))).toBeNull();
    expect(normalizeNullifierHex(`${'ab'.repeat(31)}z1`)).toBeNull();
  });

  it('the prefix is only stripped at the head (hex containing 0x elsewhere rejects)', () => {
    // 64 chars but with a literal '0x' in the middle -> 'x' is not hex -> null.
    expect(normalizeNullifierHex(`${'ab'.repeat(16)}0x${'ab'.repeat(15)}`)).toBeNull();
  });
});
