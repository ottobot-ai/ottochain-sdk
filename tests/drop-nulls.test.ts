import { dropNulls } from '../src/metakit/drop-nulls';

describe('dropNulls', () => {
  it('removes null fields from objects', () => {
    expect(dropNulls({ a: 1, b: null, c: 'hello' })).toEqual({ a: 1, c: 'hello' });
  });

  it('removes undefined fields from objects', () => {
    expect(dropNulls({ a: 1, b: undefined })).toEqual({ a: 1 });
  });

  it('preserves null values in arrays', () => {
    expect(dropNulls([1, null, 3])).toEqual([1, null, 3]);
  });

  it('recurses into nested objects', () => {
    expect(dropNulls({ a: { b: null, c: 2 }, d: null })).toEqual({ a: { c: 2 } });
  });

  it('recurses into arrays of objects', () => {
    expect(dropNulls([{ a: null, b: 1 }, { c: null }])).toEqual([{ b: 1 }, {}]);
  });

  it('returns primitives unchanged', () => {
    expect(dropNulls(42)).toBe(42);
    expect(dropNulls('hello')).toBe('hello');
    expect(dropNulls(true)).toBe(true);
  });

  it('returns null unchanged at top level', () => {
    expect(dropNulls(null)).toBeNull();
  });

  it('returns undefined unchanged at top level', () => {
    expect(dropNulls(undefined)).toBeUndefined();
  });

  it('handles deeply nested structures', () => {
    const input = { a: { b: { c: null, d: { e: null, f: 1 } } } };
    expect(dropNulls(input)).toEqual({ a: { b: { d: { f: 1 } } } });
  });

  it('handles empty objects', () => {
    expect(dropNulls({})).toEqual({});
  });

  it('handles empty arrays', () => {
    expect(dropNulls([])).toEqual([]);
  });
});
