/**
 * Native OS notification helper.
 * Desktop: uses Tauri's notification plugin (native OS toast).
 * Web:     uses the Web Notifications API (requires user permission).
 */

import { isDesktop } from '@/lib/platform';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

/** Request permission and send a native notification. */
export async function sendNativeNotification(opts: NotificationOptions): Promise<void> {
  if (isDesktop()) {
    const { sendNotification, isPermissionGranted, requestPermission } =
      await import('@tauri-apps/plugin-notification');

    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    if (!granted) return;

    sendNotification({ title: opts.title, body: opts.body });
  } else if ('Notification' in window) {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification(opts.title, { body: opts.body, icon: opts.icon });
    }
  }
}
