import { importXLSX } from '@/lib/heavyImports';

export async function exportJsonToExcel<T extends Record<string, unknown>>(
  rows: T[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const XLSX = await importXLSX();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}
