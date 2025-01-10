const { parseM4sPath } = require('../lib/parse-m4s');

describe('parseM4sPath', () => {
  test('should parse new format path correctly', () => {
    const result = parseM4sPath('/192.168.0.10/TVD0000/0-10.m4s');
    expect(result).toEqual({
      sn: '192.168.0.10',
      program: 'TVD0000',
      track: 0,
      segment: 10
    });
  });

  test('should parse path with special characters in program', () => {
    const result = parseM4sPath('/192.168.0.10/TVD_123-456/0-10.m4s');
    expect(result).toEqual({
      sn: '192.168.0.10',
      program: 'TVD_123-456',
      track: 0,
      segment: 10
    });
  });

  test('should parse path with different track numbers', () => {
    const result = parseM4sPath('/192.168.0.10/TVD0000/3-10.m4s');
    expect(result).toEqual({
      sn: '192.168.0.10',
      program: 'TVD0000',
      track: 3,
      segment: 10
    });
  });

  test('should parse legacy format correctly', () => {
    const result = parseM4sPath('/0-38304768.m4s');
    expect(result).toEqual({
      track: 0,
      segment: 38304768
    });
  });

  test('should throw error for invalid m4s path format', () => {
    expect(() => {
      parseM4sPath('/invalid.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should throw error for non-numeric track', () => {
    expect(() => {
      parseM4sPath('/192.168.0.10/TVD0000/xyz-10.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should throw error for non-numeric segment', () => {
    expect(() => {
      parseM4sPath('/192.168.0.10/TVD0000/0-xyz.m4s');
    }).toThrow('Invalid m4s path format');
  });

  test('should throw error for missing program in new format', () => {
    expect(() => {
      parseM4sPath('/192.168.0.10/0-10.m4s');
    }).toThrow('Invalid m4s path format');
  });
});
