import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAction } from '@/lib/auditLogger';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertCircle, TrendingUp, Download, Search, Loader2, StickyNote, Clock, Plus, X, Wallet, FileText, Receipt, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';
import { exportLedger } from '@/lib/ledgerExport';

// ── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  key: string;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
  lastPaymentDate: string | null;
  comments: string;
  nextFollowupDate: string;
  totalPayments: number;
  firstPaymentDate: string | null;
  avgDaysBetweenPayments: number | null;
  expectedNextPayment: string | null;
  paymentDaysOverdue: number | null; // null = "N/A"
  paymentStatus: string;
}

interface FetchResult {
  rows: RawRow[];
  collectionsThisMonth: number;
}

interface FollowupNote {
  id: string;
  note: string;
  followup_date: string | null;
  created_at: string;
  created_by: string | null;
}

type SortCol = 'name' | 'outstanding' | 'expectedNext' | 'daysOverdue' | 'pmtStatus' | 'followup' | 'assignee';

interface AssigneeEntry { name: string; bgClass: string; }

interface LedgerRow {
  date: string;
  particulars: string;
  sku: string | null;
  cases: number | null;
  debit: number | null;
  credit: number | null;
  balance: number;
}

// ── Helper Functions ──────────────────────────────────────────────────────────

async function fetchFollowupNotes(customerId: string): Promise<FollowupNote[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('client_followup_notes')
    .select('id, note, followup_date, created_at, created_by')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FollowupNote[];
}

async function insertFollowupNote(
  customerId: string,
  note: string,
  followupDate: string | null,
  createdBy?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('client_followup_notes')
    .insert({ customer_id: customerId, note, followup_date: followupDate || null, created_by: createdBy || null });
  if (error) throw error;
}

function currentFY(): { from: string; to: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed; April = 3
  const fyYear = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${fyYear}-04-01`, to: `${fyYear + 1}-03-31` };
}

async function fetchLedgerRows(
  customerId: string,
  from: string,
  to: string,
): Promise<{ openingBalance: number; rows: LedgerRow[] }> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('transaction_date, transaction_type, sku, quantity, amount, description')
    .eq('customer_id', customerId)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: true });
  if (error) throw error;

  const all = data ?? [];
  const before = all.filter(tx => tx.transaction_date < from);
  const inRange = all.filter(tx => tx.transaction_date >= from);

  let openingBalance = 0;
  for (const tx of before) {
    const amt = tx.amount ?? 0;
    openingBalance += tx.transaction_type === 'sale' ? amt : -amt;
  }

  let balance = openingBalance;
  const rows: LedgerRow[] = inRange.map(tx => {
    const isSale = tx.transaction_type === 'sale';
    const debit = isSale ? (tx.amount ?? 0) : null;
    const credit = isSale ? null : (tx.amount ?? 0);
    balance += (debit ?? 0) - (credit ?? 0);
    return {
      date: tx.transaction_date,
      particulars: isSale
        ? `Stock Delivered${tx.description ? ` — ${tx.description}` : ''}`
        : `Payment Received${tx.description ? ` — ${tx.description}` : ''}`,
      sku: tx.sku,
      cases: tx.quantity,
      debit,
      credit,
      balance,
    };
  });

  return { openingBalance, rows };
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchReceivablesTracking(): Promise<FetchResult> {
  const [txResult, custResult, followupResult] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, transaction_date'),
    supabase
      .from('customers')
      .select('id, client_name, branch'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('client_followups')
      .select('dealer_name, branch, comments, next_followup_date'),
  ]);

  if (txResult.error) throw txResult.error;
  if (custResult.error) throw custResult.error;

  const transactions = txResult.data ?? [];
  const customers = custResult.data ?? [];
  const followups = (followupResult.data ?? []) as Array<{
    dealer_name: string;
    branch: string;
    comments: string | null;
    next_followup_date: string | null;
  }>;

  const customerMap = new Map<string, { dealerName: string; branch: string }>();
  for (const c of customers) {
    customerMap.set(c.id, {
      dealerName: (c.client_name || 'Unknown') as string,
      branch: (c.branch || '') as string,
    });
  }

  const followupMap = new Map<string, { comments: string; nextFollowupDate: string }>();
  for (const f of followups) {
    followupMap.set(`${f.dealer_name.toLowerCase()}|||${f.branch.toLowerCase()}`, {
      comments: f.comments ?? '',
      nextFollowupDate: f.next_followup_date ?? '',
    });
  }

  const groups = new Map<string, {
    customerId: string;
    dealerName: string;
    branch: string;
    sales: number;
    payments: number;
    lastPaymentDate: string | null;
    paymentCount: number;
    firstPaymentDate: string | null;
  }>();

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';
  let collectionsThisMonth = 0;

  for (const tx of transactions) {
    const customer = customerMap.get(tx.customer_id);
    if (!customer) continue;

    const key = `${customer.dealerName.toLowerCase()}|||${customer.branch.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        customerId: tx.customer_id,
        dealerName: customer.dealerName,
        branch: customer.branch,
        sales: 0,
        payments: 0,
        lastPaymentDate: null,
        paymentCount: 0,
        firstPaymentDate: null,
      });
    }
    const g = groups.get(key)!;

    if (tx.transaction_type === 'sale') {
      g.sales += tx.amount ?? 0;
    } else if (tx.transaction_type === 'payment') {
      g.payments += tx.amount ?? 0;
      g.paymentCount += 1;
      const txDate = tx.transaction_date ?? null;
      if (txDate) {
        if (!g.firstPaymentDate || txDate < g.firstPaymentDate) g.firstPaymentDate = txDate;
        if (!g.lastPaymentDate || txDate > g.lastPaymentDate) g.lastPaymentDate = txDate;
      }
      if ((tx.transaction_date ?? '') >= monthStart) {
        collectionsThisMonth += tx.amount ?? 0;
      }
    }
  }

  const todayForCalc = new Date();
  todayForCalc.setHours(0, 0, 0, 0);

  const rows: RawRow[] = [];
  for (const [key, g] of groups) {
    const outstanding = g.sales - g.payments;
    if (outstanding < 0.01) continue;

    const totalPayments = g.paymentCount;
    const firstPaymentDate = g.firstPaymentDate;
    const lastPmtDate = g.lastPaymentDate;

    let avgDaysBetweenPayments: number | null = null;
    let expectedNextPayment: string | null = null;
    let paymentDaysOverdue: number | null = null;

    if (totalPayments > 1 && firstPaymentDate && lastPmtDate) {
      const firstMs = new Date(firstPaymentDate).setHours(0, 0, 0, 0);
      const lastMs = new Date(lastPmtDate).setHours(0, 0, 0, 0);
      avgDaysBetweenPayments = Math.round((lastMs - firstMs) / ((totalPayments - 1) * 86400000));

      const expDate = new Date(lastPmtDate);
      expDate.setDate(expDate.getDate() + avgDaysBetweenPayments);
      expectedNextPayment = expDate.toISOString().split('T')[0];

      const expMs = new Date(expectedNextPayment).setHours(0, 0, 0, 0);
      paymentDaysOverdue = Math.max(0, Math.round((todayForCalc.getTime() - expMs) / 86400000));
    }

    let paymentStatus: string;
    if (totalPayments === 0) {
      paymentStatus = 'No Payments';
    } else if (totalPayments === 1) {
      paymentStatus = 'Only 1 Payment';
    } else if (paymentDaysOverdue === null) {
      paymentStatus = 'N/A';
    } else if (paymentDaysOverdue > 14) {
      paymentStatus = 'OVERDUE';
    } else if (paymentDaysOverdue > 0) {
      paymentStatus = 'DUE SOON';
    } else if (expectedNextPayment) {
      const expMs = new Date(expectedNextPayment).setHours(0, 0, 0, 0);
      paymentStatus = todayForCalc.getTime() >= expMs - 5 * 86400000 ? 'DUE SOON' : 'ON TRACK';
    } else {
      paymentStatus = 'ON TRACK';
    }

    const followup = followupMap.get(key) ?? { comments: '', nextFollowupDate: '' };
    rows.push({
      key,
      customerId: g.customerId,
      dealerName: g.dealerName,
      branch: g.branch,
      outstanding,
      lastPaymentDate: lastPmtDate,
      comments: followup.comments,
      nextFollowupDate: followup.nextFollowupDate,
      totalPayments,
      firstPaymentDate,
      avgDaysBetweenPayments,
      expectedNextPayment,
      paymentDaysOverdue,
      paymentStatus,
    });
  }

  return { rows, collectionsThisMonth };
}

// ── LedgerDrawer ──────────────────────────────────────────────────────────────

interface LedgerDrawerProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
}

function LedgerDrawer({ open, onClose, customerId, dealerName, branch, outstanding }: LedgerDrawerProps) {
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

// ── FollowupNotesDrawer ───────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
  currentFollowupDate: string;
}

function FollowupNotesDrawer({
  open,
  onClose,
  customerId,
  dealerName,
  branch,
  outstanding,
  currentFollowupDate,
}: DrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const operatorName = profile?.username || profile?.email || user?.email || 'Unknown';
  const [note, setNote] = useState('');
  const [followupDate, setFollowupDate] = useState(currentFollowupDate);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setFollowupDate(currentFollowupDate);
  }, [currentFollowupDate, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['followup-notes', customerId],
    queryFn: () => fetchFollowupNotes(customerId),
    enabled: open && !!customerId,
  });

  const handleSave = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await insertFollowupNote(customerId, trimmed, followupDate || null, operatorName);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase as any)
        .from('client_followups')
        .upsert(
          {
            dealer_name: dealerName,
            branch,
            comments: trimmed,
            next_followup_date: followupDate || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'dealer_name,branch' }
        );
      if (upsertError) throw upsertError;

      queryClient.invalidateQueries({ queryKey: ['followup-notes', customerId] });
      queryClient.invalidateQueries({ queryKey: ['receivables-tracking'] });
      setNote('');
      toast({ title: 'Note saved', description: 'Follow-up note logged successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getFollowupStatusBadge = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff < 0) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (diff === 0) return <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">Today</Badge>;
    return <Badge className="text-xs bg-violet-100 text-violet-800 hover:bg-violet-100">{diff}d away</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex flex-col gap-1">
            <span className="font-semibold text-base">{dealerName}</span>
            {branch && <span className="text-sm font-normal text-muted-foreground">{branch}</span>}
            <span className="text-sm font-bold text-red-600">
              ₹{outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} outstanding
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Add note form */}
        <div className="space-y-3 py-4 border-b">
          <Textarea
            ref={textareaRef}
            rows={3}
            placeholder="Add a follow-up note..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                className="pl-8 text-sm"
                value={followupDate}
                onChange={e => setFollowupDate(e.target.value)}
                title="Follow-up date"
                aria-label="Follow-up date"
              />
            </div>
            {followupDate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setFollowupDate('')}
                aria-label="Clear follow-up date"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              className="shrink-0"
              disabled={!note.trim() || saving}
              onClick={handleSave}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                : <Plus className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        {/* Notes log */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !notes?.length ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notes yet. Add the first one above.
            </div>
          ) : (
            notes.map((n, i) => (
              <div key={n.id} className="relative pl-6">
                {i < notes.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2 flex-wrap">
                  <span>
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {n.created_by && (
                    <span className="font-medium text-foreground/70">· {n.created_by}</span>
                  )}
                  {getFollowupStatusBadge(n.followup_date)}
                </div>
                <p className="text-sm">{n.note}</p>
                {n.followup_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Follow-up: {new Date(n.followup_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivablesTrackingView() {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('outstanding');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterMinOutstanding, setFilterMinOutstanding] = useState('');
  const [filterFollowupStatus, setFilterFollowupStatus] = useState('');
  const [activeNotes, setActiveNotes] = useState<{
    customerId: string;
    dealerName: string;
    branch: string;
    outstanding: number;
    key: string;
  } | null>(null);

  const [activeLedger, setActiveLedger] = useState<{
    customerId: string;
    dealerName: string;
    branch: string;
    outstanding: number;
  } | null>(null);

  const { data, isLoading } = useQuery<FetchResult>({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const queryClient = useQueryClient();

  const { data: customerAssignees = [] } = useQuery({
    queryKey: ['customer-assignees'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('customer_assignee')
        .select('customer_id, assignee_name');
      if (error) throw error;
      return rows ?? [];
    },
    staleTime: 30000,
  });

  const { data: assigneeListRaw } = useQuery({
    queryKey: ['assignee-list-config'],
    queryFn: async () => {
      const { data: row } = await supabase
        .from('invoice_configurations')
        .select('config_value')
        .eq('config_key', 'assignee_list')
        .maybeSingle();
      return row?.config_value ?? '[]';
    },
    staleTime: 60000,
  });

  const ASSIGNEE_PALETTE_CLASSES = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500',
    'bg-cyan-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ];

  const assigneeList: AssigneeEntry[] = useMemo(() => {
    try {
      const parsed = JSON.parse(assigneeListRaw ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.map((x, i): AssigneeEntry | null => {
        const defaultBg = ASSIGNEE_PALETTE_CLASSES[i % ASSIGNEE_PALETTE_CLASSES.length];
        if (typeof x === 'string') return { name: x, bgClass: defaultBg };
        if (x && typeof x.name === 'string') return { name: x.name, bgClass: x.bgClass || defaultBg };
        return null;
      }).filter((x): x is AssigneeEntry => x !== null && x.name !== '');
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigneeListRaw]);

  const assigneeMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of customerAssignees) {
      map[row.customer_id] = row.assignee_name;
    }
    return map;
  }, [customerAssignees]);

  const assigneeMutation = useMutation({
    mutationFn: async ({ customer_id, assignee_name }: { customer_id: string; assignee_name: string | null }) => {
      if (!assignee_name) {
        const { error } = await supabase.from('customer_assignee').delete().eq('customer_id', customer_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customer_assignee').upsert(
          { customer_id, assignee_name, updated_at: new Date().toISOString() },
          { onConflict: 'customer_id' }
        );
        if (error) throw error;
      }
    },
    onSuccess: (_result, variables) => {
      logAction({ action: 'UPDATE', entityType: 'customer_assignee', description: `Assignee updated for customer ${variables.customer_id}: ${variables.assignee_name ?? 'unassigned'}`, newValues: { customer_id: variables.customer_id, assignee_name: variables.assignee_name } });
      queryClient.invalidateQueries({ queryKey: ['customer-assignees'] });
    },
  });

  const handleAssigneeChange = useCallback((customerId: string, name: string | null) => {
    assigneeMutation.mutate({ customer_id: customerId, assignee_name: name });
  }, [assigneeMutation]);

  const { toast } = useToast();

  const clearFollowupDateMutation = useMutation({
    mutationFn: async ({ dealerName, branch }: { dealerName: string; branch: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('client_followups')
        .update({ next_followup_date: null, updated_at: new Date().toISOString() })
        .eq('dealer_name', dealerName)
        .eq('branch', branch);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables-tracking'] });
      toast({ title: 'Follow-up date cleared' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleSort = useCallback((col: SortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }, [sortCol]);

  const displayRows = useMemo(() => {
    if (!data?.rows) return [];

    let rows = data.rows.map(row => {
      const isOverdue = row.outstanding > 0 && !!row.nextFollowupDate && row.nextFollowupDate < today;
      return { ...row, isOverdue };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.dealerName.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.comments.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      rows = rows.filter(r => r.paymentStatus === filterStatus);
    }

    if (filterAssignee) {
      if (filterAssignee === '__unassigned__') {
        rows = rows.filter(r => !assigneeMap[r.customerId]);
      } else {
        rows = rows.filter(r => assigneeMap[r.customerId] === filterAssignee);
      }
    }

    if (filterMinOutstanding.trim()) {
      const min = parseFloat(filterMinOutstanding.replace(/,/g, ''));
      if (!isNaN(min)) {
        rows = rows.filter(r => r.outstanding >= min);
      }
    }

    if (filterFollowupStatus) {
      const todayStr = today;
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
      switch (filterFollowupStatus) {
        case 'not_set':
          rows = rows.filter(r => !r.nextFollowupDate);
          break;
        case 'overdue':
          rows = rows.filter(r => !!r.nextFollowupDate && r.nextFollowupDate < todayStr);
          break;
        case 'upcoming':
          rows = rows.filter(r => !!r.nextFollowupDate && r.nextFollowupDate >= todayStr && r.nextFollowupDate <= sevenDaysStr);
          break;
        case 'set':
          rows = rows.filter(r => !!r.nextFollowupDate);
          break;
      }
    }

    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'name': cmp = a.dealerName.localeCompare(b.dealerName); break;
        case 'outstanding': cmp = a.outstanding - b.outstanding; break;
        case 'expectedNext':
          cmp = (a.expectedNextPayment ?? '').localeCompare(b.expectedNextPayment ?? ''); break;
        case 'daysOverdue':
          cmp = (a.paymentDaysOverdue ?? -1) - (b.paymentDaysOverdue ?? -1); break;
        case 'pmtStatus': cmp = a.paymentStatus.localeCompare(b.paymentStatus); break;
        case 'followup':
          if (!a.nextFollowupDate && !b.nextFollowupDate) { cmp = 0; break; }
          if (!a.nextFollowupDate) { cmp = 1; break; }
          if (!b.nextFollowupDate) { cmp = -1; break; }
          cmp = a.nextFollowupDate.localeCompare(b.nextFollowupDate); break;
        case 'assignee':
          cmp = (assigneeMap[a.customerId] ?? '').localeCompare(assigneeMap[b.customerId] ?? ''); break;
        default: cmp = b.outstanding - a.outstanding;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data?.rows, search, sortCol, sortDir, filterStatus, filterAssignee, filterMinOutstanding, filterFollowupStatus, assigneeMap, today]);

  const overdueCount = useMemo(
    () => displayRows.filter(r => r.isOverdue).length,
    [displayRows]
  );

  const totalOutstanding = useMemo(
    () => (data?.rows ?? []).reduce((sum, r) => sum + (r.outstanding ?? 0), 0),
    [data?.rows]
  );

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Aamodha Operations Portal';
    const ws = wb.addWorksheet('Receivables');

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    const overdueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    const normalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    ws.columns = [
      { key: 'client', width: 28 },
      { key: 'branch', width: 22 },
      { key: 'outstanding', width: 18 },
      { key: 'expectedNext', width: 22 },
      { key: 'daysOverdue', width: 16 },
      { key: 'pmtStatus', width: 18 },
      { key: 'comments', width: 40 },
      { key: 'followup', width: 18 },
      { key: 'assignee', width: 20 },
    ];

    ws.mergeCells('A1:I1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Receivables Tracker Report';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    ws.mergeCells('A2:I2');
    ws.getCell('A2').value = `Generated: ${new Date().toLocaleDateString('en-IN')}`;
    ws.getCell('A2').font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:I3');
    ws.getCell('A3').value = `Overdue Clients: ${overdueCount}   |   Collections This Month: ₹${(data?.collectionsThisMonth ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    ws.getCell('A3').font = { size: 10, color: { argb: 'FF333333' } };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]);

    const headerRow = ws.addRow([
      'Client', 'Branch', 'Outstanding (₹)',
      'Expected Next Payment', 'Payment Days Overdue',
      'Payment Status', 'Latest Note', 'Next Follow-up', 'Assignee',
    ]);
    headerRow.height = 20;
    headerRow.eachCell(cell => {
      cell.fill = headerFill;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    const fmtDateXlsx = (d: string | null) =>
      d ? new Date(d).toLocaleDateString('en-IN') : '—';

    for (const row of displayRows) {
      const dataRow = ws.addRow([
        row.dealerName,
        row.branch,
        row.outstanding,
        fmtDateXlsx(row.expectedNextPayment),
        row.paymentDaysOverdue !== null ? row.paymentDaysOverdue : 'N/A',
        row.paymentStatus,
        row.comments || '',
        row.nextFollowupDate ? new Date(row.nextFollowupDate).toLocaleDateString('en-IN') : '—',
        assigneeMap[row.customerId] || '—',
      ]);
      dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = row.isOverdue ? overdueFill : normalFill;
        cell.border = thinBorder;
        if (col === 3) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FFC00000' } };
        }
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receivables_${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';

  const getFollowupStyle = (dateStr: string | null | undefined): { badge: string; text: string } => {
    if (!dateStr) return { badge: 'bg-gray-100 text-gray-500 border-gray-200', text: 'text-gray-400' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-600' };
    if (diff <= 1) return { badge: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-600' };
    return { badge: 'bg-green-100 text-green-700 border-green-200', text: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeRow = activeNotes ? displayRows.find(r => r.key === activeNotes.key) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Receivables Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track outstanding balances and follow-up schedules for all clients
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Clients</p>
                <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Outstanding &amp; follow-up date passed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 rounded-lg">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-3xl font-bold text-orange-600">
                  {fmt(totalOutstanding)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sum of all client balances
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collections This Month</p>
                <p className="text-3xl font-bold text-green-600">
                  {fmt(data?.collectionsThisMonth ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, branch, notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pmt Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="DUE SOON">Due Soon</SelectItem>
            <SelectItem value="ON TRACK">On Track</SelectItem>
            <SelectItem value="No Payments">No Payments</SelectItem>
            <SelectItem value="Only 1 Payment">Only 1 Payment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFollowupStatus || '__all__'} onValueChange={v => setFilterFollowupStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Follow-up" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Follow-ups</SelectItem>
            <SelectItem value="overdue">Follow-up Overdue</SelectItem>
            <SelectItem value="upcoming">Due in 7 Days</SelectItem>
            <SelectItem value="set">Has Follow-up Date</SelectItem>
            <SelectItem value="not_set">No Follow-up Set</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[140px]">
          <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-medium pointer-events-none">Min ₹</span>
          <Input
            placeholder="0"
            value={filterMinOutstanding}
            onChange={e => setFilterMinOutstanding(e.target.value.replace(/[^0-9.]/g, ''))}
            className="pl-12 w-[140px]"
            title="Minimum outstanding amount"
          />
        </div>

        {assigneeList.length > 0 && (
          <Select value={filterAssignee || '__all__'} onValueChange={v => setFilterAssignee(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Assignees</SelectItem>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {assigneeList.map(a => (
                <SelectItem key={a.name} value={a.name}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 inline-block ${a.bgClass}`} />
                    {a.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(search || filterStatus || filterAssignee || filterMinOutstanding || filterFollowupStatus) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('');
              setFilterStatus('');
              setFilterAssignee('');
              setFilterMinOutstanding('');
              setFilterFollowupStatus('');
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Active filter summary */}
      {(search || filterStatus || filterAssignee || filterMinOutstanding || filterFollowupStatus) && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          <span className="font-medium">Showing {displayRows.length} result{displayRows.length !== 1 ? 's' : ''}:</span>
          {search && <span className="bg-muted px-2 py-0.5 rounded-full">Search: "{search}"</span>}
          {filterStatus && <span className="bg-muted px-2 py-0.5 rounded-full">Status: {filterStatus}</span>}
          {filterFollowupStatus && <span className="bg-muted px-2 py-0.5 rounded-full">Follow-up: {filterFollowupStatus.replace('_', ' ')}</span>}
          {filterMinOutstanding && <span className="bg-muted px-2 py-0.5 rounded-full">Min Outstanding: ₹{filterMinOutstanding}</span>}
          {filterAssignee && <span className="bg-muted px-2 py-0.5 rounded-full">Assignee: {filterAssignee === '__unassigned__' ? 'Unassigned' : filterAssignee}</span>}
        </div>
      )}

      {/* Table */}
      {displayRows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-md">
          {(search || filterStatus || filterAssignee || filterMinOutstanding || filterFollowupStatus)
            ? 'No clients match the current filters.'
            : 'No clients with outstanding balances found.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b text-left">
                {(['name', 'outstanding', 'expectedNext', 'daysOverdue', 'pmtStatus', null, 'followup', 'assignee', null, null] as const).map((col, i) => {
                  const labels = ['Client Branch', 'Outstanding', 'Expected Next Pmt', 'Days Overdue', 'Pmt Status', 'Latest Note', 'Next Follow-up', 'Assignee', 'Log', 'Ledger'];
                  const rightAlign = i === 1 || i === 3;
                  const minW = i === 5 ? 'min-w-[240px]' : '';
                  if (!col) {
                    return <th key={i} className={`px-4 py-3 font-semibold whitespace-nowrap ${rightAlign ? 'text-right' : ''} ${minW}`}>{labels[i]}</th>;
                  }
                  const isActive = sortCol === col;
                  return (
                    <th
                      key={i}
                      className={`px-4 py-3 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-muted/80 transition-colors ${rightAlign ? 'text-right' : ''} ${minW}`}
                      onClick={() => handleSort(col as SortCol)}
                    >
                      <span className={`inline-flex items-center gap-1 ${rightAlign ? 'flex-row-reverse' : ''}`}>
                        {labels[i]}
                        {isActive
                          ? sortDir === 'asc'
                            ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                            : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                          : <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                        }
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <tr
                  key={row.key}
                  className={`border-b last:border-0 transition-colors ${
                    row.isOverdue ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Client Branch */}
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium leading-tight">{row.dealerName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{row.branch}</div>
                    {row.isOverdue && (
                      <Badge variant="destructive" className="mt-1.5 text-xs">
                        Overdue
                      </Badge>
                    )}
                  </td>

                  {/* Outstanding */}
                  <td className="px-4 py-3 text-right font-bold text-red-600 whitespace-nowrap align-top">
                    {fmt(row.outstanding)}
                  </td>

                  {/* Expected Next Payment */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {row.expectedNextPayment ? (
                      <span className="text-sm">{fmtDate(row.expectedNextPayment)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">N/A</span>
                    )}
                  </td>

                  {/* Payment Days Overdue */}
                  <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                    {row.paymentDaysOverdue === null ? (
                      <span className="text-muted-foreground/50">N/A</span>
                    ) : row.paymentDaysOverdue > 0 ? (
                      <span className="font-semibold text-red-600">{row.paymentDaysOverdue}d</span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {row.paymentStatus === 'OVERDUE' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">OVERDUE</span>
                    ) : row.paymentStatus === 'DUE SOON' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">DUE SOON</span>
                    ) : row.paymentStatus === 'ON TRACK' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ON TRACK</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.paymentStatus}</span>
                    )}
                  </td>

                  {/* Latest Note (read-only) */}
                  <td className="px-4 py-3 align-top max-w-xs">
                    {row.comments ? (
                      <p className="text-sm text-foreground line-clamp-2">{row.comments}</p>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">No notes yet</span>
                    )}
                  </td>

                  {/* Next Follow-up Date */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {(() => {
                      const style = getFollowupStyle(row.nextFollowupDate || null);
                      return row.nextFollowupDate ? (
                        <div className="flex items-center gap-1 group">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
                            {fmtDate(row.nextFollowupDate)}
                          </span>
                          <button
                            type="button"
                            title="Remove follow-up date"
                            onClick={() => clearFollowupDateMutation.mutate({ dealerName: row.dealerName, branch: row.branch })}
                            disabled={clearFollowupDateMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-0.5 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-400 border-gray-200 italic">
                          Not set
                        </span>
                      );
                    })()}
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3 align-top">
                    {assigneeList.length > 0 ? (
                      <div className="flex items-center gap-1.5 min-w-[130px]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                            assigneeMap[row.customerId]
                              ? (assigneeList.find(a => a.name === assigneeMap[row.customerId])?.bgClass ?? 'bg-gray-400')
                              : 'bg-gray-300'
                          }`}
                        />
                        <select
                          value={assigneeMap[row.customerId] ?? ''}
                          onChange={e => handleAssigneeChange(row.customerId, e.target.value || null)}
                          aria-label="Assignee"
                          className="text-xs border border-border rounded-md px-2 py-1 bg-background outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground flex-1"
                        >
                          <option value="">Unassigned</option>
                          {assigneeList.map(a => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">—</span>
                    )}
                  </td>

                  {/* Log button */}
                  <td className="px-4 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground border-border/60 bg-muted/30 hover:bg-muted/60"
                      onClick={() =>
                        setActiveNotes({
                          customerId: row.customerId,
                          dealerName: row.dealerName,
                          branch: row.branch,
                          outstanding: row.outstanding,
                          key: row.key,
                        })
                      }
                    >
                      <StickyNote className="h-4 w-4 mr-1" />
                      Log
                    </Button>
                  </td>

                  {/* View Ledger button */}
                  <td className="px-4 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-blue-600 hover:text-blue-700 border-blue-200 bg-blue-50/40 hover:bg-blue-50"
                      onClick={() =>
                        setActiveLedger({
                          customerId: row.customerId,
                          dealerName: row.dealerName,
                          branch: row.branch,
                          outstanding: row.outstanding,
                        })
                      }
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      View Ledger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {displayRows.length} client{displayRows.length !== 1 ? 's' : ''} with outstanding balance
      </p>

      {/* Follow-up Notes Drawer */}
      {activeNotes && (
        <FollowupNotesDrawer
          open={!!activeNotes}
          onClose={() => setActiveNotes(null)}
          customerId={activeNotes.customerId}
          dealerName={activeNotes.dealerName}
          branch={activeNotes.branch}
          outstanding={activeNotes.outstanding}
          currentFollowupDate={activeRow?.nextFollowupDate ?? ''}
        />
      )}

      {/* Ledger Drawer */}
      {activeLedger && (
        <LedgerDrawer
          open={!!activeLedger}
          onClose={() => setActiveLedger(null)}
          customerId={activeLedger.customerId}
          dealerName={activeLedger.dealerName}
          branch={activeLedger.branch}
          outstanding={activeLedger.outstanding}
        />
      )}
    </div>
  );
}
