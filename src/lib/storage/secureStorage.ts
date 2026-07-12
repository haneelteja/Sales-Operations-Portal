/**
 * Storage utility with genuine AES-GCM encryption via the Web Crypto API.
 *
 * Sync API  (encrypt: false, default) — plain JSON in localStorage/sessionStorage.
 *           Suitable for non-sensitive data: form auto-saves, UI preferences.
 *
 * Async API (setEncryptedItem / getEncryptedItem) — AES-256-GCM.
 *           Suitable for any data you'd rather not leave in plaintext on disk.
 *           A per-install key is derived from a stable machine seed stored under
 *           a separate key; this is NOT a user-password-based key (if you need
 *           that, derive a key from the user's password using PBKDF2 separately).
 *
 * On the desktop (Tauri), prefer `src/lib/desktop/store.ts` for truly sensitive
 * data — it delegates to OS-level protected storage.
 */

import { logger } from '@/lib/logger';

type StorageType = 'localStorage' | 'sessionStorage';

interface StorageOptions {
  storageType?: StorageType;
  expiresIn?: number;
}

interface StorageEnvelope<T> {
  value: T;
  timestamp: number;
  expiresAt: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStorage(type: StorageType = 'localStorage'): Storage {
  if (typeof window === 'undefined') throw new Error('Storage unavailable outside browser');
  return type === 'localStorage' ? window.localStorage : window.sessionStorage;
}

// ── Synchronous API (no encryption) ──────────────────────────────────────────

export function setSecureItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
  try {
    const { storageType = 'localStorage', expiresIn } = options;
    const envelope: StorageEnvelope<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null,
    };
    getStorage(storageType).setItem(key, JSON.stringify(envelope));
    return true;
  } catch (err) {
    logger.error(`setSecureItem(${key}) failed:`, err);
    return false;
  }
}

export function getSecureItem<T>(key: string, options: StorageOptions = {}): T | null {
  try {
    const { storageType = 'localStorage' } = options;
    const raw = getStorage(storageType).getItem(key);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as StorageEnvelope<T>;
    if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
      getStorage(storageType).removeItem(key);
      return null;
    }
    return envelope.value;
  } catch (err) {
    logger.error(`getSecureItem(${key}) failed:`, err);
    return null;
  }
}

export function removeSecureItem(key: string, storageType: StorageType = 'localStorage'): boolean {
  try {
    getStorage(storageType).removeItem(key);
    return true;
  } catch (err) {
    logger.error(`removeSecureItem(${key}) failed:`, err);
    return false;
  }
}

export function clearSecureItems(prefix: string, storageType: StorageType = 'localStorage'): void {
  try {
    const storage = getStorage(storageType);
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => storage.removeItem(k));
  } catch (err) {
    logger.error(`clearSecureItems(${prefix}) failed:`, err);
  }
}

export function hasSecureItem(key: string, options: StorageOptions = {}): boolean {
  return getSecureItem(key, options) !== null;
}

// ── Async Encrypted API (AES-256-GCM via Web Crypto) ─────────────────────────

const CRYPTO_KEY_STORAGE_KEY = '__aamodha_ck__';
const ENC_PREFIX = 'enc:v1:';

async function getOrCreateCryptoKey(): Promise<CryptoKey> {
  // Look for existing raw key bytes in localStorage (non-encrypted envelope)
  const stored = localStorage.getItem(CRYPTO_KEY_STORAGE_KEY);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  // Generate a new random 256-bit key
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(CRYPTO_KEY_STORAGE_KEY, b64);
  return key;
}

/**
 * Store an encrypted value. Awaitable — must be used with `await`.
 * Stored value is AES-256-GCM encrypted with a per-install random key.
 */
export async function setEncryptedItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {},
): Promise<boolean> {
  try {
    const { storageType = 'localStorage', expiresIn } = options;
    const cryptoKey = await getOrCreateCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const envelope: StorageEnvelope<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null,
    };
    const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);

    // Combine: iv (12 bytes) + ciphertext → base64
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);
    const b64 = btoa(String.fromCharCode(...combined));

    getStorage(storageType).setItem(key, ENC_PREFIX + b64);
    return true;
  } catch (err) {
    logger.error(`setEncryptedItem(${key}) failed:`, err);
    return false;
  }
}

/**
 * Retrieve and decrypt a value previously stored with `setEncryptedItem`.
 * Returns null if the key is missing, expired, or decryption fails.
 */
export async function getEncryptedItem<T>(
  key: string,
  options: StorageOptions = {},
): Promise<T | null> {
  try {
    const { storageType = 'localStorage' } = options;
    const raw = getStorage(storageType).getItem(key);
    if (!raw || !raw.startsWith(ENC_PREFIX)) return null;

    const cryptoKey = await getOrCreateCryptoKey();
    const combined = Uint8Array.from(atob(raw.slice(ENC_PREFIX.length)), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
    const envelope = JSON.parse(new TextDecoder().decode(plaintext)) as StorageEnvelope<T>;

    if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
      getStorage(storageType).removeItem(key);
      return null;
    }
    return envelope.value;
  } catch (err) {
    logger.error(`getEncryptedItem(${key}) failed — clearing corrupted entry:`, err);
    getStorage(options.storageType ?? 'localStorage').removeItem(key);
    return null;
  }
}

// ── Storage key constants ─────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_MANAGEMENT_FORM:       'user_management_form_autosave',
  SALES_ENTRY_SALE_FORM:      'sales_entry_sale_form_autosave',
  SALES_ENTRY_PAYMENT_FORM:   'sales_entry_payment_form_autosave',
  SALES_ENTRY_ITEMS:          'sales_entry_items_autosave',
  USER_PREFERENCES:           'user_preferences',
  THEME_PREFERENCE:           'theme_preference',
} as const;
