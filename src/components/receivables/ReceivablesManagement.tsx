import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Search, TrendingUp, CreditCard, Users, AlertTriangle,
  ChevronDown, MapPin, X, IndianRupee, Package, Calendar,
  Phone, MessageCircle, FileText, Receipt,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { exportLedger } from '@/lib/ledgerExport';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthlyData {
  month: string;
  revenue: number;
  factory_cost: number;
  profit: number;
  cases: number;
}

interface CustomerRow {
  customer_id: string;
  name: string;
  area: string | null;
  sku: string | null;
  price_per_case: number | null;
  phone: string | null;
  whatsapp_number: string | null;
  outstanding_balance: number;
  pending_bills: number;
  last_order_date: string | null;
  last_payment_date: string | null;
  orders_after_last_payment: number;
  total_revenue: number;
  total_profit: number;
  total_cases: number;
  avg_credit_per_month: number;
  monthly: MonthlyData[];
}

interface LedgerRow {
  date: string;
  particulars: string;
  sku: string | null;
  cases: number | null;
  debit: number | null;
  credit: number | null;
  balance: number;
}

type SortKey = 'balance' | 'name' | 'profit' | 'orders' | 'bills';
type RiskLevel = 'high' | 'medium' | 'low';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n).toLocaleString();
}

function fmtFull(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fmtDate(d: string | null): string {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(d: string | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function toYYYYMM(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getRisk(c: CustomerRow): RiskLevel {
  if (c.orders_after_last_payment >= 5 || c.outstanding_balance > 100000) return 'high';
  if (c.orders_after_last_payment >= 2 || c.outstanding_balance > 30000) return 'medium';
  return 'low';
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchReceivablesData(): Promise<CustomerRow[]> {
  const [txRes, fpRes, custRes, invRes] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, quantity, transaction_date, customers(id, dealer_name, area)')
      .order('transaction_date', { ascending: true }),
    supabase
      .from('factory_payables')
      .select('customer_id, amount, transaction_date')
      .order('transaction_date', { ascending: true }),
    supabase
      .from('customers')
      .select('id, sku, price_per_case, phone, whatsapp_number'),
    supabase
      .from('invoices')
      .select('customer_id, status')
      .not('status', 'in', '(paid,cancelled)'),
  ]);

  if (txRes.error) throw txRes.error;
  if (fpRes.error) throw fpRes.error;

  const txRows = txRes.data ?? [];
  const fpRows = fpRes.data ?? [];

  // customer profile map
  const custMap: Record<string, { sku: string | null; price_per_case: number | null; phone: string | null; whatsapp_number: string | null }> = {};
  for (const c of custRes.data ?? []) {
    custMap[c.id] = { sku: c.sku, price_per_case: c.price_per_case, phone: c.phone, whatsapp_number: c.whatsapp_number };
  }

  // pending bills count per customer
  const pendingBillsMap: Record<string, number> = {};
  for (const inv of invRes.data ?? []) {
    if (!inv.customer_id) continue;
    pendingBillsMap[inv.customer_id] = (pendingBillsMap[inv.customer_id] ?? 0) + 1;
  }

  const factoryCostMap: Record<string, Record<string, number>> = {};
  for (const fp of fpRows) {
    if (!fp.customer_id) continue;
    const ym = toYYYYMM(fp.transaction_date);
    if (!factoryCostMap[fp.customer_id]) factoryCostMap[fp.customer_id] = {};
    factoryCostMap[fp.customer_id][ym] = (factoryCostMap[fp.customer_id][ym] ?? 0) + (fp.amount ?? 0);
  }

  type CustomerAcc = {
    customer_id: string;
    name: string;
    area: string | null;
    sales: Array<{ amount: number; cases: number; date: string; ym: string }>;
    payments: Array<{ amount: number; date: string }>;
  };
  const map: Record<string, CustomerAcc> = {};

  for (const tx of txRows) {
    const cid = tx.customer_id;
    if (!cid) continue;
    const cust = tx.customers as { id: string; dealer_name: string; area: string } | null;
    const name = cust?.dealer_name ?? cid;
    const area = cust?.area ?? null;
    if (!map[cid]) map[cid] = { customer_id: cid, name, area, sales: [], payments: [] };
    if (tx.transaction_type === 'sale') {
      map[cid].sales.push({ amount: tx.amount ?? 0, cases: tx.quantity ?? 0, date: tx.transaction_date, ym: toYYYYMM(tx.transaction_date) });
    } else if (tx.transaction_type === 'payment') {
      map[cid].payments.push({ amount: tx.amount ?? 0, date: tx.transaction_date });
    }
  }

  const result: CustomerRow[] = [];

  for (const acc of Object.values(map)) {
    const totalRevenue = acc.sales.reduce((s, r) => s + r.amount, 0);
    const totalPaid = acc.payments.reduce((s, r) => s + r.amount, 0);
    const outstanding = totalRevenue - totalPaid;
    const totalCases = acc.sales.reduce((s, r) => s + r.cases, 0);

    const sortedSales = [...acc.sales].sort((a, b) => a.date.localeCompare(b.date));
    const sortedPayments = [...acc.payments].sort((a, b) => a.date.localeCompare(b.date));

    const lastOrderDate = sortedSales.length ? sortedSales[sortedSales.length - 1].date : null;
    const lastPaymentDate = sortedPayments.length ? sortedPayments[sortedPayments.length - 1].date : null;

    const ordersAfterLastPayment = lastPaymentDate
      ? acc.sales.filter(s => s.date > lastPaymentDate).length
      : acc.sales.length;

    const monthlyMap: Record<string, { revenue: number; cases: number }> = {};
    for (const s of acc.sales) {
      if (!monthlyMap[s.ym]) monthlyMap[s.ym] = { revenue: 0, cases: 0 };
      monthlyMap[s.ym].revenue += s.amount;
      monthlyMap[s.ym].cases += s.cases;
    }

    const fcMap = factoryCostMap[acc.customer_id] ?? {};
    const monthly: MonthlyData[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, { revenue, cases }]) => {
        const factory_cost = fcMap[ym] ?? 0;
        return { month: ym, revenue, factory_cost, profit: revenue - factory_cost, cases };
      });

    const totalFactoryCost = Object.values(fcMap).reduce((s, v) => s + v, 0);
    const totalProfit = totalRevenue - totalFactoryCost;
    const activeMonths = new Set(acc.sales.map(s => s.ym)).size || 1;
    const avgCreditPerMonth = outstanding / activeMonths;
    const profile = custMap[acc.customer_id] ?? { sku: null, price_per_case: null, phone: null, whatsapp_number: null };

    result.push({
      customer_id: acc.customer_id,
      name: acc.name,
      area: acc.area,
      sku: profile.sku,
      price_per_case: profile.price_per_case,
      phone: profile.phone,
      whatsapp_number: profile.whatsapp_number,
      outstanding_balance: outstanding,
      pending_bills: pendingBillsMap[acc.customer_id] ?? 0,
      last_order_date: lastOrderDate,
      last_payment_date: lastPaymentDate,
      orders_after_last_payment: ordersAfterLastPayment,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_cases: totalCases,
      avg_credit_per_month: avgCreditPerMonth,
      monthly,
    });
  }

  return result;
}

async function fetchLedgerRows(customerId: string): Promise<LedgerRow[]> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('transaction_date, transaction_type, sku, quantity, amount, description')
    .eq('customer_id', customerId)
    .order('transaction_date', { ascending: true });
  if (error) throw error;

  let balance = 0;
  return (data ?? []).map(tx => {
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
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: CustomerRow[] }) {
  const totalOutstanding = data.reduce((s, c) => s + c.outstanding_balance, 0);
  const totalProfit = data.reduce((s, c) => s + c.total_profit, 0);
  const highRisk = data.filter(c => getRisk(c) === 'high').length;
  const totalRevenue = data.reduce((s, c) => s + c.total_revenue, 0);
  const totalPendingBills = data.reduce((s, c) => s + c.pending_bills, 0);

  const now = new Date();
  const thisMonthYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const saleThisMonth = data.reduce((s, c) => s + (c.monthly.find(m => m.month === thisMonthYM)?.revenue ?? 0), 0);
  const salePrevMonth = data.reduce((s, c) => s + (c.monthly.find(m => m.month === prevMonthYM)?.revenue ?? 0), 0);

  const stats = [
    {
      label: 'Active Customers',
      value: data.length.toString(),
      sub: `${data.filter(c => c.last_order_date).length} with orders`,
      icon: Users,
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
      valueColor: 'text-foreground',
    },
    {
      label: 'Total Receivable',
      value: fmt(totalOutstanding),
      sub: `${fmt(totalRevenue)} total revenue`,
      icon: CreditCard,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Bills Pending',
      value: totalPendingBills.toString(),
      sub: 'unpaid invoices',
      icon: Receipt,
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: totalPendingBills > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
    },
    {
      label: 'Cumulative Profit',
      value: fmt(totalProfit),
      sub: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '—',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'High-Risk Accounts',
      value: highRisk.toString(),
      sub: `${data.filter(c => getRisk(c) === 'medium').length} medium risk`,
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      valueColor: highRisk > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
    },
    {
      label: 'Sale This Month',
      value: fmt(saleThisMonth),
      sub: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      icon: TrendingUp,
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      valueColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      label: 'Sale Previous Month',
      value: fmt(salePrevMonth),
      sub: prevDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      icon: TrendingUp,
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      valueColor: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 gap-0 border-b bg-card">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-5 ${i < stats.length - 1 ? 'border-r border-border' : ''}`}
        >
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${s.iconBg}`}>
            <s.icon className={`h-5 w-5 ${s.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">{s.label}</p>
            <p className={`text-2xl font-bold leading-none ${s.valueColor}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function MiniBarChart({ monthly, valueKey, positiveColor, negativeColor }: {
  monthly: MonthlyData[];
  valueKey: 'profit' | 'cases';
  positiveColor: string;
  negativeColor: string;
}) {
  const vals = monthly.map(m => m[valueKey]);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);

  return (
    <div className="flex items-end gap-1 h-16">
      {monthly.map((m, i) => {
        const v = m[valueKey];
        const h = Math.max(3, (Math.abs(v) / maxAbs) * 52);
        const bg = v < 0 ? negativeColor : positiveColor;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0" title={`${formatMonthLabel(m.month)}: ${valueKey === 'profit' ? fmt(v) : Math.round(v) + ' cases'}`}>
            <div className="w-full rounded-t-[3px]" style={{ height: `${h}px`, background: bg }} />
            <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center select-none">
              {formatMonthLabel(m.month).split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Risk badge ─────────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === 'high') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      High Risk
    </span>
  );
  if (risk === 'medium') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Medium
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Low Risk
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
];

function getAvatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Metric cell ───────────────────────────────────────────────────────────────

function MetricCell({ label, value, sub, valueClass }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1 leading-none">{sub}</p>}
    </div>
  );
}

// ── Ledger Drawer ─────────────────────────────────────────────────────────────

function LedgerDrawer({ c, open, onClose }: { c: CustomerRow; open: boolean; onClose: () => void }) {
  const [exporting, setExporting] = useState(false);

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['customer-ledger', c.customer_id],
    queryFn: () => fetchLedgerRows(c.customer_id),
    enabled: open,
    staleTime: 30000,
  });

  const handleExport = async () => {
    if (!ledger?.length) return;
    setExporting(true);
    try {
      const rows = ledger.map(r => ({
        date: r.date,
        clientName: c.name,
        branch: c.area || '',
        type: r.debit != null ? 'sale' : 'payment',
        sku: r.sku,
        cases: r.cases,
        amount: r.debit ?? r.credit ?? 0,
        description: r.particulars,
      }));
      const safeName = c.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      await exportLedger(rows, `Ledger_${safeName}_${dateStr}.xlsx`, `Client Ledger — ${c.name}${c.area ? ` (${c.area})` : ''}`);
    } finally {
      setExporting(false);
    }
  };

  const lastRow = ledger?.[ledger.length - 1];
  const closingBalance = lastRow?.balance ?? 0;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-card flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${getAvatarColor(c.customer_id)} flex items-center justify-center text-white text-sm font-bold`}>
                {initials(c.name)}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold leading-tight truncate">{c.name}</SheetTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {c.area && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />{c.area}
                    </span>
                  )}
                  {c.sku && (
                    <span className="text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      {c.sku}
                    </span>
                  )}
                  {c.price_per_case != null && (
                    <span className="text-[10px] text-muted-foreground">₹{c.price_per_case.toLocaleString('en-IN', { maximumFractionDigits: 4 })}/case</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {c.phone && (
                <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={c.phone}>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
              {c.whatsapp_number && (
                <a href={`https://wa.me/${c.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={c.whatsapp_number}>
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                </a>
              )}
              <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting || !ledger?.length} className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                {exporting ? 'Exporting…' : 'Export Ledger'}
              </Button>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Outstanding</span>
              <span className={`text-sm font-bold ${closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                {fmtFull(Math.abs(closingBalance))}{closingBalance < 0 ? ' (overpaid)' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bills Pending</span>
              <span className={`text-sm font-bold ${c.pending_bills > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {c.pending_bills}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Last Payment</span>
              <span className="text-sm font-semibold text-foreground">{fmtDate(c.last_payment_date)}</span>
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
          ) : !ledger?.length ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
              <p className="text-sm text-muted-foreground">No transactions found</p>
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
                {ledger.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border/40 ${
                      row.debit != null
                        ? 'bg-red-50/40 dark:bg-red-900/10'
                        : 'bg-emerald-50/40 dark:bg-emerald-900/10'
                    }`}
                  >
                    <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{fmtDate(row.date)}</td>
                    <td className="py-2 px-4 text-foreground leading-snug max-w-[180px]">
                      <span className="line-clamp-2">{row.particulars}</span>
                      {row.sku && <span className="block text-[10px] text-muted-foreground mt-0.5">{row.sku}{row.cases ? ` · ${row.cases} cases` : ''}</span>}
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
                ))}
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

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({ c, isExpanded, onToggle, onViewLedger }: {
  c: CustomerRow;
  isExpanded: boolean;
  onToggle: () => void;
  onViewLedger: (e: React.MouseEvent) => void;
}) {
  const risk = getRisk(c);
  const activeMonths = c.monthly.filter(m => m.revenue > 0).length;
  const daysSincePayment = daysSince(c.last_payment_date);

  const borderColor =
    risk === 'high' ? 'border-l-red-500' :
    risk === 'medium' ? 'border-l-amber-400' :
    'border-l-emerald-500';

  const balanceColor =
    risk === 'high' ? 'text-red-600 dark:text-red-400' :
    risk === 'medium' ? 'text-amber-600 dark:text-amber-400' :
    'text-emerald-600 dark:text-emerald-400';

  const avatarBg = getAvatarColor(c.customer_id);

  const daysSincePaymentLabel = daysSincePayment === null
    ? 'Never paid'
    : daysSincePayment === 0
    ? 'Today'
    : `${daysSincePayment}d ago`;

  const daysSinceColor = daysSincePayment === null || daysSincePayment > 60
    ? 'text-red-500'
    : daysSincePayment > 30
    ? 'text-amber-600'
    : 'text-emerald-600';

  return (
    <div
      className={`rounded-xl border-l-4 border border-border bg-card transition-all duration-200
        hover:shadow-md hover:border-border hover:-translate-y-0.5
        ${borderColor}
        ${isExpanded ? 'shadow-md ring-1 ring-blue-400/30 dark:ring-blue-500/30' : ''}
      `}
    >
      {/* ── Card header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
            {initials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug truncate text-foreground">{c.name}</h3>
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              {c.area && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  <MapPin className="h-2.5 w-2.5" />{c.area}
                </span>
              )}
              {c.sku && (
                <span className="text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                  {c.sku}
                </span>
              )}
              <RiskBadge risk={risk} />
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          <p className={`text-xl font-bold leading-none ${balanceColor}`}>{fmt(c.outstanding_balance)}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <p className="text-[10px] text-muted-foreground">outstanding</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* ── Profile strip ── */}
      {(c.price_per_case != null || c.phone || c.whatsapp_number) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2">
          {c.price_per_case != null && (
            <span className="text-[10px] text-muted-foreground">
              ₹{c.price_per_case.toLocaleString('en-IN', { maximumFractionDigits: 4 })}/case
            </span>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-2.5 w-2.5" />{c.phone}
            </a>
          )}
          {c.whatsapp_number && (
            <a
              href={`https://wa.me/${c.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="h-2.5 w-2.5" />{c.whatsapp_number}
            </a>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-border/60" />

      {/* ── Metrics grid ── */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <MetricCell
          label="Last Payment"
          value={daysSincePaymentLabel}
          sub={c.last_payment_date ? fmtDate(c.last_payment_date) : undefined}
          valueClass={daysSinceColor}
        />
        <MetricCell
          label="Bills Pending"
          value={c.pending_bills.toString()}
          sub={c.pending_bills > 0 ? 'unpaid invoices' : 'all settled'}
          valueClass={
            c.pending_bills >= 5 ? 'text-red-500' :
            c.pending_bills >= 2 ? 'text-amber-600' :
            'text-emerald-600'
          }
        />
        <MetricCell
          label="Avg Credit/Mo"
          value={fmt(Math.max(0, c.avg_credit_per_month))}
          valueClass="text-blue-600 dark:text-blue-400"
        />
        <MetricCell
          label="Total Profit"
          value={fmt(c.total_profit)}
          valueClass={c.total_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
        />
        <MetricCell
          label="Total Cases"
          value={Math.round(c.total_cases).toLocaleString()}
        />
        <MetricCell
          label="Active Months"
          value={activeMonths.toString()}
          sub={`since ${c.monthly[0] ? formatMonthLabel(c.monthly[0].month) : '—'}`}
        />
      </div>

      {/* ── View Ledger button ── */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onViewLedger}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg py-1.5 transition-colors border border-blue-200 dark:border-blue-800"
        >
          <Receipt className="h-3.5 w-3.5" />
          View Ledger &amp; Transactions
        </button>
      </div>

      {/* ── Expanded section ── */}
      {isExpanded && c.monthly.length > 0 && (
        <div className="border-t border-border/60 px-4 pt-3 pb-4 space-y-4" onClick={e => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Profit / Month</p>
              <MiniBarChart monthly={c.monthly} valueKey="profit" positiveColor="#34d399" negativeColor="#f87171" />
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Cases / Month</p>
              <MiniBarChart monthly={c.monthly} valueKey="cases" positiveColor="#818cf8" negativeColor="#f87171" />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Month</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Revenue</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Factory</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Profit</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Cases</th>
                </tr>
              </thead>
              <tbody>
                {c.monthly.map((m, i) => (
                  <tr key={i} className={`border-t border-border/40 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="py-2 px-3 font-medium text-foreground">{formatMonthLabel(m.month)}</td>
                    <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400 font-medium">{fmt(m.revenue)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{fmt(m.factory_cost)}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${m.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{fmt(m.profit)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{Math.round(m.cases)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td className="py-2 px-3 font-bold text-foreground">Total</td>
                  <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">{fmt(c.total_revenue)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground font-semibold">{fmt(c.monthly.reduce((s, m) => s + m.factory_cost, 0))}</td>
                  <td className={`py-2 px-3 text-right font-bold ${c.total_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{fmt(c.total_profit)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground font-semibold">{Math.round(c.total_cases)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sort tab ──────────────────────────────────────────────────────────────────

function SortTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
        active
          ? 'bg-foreground text-background shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const ReceivablesManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<CustomerRow | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['receivables-management'],
    queryFn: fetchReceivablesData,
    staleTime: 60000,
  });

  const sorted = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    const filtered = q
      ? data.filter(c => c.name.toLowerCase().includes(q) || (c.area ?? '').toLowerCase().includes(q))
      : data;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'balance') return b.outstanding_balance - a.outstanding_balance;
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'profit') return b.total_profit - a.total_profit;
      if (sortKey === 'orders') return b.orders_after_last_payment - a.orders_after_last_payment;
      if (sortKey === 'bills') return b.pending_bills - a.pending_bills;
      return 0;
    });
  }, [data, search, sortKey]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">Loading receivables…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Failed to load data</p>
          <p className="text-sm text-muted-foreground mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  const highCount = sorted.filter(c => getRisk(c) === 'high').length;
  const medCount = sorted.filter(c => getRisk(c) === 'medium').length;

  return (
    <div className="min-h-full flex flex-col">
      <SummaryStrip data={sorted} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center px-5 py-3 border-b bg-card sticky top-0 z-10">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or area…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-muted-foreground"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          <SortTab active={sortKey === 'balance'} onClick={() => setSortKey('balance')}>
            <IndianRupee className="inline h-3 w-3 mr-1" />Balance
          </SortTab>
          <SortTab active={sortKey === 'bills'} onClick={() => setSortKey('bills')}>
            <Receipt className="inline h-3 w-3 mr-1" />Bills
          </SortTab>
          <SortTab active={sortKey === 'orders'} onClick={() => setSortKey('orders')}>
            <Package className="inline h-3 w-3 mr-1" />Pending
          </SortTab>
          <SortTab active={sortKey === 'profit'} onClick={() => setSortKey('profit')}>
            <TrendingUp className="inline h-3 w-3 mr-1" />Profit
          </SortTab>
          <SortTab active={sortKey === 'name'} onClick={() => setSortKey('name')}>
            <Calendar className="inline h-3 w-3 mr-1" />A–Z
          </SortTab>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {highCount} high risk
            </span>
          )}
          {medCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {medCount} medium
            </span>
          )}
          <span className="text-xs text-muted-foreground">{sorted.length} customers</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
            </div>
          </div>
        ) : (
          sorted.map(c => (
            <CustomerCard
              key={c.customer_id}
              c={c}
              isExpanded={expandedId === c.customer_id}
              onToggle={() => setExpandedId(expandedId === c.customer_id ? null : c.customer_id)}
              onViewLedger={e => { e.stopPropagation(); setLedgerCustomer(c); }}
            />
          ))
        )}
      </div>

      {/* Ledger drawer */}
      {ledgerCustomer && (
        <LedgerDrawer
          c={ledgerCustomer}
          open={!!ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
        />
      )}
    </div>
  );
};

export default ReceivablesManagement;
