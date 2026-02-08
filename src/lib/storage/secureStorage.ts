/**
 * Secure Storage Utility
 * 
 * Provides safer localStorage/sessionStorage access with:
 * - Basic encryption for sensitive data (using simple encoding - for production, use proper encryption)
 * - Type safety
 * - Error handling
 * - Expiration support
 * 
 * NOTE: For production, implement proper encryption using Web Crypto API or a library like crypto-js
 */

import { logger } from '@/lib/logger';

type StorageType = 'localStorage' | 'sessionStorage';

interface StorageOptions {
  /** Storage type - localStorage persists, sessionStorage clears on tab close */
  storageType?: StorageType;
  /** Expiration time in milliseconds */
  expiresIn?: number;
  /** Whether to encrypt sensitive data */
  encrypt?: boolean;
}

/**
 * Simple encoding/decoding (NOT real encryption - for production use Web Crypto API)
 * This is a basic obfuscation to prevent casual inspection
 */
function encode(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return data;
  }
}

function decode(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return encoded;
  }
}

/**
 * Get storage instance
 */
function getStorage(type: StorageType = 'localStorage'): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Storage is only available in browser environment');
  }
  return type === 'localStorage' ? window.localStorage : window.sessionStorage;
}

/**
 * Set item in storage with optional encryption and expiration
 */
export function setSecureItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): boolean {
  try {
    const {
      storageType = 'localStorage',
      expiresIn,
      encrypt = false,
    } = options;

    const storage = getStorage(storageType);
    
    const data = {
      value,
      timestamp: Date.now(),
      expiresIn: expiresIn ? Date.now() + expiresIn : null,
    };

    let serialized = JSON.stringify(data);
    
    // Basic encoding for sensitive data (NOT real encryption)
    if (encrypt) {
      serialized = encode(serialized);
      logger.warn(
        'Using basic encoding for sensitive data. For production, implement proper encryption using Web Crypto API.'
      );
    }

    storage.setItem(key, serialized);
    return true;
  } catch (error) {
    logger.error(`Error setting secure storage item ${key}:`, error);
    return false;
  }
}

/**
 * Get item from storage with decryption and expiration check
 */
export function getSecureItem<T>(
  key: string,
  options: StorageOptions = {}
): T | null {
  try {
    const {
      storageType = 'localStorage',
      encrypt = false,
    } = options;

    const storage = getStorage(storageType);
    const item = storage.getItem(key);

    if (!item) {
      return null;
    }

    let deserialized: { value: T; timestamp: number; expiresIn: number | null };
    
    try {
      // Try to decode if encrypted
      const decoded = encrypt ? decode(item) : item;
      deserialized = JSON.parse(decoded);
    } catch {
      // Fallback: might be old format without encryption
      try {
        deserialized = JSON.parse(item);
      } catch {
        logger.error(`Failed to parse storage item ${key}`);
        return null;
      }
    }

    // Check expiration
    if (deserialized.expiresIn && Date.now() > deserialized.expiresIn) {
      storage.removeItem(key);
      logger.debug(`Storage item ${key} expired and removed`);
      return null;
    }

    return deserialized.value;
  } catch (error) {
    logger.error(`Error getting secure storage item ${key}:`, error);
    return null;
  }
}

/**
 * Remove item from storage
 */
export function removeSecureItem(
  key: string,
  storageType: StorageType = 'localStorage'
): boolean {
  try {
    const storage = getStorage(storageType);
    storage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Error removing secure storage item ${key}:`, error);
    return false;
  }
}

/**
 * Clear all items with a specific prefix
 */
export function clearSecureItems(
  prefix: string,
  storageType: StorageType = 'localStorage'
): void {
  try {
    const storage = getStorage(storageType);
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => storage.removeItem(key));
    logger.debug(`Cleared ${keysToRemove.length} storage items with prefix ${prefix}`);
  } catch (error) {
    logger.error(`Error clearing secure storage items with prefix ${prefix}:`, error);
  }
}

/**
 * Check if item exists and is not expired
 */
export function hasSecureItem(
  key: string,
  options: StorageOptions = {}
): boolean {
  const item = getSecureItem(key, options);
  return item !== null;
}

/**
 * Storage keys for different data types
 * Use these constants to avoid typos and ensure consistency
 */
export const STORAGE_KEYS = {
  // Form auto-save (use sessionStorage for temporary data)
  USER_MANAGEMENT_FORM: 'user_management_form_autosave',
  SALES_ENTRY_SALE_FORM: 'sales_entry_sale_form_autosave',
  SALES_ENTRY_PAYMENT_FORM: 'sales_entry_payment_form_autosave',
  SALES_ENTRY_ITEMS: 'sales_entry_items_autosave',
  
  // Auth (handled by Supabase - don't store manually)
  // AUTH_TOKEN: 'auth_token', // Don't use - Supabase handles this
  
  // User preferences (safe for localStorage)
  USER_PREFERENCES: 'user_preferences',
  THEME_PREFERENCE: 'theme_preference',
} as const;

/**
 * Recommendations for storage usage:
 * 
 * 1. Form auto-save: Use sessionStorage (clears on tab close)
 *    - Less risk if user shares computer
 *    - Data is temporary anyway
 * 
 * 2. User preferences: Use localStorage with encryption=false
 *    - Not sensitive data
 *    - Should persist across sessions
 * 
 * 3. Sensitive data: Use sessionStorage with encrypt=true
 *    - Or better: Don't store in browser storage at all
 *    - Use server-side session storage instead
 * 
 * 4. Auth tokens: Let Supabase handle it
 *    - Don't manually store auth tokens
 *    - Supabase uses secure storage mechanisms
 */
