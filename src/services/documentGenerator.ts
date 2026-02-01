/**
 * Document Generator Service
 * Handles Word document generation and PDF conversion
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
 * Load HTML template and replace placeholders
 */
async function loadHTMLTemplate(): Promise<string> {
  try {
    const response = await fetch('/templates/invoice-template.html');
    if (!response.ok) {
      throw new Error(`Failed to load HTML template: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    logger.error('Error loading HTML template:', error);
    throw new Error(`Template loading failed: ${error.message}`);
  }
}

/**
 * Replace template placeholders with actual data
 */
function replaceTemplatePlaceholders(template: string, data: InvoiceData): string {
  const replacements: Record<string, string> = {
    companyName: data.companyName,
    companyAddress: data.companyAddress.replace(/\n/g, '<br>'),
    clientName: data.clientName,
    branch: data.branch || '',
    invoiceNumber: data.invoiceNumber,
    invoiceDate: formatDate(data.invoiceDate),
    sku: data.sku,
    quantity: data.quantity.toString(),
    unitPrice: formatCurrency(data.pricePerCase),
    amount: formatCurrency(data.amount),
    totalAmount: formatCurrency(data.grandTotal),
    amountInWords: data.amountInWords,
  };

  let html = template;
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value || '');
  });

  return html;
}

/**
 * Generate PDF from HTML template
 * Creates a PDF invoice using HTML template for perfect alignment
 */
export async function generatePDFDocument(
  data: InvoiceData
): Promise<ArrayBuffer> {
  try {
    // Load HTML template
    const htmlTemplate = await loadHTMLTemplate();
    
    // Replace placeholders with actual data
    const htmlContent = replaceTemplatePlaceholders(htmlTemplate, data);
    
    // Create a temporary container element with proper styling
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    
    // Style the container to match A4 dimensions and ensure proper rendering
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.backgroundColor = '#ffffff';
    container.style.overflow = 'hidden';
    
    document.body.appendChild(container);
    
    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the actual content element (invoice-container)
    const contentElement = container.querySelector('.invoice-container') || container;
    
    // Convert HTML to canvas with high quality settings
    const canvas = await html2canvas(contentElement as HTMLElement, {
      scale: 2, // Higher quality (2x resolution)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: contentElement.scrollWidth,
      height: contentElement.scrollHeight,
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123, // A4 height in pixels at 96 DPI
    });
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    
    // Calculate dimensions to fit A4 page
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If content exceeds one page, add additional pages
    const pageHeight = 297; // A4 height in mm
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Convert PDF to ArrayBuffer
    const pdfBlob = pdf.output('arraybuffer');
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
