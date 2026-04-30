import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Search, TrendingUp, CreditCard, Users, AlertTriangle,
  ChevronDown, MapPin, X, IndianRupee, Package, Calendar,
} from 'lucide-react';

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
  outstanding_balance: number;
  last_order_date: string | null;
  last_payment_date: string | null;
  orders_after_last_payment: number;
  total_revenue: number;
  total_profit: number;
  total_cases: number;
  avg_credit_per_month: number;
  monthly: MonthlyData[];
}

type SortKey = 'balance' | 'name' | 'profit' | 'orders';
type RiskLevel = 'high' | 'medium' | 'low';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n).toLocaleString();
}

function fmtDate(d: string | null): string {
  if (!d) return 'Never';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [txRes, fpRes] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, quantity, transaction_date, customers(id, dealer_name, area)')
      .order('transaction_date', { ascending: true }),
    supabase
      .from('factory_payables')
      .select('customer_id, amount, transaction_date')
      .order('transaction_date', { ascending: true }),
  ]);

  if (txRes.error) throw txRes.error;
  if (fpRes.error) throw fpRes.error;

  const txRows = txRes.data ?? [];
  const fpRows = fpRes.data ?? [];

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

    result.push({
      customer_id: acc.customer_id,
      name: acc.name,
      area: acc.area,
      outstanding_balance: outstanding,
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

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: CustomerRow[] }) {
  const totalOutstanding = data.reduce((s, c) => s + c.outstanding_balance, 0);
  const totalProfit = data.reduce((s, c) => s + c.total_profit, 0);
  const highRisk = data.filter(c => getRisk(c) === 'high').length;
  const totalRevenue = data.reduce((s, c) => s + c.total_revenue, 0);

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
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b bg-card">
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
            <div style={{ height: `${h}px`, background: bg, borderRadius: '3px 3px 0 0' }} className="w-full" />
            <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center select-none">
              {formatMonthLabel(m.month).split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────

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

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({ c, isExpanded, onToggle }: {
  c: CustomerRow;
  isExpanded: boolean;
  onToggle: () => void;
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
      className={`rounded-xl border-l-4 border border-border bg-card transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-border hover:-translate-y-0.5
        ${borderColor}
        ${isExpanded ? 'shadow-md ring-1 ring-blue-400/30 dark:ring-blue-500/30' : ''}
      `}
      onClick={onToggle}
    >
      {/* ── Card header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        {/* Left: avatar + name + area */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
            {initials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug truncate text-foreground">{c.name}</h3>
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              {c.area && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {c.area}
                </span>
              )}
              <RiskBadge risk={risk} />
            </div>
          </div>
        </div>

        {/* Right: balance */}
        <div className="text-right flex-shrink-0 ml-2">
          <p className={`text-xl font-bold leading-none ${balanceColor}`}>{fmt(c.outstanding_balance)}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <p className="text-[10px] text-muted-foreground">outstanding</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

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
          label="Avg Credit/Mo"
          value={fmt(Math.max(0, c.avg_credit_per_month))}
          valueClass="text-blue-600 dark:text-blue-400"
        />
        <MetricCell
          label="Unpaid Orders"
          value={c.orders_after_last_payment.toString()}
          sub={c.orders_after_last_payment >= 5 ? 'needs attention' : undefined}
          valueClass={
            c.orders_after_last_payment >= 5 ? 'text-red-500' :
            c.orders_after_last_payment >= 2 ? 'text-amber-600' :
            'text-emerald-600'
          }
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

      {/* ── Expanded section ── */}
      {isExpanded && c.monthly.length > 0 && (
        <div className="border-t border-border/60 px-4 pt-3 pb-4 space-y-4" onClick={e => e.stopPropagation()}>

          {/* Charts row */}
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

          {/* Monthly table */}
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
      {/* Summary */}
      <SummaryStrip data={sorted} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center px-5 py-3 border-b bg-card sticky top-0 z-10">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or area…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          <SortTab active={sortKey === 'balance'} onClick={() => setSortKey('balance')}>
            <IndianRupee className="inline h-3 w-3 mr-1" />Balance
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

        {/* Risk chips + count */}
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReceivablesManagement;
