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
 * Creates a PDF invoice matching the Word template structure
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
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.setLineWidth(0.5);
      doc.line(x1, y1, x2, y2);
    };

    // Header: Bill of Supply
    addText('Bill of supply', pageWidth / 2, yPosition, 16, 'bold', 'center');
    yPosition += 10;

    // Company Name
    addText(data.companyName, pageWidth / 2, yPosition, 14, 'bold', 'center');
    yPosition += 7;

    // Company Address (handle multi-line)
    const addressLines = data.companyAddress
      .split(/[\n,]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    addressLines.forEach(line => {
      addText(line, pageWidth / 2, yPosition, 10, 'normal', 'center');
      yPosition += 5;
    });
    yPosition += 5;

    // Bill to section
    addText('Bill to:', margin, yPosition, 10, 'bold');
    yPosition += 6;
    addText(`${data.clientName},`, margin, yPosition, 10);
    yPosition += 5;
    if (data.branch) {
      addText(`${data.branch}.`, margin, yPosition, 10);
      yPosition += 5;
    }

    // Invoice Number and Date (right aligned)
    yPosition = margin + 20;
    addText(`Bill No: ${data.invoiceNumber}`, pageWidth - margin, yPosition, 10, 'normal', 'right');
    yPosition += 5;
    addText(`Date: ${formatDate(data.invoiceDate)}`, pageWidth - margin, yPosition, 10, 'normal', 'right');
    yPosition += 5;
    addText('Dispatch Through: AUTO', pageWidth - margin, yPosition, 10, 'normal', 'right');
    yPosition += 10;

    // Table Header
    const tableStartY = yPosition;
    const colWidths = {
      sno: 15,
      description: 60,
      sku: 30,
      qty: 25,
      rate: 30,
      amount: 30,
    };
    let xPos = margin;

    // Draw table header
    addText('S.No:', xPos, yPosition, 9, 'bold');
    xPos += colWidths.sno;
    addText('Description of Goods', xPos, yPosition, 9, 'bold');
    xPos += colWidths.description;
    addText('SKU', xPos, yPosition, 9, 'bold');
    xPos += colWidths.sku;
    addText('Qty', xPos, yPosition, 9, 'bold');
    xPos += colWidths.qty;
    addText('Rate', xPos, yPosition, 9, 'bold');
    xPos += colWidths.rate;
    addText('Amount', xPos, yPosition, 9, 'bold');

    yPosition += 6;
    drawLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Table Row
    xPos = margin;
    addText('1.', xPos, yPosition, 9);
    xPos += colWidths.sno;
    addText('Elma 500 ml', xPos, yPosition, 9);
    xPos += colWidths.description;
    addText(data.sku, xPos, yPosition, 9);
    xPos += colWidths.sku;
    addText(`${data.quantity} cases`, xPos, yPosition, 9);
    xPos += colWidths.qty;
    addText(formatCurrency(data.pricePerCase), xPos, yPosition, 9);
    xPos += colWidths.rate;
    addText(formatCurrency(data.amount), xPos, yPosition, 9);

    yPosition += 8;
    drawLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Total Amount
    addText('Total amount', pageWidth - margin - colWidths.amount, yPosition, 10, 'bold', 'right');
    addText(formatCurrency(data.grandTotal), pageWidth - margin, yPosition, 10, 'bold', 'right');
    yPosition += 8;

    // Amount in words
    addText(`Amount in words: ${data.amountInWords}`, margin, yPosition, 10);
    yPosition += 8;

    // Account Details
    addText('Account Details:', margin, yPosition, 10, 'bold');
    yPosition += 6;
    addText('Account Name: M/S Aamodha Enterprises', margin, yPosition, 9);
    yPosition += 5;
    addText('Bank: HDFC Bank', margin, yPosition, 9);
    yPosition += 5;
    addText('Account Number: 50200082063860', margin, yPosition, 9);
    yPosition += 5;
    addText('IFSC Code: HDFC0009611', margin, yPosition, 9);
    yPosition += 10;

    // Signatures section
    const signatureY = pageHeight - 30;
    addText('Dispatch Signature:', margin, signatureY, 9);
    addText('Received Signature:', pageWidth - margin, signatureY, 9, 'normal', 'right');

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
