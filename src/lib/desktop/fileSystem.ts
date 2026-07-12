/**
 * Desktop file-system helpers.
 * On desktop (Tauri) — opens a native OS save/open dialog.
 * On web/PWA      — falls back to the browser download API.
 *
 * Import lazily; these modules are only bundled in desktop builds.
 */

import { isDesktop } from '@/lib/platform';

/**
 * Save a binary blob to disk.
 * Desktop: shows a native "Save As" dialog.
 * Web:     triggers a browser download.
 */
export async function saveFileToDesktop(
  data: Blob | Uint8Array,
  filename: string,
  filters?: Array<{ name: string; extensions: string[] }>,
): Promise<void> {
  if (isDesktop()) {
    const [{ save }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
    ]);
    const { writeFile } = await import('@tauri-apps/plugin-fs');

    const savePath = await save({
      defaultPath: filename,
      filters: filters ?? [{ name: 'All Files', extensions: ['*'] }],
    });

    if (!savePath) return; // user cancelled

    const bytes = data instanceof Uint8Array
      ? data
      : new Uint8Array(await (data as Blob).arrayBuffer());

    await writeFile(savePath, bytes);
  } else {
    // Browser fallback
    const blob = data instanceof Blob
      ? data
      : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Common filters for the save dialog */
export const FILE_FILTERS = {
  EXCEL: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  PDF:   [{ name: 'PDF Document', extensions: ['pdf'] }],
  CSV:   [{ name: 'CSV File', extensions: ['csv'] }],
  ALL:   [{ name: 'All Files', extensions: ['*'] }],
} as const;
