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
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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

const getMonthKey = (d: string) => d.slice(0, 7);

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

const fmtMoney = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Math.round(v)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2 max-w-48 truncate">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: entry.color }} />
            <span className="text-gray-600">{entry.name}</span>
          </span>
          <span className={`font-medium ${entry.name === 'Profit' && entry.value < 0 ? 'text-red-500' : 'text-gray-800'}`}>
            {entry.name === 'Cases'
              ? entry.value.toLocaleString('en-IN')
              : fmtMoney(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const BusinessAnalyticsChart: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: salesTxs = [] } = useQuery({
    queryKey: ['biz-analytics-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('customer_id, transaction_date, amount, quantity, transaction_type')
        .in('transaction_type', ['sale', 'payment']);
      if (error) throw error;
      return (data ?? []) as SaleTx[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: factoryPayables = [] } = useQuery({
    queryKey: ['biz-analytics-factory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factory_payables')
        .select('transaction_date, amount')
        .eq('transaction_type', 'production');
      if (error) throw error;
      return (data ?? []) as { transaction_date: string; amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: labelPurchases = [] } = useQuery({
    queryKey: ['biz-analytics-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('label_purchases')
        .select('purchase_date, total_amount');
      if (error) throw error;
      return (data ?? []) as { purchase_date: string; total_amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: backLabelPurchases = [] } = useQuery({
    queryKey: ['biz-analytics-back-labels'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('back_label_purchases')
        .select('purchase_date, total_amount');
      return (data ?? []) as { purchase_date: string; total_amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: transportExpenses = [] } = useQuery({
    queryKey: ['biz-analytics-transport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_expenses')
        .select('client_id, expense_date, amount');
      if (error) throw error;
      return (data ?? []) as { client_id: string | null; expense_date: string; amount: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['biz-analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, client_name')
        .eq('is_active', true)
        .eq('is_deprecated', false);
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

  const chartData = useMemo((): ChartPoint[] => {
    if (!salesTxs.length) return [];

    // Factory costs by month (global — allocated proportionally by cases)
    const factoryByMonth = new Map<string, number>();
    factoryPayables.forEach(fp => {
      const mk = getMonthKey(fp.transaction_date);
      factoryByMonth.set(mk, (factoryByMonth.get(mk) ?? 0) + (fp.amount ?? 0));
    });

    // Label costs by month (global — allocated proportionally by cases)
    const labelsByMonth = new Map<string, number>();
    [...labelPurchases, ...backLabelPurchases].forEach(lp => {
      const mk = getMonthKey(lp.purchase_date);
      labelsByMonth.set(mk, (labelsByMonth.get(mk) ?? 0) + (lp.total_amount ?? 0));
    });

    // Transport costs by month+clientId (direct per client)
    const transportByMonthClient = new Map<string, Map<string, number>>();
    transportExpenses.forEach(te => {
      if (!te.client_id || !te.expense_date) return;
      const mk = getMonthKey(te.expense_date);
      if (!transportByMonthClient.has(mk)) transportByMonthClient.set(mk, new Map());
      const m = transportByMonthClient.get(mk)!;
      m.set(te.client_id, (m.get(te.client_id) ?? 0) + (te.amount ?? 0));
    });

    // Sales + collections by month + clientName
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
      if (tx.transaction_type === 'sale') {
        existing.cases += tx.quantity ?? 0;
        existing.revenue += tx.amount ?? 0;
      } else {
        existing.collections += tx.amount ?? 0;
      }
      existing.clientId = tx.customer_id;
      mMap.set(clientName, existing);
    });

    const computePoints = (mk: string): ChartPoint[] => {
      const mMap = byMonthClient.get(mk) ?? new Map<string, Entry>();
      const factoryCost = factoryByMonth.get(mk) ?? 0;
      const labelsCost = labelsByMonth.get(mk) ?? 0;
      const transportMap = transportByMonthClient.get(mk) ?? new Map<string, number>();
      const totalCases = [...mMap.values()].reduce((s, v) => s + v.cases, 0);

      const points: ChartPoint[] = [];
      mMap.forEach((data, clientName) => {
        if (selectedClients.length > 0 && !selectedClients.includes(clientName)) return;
        const share = totalCases > 0 ? data.cases / totalCases : 0;
        const transport = transportMap.get(data.clientId) ?? 0;
        const profit = data.revenue - factoryCost * share - labelsCost * share - transport;
        points.push({ label: clientName, cases: data.cases, revenue: data.revenue, profit, collections: data.collections });
      });
      return points;
    };

    if (selectedMonth === 'all') {
      return [...availableMonths].reverse().map(mk => {
        const pts = computePoints(mk);
        const agg: ChartPoint = { label: monthLabel(mk), cases: 0, revenue: 0, profit: 0, collections: 0 };
        pts.forEach(p => { agg.cases += p.cases; agg.revenue += p.revenue; agg.profit += p.profit; agg.collections += p.collections; });
        return agg;
      }).filter(p => p.cases > 0 || p.revenue > 0);
    }

    return computePoints(selectedMonth).sort((a, b) => b.revenue - a.revenue);
  }, [salesTxs, factoryPayables, labelPurchases, backLabelPurchases, transportExpenses, custMap, selectedMonth, selectedClients, availableMonths]);

  const toggleClient = (name: string) => {
    setSelectedClients(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const filteredClientNames = allClientNames.filter(n =>
    n.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const chartWidth = Math.max(600, chartData.length * 72);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Business Analytics</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedMonth === 'all' ? 'Monthly trend' : `${monthLabel(selectedMonth)} — per client`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Month selector */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m}>
                    {m === CURRENT_MONTH ? `${monthLabel(m)} (Current)` : monthLabel(m)}
                  </SelectItem>
                ))}
                <SelectItem value="all">All Months (Trend)</SelectItem>
              </SelectContent>
            </Select>

            {/* Client multi-select */}
            <div ref={dropdownRef} className="relative">
              <Button
                type="button"
                variant="outline"
                className="min-w-40 justify-between gap-2"
                onClick={() => setDropdownOpen(o => !o)}
              >
                <span className="truncate">
                  {selectedClients.length === 0
                    ? 'All Clients'
                    : `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-64 p-2">
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="mb-2 h-8 text-sm"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredClientNames.map(name => (
                      <div
                        key={name}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleClient(name)}
                      >
                        <Checkbox
                          checked={selectedClients.includes(name)}
                          onCheckedChange={() => toggleClient(name)}
                        />
                        <span className="text-sm truncate">{name}</span>
                      </div>
                    ))}
                    {filteredClientNames.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">No clients found</p>
                    )}
                  </div>
                  {selectedClients.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => setSelectedClients([])}
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected client badges */}
        {selectedClients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedClients.map(name => (
              <Badge key={name} variant="secondary" className="gap-1 text-xs">
                {name}
                <button type="button" onClick={() => toggleClient(name)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No data for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 64 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    angle={-35}
                    textAnchor="end"
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="cases"
                    orientation="left"
                    tickFormatter={v => v.toLocaleString('en-IN')}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Cases', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#6b7280' } }}
                    width={60}
                  />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    tickFormatter={fmtMoney}
                    tick={{ fontSize: 11 }}
                    label={{ value: '₹ Amount', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: 11, fill: '#6b7280' } }}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                  <Bar yAxisId="cases" dataKey="cases" name="Cases" fill="#3b82f6" barSize={16} radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#22c55e" barSize={16} radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="money" dataKey="profit" name="Profit" fill="#a855f7" barSize={16} radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="money" dataKey="collections" name="Collections" fill="#f59e0b" barSize={16} radius={[2, 2, 0, 0]} />
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
