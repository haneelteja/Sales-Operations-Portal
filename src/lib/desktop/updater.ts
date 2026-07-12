/**
 * Auto-updater integration for the Tauri desktop shell.
 * Called once on app startup (non-blocking) and exposed via the UI
 * so the user can manually trigger a check.
 *
 * Update flow:
 *   1. check()          → contacts the update server
 *   2. If update found  → prompt the user (toast or dialog)
 *   3. downloadAndInstall() → downloads, validates signature, installs
 *   4. relaunch()       → restarts the app (Windows) or prompts quit-reopen (macOS)
 */

import { isDesktop } from '@/lib/platform';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  notes?: string;
}

/**
 * Check for a desktop update.
 * Returns { available: false } on web or when no update is available.
 * Throws on network error — caller should catch and handle silently.
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  if (!isDesktop()) return { available: false };

  const { check } = await import('@tauri-apps/plugin-updater');
  const update = await check();

  if (!update) return { available: false };
  return {
    available: true,
    version: update.version,
    notes: update.body ?? undefined,
  };
}

/**
 * Download and install the update, then relaunch.
 * Call only after the user has confirmed they want to update.
 */
export async function applyUpdate(): Promise<void> {
  if (!isDesktop()) return;

  const { check } = await import('@tauri-apps/plugin-updater');
  const { relaunch } = await import('@tauri-apps/plugin-process');

  const update = await check();
  if (!update) return;

  await update.downloadAndInstall();
  await relaunch();
}

/**
 * Silent background check: runs on startup and shows a toast
 * notification if an update is available without blocking the user.
 * Import and call this from App.tsx once the app is mounted.
 */
export async function silentUpdateCheck(
  onUpdateAvailable: (info: UpdateInfo) => void,
): Promise<void> {
  try {
    const info = await checkForUpdate();
    if (info.available) onUpdateAvailable(info);
  } catch {
    // Network errors on startup are expected (no internet, corp proxy, etc.)
    // Fail silently — the user can manually check later.
  }
}
