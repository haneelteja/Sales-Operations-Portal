/**
 * Secure OS-level key-value store for the desktop app.
 *
 * Uses Tauri's plugin-store which persists data in an OS-protected,
 * application-scoped file (encrypted on Windows via DPAPI, and
 * access-restricted on macOS via file permissions).
 *
 * This is the correct place to store anything that should survive
 * app restarts but is too sensitive for plain localStorage:
 *   – User preferences that reference internal IDs
 *   – Cached filter states
 *   – Any data we'd otherwise put in secureStorage with encrypt:true
 *
 * NOTE: Supabase JWT tokens are managed by Supabase-js itself (localStorage).
 * We do NOT manually re-store them here; that would create a second
 * copy and complicate the token refresh lifecycle.
 */

import { isDesktop } from '@/lib/platform';

const STORE_FILE = 'aamodha-portal.dat';

type StoreInstance = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  save: () => Promise<void>;
};

let _store: StoreInstance | null = null;

async function getStore(): Promise<StoreInstance> {
  if (_store) return _store;
  const { load } = await import('@tauri-apps/plugin-store');
  _store = await load(STORE_FILE, { autoSave: true });
  return _store;
}

/** Persist a value in the OS-protected store. No-op on web. */
export async function secureSet(key: string, value: unknown): Promise<void> {
  if (!isDesktop()) return;
  const store = await getStore();
  await store.set(key, value);
}

/** Retrieve a value from the OS-protected store. Returns null on web or missing key. */
export async function secureGet<T>(key: string): Promise<T | null> {
  if (!isDesktop()) return null;
  const store = await getStore();
  return store.get<T>(key);
}

/** Remove a value from the OS-protected store. No-op on web. */
export async function secureDelete(key: string): Promise<void> {
  if (!isDesktop()) return;
  const store = await getStore();
  await store.delete(key);
}

/** Keys used across the app to prevent typos and ensure consistency. */
export const SECURE_STORE_KEYS = {
  WINDOW_STATE:       'window_state',
  LAST_ACTIVE_MODULE: 'last_active_module',
  COLUMN_VISIBILITY:  'column_visibility',
} as const;
