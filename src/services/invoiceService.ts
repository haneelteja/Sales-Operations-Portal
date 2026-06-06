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

export interface InvoiceItem {
  sku: string;
  description?: string;
  quantity: number;
  pricePerCase: number;
  amount: number;
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
  dealerName: string;
  area: string | null;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  /** Multi-item support: when present, overrides single sku/quantity/pricePerCase/amount fields */
  items?: InvoiceItem[];
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
 * Set invoice_id on all sales_transactions that belong to a multi-SKU invoice.
 */
export async function linkTransactionsToInvoice(
  invoiceId: string,
  transactionIds: string[]
): Promise<void> {
  if (transactionIds.length === 0) return;
  const { error } = await supabase
    .from('sales_transactions')
    .update({ invoice_id: invoiceId })
    .in('id', transactionIds);
  if (error) {
    logger.error('Failed to link transactions to invoice:', error);
    throw new Error(`Failed to link transactions to invoice: ${error.message}`);
  }
}

/**
 * Get invoice by transaction ID
 */
export async function getInvoiceByTransactionId(
  transactionId: string
): Promise<Invoice | null> {
  try {
    // Primary: invoice is keyed by this transaction (first transaction in a multi-SKU sale)
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get invoice:', error);
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    if (data) return data as Invoice;

    // Fallback: this transaction is a secondary line in a multi-SKU invoice;
    // look up via the invoice_id stored on the transaction row itself.
    const { data: txRow, error: txError } = await supabase
      .from('sales_transactions')
      .select('invoice_id')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !txRow?.invoice_id) return null;

    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', txRow.invoice_id)
      .maybeSingle();

    if (invError) {
      logger.error('Failed to get invoice by invoice_id:', invError);
      return null;
    }

    return inv as Invoice | null;
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
  },
  skuDescriptions: Record<string, string> = {}
): InvoiceData {
  const invoiceDate = transaction.transaction_date;
  const dueDate = calculateDueDate(invoiceDate);

  const safeAmount = transaction.amount ?? 0;
  const safeTotalAmount = Math.round((transaction.total_amount ?? safeAmount) * 100) / 100;
  const safePricePerCase = customer.price_per_case ?? 0;
  const amountInWords = convertNumberToWords(safeTotalAmount);

  const sku = transaction.sku || 'N/A';
  const description = skuDescriptions[sku] || skuDescriptions[sku.toLowerCase().trim()] || sku;

  return {
    invoiceNumber: '',
    invoiceDate,
    dueDate,
    companyName: companyConfig.name,
    companyAddress: companyConfig.address,
    companyPhone: companyConfig.phone,
    companyEmail: companyConfig.email,
    companyGSTIN: companyConfig.gstin,
    dealerName: transaction.customers?.client_name || customer.client_name,
    area: transaction.branch || transaction.customers?.branch || customer.branch,
    clientAddress: undefined,
    clientPhone: undefined,
    clientEmail: undefined,
    sku,
    quantity: transaction.quantity ?? 0,
    pricePerCase: safePricePerCase,
    amount: safeAmount,
    totalAmount: safeTotalAmount,
    amountInWords,
    taxAmount: 0,
    grandTotal: safeTotalAmount,
    terms: companyConfig.terms || 'Payment due within 30 days. Late payment may incur interest charges.',
    items: [{
      sku,
      description,
      quantity: transaction.quantity ?? 0,
      pricePerCase: safePricePerCase,
      amount: safeAmount,
    }],
  };
}

/**
 * Prepare invoice data from multiple transactions (multi-SKU sale)
 */
export function prepareMultiInvoiceData(
  transactions: SalesTransaction[],
  customer: Customer,
  companyConfig: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;
    terms?: string;
  },
  skuDescriptions: Record<string, string> = {}
): InvoiceData {
  const invoiceDate = transactions[0].transaction_date;
  const dueDate = calculateDueDate(invoiceDate);

  const items: InvoiceItem[] = transactions.map((t) => {
    const qty = t.quantity ?? 0;
    const amount = t.amount ?? 0;
    const pricePerCase = qty > 0 ? amount / qty : 0;
    const sku = t.sku || 'N/A';
    return {
      sku,
      description: skuDescriptions[sku] || skuDescriptions[sku.toLowerCase().trim()] || sku,
      quantity: qty,
      pricePerCase,
      amount,
    };
  });

  const totalAmount = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  return {
    invoiceNumber: '',
    invoiceDate,
    dueDate,
    companyName: companyConfig.name,
    companyAddress: companyConfig.address,
    companyPhone: companyConfig.phone,
    companyEmail: companyConfig.email,
    companyGSTIN: companyConfig.gstin,
    dealerName: transactions[0].customers?.client_name || customer.client_name,
    area: transactions[0].branch || transactions[0].customers?.branch || customer.branch,
    clientAddress: undefined,
    clientPhone: undefined,
    clientEmail: undefined,
    items,
    sku: items[0]?.sku || 'N/A',
    quantity: items[0]?.quantity ?? 0,
    pricePerCase: items[0]?.pricePerCase ?? 0,
    amount: items[0]?.amount ?? 0,
    totalAmount,
    amountInWords: convertNumberToWords(totalAmount),
    taxAmount: 0,
    grandTotal: totalAmount,
    terms: companyConfig.terms || 'Payment due within 30 days. Late payment may incur interest charges.',
  };
}

/**
 * Convert number to words (Indian numbering system)
 * Example: 16000 -> "Sixteen Thousand Rupees Only"
 */
function convertNumberToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function belowHundred(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
  }

  function belowThousand(n: number): string {
    if (n < 100) return belowHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' ' + belowHundred(n % 100) : '');
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = '';
  let n = rupees;

  if (Math.floor(n / 10000000) > 0) {
    words += belowHundred(Math.floor(n / 10000000)) + ' Crore ';
    n = n % 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += belowHundred(Math.floor(n / 100000)) + ' Lakh ';
    n = n % 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += belowHundred(Math.floor(n / 1000)) + ' Thousand ';
    n = n % 1000;
  }
  if (n > 0) {
    words += belowThousand(n);
  }

  words = (words.trim() || 'Zero') + ' Rupees';
  if (paise > 0) {
    words += ' and ' + belowHundred(paise) + ' Paise';
  }
  return words + ' Only';
}
