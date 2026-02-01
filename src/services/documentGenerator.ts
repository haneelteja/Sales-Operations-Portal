/**
 * Document Generator Service
 * Handles Word document generation and PDF conversion
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import type { InvoiceData } from './invoiceService';
import { logger } from '@/lib/logger';

export interface GeneratedDocument {
  wordBuffer: ArrayBuffer;
  pdfBuffer?: ArrayBuffer;
  wordFileName: string;
  pdfFileName: string;
}

/**
 * Load invoice template from public folder
 * Note: Template should be placed in public/templates/invoice-template.docx
 */
async function loadInvoiceTemplate(): Promise<ArrayBuffer> {
  try {
    const response = await fetch('/templates/invoice-template.docx');
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    logger.error('Error loading invoice template:', error);
    throw new Error(`Template loading failed: ${error.message}`);
  }
}

/**
 * Generate Word document from template and data
 */
export async function generateWordDocument(
  data: InvoiceData
): Promise<ArrayBuffer> {
  try {
    // Load template
    const templateBuffer = await loadInvoiceTemplate();
    const zip = new PizZip(templateBuffer);
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for template
    const templateData = {
      // Invoice header
      invoiceNumber: data.invoiceNumber,
      invoiceDate: formatDate(data.invoiceDate),
      dueDate: formatDate(data.dueDate),
      
      // Company details
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companyGSTIN: data.companyGSTIN || '',
      
      // Client details
      clientName: data.clientName,
      branch: data.branch || '',
      clientAddress: data.clientAddress || '',
      clientPhone: data.clientPhone || '',
      clientEmail: data.clientEmail || '',
      
      // Invoice items
      items: [
        {
          sku: data.sku,
          description: data.sku, // Can be enhanced with product description
          quantity: data.quantity,
          unitPrice: formatCurrency(data.pricePerCase),
          amount: formatCurrency(data.amount),
        }
      ],
      
      // Totals
      subtotal: formatCurrency(data.totalAmount),
      tax: formatCurrency(data.taxAmount || 0),
      totalAmount: formatCurrency(data.grandTotal),
      amountInWords: data.amountInWords,
      
      // Terms
      terms: data.terms,
    };

    // Render document
    doc.render(templateData);

    // Generate document buffer
    const buffer = doc.getZip().generate({
      type: 'arraybuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  } catch (error) {
    logger.error('Error generating Word document:', error);
    if (error instanceof Error && error.message.includes('Unclosed')) {
      throw new Error('Template syntax error: Unclosed tag in template');
    }
    throw new Error(`Word document generation failed: ${error.message}`);
  }
}

/**
 * Convert Word document to PDF
 * Note: This requires a backend service or client-side library
 * For now, we'll use a placeholder that can be replaced with actual PDF conversion
 */
export async function convertWordToPDF(
  wordBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // Option 1: Use backend API (recommended)
  // This would call a Supabase Edge Function or external API
  
  // Option 2: Use client-side library (limited)
  // Note: Direct Word to PDF conversion in browser is complex
  // Consider using a service like CloudConvert API or LibreOffice on server
  
  throw new Error(
    'PDF conversion not yet implemented. ' +
    'Please implement using a backend service (LibreOffice/CloudConvert) ' +
    'or use a PDF generation library to create PDF directly from data.'
  );
}

/**
 * Generate PDF directly from invoice data
 * Creates a PDF invoice matching the Word template structure exactly
 */
export async function generatePDFDocument(
  data: InvoiceData
): Promise<ArrayBuffer> {
  try {
    // Create new PDF document (A4 size: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const rightMargin = pageWidth - margin;
    let yPosition = margin;

    // Helper function to add text with optional styling
    const addText = (
      text: string,
      x: number,
      y: number,
      fontSize: number = 10,
      fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
      align: 'left' | 'center' | 'right' = 'left'
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.text(text, x, y, { align });
    };

    // Helper function to draw a line
    const drawLine = (x1: number, y1: number, x2: number, y2: number, lineWidth: number = 0.5) => {
      doc.setLineWidth(lineWidth);
      doc.line(x1, y1, x2, y2);
    };

    // Header: Bill of Supply (centered, larger font, matching template)
    addText('Bill of supply', pageWidth / 2, yPosition, 18, 'bold', 'center');
    yPosition += 12;

    // Company Name (centered, bold, matching template)
    addText(data.companyName, pageWidth / 2, yPosition, 16, 'bold', 'center');
    yPosition += 8;

    // Company Address (centered, handle multi-line, matching template)
    const addressLines = data.companyAddress
      .split(/[\n,]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    addressLines.forEach(line => {
      addText(line, pageWidth / 2, yPosition, 11, 'normal', 'center');
      yPosition += 5.5;
    });
    yPosition += 6;

    // Bill to section and Invoice details (side by side, matching template)
    const billToStartY = yPosition;
    
    // Left side: Bill to
    addText('Bill to:', margin, yPosition, 11, 'bold');
    yPosition += 6;
    addText(`${data.clientName},`, margin, yPosition, 11);
    yPosition += 5.5;
    if (data.branch) {
      addText(`${data.branch}.`, margin, yPosition, 11);
    }

    // Right side: Invoice details (aligned to match template)
    yPosition = billToStartY;
    addText(`Bill No: ${data.invoiceNumber}`, rightMargin, yPosition, 11, 'normal', 'right');
    yPosition += 5.5;
    addText(`Date: ${formatDate(data.invoiceDate)}`, rightMargin, yPosition, 11, 'normal', 'right');
    yPosition += 5.5;
    addText('Dispatch Through: AUTO', rightMargin, yPosition, 11, 'normal', 'right');
    
    // Move to table section (ensure enough space)
    yPosition = Math.max(billToStartY + 18, yPosition + 3) + 5;

    // Table Section - Precisely aligned columns to match template
    const tableStartY = yPosition;
    
    // Column positions matching template layout (in mm from left margin)
    const colPositions = {
      sno: margin + 2,           // S.No: column
      description: margin + 20,   // Description column
      sku: margin + 88,           // SKU column
      qty: margin + 118,          // Qty column
      rate: margin + 143,         // Rate column
      amount: rightMargin - 2,    // Amount column (right aligned)
    };

    // Draw table header (matching template)
    addText('S.No:', colPositions.sno, yPosition, 10, 'bold');
    addText('Description of Goods', colPositions.description, yPosition, 10, 'bold');
    addText('SKU', colPositions.sku, yPosition, 10, 'bold');
    addText('Qty', colPositions.qty, yPosition, 10, 'bold');
    addText('Rate', colPositions.rate, yPosition, 10, 'bold');
    addText('Amount', colPositions.amount, yPosition, 10, 'bold', 'right');

    yPosition += 6;
    drawLine(margin, yPosition, rightMargin, yPosition, 0.5);
    yPosition += 4;

    // Table Row - Precisely aligned with header
    addText('1.', colPositions.sno, yPosition, 10);
    addText('Elma 500 ml', colPositions.description, yPosition, 10);
    addText(data.sku, colPositions.sku, yPosition, 10);
    addText(`${data.quantity} cases`, colPositions.qty, yPosition, 10);
    addText(formatCurrency(data.pricePerCase), colPositions.rate, yPosition, 10);
    addText(formatCurrency(data.amount), colPositions.amount, yPosition, 10, 'normal', 'right');

    yPosition += 8;
    drawLine(margin, yPosition, rightMargin, yPosition, 0.5);
    yPosition += 6;

    // Total Amount (right aligned, matching template position)
    addText('Total amount', rightMargin - 38, yPosition, 11, 'bold', 'right');
    addText(formatCurrency(data.grandTotal), rightMargin, yPosition, 11, 'bold', 'right');
    yPosition += 9;

    // Amount in words (matching template)
    addText(`Amount in words: ${data.amountInWords}`, margin, yPosition, 11);
    yPosition += 10;

    // Account Details section (matching template spacing)
    addText('Account Details:', margin, yPosition, 11, 'bold');
    yPosition += 6;
    addText('Account Name: M/S Aamodha Enterprises', margin, yPosition, 10);
    yPosition += 5.5;
    addText('Bank: HDFC Bank', margin, yPosition, 10);
    yPosition += 5.5;
    addText('Account Number: 50200082063860', margin, yPosition, 10);
    yPosition += 5.5;
    addText('IFSC Code: HDFC0009611', margin, yPosition, 10);
    yPosition += 12;

    // Signatures section (at bottom, matching template)
    const signatureY = pageHeight - 20;
    addText('Dispatch Signature:', margin, signatureY, 10);
    addText('Received Signature:', rightMargin, signatureY, 10, 'normal', 'right');

    // Convert PDF to ArrayBuffer
    const pdfBlob = doc.output('arraybuffer');
    return pdfBlob;
  } catch (error) {
    logger.error('Error generating PDF document:', error);
    throw new Error(`PDF document generation failed: ${error.message}`);
  }
}

/**
 * Generate both Word and PDF documents
 */
export async function generateInvoiceDocuments(
  data: InvoiceData
): Promise<GeneratedDocument> {
  try {
    // Generate Word document
    const wordBuffer = await generateWordDocument(data);
    
    // Generate PDF document
    const pdfBuffer = await generatePDFDocument(data);
    
    // Generate file names
    const wordFileName = `${data.invoiceNumber}.docx`;
    const pdfFileName = `${data.invoiceNumber}.pdf`;
    
    return {
      wordBuffer,
      pdfBuffer,
      wordFileName,
      pdfFileName,
    };
  } catch (error) {
    logger.error('Error generating invoice documents:', error);
    throw error;
  }
}

/**
 * Download Word document to user's computer
 */
export function downloadWordDocument(
  buffer: ArrayBuffer,
  fileName: string
): void {
  try {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    saveAs(blob, fileName);
  } catch (error) {
    logger.error('Error downloading Word document:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Download PDF document to user's computer
 */
export function downloadPDFDocument(
  buffer: ArrayBuffer,
  fileName: string
): void {
  try {
    const blob = new Blob([buffer], {
      type: 'application/pdf',
    });
    saveAs(blob, fileName);
  } catch (error) {
    logger.error('Error downloading PDF document:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Format date for display (DD-MM-YYYY)
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Format currency for display (₹X,XXX.XX)
 */
function formatCurrency(amount: number | null | undefined): string {
  // Handle null, undefined, or NaN values
  const safeAmount = amount ?? 0;
  if (isNaN(safeAmount)) {
    return '₹0.00';
  }
  return `₹${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
