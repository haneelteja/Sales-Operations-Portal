/**
 * Lightweight Excel export utility built on exceljs.
 * Provides the same interface used across the app (previously via the xlsx package).
 */
import ExcelJS from 'exceljs';

function parseDateValue(v: unknown): number {
  if (!v) return 0;
  const s = String(v);
  const direct = Date.parse(s);
  if (!isNaN(direct)) return direct;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return Date.parse(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
  return 0;
}

export async function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    const dateKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('date'));
    const sorted = dateKey
      ? [...data].sort((a, b) => parseDateValue(b[dateKey]) - parseDateValue(a[dateKey]))
      : data;

    worksheet.columns = Object.keys(data[0]).map((key) => ({
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
