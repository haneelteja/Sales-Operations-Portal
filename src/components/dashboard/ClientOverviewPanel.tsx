import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, StickyNote, Receipt, User, MapPin } from 'lucide-react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { fetchFollowupNotes } from '@/lib/receivablesUtils';
import { LedgerDrawer } from '@/components/receivables-tracking/LedgerDrawer';
import { FollowupNotesDrawer } from '@/components/receivables-tracking/FollowupNotesDrawer';

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtMoney = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Math.round(v)}`;
};

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const daysDiff = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86400000);
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  client_name: string;
  branch: string | null;
  contact_person: string | null;
  phone: string | null;
  whatsapp_number: string | null;
}

interface SaleTx {
  transaction_date: string;
  transaction_type: string;
  amount: number | null;
  quantity: number | null;
  sku: string | null;
}

interface MonthBucket {
  label: string;
  ym: string;
  cases: number;
  revenue: number;
  collections: number;
  factoryCost: number;
  labelCost: number;
  transportCost: number;
}

// ── Tile variants (avoids inline styles) ──────────────────────────────────────

type TileVariant = 'violet' | 'emerald' | 'sky' | 'amber' | 'rose';

const TILE_CLASSES: Record<TileVariant, { bg: string; label: string; value: string; sub: string }> = {
  violet: { bg: 'bg-violet-50',  label: 'text-violet-500', value: 'text-violet-900', sub: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-50', label: 'text-emerald-500', value: 'text-emerald-900', sub: 'text-emerald-400' },
  sky:     { bg: 'bg-sky-50',    label: 'text-sky-500',    value: 'text-sky-900',    sub: 'text-sky-400' },
  amber:   { bg: 'bg-amber-50',  label: 'text-amber-500',  value: 'text-amber-900',  sub: 'text-amber-400' },
  rose:    { bg: 'bg-rose-50',   label: 'text-rose-500',   value: 'text-rose-900',   sub: 'text-rose-400' },
};

function Tile({ label, value, sub, variant }: { label: string; value: string; sub?: string; variant: TileVariant }) {
  const c = TILE_CLASSES[variant];
  return (
    <div className={`rounded-xl px-4 py-3 ${c.bg}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${c.label}`}>{label}</p>
      <p className={`text-lg font-bold mt-0.5 leading-tight ${c.value}`}>{value}</p>
      {sub && <p className={`text-[10px] mt-0.5 ${c.sub}`}>{sub}</p>}
    </div>
  );
}

// Width steps in 10% increments so Tailwind includes the classes at build time
const UTIL_WIDTH_CLASS = ['w-0','w-[10%]','w-[20%]','w-[30%]','w-[40%]','w-[50%]','w-[60%]','w-[70%]','w-[80%]','w-[90%]','w-full'] as const;

function CreditUtilizationTile({ utilization }: { utilization: number }) {
  const capped = Math.min(100, utilization);
  const step = Math.round(capped / 10); // 0–10
  const barW = UTIL_WIDTH_CLASS[step];
  const barColor = utilization > 100 ? 'bg-red-500' : utilization > 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-xl px-4 py-3 bg-amber-50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Credit Utilization</p>
      <p className="text-lg font-bold mt-0.5 leading-tight text-amber-900">{utilization.toFixed(0)}%</p>
      <div className="mt-1.5 h-1.5 bg-amber-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} ${barW}`} />
      </div>
    </div>
  );
}

// ── ClientOverviewPanel ────────────────────────────────────────────────────────

export default function ClientOverviewPanel() {
  const [selectedId, setSelectedId] = useState<string>('');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // ── Customers list ──────────────────────────────────────────────────────────
  const { data: customers = [], error: customersError } = useQuery<Customer[]>({
    queryKey: ['overview-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, client_name, branch, contact_person, phone, whatsapp_number, is_deprecated')
        .eq('is_active', true)
        .order('client_name');
      if (error) throw error;
      return (data ?? []).filter(c => !(c as Record<string, unknown>).is_deprecated) as Customer[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const selectedCustomer = customers.find(c => c.id === selectedId) ?? null;

  // ── Sales transactions ──────────────────────────────────────────────────────
  const { data: saleTxs = [], isLoading: txLoading } = useQuery<SaleTx[]>({
    queryKey: ['overview-sales-txs', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('transaction_date, transaction_type, amount, quantity, sku')
        .eq('customer_id', selectedId)
        .order('transaction_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SaleTx[];
    },
    enabled: !!selectedId,
    staleTime: 2 * 60 * 1000,
  });

  // ── client_followups ────────────────────────────────────────────────────────
  const { data: followup } = useQuery({
    queryKey: ['overview-followup', selectedCustomer?.client_name, selectedCustomer?.branch],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('client_followups')
        .select('next_followup_date, comments')
        .eq('dealer_name', selectedCustomer.client_name)
        .eq('branch', selectedCustomer.branch ?? '')
        .maybeSingle();
      return data as { next_followup_date: string | null; comments: string | null } | null;
    },
    enabled: !!selectedCustomer,
    staleTime: 2 * 60 * 1000,
  });

  // ── client_followup_notes (preview: 3) ─────────────────────────────────────
  const { data: recentNotes = [] } = useQuery({
    queryKey: ['overview-notes-preview', selectedId],
    queryFn: () => fetchFollowupNotes(selectedId),
    enabled: !!selectedId,
    staleTime: 2 * 60 * 1000,
    select: notes => notes.slice(0, 3),
  });

  // ── factory_payables (production type) ─────────────────────────────────────
  const { data: factoryPayables = [] } = useQuery({
    queryKey: ['overview-factory', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factory_payables')
        .select('transaction_date, amount, quantity')
        .eq('customer_id', selectedId)
        .eq('transaction_type', 'production');
      if (error) throw error;
      return (data ?? []) as { transaction_date: string; amount: number | null; quantity: number | null }[];
    },
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  // ── transport_expenses ──────────────────────────────────────────────────────
  const { data: transportExpenses = [] } = useQuery({
    queryKey: ['overview-transport', selectedId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('transport_expenses')
        .select('expense_date, amount')
        .eq('client_id', selectedId);
      if (error) throw error;
      return (data ?? []) as { expense_date: string; amount: number | null }[];
    },
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  // ── label_purchases ─────────────────────────────────────────────────────────
  const { data: labelPurchases = [] } = useQuery({
    queryKey: ['overview-labels', selectedId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('label_purchases')
        .select('purchase_date, total_amount')
        .eq('client_id', selectedId);
      if (error) throw error;
      return (data ?? []) as { purchase_date: string; total_amount: number | null }[];
    },
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Computed metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!selectedId || saleTxs.length === 0) return null;

    const sales = saleTxs.filter(t => t.transaction_type === 'sale');
    const payments = saleTxs.filter(t => t.transaction_type === 'payment');

    const totalRevenue = sales.reduce((s, t) => s + (t.amount ?? 0), 0);
    const totalPaid = payments.reduce((s, t) => s + (t.amount ?? 0), 0);
    const outstanding = totalRevenue - totalPaid;

    const saleDates = sales.map(t => t.transaction_date).sort();
    const firstOrderDate = saleDates[0] ?? null;
    const latestOrderDate = saleDates[saleDates.length - 1] ?? null;
    const totalOrdersCount = sales.length;

    const pmtDates = payments.map(t => t.transaction_date).sort();
    const firstPaymentDate = pmtDates[0] ?? null;
    const lastPaymentDate = pmtDates[pmtDates.length - 1] ?? null;
    const lastPaymentAmount = payments.length > 0
      ? (payments.filter(t => t.transaction_date === lastPaymentDate)[0]?.amount ?? null)
      : null;

    // Avg order frequency
    let avgOrderFreqDays: number | null = null;
    let expectedNextOrderDate: string | null = null;
    let daysOverdueOrder: number | null = null;
    if (totalOrdersCount > 1 && firstOrderDate && latestOrderDate) {
      const span = daysDiff(firstOrderDate) - daysDiff(latestOrderDate);
      avgOrderFreqDays = Math.round(span / (totalOrdersCount - 1));
      if (avgOrderFreqDays > 0) {
        expectedNextOrderDate = addDays(latestOrderDate, avgOrderFreqDays);
        const overdue = daysDiff(expectedNextOrderDate);
        daysOverdueOrder = Math.max(0, overdue);
      }
    }

    // Avg payment frequency
    let avgPaymentFreqDays: number | null = null;
    let expectedNextPaymentDate: string | null = null;
    let daysOverduePayment: number | null = null;
    if (payments.length > 1 && firstPaymentDate && lastPaymentDate) {
      const span = daysDiff(firstPaymentDate) - daysDiff(lastPaymentDate);
      avgPaymentFreqDays = Math.round(span / (payments.length - 1));
      if (avgPaymentFreqDays > 0) {
        expectedNextPaymentDate = addDays(lastPaymentDate, avgPaymentFreqDays);
        const overdue = daysDiff(expectedNextPaymentDate);
        daysOverduePayment = Math.max(0, overdue);
      }
    }

    // Credit limit = avg of last 90 days sales / 3
    const cutoff90 = new Date(); cutoff90.setDate(cutoff90.getDate() - 90);
    const cutoff90Str = cutoff90.toISOString().split('T')[0];
    const recent90Sales = sales.filter(t => t.transaction_date >= cutoff90Str);
    const creditLimit = recent90Sales.length > 0
      ? recent90Sales.reduce((s, t) => s + (t.amount ?? 0), 0) / 3
      : totalRevenue / Math.max(1, 3);
    const creditUtilization = creditLimit > 0 ? Math.min(999, (outstanding / creditLimit) * 100) : 0;

    const paymentToRevenueRatio = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    // Order status
    let orderStatus = 'NEW';
    if (totalOrdersCount > 1 && avgOrderFreqDays && daysOverdueOrder !== null) {
      if (daysOverdueOrder <= avgOrderFreqDays * 0.5) orderStatus = 'ACTIVE';
      else if (daysOverdueOrder <= avgOrderFreqDays) orderStatus = 'AT RISK';
      else orderStatus = 'INACTIVE';
    } else if (totalOrdersCount > 1) {
      orderStatus = 'ACTIVE';
    }

    // Payment status
    let paymentStatus = 'N/A';
    if (payments.length === 0) {
      paymentStatus = 'No Payments';
    } else if (payments.length === 1) {
      paymentStatus = 'Only 1 Payment';
    } else if (daysOverduePayment !== null) {
      if (daysOverduePayment > 14) paymentStatus = 'OVERDUE';
      else if (daysOverduePayment > 0) paymentStatus = 'DUE SOON';
      else if (expectedNextPaymentDate) {
        const daysToExp = -daysDiff(expectedNextPaymentDate); // negative = days until
        paymentStatus = daysToExp <= 5 ? 'DUE SOON' : 'ON TRACK';
      } else {
        paymentStatus = 'ON TRACK';
      }
    }

    return {
      totalRevenue, totalPaid, outstanding,
      firstOrderDate, latestOrderDate, totalOrdersCount,
      firstPaymentDate, lastPaymentDate, lastPaymentAmount,
      avgOrderFreqDays, expectedNextOrderDate, daysOverdueOrder,
      avgPaymentFreqDays, expectedNextPaymentDate, daysOverduePayment,
      creditLimit, creditUtilization, paymentToRevenueRatio,
      orderStatus, paymentStatus,
      paymentCount: payments.length,
    };
  }, [selectedId, saleTxs]);

  // ── Monthly chart data ──────────────────────────────────────────────────────
  const chartData = useMemo((): MonthBucket[] => {
    if (!saleTxs.length) return [];

    const bucketMap = new Map<string, MonthBucket>();

    const getOrCreate = (ym: string): MonthBucket => {
      if (!bucketMap.has(ym)) {
        const [y, m] = ym.split('-');
        const label = new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        bucketMap.set(ym, { label, ym, cases: 0, revenue: 0, collections: 0, factoryCost: 0, labelCost: 0, transportCost: 0 });
      }
      return bucketMap.get(ym)!;
    };

    for (const tx of saleTxs) {
      const ym = tx.transaction_date.slice(0, 7);
      const b = getOrCreate(ym);
      if (tx.transaction_type === 'sale') {
        b.cases += tx.quantity ?? 0;
        b.revenue += tx.amount ?? 0;
      } else if (tx.transaction_type === 'payment') {
        b.collections += tx.amount ?? 0;
      }
    }

    for (const fp of factoryPayables) {
      const ym = fp.transaction_date.slice(0, 7);
      if (bucketMap.has(ym)) {
        getOrCreate(ym).factoryCost += fp.amount ?? 0;
      }
    }

    for (const te of transportExpenses) {
      const ym = te.expense_date.slice(0, 7);
      if (bucketMap.has(ym)) {
        getOrCreate(ym).transportCost += te.amount ?? 0;
      }
    }

    for (const lp of labelPurchases) {
      const ym = lp.purchase_date.slice(0, 7);
      if (bucketMap.has(ym)) {
        getOrCreate(ym).labelCost += lp.total_amount ?? 0;
      }
    }

    return [...bucketMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, b]) => ({
        ...b,
        profit: b.revenue - b.factoryCost - b.labelCost - b.transportCost,
      }));
  }, [saleTxs, factoryPayables, transportExpenses, labelPurchases]);

  // ── Status badge helpers ────────────────────────────────────────────────────
  const orderStatusColor = (s: string) => {
    if (s === 'ACTIVE') return 'bg-emerald-100 text-emerald-800';
    if (s === 'AT RISK') return 'bg-amber-100 text-amber-800';
    if (s === 'INACTIVE') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800'; // NEW
  };

  const paymentStatusColor = (s: string) => {
    if (s === 'OVERDUE') return 'bg-red-100 text-red-800';
    if (s === 'DUE SOON') return 'bg-amber-100 text-amber-800';
    if (s === 'ON TRACK') return 'bg-emerald-100 text-emerald-800';
    return 'bg-gray-100 text-gray-600';
  };

  const followupDateStr = followup?.next_followup_date ?? '';
  const latestNoteText = recentNotes[0]?.note ?? '';

  return (
    <Card className="border border-gray-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold">Client Overview</CardTitle>
          {customersError && (
            <p className="text-xs text-red-500 max-w-sm break-all">
              Error: {(customersError as {message?: string}).message ?? JSON.stringify(customersError)}
            </p>
          )}
          <Select value={selectedId || '__none__'} onValueChange={v => setSelectedId(v === '__none__' ? '' : v)}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Select a client —</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.client_name}{c.branch ? ` · ${c.branch}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {!selectedCustomer ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
            Select a client above to view their profile
          </div>
        ) : txLoading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">Loading client data…</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Dealer info header */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-base">{selectedCustomer.client_name}</span>
              </div>
              {selectedCustomer.branch && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedCustomer.branch}
                </div>
              )}
              {(selectedCustomer.phone || selectedCustomer.whatsapp_number) && (
                <span className="text-sm text-muted-foreground">
                  {selectedCustomer.phone || selectedCustomer.whatsapp_number}
                </span>
              )}
              {selectedCustomer.contact_person && (
                <span className="text-sm text-muted-foreground">Contact: {selectedCustomer.contact_person}</span>
              )}
            </div>

            {metrics ? (
              <>
                {/* Row 1: Order timing */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile label="First Order" value={fmtDate(metrics.firstOrderDate)} variant="violet" />
                  <Tile label="Latest Order" value={fmtDate(metrics.latestOrderDate)} variant="emerald" />
                  <Tile label="Total Orders" value={String(metrics.totalOrdersCount)} variant="sky" />
                  <Tile
                    label="Avg Order Freq"
                    value={metrics.avgOrderFreqDays ? `Every ${metrics.avgOrderFreqDays}d` : 'N/A'}
                    variant="amber"
                  />
                </div>

                {/* Row 2: Financials */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile label="Lifetime Revenue" value={fmtMoney(metrics.totalRevenue)} variant="emerald" />
                  <Tile
                    label="Outstanding"
                    value={fmtMoney(metrics.outstanding)}
                    sub={metrics.outstanding < 0 ? 'Overpaid' : undefined}
                    variant="rose"
                  />
                  <Tile label="Credit Limit (est.)" value={fmtMoney(metrics.creditLimit)} sub="Avg monthly last 90d" variant="violet" />
                  <CreditUtilizationTile utilization={metrics.creditUtilization} />
                </div>

                {/* Row 3: Payment info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile
                    label="Last Payment"
                    value={metrics.lastPaymentAmount != null ? fmtMoney(metrics.lastPaymentAmount) : 'N/A'}
                    sub={fmtDate(metrics.lastPaymentDate)}
                    variant="emerald"
                  />
                  <Tile
                    label="Avg Pmt Freq"
                    value={metrics.avgPaymentFreqDays ? `Every ${metrics.avgPaymentFreqDays}d` : 'N/A'}
                    variant="sky"
                  />
                  <Tile
                    label="Pmt / Revenue"
                    value={`${metrics.paymentToRevenueRatio.toFixed(0)}%`}
                    sub={`${fmtMoney(metrics.totalPaid)} collected`}
                    variant="violet"
                  />
                  <Tile
                    label="Expected Next Pmt"
                    value={fmtDate(metrics.expectedNextPaymentDate)}
                    variant="amber"
                  />
                </div>

                {/* Row 4: Status badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${orderStatusColor(metrics.orderStatus)}`}>
                    Order: {metrics.orderStatus}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${paymentStatusColor(metrics.paymentStatus)}`}>
                    Payment: {metrics.paymentStatus}
                  </span>
                  {(metrics.daysOverdueOrder ?? 0) > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      Order {metrics.daysOverdueOrder}d overdue
                    </span>
                  )}
                  {(metrics.daysOverduePayment ?? 0) > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      Payment {metrics.daysOverduePayment}d overdue
                    </span>
                  )}
                  {metrics.expectedNextOrderDate && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Next order est. {fmtDate(metrics.expectedNextOrderDate)}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No transaction data found for this client.</p>
            )}

            {/* Bar chart */}
            {chartData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Monthly Performance</p>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="cases" orientation="left" tick={{ fontSize: 10 }} width={32} />
                    <YAxis yAxisId="money" orientation="right" tick={{ fontSize: 10 }} width={52}
                      tickFormatter={v => fmtMoney(v)} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Cases') return [value, 'Cases'];
                        return [fmtMoney(value), name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="cases" dataKey="cases" name="Cases" fill="#7c3aed" opacity={0.85} radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#059669" opacity={0.85} radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="money" dataKey="collections" name="Collections" fill="#0284c7" opacity={0.85} radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="money" dataKey="profit" name="Profit" fill="#d97706" opacity={0.85} radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bottom action row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Latest notes */}
              <div className="rounded-xl border border-gray-100 bg-violet-50/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 mb-1">Latest Note</p>
                {latestNoteText ? (
                  <>
                    <p className="text-sm line-clamp-2 text-foreground">{latestNoteText}</p>
                    {recentNotes.length > 1 && (
                      <p className="text-[10px] text-muted-foreground mt-1">and {recentNotes.length - 1} more note{recentNotes.length > 2 ? 's' : ''}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes yet</p>
                )}
              </div>

              {/* Follow-up */}
              <div className="rounded-xl border border-gray-100 bg-sky-50/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 mb-1">Next Follow-up</p>
                {followupDateStr ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{fmtDate(followupDateStr)}</span>
                    {(() => {
                      const d = new Date(followupDateStr); d.setHours(0, 0, 0, 0);
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
                      if (diff < 0) return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
                      if (diff === 0) return <Badge className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100">Today</Badge>;
                      return <Badge className="text-[10px] bg-sky-100 text-sky-800 hover:bg-sky-100">{diff}d away</Badge>;
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Not set</p>
                )}
                {followup?.comments && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{followup.comments}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 justify-center">
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50 gap-2"
                  onClick={() => setLedgerOpen(true)}
                >
                  <Receipt className="h-4 w-4" />
                  View Ledger
                </Button>
                <Button
                  variant="outline"
                  className="text-violet-600 border-violet-200 bg-violet-50/50 hover:bg-violet-50 gap-2"
                  onClick={() => setNotesOpen(true)}
                >
                  <StickyNote className="h-4 w-4" />
                  Log Note
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Drawers */}
      {selectedCustomer && (
        <>
          <LedgerDrawer
            open={ledgerOpen}
            onClose={() => setLedgerOpen(false)}
            customerId={selectedCustomer.id}
            dealerName={selectedCustomer.client_name}
            branch={selectedCustomer.branch ?? ''}
            outstanding={metrics?.outstanding ?? 0}
          />
          <FollowupNotesDrawer
            open={notesOpen}
            onClose={() => setNotesOpen(false)}
            customerId={selectedCustomer.id}
            dealerName={selectedCustomer.client_name}
            branch={selectedCustomer.branch ?? ''}
            outstanding={metrics?.outstanding ?? 0}
            currentFollowupDate={followupDateStr}
          />
        </>
      )}
    </Card>
  );
}
