/**
 * Invoice actions and display for SalesEntry transactions
 * Extracted for better maintainability and re-render optimization
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useInvoice } from "@/hooks/useInvoiceGeneration";
import type { Customer, SalesTransaction } from "@/types";

interface InvoiceActionsProps {
  transaction: SalesTransaction;
  customer?: Customer;
  onGenerate: (transaction: SalesTransaction) => void;
  onDownload: (invoice: { word_file_url?: string; pdf_file_url?: string }, format: 'word' | 'pdf') => void;
  isGenerating: boolean;
}

export const InvoiceActions = memo(({
  transaction,
  onGenerate,
  onDownload,
  isGenerating,
}: InvoiceActionsProps) => {
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(transaction.id);

  if (transaction.transaction_type !== 'sale') return null;

  if (invoiceLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (invoice) {
    return (
      <>
        {invoice.word_file_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(invoice, 'word')}
            title="Download Word Invoice"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {invoice.pdf_file_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(invoice, 'pdf')}
            title="Download PDF Invoice"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onGenerate(transaction)}
      disabled={isGenerating}
      title="Generate Invoice"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </Button>
  );
});

InvoiceActions.displayName = 'InvoiceActions';

interface InvoiceNumberCellProps {
  transactionId: string;
  transactionType: string;
}

/** Cell that shows invoice number for a transaction (sales only). */
export const InvoiceNumberCell = memo(({
  transactionId,
  transactionType,
}: InvoiceNumberCellProps) => {
  const { data: invoice } = useInvoice(transactionType === 'sale' ? transactionId : null);
  if (transactionType !== 'sale') return <span className="text-muted-foreground">—</span>;
  return <span>{invoice?.invoice_number ?? '—'}</span>;
});

InvoiceNumberCell.displayName = 'InvoiceNumberCell';
