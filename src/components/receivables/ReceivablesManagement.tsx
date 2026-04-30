import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, TrendingUp, CreditCard, Users, AlertTriangle, ChevronDown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthlyData {
  month: string;        // 'YYYY-MM'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n).toLocaleString();
}

function fmtDate(d: string | null): string {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toYYYYMM(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
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

  // Index factory payables per customer per month
  const factoryCostMap: Record<string, Record<string, number>> = {};
  for (const fp of fpRows) {
    if (!fp.customer_id) continue;
    const ym = toYYYYMM(fp.transaction_date);
    if (!factoryCostMap[fp.customer_id]) factoryCostMap[fp.customer_id] = {};
    factoryCostMap[fp.customer_id][ym] = (factoryCostMap[fp.customer_id][ym] ?? 0) + (fp.amount ?? 0);
  }

  // Group transactions by customer
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
      map[cid].sales.push({
        amount: tx.amount ?? 0,
        cases: tx.quantity ?? 0,
        date: tx.transaction_date,
        ym: toYYYYMM(tx.transaction_date),
      });
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

    // Monthly aggregation
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

    // Avg credit per month: outstanding / number of active months
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
  const highRisk = data.filter(c => c.orders_after_last_payment >= 5).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-b bg-card">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Customers</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{data.length}</div>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Receivable</span>
        </div>
        <div className="text-2xl font-bold text-blue-600">{fmt(totalOutstanding)}</div>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Cumulative Profit</span>
        </div>
        <div className="text-2xl font-bold text-green-600">{fmt(totalProfit)}</div>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">High-Risk (5+ Unpaid)</span>
        </div>
        <div className="text-2xl font-bold text-red-500">{highRisk}</div>
      </div>
    </div>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function MiniBarChart({ monthly, valueKey, color }: {
  monthly: MonthlyData[];
  valueKey: 'profit' | 'cases';
  color: string;
}) {
  const vals = monthly.map(m => m[valueKey]);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);

  return (
    <div className="flex items-end gap-0.5 h-14">
      {monthly.map((m, i) => {
        const v = m[valueKey];
        const h = Math.max(2, (Math.abs(v) / maxAbs) * 48);
        const bg = v < 0 ? '#f87171' : color;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <div
              style={{ height: `${h}px`, background: bg }}
              className="w-full rounded-t"
              title={`${formatMonthLabel(m.month)}: ${valueKey === 'profit' ? fmt(v) : Math.round(v) + ' cases'}`}
            />
            <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center">
              {formatMonthLabel(m.month).replace(' ', "'")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({ c, isExpanded, onToggle }: {
  c: CustomerRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const balanceColor =
    c.outstanding_balance > 50000 ? 'text-red-500 bg-red-50 dark:bg-red-950/30' :
    c.outstanding_balance > 10000 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' :
    'text-green-600 bg-green-50 dark:bg-green-950/30';

  const ordersColor =
    c.orders_after_last_payment >= 5 ? 'text-red-500' :
    c.orders_after_last_payment >= 2 ? 'text-yellow-600' :
    'text-green-600';

  const activeMonths = c.monthly.filter(m => m.revenue > 0).length;

  return (
    <div
      className={`rounded-xl border bg-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 ${isExpanded ? 'border-orange-400 dark:border-orange-600' : ''}`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {c.orders_after_last_payment >= 5 && (
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm leading-snug truncate">{c.name}</h3>
          </div>
          {c.area && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="inline-block bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium">{c.area}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Last order: <span className="text-foreground">{fmtDate(c.last_order_date)}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <Badge className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${balanceColor} border-0`}>
            {fmt(c.outstanding_balance)}
          </Badge>
          <div className="text-xs text-muted-foreground mt-1.5 flex items-center justify-end gap-0.5">
            balance
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-5 py-3">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Last Payment</p>
          <p className={`text-xs font-medium ${c.last_payment_date ? '' : 'text-red-500'}`}>
            {fmtDate(c.last_payment_date)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Avg Credit/Mo</p>
          <p className="text-xs font-medium text-blue-600">{fmt(Math.max(0, c.avg_credit_per_month))}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Orders After Pay</p>
          <p className={`text-xs font-medium ${ordersColor}`}>{c.orders_after_last_payment}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total Profit</p>
          <p className={`text-xs font-medium ${c.total_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(c.total_profit)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total Cases</p>
          <p className="text-xs font-medium">{Math.round(c.total_cases).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Active Months</p>
          <p className="text-xs font-medium">{activeMonths}</p>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && c.monthly.length > 0 && (
        <div className="px-5 pb-4 border-t pt-3 space-y-3" onClick={e => e.stopPropagation()}>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5">
              Profit by Month
            </p>
            <MiniBarChart monthly={c.monthly} valueKey="profit" color="#38bdf8" />
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5">
              Volume (Cases) by Month
            </p>
            <MiniBarChart monthly={c.monthly} valueKey="cases" color="#a78bfa" />
          </div>

          {/* Monthly table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Month</th>
                  <th className="text-right py-1.5 pr-3 text-muted-foreground font-medium">Revenue</th>
                  <th className="text-right py-1.5 pr-3 text-muted-foreground font-medium">Factory Cost</th>
                  <th className="text-right py-1.5 pr-3 text-muted-foreground font-medium">Profit</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Cases</th>
                </tr>
              </thead>
              <tbody>
                {c.monthly.map((m, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 text-muted-foreground">{formatMonthLabel(m.month)}</td>
                    <td className="py-1.5 pr-3 text-right text-blue-600">{fmt(m.revenue)}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">{fmt(m.factory_cost)}</td>
                    <td className={`py-1.5 pr-3 text-right ${m.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fmt(m.profit)}
                    </td>
                    <td className="py-1.5 text-right text-muted-foreground">{Math.round(m.cases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
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
    const filtered = q ? data.filter(c => c.name.toLowerCase().includes(q) || (c.area ?? '').toLowerCase().includes(q)) : data;
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load receivables data. Please refresh.
      </div>
    );
  }

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: 'balance', label: '↓ Balance' },
    { key: 'name', label: 'A→Z Name' },
    { key: 'profit', label: '↓ Profit' },
    { key: 'orders', label: 'Orders Pending' },
  ];

  return (
    <div className="space-y-0 min-h-full">
      {/* Summary strip */}
      <SummaryStrip data={sorted} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center px-4 py-3 border-b bg-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {sortButtons.map(({ key, label }) => (
            <Button
              key={key}
              variant={sortKey === key ? 'default' : 'outline'}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setSortKey(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{sorted.length} customers</span>
      </div>

      {/* Card grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No customers match your search
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
