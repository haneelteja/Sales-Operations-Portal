/**
 * Invoice Service
 * Handles invoice number generation, database operations, and coordination
 */

import { supabase } from "@/integrations/supabase/client";
import type { Invoice, SalesTransaction, Customer } from "@/types";
import { logger } from "@/lib/logger";

export interface InvoiceGenerationResult {
  invoice: Invoice;
  wordFileId: string | null;
  pdfFileId: string | null;
  wordFileUrl: string | null;
  pdfFileUrl: string | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGSTIN?: string;
  clientName: string;
  branch: string | null;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  sku: string;
  quantity: number;
  pricePerCase: number;
  amount: number;
  totalAmount: number;
  amountInWords: string;
  taxAmount?: number;
  grandTotal: number;
  terms: string;
}

/**
 * Generate a unique invoice number using the database function
 */
export async function generateInvoiceNumber(
  prefix: string = 'INV',
  useYear: boolean = true,
  useMonth: boolean = true
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_invoice_number', {
      p_prefix: prefix,
      p_use_year: useYear,
      p_use_month: useMonth
    });

    if (error) {
      logger.error('Failed to generate invoice number:', error);
      throw new Error(`Invoice number generation failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Invoice number generation returned null');
    }

    return data as string;
  } catch (error) {
    logger.error('Error generating invoice number:', error);
    throw error;
  }
}

/**
 * Create an invoice record in the database
 */
export async function createInvoiceRecord(
  transactionId: string,
  customerId: string,
  invoiceNumber: string,
  invoiceDate: string,
  dueDate?: string
): Promise<Invoice> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        transaction_id: transactionId,
        customer_id: customerId,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        status: 'generated'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create invoice record:', error);
      throw new Error(`Invoice record creation failed: ${error.message}`);
    }

    return data as Invoice;
  } catch (error) {
    logger.error('Error creating invoice record:', error);
    throw error;
  }
}

/**
 * Get invoice by transaction ID
 */
export async function getInvoiceByTransactionId(
  transactionId: string
): Promise<Invoice | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get invoice:', error);
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    return data as Invoice | null;
  } catch (error) {
    logger.error('Error getting invoice:', error);
    throw error;
  }
}

/**
 * Update invoice record with file information
 */
export async function updateInvoiceFiles(
  invoiceId: string,
  wordFileId: string | null,
  pdfFileId: string | null,
  wordFileUrl: string | null,
  pdfFileUrl: string | null,
  folderPath?: string,
  storageProvider?: 'google_drive' | 'onedrive'
): Promise<Invoice> {
  try {
    const updateData: Partial<Invoice> = {
      word_file_id: wordFileId,
      pdf_file_id: pdfFileId,
      word_file_url: wordFileUrl,
      pdf_file_url: pdfFileUrl,
    };

    if (folderPath) {
      updateData.folder_path = folderPath;
    }

    if (storageProvider) {
      updateData.storage_provider = storageProvider;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update invoice files:', error);
      throw new Error(`Invoice update failed: ${error.message}`);
    }

    return data as Invoice;
  } catch (error) {
    logger.error('Error updating invoice files:', error);
    throw error;
  }
}

/**
 * Mark invoice as regenerated
 */
export async function markInvoiceRegenerated(invoiceId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        last_regenerated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) {
      logger.error('Failed to mark invoice as regenerated:', error);
      throw new Error(`Failed to mark invoice as regenerated: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error marking invoice as regenerated:', error);
    throw error;
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice['status']
): Promise<Invoice> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update invoice status:', error);
      throw new Error(`Invoice status update failed: ${error.message}`);
    }

    return data as Invoice;
  } catch (error) {
    logger.error('Error updating invoice status:', error);
    throw error;
  }
}

/**
 * Calculate due date based on invoice date and payment terms (default: 30 days)
 */
export function calculateDueDate(
  invoiceDate: string,
  paymentTermsDays: number = 30
): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + paymentTermsDays);
  return date.toISOString().split('T')[0];
}

/**
 * Prepare invoice data from transaction and customer
 */
export function prepareInvoiceData(
  transaction: SalesTransaction,
  customer: Customer,
  companyConfig: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;
    terms?: string;
  }
): InvoiceData {
  const invoiceDate = transaction.transaction_date;
  const dueDate = calculateDueDate(invoiceDate);

  // Calculate safe amounts with proper fallbacks
  const safeAmount = transaction.amount ?? 0;
  const safeTotalAmount = transaction.total_amount ?? safeAmount;
  const safePricePerCase = customer.price_per_case ?? 0;

  // Calculate amount in words (use safe total amount)
  const amountInWords = convertNumberToWords(safeTotalAmount);

  return {
    invoiceNumber: '', // Will be generated
    invoiceDate,
    dueDate,
    companyName: companyConfig.name,
    companyAddress: companyConfig.address,
    companyPhone: companyConfig.phone,
    companyEmail: companyConfig.email,
    companyGSTIN: companyConfig.gstin,
    clientName: customer.client_name,
    branch: customer.branch,
    clientAddress: undefined, // Not in current schema
    clientPhone: undefined,   // Not in current schema
    clientEmail: undefined,   // Not in current schema
    sku: transaction.sku || 'N/A',
    quantity: transaction.quantity ?? 0,
    pricePerCase: safePricePerCase,
    amount: safeAmount,
    totalAmount: safeTotalAmount,
    amountInWords,
    taxAmount: 0, // Can be calculated if tax is applicable
    grandTotal: safeTotalAmount,
    terms: companyConfig.terms || 'Payment due within 30 days. Late payment may incur interest charges.'
  };
}

/**
 * Convert number to words (Indian numbering system)
 * Example: 16000 -> "Sixteen Thousand Rupees Only"
 */
function convertNumberToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (amount === 0) return 'Zero Rupees Only';

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  function convertHundreds(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
  }

  function convert(num: number, scaleIndex: number): string {
    if (num === 0) return '';
    const scale = scales[scaleIndex];
    const remainder = num % 100;
    const quotient = Math.floor(num / 100);
    
    let result = '';
    if (remainder > 0) {
      result = convertHundreds(remainder);
    }
    if (scale && remainder > 0) {
      result += ' ' + scale;
    }
    if (quotient > 0) {
      const higher = convert(quotient, scaleIndex + 1);
      if (higher) {
        result = higher + (result ? ' ' + result : '');
      }
    }
    return result;
  }

  let words = convert(rupees, 0).trim();
  if (!words) words = 'Zero';
  
  words += ' Rupees';
  
  if (paise > 0) {
    const paiseWords = convertHundreds(paise);
    words += ' and ' + paiseWords + ' Paise';
  }
  
  words += ' Only';
  
  return words;
}
