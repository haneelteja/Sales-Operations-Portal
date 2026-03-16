/**
 * Lightweight Excel export utility built on exceljs.
 * Provides the same interface used across the app (previously via the xlsx package).
 */
import ExcelJS from 'exceljs';

export async function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    worksheet.addRows(data);
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
