/**
 * Test: Anonymous User ID Prefix Validation
 * 
 * Ensures that anonymous_user_id always has 'user_' prefix
 * to prevent Mozilla UA strings from being stored.
 */

import { getOrCreateAnonymousUser } from '@/lib/services/anonymous-user.service';

describe('Anonymous User ID Prefix', () => {
  it('should always return ID with user_ prefix', () => {
    const user = getOrCreateAnonymousUser();
    
    expect(user.id).toBeDefined();
    expect(user.id).toMatch(/^user_/);
    expect(user.id.length).toBeGreaterThan(6); // 'user_' + UUID
  });

  it('should not contain Mozilla UA string', () => {
    const user = getOrCreateAnonymousUser();
    
    expect(user.id).not.toContain('Mozilla');
    expect(user.id).not.toContain('Chrome');
    expect(user.id).not.toContain('Safari');
    expect(user.id).not.toContain('AppleWebKit');
  });

  it('should be consistent across multiple calls', () => {
    const user1 = getOrCreateAnonymousUser();
    const user2 = getOrCreateAnonymousUser();
    
    expect(user1.id).toBe(user2.id);
  });
});

describe('Guard Prefix Function', () => {
  const ensurePrefix = (id: string): string => {
    return id.startsWith('user_') ? id : `user_${id}`;
  };

  it('should add prefix if missing', () => {
    const rawId = '123e4567-e89b-12d3-a456-426614174000';
    const result = ensurePrefix(rawId);
    
    expect(result).toBe(`user_${rawId}`);
    expect(result).toMatch(/^user_/);
  });

  it('should not duplicate prefix', () => {
    const prefixedId = 'user_123e4567-e89b-12d3-a456-426614174000';
    const result = ensurePrefix(prefixedId);
    
    expect(result).toBe(prefixedId);
    expect(result.match(/user_/g)?.length).toBe(1);
  });

  it('should handle Mozilla UA string', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    const result = ensurePrefix(ua);
    
    expect(result).toBe(`user_${ua}`);
    expect(result).toMatch(/^user_/);
  });
});
