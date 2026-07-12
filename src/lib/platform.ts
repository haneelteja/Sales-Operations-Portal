/**
 * Platform detection utilities.
 * Use these guards to branch behaviour between desktop (Tauri),
 * mobile (Capacitor/Android), and plain web.
 */

/** True when running inside a Tauri desktop shell. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window;
}

/** True when running inside a Capacitor Android/iOS WebView. */
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' &&
    'Capacitor' in window &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNative === true;
}

/** True when running as a plain browser (web or PWA). */
export function isWeb(): boolean {
  return !isDesktop() && !isCapacitor();
}

/** True when running in any native shell (Tauri or Capacitor). */
export function isNative(): boolean {
  return isDesktop() || isCapacitor();
}

/**
 * Returns a human-readable platform label for logging/analytics.
 * Values: "desktop-windows" | "desktop-macos" | "desktop-linux" |
 *         "android" | "ios" | "web" | "pwa"
 */
export async function getPlatformLabel(): Promise<string> {
  if (isCapacitor()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = (window as any).Capacitor?.getPlatform?.();
    return info ?? 'native';
  }
  if (isDesktop()) {
    try {
      const { platform } = await import('@tauri-apps/plugin-os');
      const p = await platform();
      return `desktop-${p}`;
    } catch {
      return 'desktop';
    }
  }
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true;
  return isStandalone ? 'pwa' : 'web';
}
