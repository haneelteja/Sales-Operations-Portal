import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ComposedChart, BarChart, Bar, Cell, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  Users, TrendingUp, Package, UserPlus, AlertTriangle, Plus, Trash2, Settings, UserCheck,
} from 'lucide-react';
import { fetchReceivablesTracking } from '@/lib/receivablesUtils';

// ── Constants ──────────────────────────────────────────────────────────────────

const OFFICER_COLORS = ['#7c3aed', '#059669', '#d97706', '#0284c7', '#dc2626', '#0891b2', '#ca8a04', '#be185d'];

// ── Types ──────────────────────────────────────────────────────────────────────

type ChartMetric = 'cases' | 'new_clients' | 'revenue';
type ChartPeriod = '3m' | '6m' | '12m' | 'last_year' | 'custom';
type OverviewChartType = 'new_clients' | 'cases_by_officer' | 'outstanding_by_officer';

interface SalesOfficer { id: string; name: string; is_active: boolean; created_at: string; }
interface ClientOfficerMapping { client_name: string; branch: string; officer_id: string; assigned_at: string; }
interface MomTx { transaction_date: string; quantity: number | null; customer_id: string; amount: number | null; }

// ── Pure helpers ───────────────────────────────────────────────────────────────

function buildMonthKeys(period: ChartPeriod, customStart?: string, customEnd?: string): string[] {
  if (period === 'custom') {
    if (!customStart || !customEnd || customStart > customEnd) return [];
    const keys: string[] = [];
    let cur = customStart;
    while (cur <= customEnd) {
      keys.push(cur);
      const [y, m] = cur.split('-').map(Number);
      cur = new Date(y, m, 1).toISOString().substring(0, 7);
    }
    return keys;
  }
  if (period === 'last_year') {
    const year = new Date().getFullYear() - 1;
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  }
  const n = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    keys.push(d.toISOString().substring(0, 7));
  }
  return keys;
}

function makeDotLabel(color: string, fmt?: (v: number) => string) {
  return function LabelRenderer({ x, y, value }: { x?: number; y?: number; value?: number }) {
    if (value == null || value === 0 || x == null || y == null) return null;
    const text = fmt ? fmt(value) : String(value);
    return (
      <g>
        <text x={x} y={y} dy={-12} textAnchor="middle" fontSize={10} fontWeight={700}
          stroke="white" strokeWidth={4} strokeLinejoin="round" fill="white">{text}</text>
        <text x={x} y={y} dy={-12} textAnchor="middle" fontSize={10} fontWeight={700}
          fill={color}>{text}</text>
      </g>
    );
  };
}

function getPeriodFrom(period: ChartPeriod, customStart?: string): string {
  if (period === 'custom' && customStart) return `${customStart}-01`;
  if (period === 'last_year') return `${new Date().getFullYear() - 1}-01-01`;
  const n = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const d = new Date(); d.setMonth(d.getMonth() - (n - 1)); d.setDate(1);
  return d.toISOString().split('T')[0];
}

function monthLabel(key: string): string {
  const [y, mo] = key.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, sub, highlight, accent }: {
  title: string; value: string | number; icon: React.ElementType;
  sub?: string; highlight?: boolean; accent?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1.5 ${highlight ? 'text-destructive' : ''}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="rounded-lg p-2 mt-0.5 flex-shrink-0" style={{ background: accent ? `${accent}18` : 'hsl(var(--muted))' }}>
            <Icon className="h-4 w-4" style={{ color: accent ?? 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, isMonetary }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  isMonetary?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) => isMonetary ? `₹${Math.round(v).toLocaleString('en-IN')}` : v.toLocaleString('en-IN');
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 truncate max-w-[100px]">{p.name}</span>
          <span className="font-semibold text-slate-800 ml-auto pl-2">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SalesTrackerView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [showManageOfficers, setShowManageOfficers] = useState(false);
  const [showAssignClients, setShowAssignClients] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [assignSearch, setAssignSearch] = useState('');

  // Shared period selector (overview + per-officer)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6m');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Overview unified chart
  const [overviewChartType, setOverviewChartType] = useState<OverviewChartType>('new_clients');
  // null = all officers visible
  const [activeOfficerIds, setActiveOfficerIds] = useState<Set<string> | null>(null);

  // Per-officer chart metric
  const [chartMetric, setChartMetric] = useState<ChartMetric>('new_clients');

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: officers = [], isLoading: officersLoading } = useQuery({
    queryKey: ['sales-officers'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from('sales_officers').select('id, name, is_active').eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as SalesOfficer[];
    },
    staleTime: 30000,
  });

  const { data: allMappings = [] } = useQuery({
    queryKey: ['customer-sales-officer'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from('customer_sales_officer').select('officer_id, client_name, branch, assigned_at');
      if (error) throw error;
      return (data ?? []) as ClientOfficerMapping[];
    },
    staleTime: 30000,
  });

  const { data: receivablesData, isLoading: receivablesLoading } = useQuery({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: allClientPairs = [] } = useQuery({
    queryKey: ['distinct-client-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('client_name, branch').eq('is_active', true);
      if (error) throw error;
      const seen = new Set<string>();
      const pairs: { client_name: string; branch: string }[] = [];
      for (const r of (data ?? [])) {
        const key = `${r.client_name}|||${r.branch ?? ''}`;
        if (!seen.has(key)) { seen.add(key); pairs.push({ client_name: r.client_name as string, branch: (r.branch ?? '') as string }); }
      }
      return pairs.sort((a, b) => a.client_name.localeCompare(b.client_name));
    },
    enabled: showAssignClients,
    staleTime: 60000,
  });

  // ── Derived: mapping lookups ─────────────────────────────────────────────

  const mappingByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const mapping of allMappings) {
      m.set(`${mapping.client_name.toLowerCase()}|||${(mapping.branch ?? '').toLowerCase()}`, mapping.officer_id);
    }
    return m;
  }, [allMappings]);

  const customerIdToOfficer = useMemo(() => {
    const result = new Map<string, string>();
    for (const r of (receivablesData?.rows ?? [])) {
      const k = `${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`;
      const oid = mappingByKey.get(k);
      if (oid) result.set(r.customerId, oid);
    }
    return result;
  }, [receivablesData, mappingByKey]);

  const allMappedCustomerIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of (receivablesData?.rows ?? [])) {
      if (mappingByKey.has(`${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`)) ids.push(r.customerId);
    }
    return ids;
  }, [receivablesData, mappingByKey]);

  // ── Derived: selected officer ─────────────────────────────────────────────

  const officerMappings = useMemo(() => allMappings.filter(m => m.officer_id === selectedOfficerId), [allMappings, selectedOfficerId]);

  const officerClientKeys = useMemo(() => {
    const set = new Set<string>();
    for (const m of officerMappings) set.add(`${m.client_name.toLowerCase()}|||${(m.branch ?? '').toLowerCase()}`);
    return set;
  }, [officerMappings]);

  const officerRows = useMemo(() => {
    if (!selectedOfficerId) return [];
    return (receivablesData?.rows ?? []).filter(r =>
      officerClientKeys.has(`${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`),
    );
  }, [receivablesData, officerClientKeys, selectedOfficerId]);

  const officerCustomerIds = useMemo(() => officerRows.map(r => r.customerId), [officerRows]);

  // ── Queries: per-officer ─────────────────────────────────────────────────

  const { data: momTransactions = [] } = useQuery({
    queryKey: ['officer-mom-transactions', selectedOfficerId, officerCustomerIds.join(','), chartPeriod, customStartDate],
    queryFn: async (): Promise<MomTx[]> => {
      if (!officerCustomerIds.length) return [];
      if (chartPeriod === 'custom' && !customStartDate) return [];
      const from = getPeriodFrom(chartPeriod, customStartDate);
      const { data, error } = await supabase
        .from('sales_transactions').select('transaction_date, quantity, customer_id, amount')
        .eq('transaction_type', 'sale').in('customer_id', officerCustomerIds).gte('transaction_date', from);
      if (error) throw error;
      return (data ?? []) as MomTx[];
    },
    enabled: !!selectedOfficerId && officerCustomerIds.length > 0 && (chartPeriod !== 'custom' || !!customStartDate),
    staleTime: 0,
  });

  const { data: firstSaleData = [] } = useQuery({
    queryKey: ['officer-first-sales', selectedOfficerId, officerCustomerIds.join(',')],
    queryFn: async (): Promise<{ customer_id: string; first_date: string }[]> => {
      if (!officerCustomerIds.length) return [];
      const { data, error } = await supabase
        .from('sales_transactions').select('customer_id, transaction_date')
        .eq('transaction_type', 'sale').in('customer_id', officerCustomerIds).order('transaction_date', { ascending: true }).limit(10000);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const t of (data ?? [])) { if (!map.has(t.customer_id)) map.set(t.customer_id, t.transaction_date); }
      return [...map.entries()].map(([customer_id, first_date]) => ({ customer_id, first_date }));
    },
    enabled: !!selectedOfficerId && officerCustomerIds.length > 0,
    staleTime: 60000,
  });

  // ── Queries: overview ────────────────────────────────────────────────────

  const { data: overviewTransactions = [] } = useQuery({
    queryKey: ['overview-mom-transactions', allMappedCustomerIds.join(','), chartPeriod, customStartDate],
    queryFn: async (): Promise<MomTx[]> => {
      if (!allMappedCustomerIds.length) return [];
      if (chartPeriod === 'custom' && !customStartDate) return [];
      const from = getPeriodFrom(chartPeriod, customStartDate);
      const { data, error } = await supabase
        .from('sales_transactions').select('transaction_date, quantity, customer_id, amount')
        .eq('transaction_type', 'sale').in('customer_id', allMappedCustomerIds).gte('transaction_date', from).limit(10000);
      if (error) throw error;
      return (data ?? []) as MomTx[];
    },
    enabled: !selectedOfficerId && allMappedCustomerIds.length > 0 && (chartPeriod !== 'custom' || !!customStartDate),
    staleTime: 0,
  });

  // (allFirstSaleData removed — New Clients chart now uses assigned_at from allMappings)

  // ── Stats ─────────────────────────────────────────────────────────────────

  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  const stats = useMemo(() => {
    const totalClients = officerMappings.length;
    const casesThisMonth = momTransactions.filter(t => t.transaction_date?.startsWith(currentMonthStr)).reduce((s, t) => s + (t.quantity ?? 0), 0);
    const totalOutstanding = officerRows.reduce((s, r) => s + r.outstanding, 0);
    const overdueCount = officerRows.filter(r => !r.lastPaymentDate || (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000 > 60).length;
    const newThisMonth = firstSaleData.filter(d => d.first_date?.startsWith(currentMonthStr)).length;
    return { totalClients, casesThisMonth, totalOutstanding, overdueCount, newThisMonth };
  }, [officerMappings, momTransactions, officerRows, currentMonthStr, firstSaleData]);

  const teamStats = useMemo(() => {
    let totalOutstanding = 0; let overdueClients = 0; let casesThisMonth = 0;
    for (const r of (receivablesData?.rows ?? [])) {
      const k = `${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`;
      if (!mappingByKey.has(k)) continue;
      totalOutstanding += r.outstanding;
      if (!r.lastPaymentDate || (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000 > 60) overdueClients += 1;
    }
    for (const t of overviewTransactions) {
      if (t.transaction_date?.startsWith(currentMonthStr)) casesThisMonth += t.quantity ?? 0;
    }
    return { totalClients: allMappings.length, totalOutstanding, overdueClients, casesThisMonth };
  }, [allMappings, receivablesData, mappingByKey, overviewTransactions, currentMonthStr]);

  const officerPerformanceStats = useMemo(() => {
    const sm: Record<string, { clients: number; outstanding: number; overdue: number; casesThisMonth: number }> = {};
    for (const o of officers) sm[o.id] = { clients: 0, outstanding: 0, overdue: 0, casesThisMonth: 0 };
    for (const m of allMappings) { if (sm[m.officer_id]) sm[m.officer_id].clients += 1; }
    for (const r of (receivablesData?.rows ?? [])) {
      const k = `${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`;
      const oid = mappingByKey.get(k);
      if (!oid || !sm[oid]) continue;
      sm[oid].outstanding += r.outstanding;
      if (!r.lastPaymentDate || (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000 > 60) sm[oid].overdue += 1;
    }
    for (const t of overviewTransactions) {
      if (!t.transaction_date?.startsWith(currentMonthStr)) continue;
      const oid = customerIdToOfficer.get(t.customer_id);
      if (oid && sm[oid]) sm[oid].casesThisMonth += t.quantity ?? 0;
    }
    return officers.map(o => ({ officer: o, ...sm[o.id] }));
  }, [officers, allMappings, receivablesData, mappingByKey, overviewTransactions, customerIdToOfficer, currentMonthStr]);

  // ── Overview chart data ───────────────────────────────────────────────────

  // Officers visible in the overview chart (null = all)
  const visibleOfficers = useMemo(() =>
    activeOfficerIds === null ? officers : officers.filter(o => activeOfficerIds.has(o.id)),
  [officers, activeOfficerIds]);

  // Client detail lookup for tooltips: monthLabel → officerId → [{dealerName, branch}]
  // Uses assigned_at from allMappings so the chart shows when officers onboarded clients,
  // not the historical first-ever-sale date (which predates the sales tracker for all existing clients).
  const newClientsDetailByLabel = useMemo(() => {
    const keys = buildMonthKeys(chartPeriod, customStartDate, customEndDate);
    const result = new Map<string, Map<string, Array<{ dealerName: string; branch: string }>>>();
    for (const k of keys) result.set(monthLabel(k), new Map());
    for (const m of allMappings) {
      if (!m.assigned_at) continue;
      const lbl = monthLabel(m.assigned_at.substring(0, 7));
      if (!result.has(lbl)) continue;
      if (activeOfficerIds !== null && !activeOfficerIds.has(m.officer_id)) continue;
      const om = result.get(lbl)!;
      if (!om.has(m.officer_id)) om.set(m.officer_id, []);
      om.get(m.officer_id)!.push({ dealerName: m.client_name, branch: m.branch ?? '' });
    }
    return result;
  }, [allMappings, chartPeriod, customStartDate, customEndDate, activeOfficerIds]);

  // Client detail lookup for outstanding tooltip: officerId → [{dealerName, branch, outstanding}]
  const officerClientsDetail = useMemo(() => {
    const result = new Map<string, Array<{ dealerName: string; branch: string; outstanding: number }>>();
    for (const o of officers) result.set(o.id, []);
    for (const r of (receivablesData?.rows ?? [])) {
      const k = `${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`;
      const oid = mappingByKey.get(k);
      if (oid && result.has(oid)) result.get(oid)!.push({ dealerName: r.dealerName, branch: r.branch, outstanding: r.outstanding });
    }
    for (const [, clients] of result) clients.sort((a, b) => b.outstanding - a.outstanding);
    return result;
  }, [officers, receivablesData, mappingByKey]);

  // New Clients Overall — line (total) + per-officer breakdown for tooltip
  // Uses assigned_at from allMappings (when the officer was assigned each client).
  const newClientsByOfficerData = useMemo(() => {
    const keys = buildMonthKeys(chartPeriod, customStartDate, customEndDate);
    const data: Record<string, Record<string, number>> = {};
    for (const k of keys) {
      data[k] = {};
      for (const o of visibleOfficers) data[k][o.id] = 0;
    }
    for (const m of allMappings) {
      if (!m.assigned_at) continue;
      const month = m.assigned_at.substring(0, 7);
      if (!(month in data) || data[month][m.officer_id] === undefined) continue;
      data[month][m.officer_id] += 1;
    }
    return keys.map(key => {
      const row: Record<string, string | number> = { month: monthLabel(key) };
      let total = 0;
      for (const o of visibleOfficers) {
        const count = data[key]?.[o.id] ?? 0;
        row[o.id] = count;
        total += count;
      }
      row['total'] = total;
      return row;
    });
  }, [allMappings, chartPeriod, customStartDate, customEndDate, visibleOfficers]);

  // New clients table — grouped by year/month with officer and assignment date
  const newClientsTableData = useMemo(() => {
    const keySet = new Set(buildMonthKeys(chartPeriod, customStartDate, customEndDate));

    const entries = allMappings
      .filter(m => {
        if (!m.assigned_at) return false;
        if (!keySet.has(m.assigned_at.substring(0, 7))) return false;
        if (activeOfficerIds !== null && !activeOfficerIds.has(m.officer_id)) return false;
        return true;
      })
      .map(m => {
        const officerName = officers.find(o => o.id === m.officer_id)?.name ?? '—';
        const monthKey = m.assigned_at!.substring(0, 7);
        const [y, mo] = monthKey.split('-').map(Number);
        return {
          dealerName: m.client_name,
          branch: m.branch ?? '',
          officerName,
          officerId: m.officer_id,
          first_date: m.assigned_at!,
          monthKey,
          year: y,
          month: mo,
        };
      })
      .sort((a, b) => a.first_date.localeCompare(b.first_date));

    const grouped = new Map<number, Map<string, typeof entries>>();
    for (const e of entries) {
      if (!grouped.has(e.year)) grouped.set(e.year, new Map());
      const yg = grouped.get(e.year)!;
      if (!yg.has(e.monthKey)) yg.set(e.monthKey, []);
      yg.get(e.monthKey)!.push(e);
    }
    return grouped;
  }, [allMappings, chartPeriod, customStartDate, customEndDate, activeOfficerIds, officers]);

  // Cases by Officer — multi-line
  const casesByOfficerChartData = useMemo(() => {
    const keys = buildMonthKeys(chartPeriod, customStartDate, customEndDate);
    const data: Record<string, Record<string, number>> = {};
    for (const m of keys) { data[m] = {}; for (const o of officers) data[m][o.id] = 0; }
    for (const t of overviewTransactions) {
      const m = t.transaction_date?.substring(0, 7);
      if (!m || !(m in data)) continue;
      const oid = customerIdToOfficer.get(t.customer_id);
      if (oid && data[m][oid] !== undefined) data[m][oid] += t.quantity ?? 0;
    }
    return keys.map(key => {
      const row: Record<string, string | number> = { month: monthLabel(key) };
      for (const o of officers) row[o.id] = data[key]?.[o.id] ?? 0;
      return row;
    });
  }, [overviewTransactions, officers, customerIdToOfficer, chartPeriod, customStartDate, customEndDate]);

  // Outstanding by Officer — bar chart (current snapshot per officer)
  const outstandingBarData = useMemo(() =>
    officerPerformanceStats.map(s => ({
      name: s.officer.name.split(' ')[0],
      fullName: s.officer.name,
      value: Math.round(s.outstanding),
      officer_id: s.officer.id,
    })),
  [officerPerformanceStats]);

  // ── Per-officer chart data ────────────────────────────────────────────────

  const momChartData = useMemo(() => {
    const keys = buildMonthKeys(chartPeriod, customStartDate, customEndDate);
    const counts: Record<string, number> = {};
    keys.forEach(m => (counts[m] = 0));
    if (chartMetric === 'cases') {
      for (const t of momTransactions) { const m = t.transaction_date?.substring(0, 7); if (m && m in counts) counts[m] += t.quantity ?? 0; }
    } else if (chartMetric === 'revenue') {
      for (const t of momTransactions) { const m = t.transaction_date?.substring(0, 7); if (m && m in counts) counts[m] += t.amount ?? 0; }
    } else {
      for (const d of firstSaleData) { const m = d.first_date?.substring(0, 7); if (m && m in counts) counts[m] += 1; }
    }
    return keys.map(key => ({ month: monthLabel(key), value: counts[key] }));
  }, [momTransactions, firstSaleData, chartMetric, chartPeriod, customStartDate, customEndDate]);

  const overdueRows = useMemo(() => officerRows.filter(r =>
    !r.lastPaymentDate || (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000 > 60,
  ), [officerRows]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addOfficerMutation = useMutation({
    mutationFn: async (name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('sales_officers').insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-officers'] }); setNewOfficerName(''); toast({ title: 'Officer added' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeOfficerMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('sales_officers').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales-officers'] });
      if (selectedOfficerId === id) setSelectedOfficerId(null);
      toast({ title: 'Officer removed' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assignOfficerMutation = useMutation({
    mutationFn: async ({ client_name, branch, officer_id }: { client_name: string; branch: string; officer_id: string | null }) => {
      if (!officer_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('customer_sales_officer').delete().eq('client_name', client_name).eq('branch', branch);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('customer_sales_officer').upsert({ client_name, branch, officer_id }, { onConflict: 'client_name,branch' });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-sales-officer'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const getMappingForClient = useCallback(
    (clientName: string, branch: string) => allMappings.find(m => m.client_name === clientName && m.branch === branch),
    [allMappings],
  );

  const filteredClientPairs = useMemo(() => {
    if (!assignSearch.trim()) return allClientPairs;
    const q = assignSearch.toLowerCase();
    return allClientPairs.filter(p => p.client_name.toLowerCase().includes(q) || p.branch.toLowerCase().includes(q));
  }, [allClientPairs, assignSearch]);

  const selectedOfficer = officers.find(o => o.id === selectedOfficerId);

  const officerColor = useMemo(() => {
    const idx = officers.findIndex(o => o.id === selectedOfficerId);
    return OFFICER_COLORS[idx % OFFICER_COLORS.length] ?? '#7c3aed';
  }, [officers, selectedOfficerId]);

  const toggleOfficer = useCallback((id: string) => {
    setActiveOfficerIds(prev => {
      // On first toggle, start from all-selected state
      const base = prev ?? new Set(officers.map(o => o.id));
      const next = new Set(base);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      // If all are selected again, reset to null (all)
      if (next.size === officers.length) return null;
      return next;
    });
  }, [officers]);

  // ── Shared selectors ──────────────────────────────────────────────────────

  const periodSelector = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={chartPeriod} onValueChange={v => setChartPeriod(v as ChartPeriod)}>
        <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="3m">Last 3 months</SelectItem>
          <SelectItem value="6m">Last 6 months</SelectItem>
          <SelectItem value="12m">Last 12 months</SelectItem>
          <SelectItem value="last_year">Last year ({new Date().getFullYear() - 1})</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      {chartPeriod === 'custom' && (
        <>
          <input
            type="month"
            title="Start month"
            value={customStartDate}
            onChange={e => setCustomStartDate(e.target.value)}
            className="h-8 px-2 border border-input rounded-md text-sm bg-background"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="month"
            title="End month"
            value={customEndDate}
            min={customStartDate}
            onChange={e => setCustomEndDate(e.target.value)}
            className="h-8 px-2 border border-input rounded-md text-sm bg-background"
          />
        </>
      )}
    </div>
  );

  // ── Overview chart labels ─────────────────────────────────────────────────

  const overviewChartMeta = {
    new_clients:          { label: 'New Clients Overall',       sub: 'Clients assigned to officers per month' },
    cases_by_officer:     { label: 'Cases Trend by Officer',    sub: 'Month-over-month cases, one line per officer' },
    outstanding_by_officer: { label: 'Outstanding by Officer',  sub: 'Current outstanding balance per officer' },
  } as const;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sales Tracker</h2>
          <p className="text-sm text-muted-foreground">Track sales officer performance and client assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowManageOfficers(true)}>
            <Settings className="h-4 w-4 mr-2" />Manage Officers
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAssignClients(true)}>
            <UserCheck className="h-4 w-4 mr-2" />Assign Clients
          </Button>
        </div>
      </div>

      {/* Officer selector pills */}
      {officersLoading ? (
        <p className="text-sm text-muted-foreground">Loading officers…</p>
      ) : officers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No sales officers yet. Click &quot;Manage Officers&quot; to add one.</CardContent></Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {officers.map((o, idx) => {
            const count = allMappings.filter(m => m.officer_id === o.id).length;
            const color = OFFICER_COLORS[idx % OFFICER_COLORS.length];
            const active = selectedOfficerId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOfficerId(active ? null : o.id)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all"
                style={active
                  ? { background: color, borderColor: color, color: 'white' }
                  : { background: `${color}12`, borderColor: `${color}44`, color }}
              >
                {o.name}
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                  style={active ? { background: 'rgba(255,255,255,0.25)' } : { background: `${color}30` }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {!selectedOfficer && officers.length > 0 && (
        <>
          {/* Team stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Active Officers" value={officers.length} icon={Users} accent="#7c3aed" />
            <StatCard title="Assigned Clients" value={teamStats.totalClients} icon={UserCheck} accent="#059669" />
            <StatCard title="Cases This Month" value={teamStats.casesThisMonth.toLocaleString('en-IN')} icon={Package} accent="#d97706" />
            <StatCard title="Team Outstanding" value={fmtINR(teamStats.totalOutstanding)} icon={TrendingUp} accent="#0284c7" />
          </div>

          {/* ── UNIFIED OVERVIEW CHART ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {overviewChartMeta[overviewChartType].label}
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">{overviewChartMeta[overviewChartType].sub}</p>
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Chart type */}
                  <Select value={overviewChartType} onValueChange={v => setOverviewChartType(v as OverviewChartType)}>
                    <SelectTrigger className="h-8 w-52 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_clients">New Clients Overall</SelectItem>
                      <SelectItem value="cases_by_officer">Cases by Officer</SelectItem>
                      <SelectItem value="outstanding_by_officer">Outstanding by Officer</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Period — not relevant for outstanding snapshot */}
                  {overviewChartType !== 'outstanding_by_officer' && periodSelector}
                </div>
              </div>

              {/* Officer toggles — all modes */}
              {officers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                  {officers.map((o, idx) => {
                    const color = OFFICER_COLORS[idx % OFFICER_COLORS.length];
                    const isActive = activeOfficerIds === null || activeOfficerIds.has(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => toggleOfficer(o.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                        style={isActive
                          ? { background: `${color}15`, borderColor: color, color }
                          : { background: 'transparent', borderColor: '#e2e8f0', color: '#94a3b8' }}
                      >
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: isActive ? color : '#cbd5e1' }} />
                        {o.name}
                      </button>
                    );
                  })}
                  {activeOfficerIds !== null && (
                    <button
                      type="button"
                      onClick={() => setActiveOfficerIds(null)}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 transition-all"
                    >
                      Show all
                    </button>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {/* NEW CLIENTS — line (total) with per-officer tooltip breakdown */}
              {overviewChartType === 'new_clients' && (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={newClientsByOfficerData} margin={{ top: 28, right: 16, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                      content={({ active, label }) => {
                        if (!active || !label) return null;
                        const row = newClientsByOfficerData.find(r => r.month === label);
                        if (!row) return null;
                        const detailMap = newClientsDetailByLabel.get(label);
                        const officerBreakdown = visibleOfficers
                          .map((o, idx) => ({
                            id: o.id,
                            name: o.name,
                            value: (row[o.id] as number) ?? 0,
                            color: OFFICER_COLORS[officers.findIndex(x => x.id === o.id) % OFFICER_COLORS.length],
                            clients: detailMap?.get(o.id) ?? [],
                          }))
                          .filter(r => r.value > 0);
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[200px] max-w-[280px]">
                            <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-slate-500">Total new clients</span>
                              <span className="font-bold text-slate-800 ml-auto">{row['total'] as number}</span>
                            </div>
                            {officerBreakdown.length > 0 && (
                              <div className="border-t border-slate-100 pt-1.5 space-y-2.5">
                                {officerBreakdown.map(r => (
                                  <div key={r.id}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                                      <span className="font-semibold text-slate-700">{r.name}</span>
                                      <span className="ml-auto font-bold text-slate-800">{r.value}</span>
                                    </div>
                                    {r.clients.map((c, ci) => (
                                      <div key={ci} className="flex items-start gap-1.5 pl-3.5 mb-0.5">
                                        <span className="text-slate-300 mt-px">•</span>
                                        <span className="text-slate-500 leading-tight">
                                          {c.dealerName}{c.branch ? ` · ${c.branch}` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="total" name="New Clients" stroke="#7c3aed" strokeWidth={2.5}
                      dot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
                      label={makeDotLabel('#7c3aed')}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* CASES BY OFFICER — multi-line */}
              {overviewChartType === 'cases_by_officer' && (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={casesByOfficerChartData} margin={{ top: 28, right: 16, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const officerEntries = payload
                          .map(p => {
                            const o = officers.find(x => x.id === String(p.dataKey));
                            return o ? { id: o.id, name: o.name, value: p.value as number, color: p.color ?? '#888', clients: officerClientsDetail.get(o.id) ?? [] } : null;
                          })
                          .filter((e): e is NonNullable<typeof e> => e !== null && e.value > 0);
                        const total = officerEntries.reduce((s, e) => s + e.value, 0);
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[200px] max-w-[280px]">
                            <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-slate-500">Total cases</span>
                              <span className="font-bold text-slate-800 ml-auto">{total.toLocaleString('en-IN')}</span>
                            </div>
                            {officerEntries.length > 0 && (
                              <div className="border-t border-slate-100 pt-1.5 space-y-2.5">
                                {officerEntries.map(e => (
                                  <div key={e.id}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                                      <span className="font-semibold text-slate-700">{e.name}</span>
                                      <span className="ml-auto font-bold text-slate-800">{e.value.toLocaleString('en-IN')}</span>
                                    </div>
                                    {e.clients.map((c, ci) => (
                                      <div key={ci} className="flex items-start gap-1.5 pl-3.5 mb-0.5">
                                        <span className="text-slate-300 mt-px">•</span>
                                        <span className="text-slate-500 leading-tight">
                                          {c.dealerName}{c.branch ? ` · ${c.branch}` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs text-slate-600">{officers.find(o => o.id === value)?.name ?? value}</span>}
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                    {visibleOfficers.map((o, idx) => {
                      const globalIdx = officers.findIndex(x => x.id === o.id);
                      const color = OFFICER_COLORS[globalIdx % OFFICER_COLORS.length];
                      return (
                        <Line key={o.id} type="monotone" dataKey={o.id} name={o.id} stroke={color} strokeWidth={2.5}
                          dot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                        />
                      );
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* OUTSTANDING BY OFFICER — bar chart snapshot */}
              {overviewChartType === 'outstanding_by_officer' && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={outstandingBarData.filter(d => activeOfficerIds === null || activeOfficerIds.has(d.officer_id))}
                    margin={{ top: 16, right: 16, left: 4, bottom: 4 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const entry = outstandingBarData.find(d => d.name === label);
                        const clients = entry ? (officerClientsDetail.get(entry.officer_id) ?? []) : [];
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[210px] max-w-[290px]">
                            <p className="font-semibold text-slate-700 mb-1.5 border-b border-slate-100 pb-1.5">{entry?.fullName ?? label}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-slate-500">Total outstanding</span>
                              <span className="font-bold text-slate-800 ml-auto">{fmtINR(payload[0].value as number)}</span>
                            </div>
                            {clients.length > 0 && (
                              <div className="border-t border-slate-100 pt-1.5">
                                <p className="text-slate-400 mb-1.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {clients.map((c, ci) => (
                                    <div key={ci} className="flex items-start gap-1.5">
                                      <span className="text-slate-300 mt-px">•</span>
                                      <span className="text-slate-500 flex-1 leading-tight">
                                        {c.dealerName}{c.branch ? ` · ${c.branch}` : ''}
                                      </span>
                                      {c.outstanding > 0 && (
                                        <span className="font-semibold text-slate-700 ml-2 whitespace-nowrap">{fmtINR(c.outstanding)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {outstandingBarData
                        .filter(d => activeOfficerIds === null || activeOfficerIds.has(d.officer_id))
                        .map(entry => {
                          const idx = officers.findIndex(o => o.id === entry.officer_id);
                          return <Cell key={entry.officer_id} fill={OFFICER_COLORS[idx % OFFICER_COLORS.length]} />;
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* New Clients breakdown table — visible in new_clients mode */}
          {overviewChartType === 'new_clients' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  New Clients — Assignment Details
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (clients assigned to officers in selected period)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {newClientsTableData.size === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No new clients in the selected period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    {[...newClientsTableData.entries()].map(([year, monthMap]) => (
                      <div key={year}>
                        {/* Year header */}
                        <div className="px-4 py-2 bg-slate-50 border-y border-slate-200">
                          <span className="text-sm font-bold text-slate-700">{year}</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Branch</TableHead>
                              <TableHead>Sales Officer</TableHead>
                              <TableHead>Assigned Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...monthMap.entries()].map(([monthKey, rows]) => {
                              const [y, mo] = monthKey.split('-').map(Number);
                              const monthName = new Date(y, mo - 1, 1).toLocaleString('default', { month: 'long' });
                              return rows.map((row, rowIdx) => {
                                const globalOfficerIdx = officers.findIndex(o => o.id === row.officerId);
                                const officerColor = globalOfficerIdx >= 0 ? OFFICER_COLORS[globalOfficerIdx % OFFICER_COLORS.length] : '#94a3b8';
                                return (
                                  <TableRow key={`${monthKey}-${row.dealerName}-${row.branch}-${rowIdx}`}>
                                    <TableCell className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                      {rowIdx === 0 ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          {monthName}
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                                            {rows.length}
                                          </span>
                                        </span>
                                      ) : null}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">{row.dealerName}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{row.branch || '—'}</TableCell>
                                    <TableCell>
                                      {row.officerId ? (
                                        <span className="inline-flex items-center gap-1.5 text-sm">
                                          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: officerColor }} />
                                          {row.officerName}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-slate-600">{row.first_date}</TableCell>
                                  </TableRow>
                                );
                              });
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Officer performance table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Officer Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Cases This Month</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officerPerformanceStats.map((s, idx) => (
                    <TableRow key={s.officer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOfficerId(s.officer.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: OFFICER_COLORS[idx % OFFICER_COLORS.length] }} />
                          <span className="font-medium text-sm">{s.officer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{s.clients}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{s.casesThisMonth.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{fmtINR(s.outstanding)}</TableCell>
                      <TableCell className="text-right">
                        {s.overdue > 0 ? <Badge variant="destructive" className="text-xs">{s.overdue}</Badge> : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── PER-OFFICER DASHBOARD ─────────────────────────────────────────── */}
      {selectedOfficer && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Total Clients" value={stats.totalClients} icon={Users} accent={officerColor} />
            <StatCard title="Cases This Month" value={stats.casesThisMonth.toLocaleString('en-IN')} icon={Package} accent={officerColor} />
            <StatCard title="New Clients This Month" value={stats.newThisMonth} icon={UserPlus} accent={officerColor} />
            <StatCard title="Total Outstanding" value={fmtINR(stats.totalOutstanding)} icon={TrendingUp} accent={officerColor} />
            <StatCard title="Overdue Clients" value={stats.overdueCount} icon={AlertTriangle} sub="No payment in 60+ days" highlight={stats.overdueCount > 0} accent={stats.overdueCount > 0 ? '#dc2626' : officerColor} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Month-over-Month — {selectedOfficer.name}</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Performance trend over selected period</p>
                </div>
                <div className="flex items-center gap-2">
                  {periodSelector}
                  <Select value={chartMetric} onValueChange={v => setChartMetric(v as ChartMetric)}>
                    <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_clients">New Clients</SelectItem>
                      <SelectItem value="cases">Cases Sold</SelectItem>
                      <SelectItem value="revenue">Revenue (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {momTransactions.length === 0 && firstSaleData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No sales data in the selected period</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={momChartData} margin={{ top: 28, right: 16, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={chartMetric === 'revenue' ? (v: number) => `₹${(v / 1000).toFixed(0)}k` : undefined}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                      content={({ active, payload, label }) => (
                        <ChartTooltip
                          active={active}
                          payload={payload?.map(p => ({ name: chartMetric === 'new_clients' ? 'New Clients' : chartMetric === 'cases' ? 'Cases' : 'Revenue', value: p.value as number, color: officerColor }))}
                          label={label}
                          isMonetary={chartMetric === 'revenue'}
                        />
                      )}
                    />
                    <Line type="monotone" dataKey="value" stroke={officerColor} strokeWidth={2.5}
                      dot={{ r: 5, fill: officerColor, strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
                      label={makeDotLabel(officerColor, chartMetric === 'revenue' ? (v) => `₹${(v / 1000).toFixed(0)}k` : undefined)}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                All Clients — Outstanding Balances
                <span className="ml-2 text-sm font-normal text-muted-foreground">({officerRows.length} with balance)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {receivablesLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : officerRows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No clients with outstanding balance.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...officerRows].sort((a, b) => b.outstanding - a.outstanding).map(r => (
                        <TableRow key={r.key}>
                          <TableCell className="font-medium">{r.dealerName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.branch}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmtINR(r.outstanding)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.lastPaymentDate ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={r.paymentStatus === 'OVERDUE' || r.paymentStatus === 'No Payments' ? 'destructive' : r.paymentStatus === 'DUE SOON' ? 'secondary' : 'outline'} className="text-xs">
                              {r.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {overdueRows.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />Overdue Clients — No Payment in 60+ Days
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Days Since Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...overdueRows].sort((a, b) => b.outstanding - a.outstanding).map(r => {
                        const daysSince = r.lastPaymentDate ? Math.round((Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000) : null;
                        return (
                          <TableRow key={r.key}>
                            <TableCell className="font-medium">{r.dealerName}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{r.branch}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmtINR(r.outstanding)}</TableCell>
                            <TableCell className="text-sm">{r.lastPaymentDate ?? 'Never'}</TableCell>
                            <TableCell>
                              <span className="text-destructive font-medium text-sm">
                                {daysSince !== null ? `${daysSince} days` : 'Never paid'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Manage Officers ────────────────────────────────────────────────── */}
      <Dialog open={showManageOfficers} onOpenChange={setShowManageOfficers}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Manage Sales Officers</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Officer name" value={newOfficerName} onChange={e => setNewOfficerName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newOfficerName.trim()) addOfficerMutation.mutate(newOfficerName.trim()); }}
              />
              <Button type="button" onClick={() => newOfficerName.trim() && addOfficerMutation.mutate(newOfficerName.trim())} disabled={!newOfficerName.trim() || addOfficerMutation.isPending} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {officers.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-6">No officers yet</p>
                : officers.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-3 py-2 rounded-md border">
                    <span className="text-sm font-medium">{o.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeOfficerMutation.mutate(o.id)} disabled={removeOfficerMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Clients ─────────────────────────────────────────────────── */}
      <Dialog open={showAssignClients} onOpenChange={v => { setShowAssignClients(v); if (!v) setAssignSearch(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-4">
          <DialogHeader><DialogTitle>Assign Clients to Sales Officers</DialogTitle></DialogHeader>
          <Input placeholder="Search clients or branches…" value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
          <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead><TableHead>Branch</TableHead><TableHead>Sales Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientPairs.length === 0
                  ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No clients found</TableCell></TableRow>
                  : filteredClientPairs.map(p => {
                    const mapping = getMappingForClient(p.client_name, p.branch);
                    return (
                      <TableRow key={`${p.client_name}|||${p.branch}`}>
                        <TableCell className="font-medium text-sm">{p.client_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.branch}</TableCell>
                        <TableCell>
                          <Select value={mapping?.officer_id ?? '__none__'} onValueChange={v => assignOfficerMutation.mutate({ client_name: p.client_name, branch: p.branch, officer_id: v === '__none__' ? null : v })}>
                            <SelectTrigger className="h-8 w-48 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {officers.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                }
              </TableBody>
            </Table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAssignClients(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
