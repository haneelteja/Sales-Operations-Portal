// Dynamic imports for heavy libraries
export async function importDocxtemplater() {
  return await import('docxtemplater');
}

export async function importPizZip() {
  return await import('pizzip');
}

export async function importFileSaver() {
  return await import('file-saver');
}

export async function importJsPDF() {
  return await import('jspdf');
}

export async function importHtml2Canvas() {
  return await import('html2canvas');
}

export async function importExcelJS() {
  const { default: ExcelJS } = await import('exceljs');
  return ExcelJS;
}
