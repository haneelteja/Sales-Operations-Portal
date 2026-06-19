import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

interface SaleTx {
  customer_id: string | null;
  transaction_date: string;
  amount: number;
  quantity: number;
  transaction_type: string;
}

interface ChartPoint {
  label: string;
  cases: number;
  revenue: number;
  profit: number;
  collections: number;
}

const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const CURRENT_YEAR = new Date().getFullYear().toString();

const getMonthKey = (d: string) => d.slice(0, 7);

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

const monthShort = (ym: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short' });
};

const fmtMoney = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Math.round(v)}`;
};

const LINE_COLORS = {
  cases: '#7c3aed',      // violet-700
  revenue: '#059669',    // emerald-600
  profit: '#d97706',     // amber-600
  collections: '#0284c7', // sky-600
};

const METRIC_META = [
  { key: 'cases',       label: 'Cases',       color: LINE_COLORS.cases,       pastel: '#ede9fe', text: '#5b21b6' },
  { key: 'revenue',     label: 'Revenue',     color: LINE_COLORS.revenue,     pastel: '#d1fae5', text: '#065f46' },
  { key: 'profit',      label: 'Profit',      color: LINE_COLORS.profit,      pastel: '#fef3c7', text: '#92400e' },
  { key: 'collections', label: 'Collections', color: LINE_COLORS.collections, pastel: '#e0f2fe', text: '#075985' },
] as const;

interface DotLabelProps { x?: number; y?: number; value?: number }
interface TooltipEntry { name: string; dataKey: string; value: number; color: string }

const makeDotLabel = (color: string, fmt: (v: number) => string, dy = -12) =>
  ({ x, y, value }: DotLabelProps) => {
    if (value == null) return null;
    const text = fmt(value);
    return (
      <g>
        {/* white halo so label reads over crossing lines */}
        <text x={x} y={y} dy={dy} textAnchor="middle" fontSize={10} fontWeight={700}
          stroke="white" strokeWidth={4} strokeLinejoin="round" fill="white">{text}</text>
        <text x={x} y={y} dy={dy} textAnchor="middle" fontSize={10} fontWeight={700}
          fill={color}>{text}</text>
      </g>
    );
  };

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-3.5 text-sm min-w-[190px]">
      <p className="font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-100 text-xs uppercase tracking-wide">{label}</p>
      {payload.map((entry: TooltipEntry) => {
        const meta = METRIC_META.find(m => m.key === entry.dataKey);
        return (
          <div key={entry.name} className="flex items-center justify-between gap-6 py-0.5">
            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: meta?.color ?? entry.color }} />
              {entry.name}
            </span>
            <span className={`font-bold tabular-nums text-xs ${entry.dataKey === 'profit' && entry.value < 0 ? 'text-red-500' : ''}`}
              style={{ color: entry.dataKey === 'profit' && entry.value < 0 ? undefined : meta?.color }}>
              {entry.dataKey === 'cases' ? entry.value.toLocaleString('en-IN') : fmtMoney(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex flex-wrap justify-center gap-5 pt-1">
    {METRIC_META.map(({ key, label, color }) => (
      <span key={key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
        <span className="h-3 w-3 rounded-full opacity-80" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

const TotalsRow = ({ totals }: { totals: { cases: number; revenue: number; profit: number; collections: number } }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {[
      { label: 'Total Cases', value: totals.cases.toLocaleString('en-IN'), meta: METRIC_META[0] },
      { label: 'Revenue',     value: fmtMoney(totals.revenue),             meta: METRIC_META[1] },
      { label: 'Profit',      value: fmtMoney(totals.profit),              meta: totals.profit >= 0 ? METRIC_META[2] : { ...METRIC_META[2], color: '#dc2626', pastel: '#fee2e2', text: '#991b1b' } },
      { label: 'Collections', value: fmtMoney(totals.collections),         meta: METRIC_META[3] },
    ].map(({ label, value, meta }) => (
      <div key={label} className="rounded-2xl px-4 py-3 border" style={{ background: meta.pastel, borderColor: `${meta.color}25` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: meta.text }}>{label}</p>
        </div>
        <p className="text-xl font-bold leading-none tabular-nums" style={{ color: meta.color }}>{value}</p>
      </div>
    ))}
  </div>
);

const BusinessAnalyticsChart: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>(CURRENT_YEAR);
  const [selectedOverallMonth, setSelectedOverallMonth] = useState<string>('all');
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['cases', 'revenue', 'profit', 'collections']));

  const { data: salesTxs = [] } = useQuery({
    queryKey: ['biz-analytics-sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales_transactions').select('customer_id, transaction_date, amount, quantity, transaction_type').in('transaction_type', ['sale', 'payment']);
      if (error) throw error;
      return (data ?? []) as SaleTx[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: factoryPayables = [] } = useQuery({
    queryKey: ['biz-analytics-factory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('factory_payables').select('transaction_date, amount').eq('transaction_type', 'production');
      if (error) throw error;
      return (data ?? []) as { transaction_date: string; amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: labelPurchases = [] } = useQuery({
    queryKey: ['biz-analytics-labels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('label_purchases').select('purchase_date, total_amount');
      if (error) throw error;
      return (data ?? []) as { purchase_date: string; total_amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: backLabelPurchases = [] } = useQuery({
    queryKey: ['biz-analytics-back-labels'],
    queryFn: async () => {
      type BackLabelClient = { from: (t: string) => { select: (c: string) => Promise<{ data: { purchase_date: string; total_amount: number }[] | null }> } };
      const { data } = await (supabase as unknown as BackLabelClient).from('back_label_purchases').select('purchase_date, total_amount');
      return (data ?? []) as { purchase_date: string; total_amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: transportExpenses = [] } = useQuery({
    queryKey: ['biz-analytics-transport'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transport_expenses').select('client_id, expense_date, amount');
      if (error) throw error;
      return (data ?? []) as { client_id: string | null; expense_date: string; amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['biz-analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('id, client_name').eq('is_active', true).eq('is_deprecated', false);
      if (error) throw error;
      return (data ?? []) as { id: string; client_name: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const custMap = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach(c => m.set(c.id, c.client_name));
    return m;
  }, [customers]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    salesTxs.forEach(tx => { if (tx.transaction_date) months.add(getMonthKey(tx.transaction_date)); });
    return [...months].sort().reverse();
  }, [salesTxs]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    availableMonths.forEach(m => years.add(m.slice(0, 4)));
    return [...years].sort().reverse();
  }, [availableMonths]);

  const computedData = useMemo(() => {
    if (!salesTxs.length) return { byMonthClient: new Map(), factoryByMonth: new Map(), labelsByMonth: new Map(), transportByMonthClient: new Map() };

    const factoryByMonth = new Map<string, number>();
    factoryPayables.forEach(fp => {
      const mk = getMonthKey(fp.transaction_date);
      factoryByMonth.set(mk, (factoryByMonth.get(mk) ?? 0) + (fp.amount ?? 0));
    });

    const labelsByMonth = new Map<string, number>();
    [...labelPurchases, ...backLabelPurchases].forEach(lp => {
      const mk = getMonthKey(lp.purchase_date);
      labelsByMonth.set(mk, (labelsByMonth.get(mk) ?? 0) + (lp.total_amount ?? 0));
    });

    const transportByMonthClient = new Map<string, Map<string, number>>();
    transportExpenses.forEach(te => {
      if (!te.client_id || !te.expense_date) return;
      const mk = getMonthKey(te.expense_date);
      if (!transportByMonthClient.has(mk)) transportByMonthClient.set(mk, new Map());
      transportByMonthClient.get(mk)!.set(te.client_id, (transportByMonthClient.get(mk)!.get(te.client_id) ?? 0) + (te.amount ?? 0));
    });

    type Entry = { cases: number; revenue: number; collections: number; clientId: string };
    const byMonthClient = new Map<string, Map<string, Entry>>();
    salesTxs.forEach(tx => {
      if (!tx.customer_id || !tx.transaction_date) return;
      const clientName = custMap.get(tx.customer_id);
      if (!clientName) return;
      const mk = getMonthKey(tx.transaction_date);
      if (!byMonthClient.has(mk)) byMonthClient.set(mk, new Map());
      const mMap = byMonthClient.get(mk)!;
      const existing = mMap.get(clientName) ?? { cases: 0, revenue: 0, collections: 0, clientId: tx.customer_id };
      if (tx.transaction_type === 'sale') { existing.cases += tx.quantity ?? 0; existing.revenue += tx.amount ?? 0; }
      else { existing.collections += tx.amount ?? 0; }
      existing.clientId = tx.customer_id;
      mMap.set(clientName, existing);
    });

    return { byMonthClient, factoryByMonth, labelsByMonth, transportByMonthClient };
  }, [salesTxs, factoryPayables, labelPurchases, backLabelPurchases, transportExpenses, custMap]);

  const chartData = useMemo((): ChartPoint[] => {
    const { byMonthClient, factoryByMonth, labelsByMonth, transportByMonthClient } = computedData;

    const getAggForMonth = (mk: string): ChartPoint => {
      const mMap = byMonthClient.get(mk) ?? new Map();
      const factoryCost = factoryByMonth.get(mk) ?? 0;
      const labelsCost = labelsByMonth.get(mk) ?? 0;
      const transportMap = transportByMonthClient.get(mk) ?? new Map();
      const totalCases = [...mMap.values()].reduce((s, v) => s + v.cases, 0);
      let cases = 0, revenue = 0, profit = 0, collections = 0;
      mMap.forEach(data => {
        const share = totalCases > 0 ? data.cases / totalCases : 0;
        cases += data.cases;
        revenue += data.revenue;
        collections += data.collections;
        profit += data.revenue - factoryCost * share - labelsCost * share - (transportMap.get(data.clientId) ?? 0);
      });
      return { label: monthShort(mk), cases, revenue, profit, collections };
    };

    let months = selectedYear === 'all'
      ? [...availableMonths].reverse()
      : [...availableMonths].filter(m => m.startsWith(selectedYear)).reverse();

    if (selectedOverallMonth !== 'all') months = months.filter(m => m === selectedOverallMonth);

    return months.map(getAggForMonth).filter(p => p.cases > 0 || p.revenue > 0);
  }, [computedData, availableMonths, selectedYear, selectedOverallMonth]);

  const totals = useMemo(() => ({
    cases: chartData.reduce((s, p) => s + p.cases, 0),
    revenue: chartData.reduce((s, p) => s + p.revenue, 0),
    profit: chartData.reduce((s, p) => s + p.profit, 0),
    collections: chartData.reduce((s, p) => s + p.collections, 0),
  }), [chartData]);

  const monthOptions = useMemo(() => {
    if (selectedYear === 'all') return availableMonths;
    return availableMonths.filter(m => m.startsWith(selectedYear));
  }, [availableMonths, selectedYear]);

  const subtitle = selectedOverallMonth !== 'all'
    ? `${monthLabel(selectedOverallMonth)} — overall`
    : selectedYear === 'all' ? 'All time monthly trend' : `${selectedYear} monthly trend`;

  const chartWidth = Math.max(560, chartData.length * 80);

  return (
    <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">Business Analytics</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {chartData.length > 0 && <TotalsRow totals={totals} />}

        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Metric toggles */}
          <div className="flex items-center gap-1">
            {METRIC_META.map(({ key, label, color }) => {
              const on = activeMetrics.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMetrics(prev => {
                    const next = new Set(prev);
                    if (next.has(key) && next.size > 1) next.delete(key);
                    else next.add(key);
                    return next;
                  })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    on ? 'text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                  style={on ? { background: color, borderColor: color } : {}}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? '#fff' : color }} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Year selector */}
          <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setSelectedOverallMonth('all'); }}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y === CURRENT_YEAR ? `${y} (This Year)` : y}</SelectItem>
              ))}
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Month selector */}
          <Select value={selectedOverallMonth} onValueChange={setSelectedOverallMonth}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map(m => (
                <SelectItem key={m} value={m}>{m === CURRENT_MONTH ? `${monthLabel(m)} (Current)` : monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-sm text-gray-400">
            No data for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <div style={{ minWidth: chartWidth }} className="px-2">
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chartData} margin={{ top: 28, right: 16, left: 4, bottom: 20 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis yAxisId="cases" orientation="left" tickFormatter={v => v.toLocaleString('en-IN')} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                  <YAxis yAxisId="money" orientation="right" tickFormatter={fmtMoney} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.has('cases') && <Line yAxisId="cases" type="monotone" dataKey="cases" name="Cases" stroke={LINE_COLORS.cases} strokeWidth={2.5} dot={{ r: 5, fill: LINE_COLORS.cases, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7, fill: LINE_COLORS.cases, stroke: 'white', strokeWidth: 2 }} label={makeDotLabel(LINE_COLORS.cases, v => v.toLocaleString('en-IN'), -12)} />}
                  {activeMetrics.has('revenue') && <Line yAxisId="money" type="monotone" dataKey="revenue" name="Revenue" stroke={LINE_COLORS.revenue} strokeWidth={2.5} dot={{ r: 5, fill: LINE_COLORS.revenue, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7, fill: LINE_COLORS.revenue, stroke: 'white', strokeWidth: 2 }} label={makeDotLabel(LINE_COLORS.revenue, fmtMoney, -12)} />}
                  {activeMetrics.has('profit') && <Line yAxisId="money" type="monotone" dataKey="profit" name="Profit" stroke={LINE_COLORS.profit} strokeWidth={2.5} dot={{ r: 5, fill: LINE_COLORS.profit, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7, fill: LINE_COLORS.profit, stroke: 'white', strokeWidth: 2 }} label={makeDotLabel(LINE_COLORS.profit, fmtMoney, 20)} />}
                  {activeMetrics.has('collections') && <Line yAxisId="money" type="monotone" dataKey="collections" name="Collections" stroke={LINE_COLORS.collections} strokeWidth={2.5} dot={{ r: 5, fill: LINE_COLORS.collections, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7, fill: LINE_COLORS.collections, stroke: 'white', strokeWidth: 2 }} label={makeDotLabel(LINE_COLORS.collections, fmtMoney, -24)} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessAnalyticsChart;
