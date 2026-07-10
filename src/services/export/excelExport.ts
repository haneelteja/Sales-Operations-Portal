import { importExcelJS } from '@/lib/heavyImports';

function parseDateValue(v: unknown): number {
  if (!v) return 0;
  const s = String(v);
  // ISO or US locale (M/D/YYYY)
  const direct = Date.parse(s);
  if (!isNaN(direct)) return direct;
  // Indian locale DD/MM/YYYY or D/M/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return Date.parse(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
  return 0;
}

export async function exportJsonToExcel<T extends Record<string, unknown>>(
  rows: T[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const ExcelJS = await importExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (rows.length > 0) {
    // Sort descending by the first column whose key contains "date" (case-insensitive)
    const dateKey = Object.keys(rows[0]).find(k => k.toLowerCase().includes('date'));
    const sorted = dateKey
      ? [...rows].sort((a, b) => parseDateValue(b[dateKey]) - parseDateValue(a[dateKey]))
      : rows;

    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    worksheet.addRows(sorted);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
