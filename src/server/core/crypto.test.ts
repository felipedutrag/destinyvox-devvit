import { describe, it, expect } from 'vitest';
import { encryptUsername, decryptUsername } from './crypto';

describe('Stripe Username Encryption (AES-256-GCM)', () => {
  it('encrypts and decrypts a reddit username successfully', () => {
    const user = 'differentduck';
    const encrypted = encryptUsername(user);

    expect(encrypted).toMatch(/^enc_/);
    expect(encrypted).not.toContain(user);

    const decrypted = decryptUsername(encrypted);
    expect(decrypted).toBe(user);
  });

  it('strips u/ prefix when encrypting', () => {
    const user = 'u/cosmic_voyager';
    const encrypted = encryptUsername(user);
    const decrypted = decryptUsername(encrypted);
    expect(decrypted).toBe('cosmic_voyager');
  });

  it('returns null for invalid or tampered tokens', () => {
    expect(decryptUsername('invalid_token')).toBeNull();
    expect(decryptUsername('enc_YWJjZGVm')).toBeNull();
  });
});
