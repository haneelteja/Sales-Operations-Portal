import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, Loader2 } from 'lucide-react';
import { exportLedger } from '@/lib/ledgerExport';
import { currentFY, fetchLedgerRows } from '@/lib/receivablesUtils';

export interface LedgerDrawerProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
}

export function LedgerDrawer({ open, onClose, customerId, dealerName, branch }: LedgerDrawerProps) {
  const [exporting, setExporting] = useState(false);
  const defaultFY = useMemo(() => currentFY(), []);
  const [dateFrom, setDateFrom] = useState(defaultFY.from);
  const [dateTo, setDateTo] = useState(defaultFY.to);

  const { data: firstTxDate } = useQuery({
    queryKey: ['customer-ledger-first-date', customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('sales_transactions')
        .select('transaction_date')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: true })
        .limit(1);
      return (data?.[0]?.transaction_date as string | undefined) ?? null;
    },
    enabled: open && !!customerId,
    staleTime: 60000,
  });

  const today = new Date().toISOString().split('T')[0];

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['customer-ledger', customerId, dateFrom, dateTo],
    queryFn: () => fetchLedgerRows(customerId, dateFrom, dateTo),
    enabled: open && !!customerId,
    staleTime: 30000,
  });

  const { openingBalance = 0, rows: ledger = [] } = ledgerData ?? {};

  const fmtFull = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtDateLedger = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const lastRow = ledger[ledger.length - 1];
  const closingBalance = lastRow?.balance ?? openingBalance;

  const handleExport = async () => {
    if (!ledger.length && openingBalance === 0) return;
    setExporting(true);
    try {
      const rows = ledger.map(r => ({
        date: r.date,
        clientName: dealerName,
        branch: branch || '',
        type: r.debit != null ? 'sale' : 'payment',
        sku: r.sku,
        cases: r.cases,
        amount: r.debit ?? r.credit ?? 0,
        description: r.particulars,
      }));
      const safeName = dealerName.replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportLedger(
        rows,
        `Ledger_${safeName}_${dateFrom}_to_${dateTo}.xlsx`,
        `Client Ledger — ${dealerName}${branch ? ` (${branch})` : ''} | ${dateFrom} to ${dateTo}`,
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-card flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold leading-tight">{dealerName}</SheetTitle>
              {branch && <p className="text-sm text-muted-foreground mt-0.5">{branch}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting || (ledger.length === 0 && openingBalance === 0)}
              className="gap-1.5 text-xs flex-shrink-0"
            >
              <FileText className="h-3.5 w-3.5" />
              {exporting ? 'Exporting…' : 'Export Ledger'}
            </Button>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="From date"
                className="flex-1 text-xs border border-input rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="To date"
                className="flex-1 text-xs border border-input rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={() => { setDateFrom(defaultFY.from); setDateTo(defaultFY.to); }}
              className="text-[10px] text-blue-600 hover:text-blue-800 whitespace-nowrap font-medium"
            >
              Current FY
            </button>
            <button
              type="button"
              onClick={() => { setDateFrom(firstTxDate ?? defaultFY.from); setDateTo(today); }}
              disabled={!firstTxDate}
              className="text-[10px] text-purple-600 hover:text-purple-800 whitespace-nowrap font-medium disabled:opacity-40"
            >
              Full Ledger
            </button>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Opening Balance</span>
              <span className={`text-sm font-bold ${openingBalance > 0 ? 'text-red-600' : openingBalance < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                {fmtFull(Math.abs(openingBalance))}{openingBalance < 0 ? ' CR' : openingBalance > 0 ? ' DR' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Closing Balance</span>
              <span className={`text-sm font-bold ${closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                {fmtFull(Math.abs(closingBalance))}{closingBalance < 0 ? ' CR' : closingBalance > 0 ? ' DR' : ''}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Ledger table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Loading ledger…</span>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                <tr>
                  <th className="text-left py-2.5 px-4 text-muted-foreground font-semibold">Date</th>
                  <th className="text-left py-2.5 px-4 text-muted-foreground font-semibold">Particulars</th>
                  <th className="text-right py-2.5 px-3 text-muted-foreground font-semibold">Debit</th>
                  <th className="text-right py-2.5 px-3 text-muted-foreground font-semibold">Credit</th>
                  <th className="text-right py-2.5 px-4 text-muted-foreground font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance row */}
                <tr className="border-t border-border/40 bg-muted/30">
                  <td className="py-2 px-4 text-muted-foreground whitespace-nowrap font-medium">{fmtDateLedger(dateFrom)}</td>
                  <td className="py-2 px-4 text-foreground font-medium" colSpan={3}>Opening Balance</td>
                  <td className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${
                    openingBalance > 0 ? 'text-red-600 dark:text-red-400' :
                    openingBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-muted-foreground'
                  }`}>
                    {fmtFull(Math.abs(openingBalance))}{openingBalance < 0 ? ' CR' : openingBalance > 0 ? ' DR' : ''}
                  </td>
                </tr>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      No transactions in selected period
                    </td>
                  </tr>
                ) : (
                  ledger.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t border-border/40 ${
                        row.debit != null
                          ? 'bg-red-50/40 dark:bg-red-900/10'
                          : 'bg-emerald-50/40 dark:bg-emerald-900/10'
                      }`}
                    >
                      <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{fmtDateLedger(row.date)}</td>
                      <td className="py-2 px-4 text-foreground leading-snug max-w-[180px]">
                        <span className="line-clamp-2">{row.particulars}</span>
                        {row.sku && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            {row.sku}{row.cases ? ` · ${row.cases} cases` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        {row.debit != null ? fmtFull(row.debit) : ''}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {row.credit != null ? fmtFull(row.credit) : ''}
                      </td>
                      <td className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${
                        row.balance > 0 ? 'text-red-600 dark:text-red-400' :
                        row.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-foreground'
                      }`}>
                        {fmtFull(Math.abs(row.balance))}{row.balance < 0 ? ' CR' : row.balance > 0 ? ' DR' : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-card border-t-2 border-border">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 font-bold text-foreground text-xs">Closing Balance</td>
                  <td colSpan={2} />
                  <td className={`py-2.5 px-4 text-right font-bold text-sm ${
                    closingBalance > 0 ? 'text-red-600 dark:text-red-400' :
                    closingBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-foreground'
                  }`}>
                    {fmtFull(Math.abs(closingBalance))}{closingBalance < 0 ? ' CR' : closingBalance > 0 ? ' DR' : ''}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
