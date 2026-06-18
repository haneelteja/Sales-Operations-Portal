import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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

const BAR_COLORS = {
  cases: '#818cf8',
  revenue: '#10b981',
  profit: '#f59e0b',
  collections: '#38bdf8',
};

const LEGEND_COLORS = BAR_COLORS;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-xl shadow-xl p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-100 truncate max-w-[200px]">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LEGEND_COLORS[entry.dataKey as keyof typeof LEGEND_COLORS] ?? entry.color }} />
            {entry.name}
          </span>
          <span className={`font-semibold tabular-nums ${entry.dataKey === 'profit' && entry.value < 0 ? 'text-red-500' : 'text-gray-800'}`}>
            {entry.dataKey === 'cases'
              ? entry.value.toLocaleString('en-IN')
              : fmtMoney(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex flex-wrap justify-center gap-4 pt-2">
    {[
      { key: 'cases', label: 'Cases', color: LEGEND_COLORS.cases },
      { key: 'revenue', label: 'Revenue', color: LEGEND_COLORS.revenue },
      { key: 'profit', label: 'Profit', color: LEGEND_COLORS.profit },
      { key: 'collections', label: 'Collections', color: LEGEND_COLORS.collections },
    ].map(({ key, label, color }) => (
      <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

const TotalsRow = ({ totals }: { totals: { cases: number; revenue: number; profit: number; collections: number } }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {[
      { label: 'Total Cases', value: totals.cases.toLocaleString('en-IN'), color: 'text-indigo-600', dot: 'bg-indigo-400', bg: 'bg-indigo-50/60' },
      { label: 'Revenue', value: fmtMoney(totals.revenue), color: 'text-emerald-600', dot: 'bg-emerald-400', bg: 'bg-emerald-50/60' },
      { label: 'Profit', value: fmtMoney(totals.profit), color: totals.profit >= 0 ? 'text-amber-600' : 'text-red-500', dot: totals.profit >= 0 ? 'bg-amber-400' : 'bg-red-400', bg: 'bg-amber-50/60' },
      { label: 'Collections', value: fmtMoney(totals.collections), color: 'text-sky-600', dot: 'bg-sky-400', bg: 'bg-sky-50/60' },
    ].map(({ label, value, color, dot, bg }) => (
      <div key={label} className={`rounded-xl px-3 py-2.5 ${bg} border border-white/80`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        </div>
        <p className={`text-base font-bold leading-none ${color}`}>{value}</p>
      </div>
    ))}
  </div>
);

const ClientDropdown = ({
  dropdownRef, dropdownOpen, setDropdownOpen,
  selectedClients, filteredClientNames, clientSearch, setClientSearch,
  toggleClient, setSelectedClients,
}: any) => (
  <div ref={dropdownRef} className="relative">
    <Button type="button" variant="outline" className="min-w-40 justify-between gap-2 h-8 text-sm" onClick={() => setDropdownOpen((o: boolean) => !o)}>
      <span className="truncate">
        {selectedClients.length === 0 ? 'All Clients' : `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`}
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
    </Button>
    {dropdownOpen && (
      <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-64 p-2">
        <Input placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="mb-2 h-8 text-sm" />
        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {filteredClientNames.map((name: string) => (
            <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => toggleClient(name)}>
              <Checkbox checked={selectedClients.includes(name)} onCheckedChange={() => toggleClient(name)} />
              <span className="text-sm truncate">{name}</span>
            </div>
          ))}
          {filteredClientNames.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No clients found</p>}
        </div>
        {selectedClients.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => setSelectedClients([])}>Clear selection</Button>
        )}
      </div>
    )}
  </div>
);

const BusinessAnalyticsChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overall' | 'clients'>('overall');
  const [selectedYear, setSelectedYear] = useState<string>(CURRENT_YEAR);
  const [selectedOverallMonth, setSelectedOverallMonth] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['cases', 'revenue', 'profit', 'collections']));
  const [clientSearch, setClientSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      const { data } = await (supabase as any).from('back_label_purchases').select('purchase_date, total_amount');
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

  const allClientNames = useMemo(() => {
    const names = new Set<string>();
    customers.forEach(c => names.add(c.client_name));
    return [...names].sort();
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

  // Core data computation shared by both tabs
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

  const getPointsForMonth = (mk: string): ChartPoint[] => {
    const { byMonthClient, factoryByMonth, labelsByMonth, transportByMonthClient } = computedData;
    const mMap = byMonthClient.get(mk) ?? new Map();
    const factoryCost = factoryByMonth.get(mk) ?? 0;
    const labelsCost = labelsByMonth.get(mk) ?? 0;
    const transportMap = transportByMonthClient.get(mk) ?? new Map();
    const totalCases = [...mMap.values()].reduce((s, v) => s + v.cases, 0);
    const points: ChartPoint[] = [];
    mMap.forEach((data, clientName) => {
      if (selectedClients.length > 0 && !selectedClients.includes(clientName)) return;
      const share = totalCases > 0 ? data.cases / totalCases : 0;
      const profit = data.revenue - factoryCost * share - labelsCost * share - (transportMap.get(data.clientId) ?? 0);
      points.push({ label: clientName, cases: data.cases, revenue: data.revenue, profit, collections: data.collections });
    });
    return points;
  };

  // Tab 1: Overall — monthly trend, no client filter, filtered by selected year or all
  const overallChartData = useMemo((): ChartPoint[] => {
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

  // Tab 2: Clients — per-client for selected month
  const clientChartData = useMemo((): ChartPoint[] => {
    if (selectedMonth === 'all') {
      // Aggregate per client across all months
      const clientMap = new Map<string, ChartPoint>();
      availableMonths.forEach(mk => {
        getPointsForMonth(mk).forEach(p => {
          const existing = clientMap.get(p.label) ?? { label: p.label, cases: 0, revenue: 0, profit: 0, collections: 0 };
          existing.cases += p.cases; existing.revenue += p.revenue; existing.profit += p.profit; existing.collections += p.collections;
          clientMap.set(p.label, existing);
        });
      });
      return [...clientMap.values()].sort((a, b) => b.revenue - a.revenue);
    }
    return getPointsForMonth(selectedMonth).sort((a, b) => b.revenue - a.revenue);
  }, [computedData, selectedMonth, availableMonths, selectedClients]);

  const chartData = activeTab === 'overall' ? overallChartData : clientChartData;

  const totals = useMemo(() => ({
    cases: chartData.reduce((s, p) => s + p.cases, 0),
    revenue: chartData.reduce((s, p) => s + p.revenue, 0),
    profit: chartData.reduce((s, p) => s + p.profit, 0),
    collections: chartData.reduce((s, p) => s + p.collections, 0),
  }), [chartData]);

  const overallMonthOptions = useMemo(() => {
    if (selectedYear === 'all') return availableMonths;
    return availableMonths.filter(m => m.startsWith(selectedYear));
  }, [availableMonths, selectedYear]);

  const toggleClient = (name: string) => setSelectedClients(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  const filteredClientNames = allClientNames.filter(n => n.toLowerCase().includes(clientSearch.toLowerCase()));
  const chartWidth = Math.max(560, chartData.length * (activeTab === 'overall' ? 80 : 68));
  const barSize = activeTab === 'overall' ? 18 : 14;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
      <CardHeader className="pb-4">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">Business Analytics</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTab === 'overall'
                ? selectedOverallMonth !== 'all'
                  ? `${monthLabel(selectedOverallMonth)} — overall`
                  : selectedYear === 'all' ? 'All time monthly trend' : `${selectedYear} monthly trend`
                : selectedMonth === 'all' ? 'All time — per client' : `${monthLabel(selectedMonth)} — per client`}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {([
              { key: 'overall', label: 'Overall' },
              { key: 'clients', label: 'Clients' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  activeTab === tab.key
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Totals */}
        {chartData.length > 0 && <TotalsRow totals={totals} />}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {activeTab === 'overall' && (
            <>
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

              <Select value={selectedOverallMonth} onValueChange={setSelectedOverallMonth}>
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {overallMonthOptions.map(m => (
                    <SelectItem key={m} value={m}>{m === CURRENT_MONTH ? `${monthLabel(m)} (Current)` : monthLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {activeTab === 'clients' && (
            <>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m}>{m === CURRENT_MONTH ? `${monthLabel(m)} (Current)` : monthLabel(m)}</SelectItem>
                  ))}
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Metric toggles */}
              <div className="flex items-center gap-1">
                {([
                  { key: 'cases', label: 'Cases', color: '#818cf8' },
                  { key: 'revenue', label: 'Revenue', color: '#10b981' },
                  { key: 'profit', label: 'Profit', color: '#f59e0b' },
                  { key: 'collections', label: 'Collections', color: '#38bdf8' },
                ] as const).map(({ key, label, color }) => {
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
                        on ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                      }`}
                      style={on ? { background: color, borderColor: color } : {}}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? '#fff' : color }} />
                      {label}
                    </button>
                  );
                })}
              </div>

              <ClientDropdown
                dropdownRef={dropdownRef}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                selectedClients={selectedClients}
                filteredClientNames={filteredClientNames}
                clientSearch={clientSearch}
                setClientSearch={setClientSearch}
                toggleClient={toggleClient}
                setSelectedClients={setSelectedClients}
              />
            </>
          )}
        </div>

        {/* Selected client badges (clients tab only) */}
        {activeTab === 'clients' && selectedClients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedClients.map(name => (
              <Badge key={name} variant="secondary" className="gap-1 text-xs font-normal">
                {name}
                <button type="button" aria-label={`Remove ${name}`} onClick={() => toggleClient(name)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
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
                <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 4, bottom: activeTab === 'clients' ? 70 : 20 }} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    angle={activeTab === 'clients' ? -40 : 0}
                    textAnchor={activeTab === 'clients' ? 'end' : 'middle'}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="cases"
                    orientation="left"
                    tickFormatter={v => v.toLocaleString('en-IN')}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    tickFormatter={fmtMoney}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                  <Legend content={<CustomLegend />} />
                  {activeTab === 'overall' ? (
                    <>
                      <Line yAxisId="cases" type="monotone" dataKey="cases" name="Cases" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 5, fill: '#818cf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }} />
                      <Line yAxisId="money" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                      <Line yAxisId="money" type="monotone" dataKey="profit" name="Profit" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                      <Line yAxisId="money" type="monotone" dataKey="collections" name="Collections" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 5, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }} />
                    </>
                  ) : (
                    <>
                      {activeMetrics.has('cases') && <Bar yAxisId="cases" dataKey="cases" name="Cases" fill="#818cf8" barSize={barSize} radius={[4, 4, 0, 0]} />}
                      {activeMetrics.has('revenue') && <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#10b981" barSize={barSize} radius={[4, 4, 0, 0]} />}
                      {activeMetrics.has('profit') && <Bar yAxisId="money" dataKey="profit" name="Profit" fill="#f59e0b" barSize={barSize} radius={[4, 4, 0, 0]} />}
                      {activeMetrics.has('collections') && <Bar yAxisId="money" dataKey="collections" name="Collections" fill="#38bdf8" barSize={barSize} radius={[4, 4, 0, 0]} />}
                    </>
                  )}
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
