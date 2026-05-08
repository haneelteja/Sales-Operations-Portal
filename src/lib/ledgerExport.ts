import ExcelJS from 'exceljs';

export interface LedgerTransaction {
  date: string;
  clientName: string;
  branch: string;
  /** 'sale' → debit (stock delivered), 'payment' → credit */
  type: string;
  sku?: string | null;
  cases?: number | null;
  amount: number;
  description?: string | null;
}

function triggerDownload(buffer: ExcelJS.Buffer, fileName: string) {
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports transactions in a double-entry ledger format (Debit / Credit / Running Balance).
 * Rows are grouped by client+branch, sorted chronologically within each group.
 */
export async function exportLedger(
  transactions: LedgerTransaction[],
  fileName: string,
  reportTitle = 'Client Ledger Statement'
): Promise<void> {
  // ── Group by client+branch ──────────────────────────────────────────────────
  const groups = new Map<string, LedgerTransaction[]>();
  for (const tx of transactions) {
    const key = `${tx.clientName}|||${tx.branch}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  // Sort each group chronologically (oldest → newest)
  for (const rows of groups.values()) {
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // ── Colours ─────────────────────────────────────────────────────────────────
  const C = {
    headerFg: { argb: 'FFFFFFFF' } as ExcelJS.Color,
    headerBg: { argb: 'FF1F4E79' } as ExcelJS.Color,
    clientBg:  { argb: 'FFD6E4F0' } as ExcelJS.Color,
    debitBg:   { argb: 'FFFCE4D6' } as ExcelJS.Color,
    creditBg:  { argb: 'FFE2EFDA' } as ExcelJS.Color,
    closingBg: { argb: 'FFF2F2F2' } as ExcelJS.Color,
    red:       { argb: 'FFC00000' } as ExcelJS.Color,
    green:     { argb: 'FF375623' } as ExcelJS.Color,
    neutral:   { argb: 'FF000000' } as ExcelJS.Color,
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top:    { style: 'hair' },
    bottom: { style: 'hair' },
    left:   { style: 'thin' },
    right:  { style: 'thin' },
  };

  const amountFmt = '#,##0.00';
  const COLS = 7; // A…G

  // ── Workbook ─────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Aamodha Operations Portal';
  const ws = wb.addWorksheet('Ledger');

  ws.columns = [
    { key: 'date',        width: 14 },
    { key: 'particulars', width: 36 },
    { key: 'sku',         width: 12 },
    { key: 'cases',       width: 10 },
    { key: 'debit',       width: 16 },
    { key: 'credit',      width: 16 },
    { key: 'balance',     width: 18 },
  ];

  // Helper: merge a single-row span A→G
  const mergeRow = (rowNum: number, colEnd = COLS) => {
    ws.mergeCells(rowNum, 1, rowNum, colEnd);
  };

  // ── Title ────────────────────────────────────────────────────────────────────
  const titleRow = ws.addRow([reportTitle]);
  mergeRow(titleRow.number);
  titleRow.getCell(1).font = { bold: true, size: 14, color: C.headerBg };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 24;

  const dateRow = ws.addRow([`Generated: ${new Date().toLocaleDateString('en-IN')}`]);
  mergeRow(dateRow.number);
  dateRow.getCell(1).font = { size: 10, italic: true, color: { argb: 'FF666666' } };
  dateRow.getCell(1).alignment = { horizontal: 'center' };

  ws.addRow([]); // spacer

  // ── Column headers ───────────────────────────────────────────────────────────
  const colHeaders = ['Date', 'Particulars', 'SKU', 'Cases', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'];
  const colHeaderRow = ws.addRow(colHeaders);
  colHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: C.headerFg };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: C.headerBg };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  colHeaderRow.height = 20;

  // Freeze title + date + spacer + column header rows
  ws.views = [{ state: 'frozen', ySplit: colHeaderRow.number }];

  // ── Client groups ────────────────────────────────────────────────────────────
  for (const [key, rows] of groups) {
    const [clientName, branch] = key.split('|||');
    const clientLabel = branch && branch !== clientName
      ? `${clientName}  —  ${branch}`
      : clientName;

    // Client header
    const clientRow = ws.addRow([clientLabel]);
    mergeRow(clientRow.number);
    clientRow.getCell(1).font = { bold: true, size: 11 };
    clientRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: C.clientBg };
    clientRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    clientRow.height = 20;

    let balance = 0;

    for (const tx of rows) {
      const isDebit = tx.type === 'sale';
      const debit  = isDebit ? tx.amount : null;
      const credit = isDebit ? null : tx.amount;
      balance += (debit ?? 0) - (credit ?? 0);

      const particulars = isDebit
        ? `Stock Delivered${tx.description ? ` — ${tx.description}` : ''}`
        : `Payment Received${tx.description ? ` — ${tx.description}` : ''}`;

      const dataRow = ws.addRow([
        new Date(tx.date).toLocaleDateString('en-IN'),
        particulars,
        tx.sku ?? '',
        tx.cases ?? '',
        debit,
        credit,
        balance,
      ]);

      const bg = isDebit ? C.debitBg : C.creditBg;
      dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: bg };
        cell.border = thinBorder;
        if (col >= 5) {
          cell.numFmt = amountFmt;
          cell.alignment = { horizontal: 'right' };
        }
      });

      // Running balance colour: red = client owes, green = overpaid / zero
      dataRow.getCell(7).font = {
        color: balance > 0 ? C.red : balance < 0 ? C.green : C.neutral,
      };
    }

    // Closing balance row
    const closingRow = ws.addRow(['Closing Balance', '', '', '', '', '', balance]);
    ws.mergeCells(closingRow.number, 1, closingRow.number, COLS - 1); // A:F
    const labelCell = closingRow.getCell(1);
    labelCell.font = { bold: true };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: C.closingBg };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    const balCell = closingRow.getCell(7);
    balCell.numFmt = amountFmt;
    balCell.font = { bold: true, color: balance > 0 ? C.red : balance < 0 ? C.green : C.neutral };
    balCell.fill = { type: 'pattern', pattern: 'solid', fgColor: C.closingBg };
    balCell.alignment = { horizontal: 'right' };
    closingRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    ws.addRow([]); // spacer between clients
  }

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, fileName);
}
