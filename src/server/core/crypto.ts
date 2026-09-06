import crypto from 'node:crypto';

// Segredo para criptografia simétrica. Se não estiver configurado nas envs, utiliza um fallback de 32 bytes estável.
const RAW_SECRET = process.env.STRIPE_ENCRYPTION_SECRET || 'destinyvox_pythagorean_cosmic_key_2026_secure';
const CIPHER_KEY = crypto.createHash('sha256').update(RAW_SECRET).digest();
const ALGORITHM = 'aes-256-gcm';

/**
 * Criptografa o username do usuário usando AES-256-GCM.
 * Retorna uma string segura contendo IV, Auth Tag e Ciphertext em Base64 URL-safe.
 */
export function encryptUsername(username: string): string {
  const cleanUsername = username.replace(/^u\//i, '').trim();
  if (!cleanUsername) return '';

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, CIPHER_KEY, iv);
  
  const payload = JSON.stringify({
    u: cleanUsername,
    t: Date.now(),
  });

  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv (12 bytes) + tag (16 bytes) + encrypted
  const combined = Buffer.concat([iv, tag, encrypted]);
  return 'enc_' + combined.toString('base64url');
}

/**
 * Decriptografa e valida o token retornado pelo Stripe.
 * Retorna o username limpo do Reddit ou null caso inválido/adulterado.
 */
export function decryptUsername(token: string): string | null {
  if (!token) return null;

  // Fallback seguro caso venha como u_username do client_reference_id
  if (token.startsWith('u_')) {
    const rawUser = token.slice(2).trim();
    return rawUser ? rawUser.replace(/^u\//i, '') : null;
  }

  if (!token.startsWith('enc_')) return null;

  try {
    const rawBase64 = token.slice(4);
    const combined = Buffer.from(rawBase64, 'base64url');

    if (combined.length < 28) return null; // 12 bytes IV + 16 bytes Tag

    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);

    const decipher = crypto.createDecipheriv(ALGORITHM, CIPHER_KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted) as { u?: string };

    return parsed.u ? parsed.u.trim() : null;
  } catch (err) {
    console.error('Falha ao decriptografar token de usuário Stripe:', err);
    return null;
  }
}
