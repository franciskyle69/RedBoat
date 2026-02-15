import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const KEY_LEN = 32;
const PREFIX = 'enc:';

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) return null;
  const buf = Buffer.from(raw, 'utf8');
  if (buf.length >= KEY_LEN) return buf.slice(0, KEY_LEN);
  return crypto.scryptSync(raw, 'salt', KEY_LEN);
}

/** Encrypt a string. Returns PREFIX + base64(iv || ciphertext || authTag). If ENCRYPTION_KEY not set, returns plaintext. */
export function encrypt(plaintext: string | undefined | null): string | undefined {
  if (plaintext === undefined || plaintext === null || plaintext === '') return undefined;
  const key = getKey();
  if (!key) return plaintext;
  try {
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + Buffer.concat([iv, enc, tag]).toString('base64');
  } catch {
    return undefined;
  }
}

/** Decrypt a string. If value does not start with PREFIX, returns as-is (backward compat). */
export function decrypt(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (!value.startsWith(PREFIX)) return value;
  const key = getKey();
  if (!key) return value;
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), 'base64');
    if (buf.length < IV_LEN + AUTH_TAG_LEN) return value;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return value;
  }
}

/** Encrypt an object by JSON.stringify then encrypt. */
export function encryptObject(obj: unknown): string | undefined {
  if (obj === undefined || obj === null) return undefined;
  return encrypt(JSON.stringify(obj));
}

/** Decrypt to object. If not encrypted, parse as JSON if it looks like JSON. */
export function decryptObject<T = unknown>(value: string | undefined | null): T | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const dec = decrypt(value);
  if (!dec) return undefined;
  try {
    return JSON.parse(dec) as T;
  } catch {
    return undefined;
  }
}
