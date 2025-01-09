const { parseM4sPath } = require('../lib/parse-m4s');

describe('parseM4sPath', () => {
  test('should parse path with numeric sn correctly', () => {
    const result = parseM4sPath('/123/0-38304768.m4s');
    expect(result).toEqual({
      sn: '123',
      trackId: 0,
      targetSequence: 38304768
    });
  });

  test('should parse path with string sn correctly', () => {
    const result = parseM4sPath('/abc-def/0-38304768.m4s');
    expect(result).toEqual({
      sn: 'abc-def',
      trackId: 0,
      targetSequence: 38304768
    });
  });

  test('should parse path with special characters in sn', () => {
    const result = parseM4sPath('/test_123-xyz/0-38304768.m4s');
    expect(result).toEqual({
      sn: 'test_123-xyz',
      trackId: 0,
      targetSequence: 38304768
    });
  });

  test('should parse simple path format correctly', () => {
    const result = parseM4sPath('/0-38304768.m4s');
    expect(result).toEqual({
      trackId: 0,
      targetSequence: 38304768
    });
  });

  test('should handle paths with leading directories', () => {
    const result = parseM4sPath('/some/path/test-123/0-38304768.m4s');
    expect(result).toEqual({
      sn: 'test-123',
      trackId: 0,
      targetSequence: 38304768
    });
  });

  test('should throw error for invalid m4s path format', () => {
    expect(() => {
      parseM4sPath('/invalid.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should throw error for non-numeric track ID', () => {
    expect(() => {
      parseM4sPath('/abc/xyz-38304768.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should throw error for non-numeric sequence', () => {
    expect(() => {
      parseM4sPath('/abc/0-xyz.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should handle paths with different track IDs', () => {
    const result = parseM4sPath('/test-abc/3-38304768.m4s');
    expect(result).toEqual({
      sn: 'test-abc',
      trackId: 3,
      targetSequence: 38304768
    });
  });
});
