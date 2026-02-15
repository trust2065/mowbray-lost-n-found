import { describe, it, expect } from 'vitest';
import { validateNameTag } from '../hooks/useFileUpload';

describe('validateNameTag', () => {
  it('should reject empty names', () => {
    const result = validateNameTag('');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Name cannot be empty');
  });

  it('should reject null/undefined names', () => {
    const result1 = validateNameTag(null as unknown as string);
    const result2 = validateNameTag(undefined as unknown as string);

    expect(result1.isValid).toBe(false);
    expect(result2.isValid).toBe(false);
  });

  it('should reject whitespace-only names', () => {
    const result = validateNameTag('   ');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Name cannot be empty');
  });

  it('should reject generic names', () => {
    const genericNames = ['unknown', 'item', 'unnamed', 'lost item', 'found item'];

    genericNames.forEach(name => {
      const result = validateNameTag(name);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please provide a more specific name');
    });
  });

  it('should be case insensitive for generic names', () => {
    const result = validateNameTag('UNKNOWN');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Please provide a more specific name');
  });

  it('should accept valid names', () => {
    const validNames = ['John', 'Key', 'Phone', 'Blue hat', 'My wallet'];

    validNames.forEach(name => {
      const result = validateNameTag(name);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  it('should accept single character names', () => {
    const result = validateNameTag('A');
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should trim whitespace before validation', () => {
    const result = validateNameTag('  John  ');
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });
});
