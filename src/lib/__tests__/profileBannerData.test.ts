import { describe, it, expect } from 'vitest';
import { normalizeUserProfile } from '../profile';
import { Timestamp } from 'firebase/firestore';

describe('normalizeUserProfile com bannerUrl', () => {
  it('retorna photoURL e bannerUrl quando fornecidos', () => {
    const data = {
      photoURL: 'https://example.com/avatar.jpg',
      bannerUrl: 'https://example.com/banner.jpg',
      createdAt: Timestamp.now(),
    };
    const profile = normalizeUserProfile(data, 'user-123');

    expect(profile.photoURL).toBe('https://example.com/avatar.jpg');
    expect(profile.bannerUrl).toBe('https://example.com/banner.jpg');
  });

  it('retorna bannerUrl como null quando documento não possuir bannerUrl', () => {
    const data = {
      photoURL: 'https://example.com/avatar.jpg',
      createdAt: Timestamp.now(),
    };
    const profile = normalizeUserProfile(data, 'user-123');

    expect(profile.photoURL).toBe('https://example.com/avatar.jpg');
    expect(profile.bannerUrl).toBeNull();
  });
});
