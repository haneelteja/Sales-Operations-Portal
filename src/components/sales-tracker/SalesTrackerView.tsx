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
  Users, TrendingUp, Package, UserPlus, AlertTriangle,
  Plus, Trash2, Settings, UserCheck,
} from 'lucide-react';
import { fetchReceivablesTracking } from '@/lib/receivablesUtils';

// ── Constants ──────────────────────────────────────────────────────────────────

const OFFICER_COLORS = ['#7c3aed', '#059669', '#d97706', '#0284c7', '#dc2626', '#0891b2', '#ca8a04', '#be185d'];

// ── Types ──────────────────────────────────────────────────────────────────────

type ChartMetric = 'cases' | 'new_clients' | 'revenue';

interface SalesOfficer { id: string; name: string; is_active: boolean; created_at: string; }
interface ClientOfficerMapping { client_name: string; branch: string; officer_id: string; assigned_at: string; }
interface MomTx { transaction_date: string; quantity: number | null; customer_id: string; amount: number | null; }

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
          <div
            className="rounded-lg p-2 mt-0.5 flex-shrink-0"
            style={{ background: accent ? `${accent}18` : 'hsl(var(--muted))' }}
          >
            <Icon className="h-4 w-4" style={{ color: accent ?? 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, metric }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  metric?: ChartMetric | 'overview' | 'outstanding';
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 truncate">{p.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto pl-2">
            {metric === 'revenue' || metric === 'outstanding'
              ? `₹${Math.round(p.value).toLocaleString('en-IN')}`
              : p.value.toLocaleString('en-IN')}
          </span>
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>('new_clients');
  const [chartMonths, setChartMonths] = useState(6);
  const [overviewMetric, setOverviewMetric] = useState<'cases' | 'outstanding'>('cases');

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: officers = [], isLoading: officersLoading } = useQuery({
    queryKey: ['sales-officers'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from('sales_officers').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as SalesOfficer[];
    },
    staleTime: 30000,
  });

  const { data: allMappings = [] } = useQuery({
    queryKey: ['customer-sales-officer'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from('customer_sales_officer').select('*');
      if (error) throw error;
      return (data ?? []) as ClientOfficerMapping[];
    },
    staleTime: 30000,
  });

  const { data: receivablesData, isLoading: receivablesLoading } = useQuery({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  // ── Queries: per-officer MoM ─────────────────────────────────────────────

  const { data: momTransactions = [] } = useQuery({
    queryKey: ['officer-mom-transactions', selectedOfficerId, officerCustomerIds.join(','), chartMonths],
    queryFn: async (): Promise<MomTx[]> => {
      if (!officerCustomerIds.length) return [];
      const d = new Date(); d.setMonth(d.getMonth() - (chartMonths - 1)); d.setDate(1);
      const from = d.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_transactions').select('transaction_date, quantity, customer_id, amount')
        .eq('transaction_type', 'sale').in('customer_id', officerCustomerIds).gte('transaction_date', from);
      if (error) throw error;
      return (data ?? []) as MomTx[];
    },
    enabled: !!selectedOfficerId && officerCustomerIds.length > 0,
    staleTime: 0,
  });

  const { data: firstSaleData = [] } = useQuery({
    queryKey: ['officer-first-sales', selectedOfficerId, officerCustomerIds.join(',')],
    queryFn: async (): Promise<{ customer_id: string; first_date: string }[]> => {
      if (!officerCustomerIds.length) return [];
      const { data, error } = await supabase
        .from('sales_transactions').select('customer_id, transaction_date')
        .eq('transaction_type', 'sale').in('customer_id', officerCustomerIds).order('transaction_date', { ascending: true });
      if (error) throw error;
      const map = new Map<string, string>();
      for (const t of (data ?? [])) { if (!map.has(t.customer_id)) map.set(t.customer_id, t.transaction_date); }
      return [...map.entries()].map(([customer_id, first_date]) => ({ customer_id, first_date }));
    },
    enabled: !!selectedOfficerId && officerCustomerIds.length > 0,
    staleTime: 60000,
  });

  // ── Derived: overview ─────────────────────────────────────────────────────

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

  const { data: overviewTransactions = [] } = useQuery({
    queryKey: ['overview-mom-transactions', allMappedCustomerIds.join(','), chartMonths],
    queryFn: async (): Promise<MomTx[]> => {
      if (!allMappedCustomerIds.length) return [];
      const d = new Date(); d.setMonth(d.getMonth() - (chartMonths - 1)); d.setDate(1);
      const from = d.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_transactions').select('transaction_date, quantity, customer_id, amount')
        .eq('transaction_type', 'sale').in('customer_id', allMappedCustomerIds).gte('transaction_date', from);
      if (error) throw error;
      return (data ?? []) as MomTx[];
    },
    enabled: !selectedOfficerId && allMappedCustomerIds.length > 0,
    staleTime: 0,
  });

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

  // ── Chart data ────────────────────────────────────────────────────────────

  const buildMonthKeys = (n: number) => {
    const keys: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      keys.push(d.toISOString().substring(0, 7));
    }
    return keys;
  };

  const monthLabel = (key: string) => {
    const [y, mo] = key.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const overviewChartData = useMemo(() => {
    const keys = buildMonthKeys(chartMonths);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewTransactions, officers, customerIdToOfficer, chartMonths]);

  const officerComparisonData = useMemo(() =>
    officerPerformanceStats.map(s => ({
      name: s.officer.name.split(' ')[0],
      fullName: s.officer.name,
      value: overviewMetric === 'cases' ? s.casesThisMonth : Math.round(s.outstanding),
      officer_id: s.officer.id,
    })),
  [officerPerformanceStats, overviewMetric]);

  const momChartData = useMemo(() => {
    const keys = buildMonthKeys(chartMonths);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momTransactions, firstSaleData, chartMetric, chartMonths]);

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
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ['sales-officers'] }); if (selectedOfficerId === id) setSelectedOfficerId(null); toast({ title: 'Officer removed' }); },
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

  // ── Render ───────────────────────────────────────────────────────────────────

  const periodSelector = (
    <Select value={String(chartMonths)} onValueChange={v => setChartMonths(Number(v))}>
      <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="3">Last 3 months</SelectItem>
        <SelectItem value="6">Last 6 months</SelectItem>
        <SelectItem value="12">Last 12 months</SelectItem>
      </SelectContent>
    </Select>
  );

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

      {/* ── OVERVIEW (no officer selected) ──────────────────────────────────── */}
      {!selectedOfficer && officers.length > 0 && (
        <>
          {/* Team stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Active Officers" value={officers.length} icon={Users} accent="#7c3aed" />
            <StatCard title="Assigned Clients" value={teamStats.totalClients} icon={UserCheck} accent="#059669" />
            <StatCard title="Cases This Month" value={teamStats.casesThisMonth.toLocaleString('en-IN')} icon={Package} accent="#d97706" />
            <StatCard title="Team Outstanding" value={fmtINR(teamStats.totalOutstanding)} icon={TrendingUp} accent="#0284c7" />
          </div>

          {/* Officer comparison bar chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Officer Comparison</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Side-by-side performance this month</p>
                </div>
                <Select value={overviewMetric} onValueChange={v => setOverviewMetric(v as 'cases' | 'outstanding')}>
                  <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cases">Cases This Month</SelectItem>
                    <SelectItem value="outstanding">Outstanding (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={officerComparisonData} margin={{ top: 16, right: 16, left: 4, bottom: 4 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={overviewMetric === 'outstanding' ? (v: number) => `₹${(v / 1000).toFixed(0)}k` : undefined}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const entry = officerComparisonData.find(d => d.name === label);
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold text-slate-700 mb-1">{entry?.fullName ?? label}</p>
                          <p className="text-slate-600">
                            {overviewMetric === 'outstanding'
                              ? fmtINR(payload[0].value as number)
                              : `${payload[0].value} cases`}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {officerComparisonData.map((entry) => {
                      const idx = officers.findIndex(o => o.id === entry.officer_id);
                      return <Cell key={entry.officer_id} fill={OFFICER_COLORS[idx % OFFICER_COLORS.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cases trend — multi-line per officer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Cases Trend by Officer</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Month-over-month cases per sales officer</p>
                </div>
                {periodSelector}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={overviewChartData} margin={{ top: 28, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload?.map(p => ({
                          name: officers.find(o => o.id === String(p.dataKey))?.name ?? String(p.dataKey),
                          value: p.value as number,
                          color: p.color ?? '#888',
                        }))}
                        label={label}
                        metric="overview"
                      />
                    )}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-slate-600">{officers.find(o => o.id === value)?.name ?? value}</span>}
                    wrapperStyle={{ paddingTop: 12 }}
                  />
                  {officers.map((o, idx) => (
                    <Line
                      key={o.id} type="monotone" dataKey={o.id} name={o.id}
                      stroke={OFFICER_COLORS[idx % OFFICER_COLORS.length]} strokeWidth={2.5}
                      dot={{ r: 4, fill: OFFICER_COLORS[idx % OFFICER_COLORS.length], strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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

      {/* ── PER-OFFICER DASHBOARD ──────────────────────────────────────────── */}
      {selectedOfficer && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Total Clients" value={stats.totalClients} icon={Users} accent={officerColor} />
            <StatCard title="Cases This Month" value={stats.casesThisMonth.toLocaleString('en-IN')} icon={Package} accent={officerColor} />
            <StatCard title="New Clients This Month" value={stats.newThisMonth} icon={UserPlus} accent={officerColor} />
            <StatCard title="Total Outstanding" value={fmtINR(stats.totalOutstanding)} icon={TrendingUp} accent={officerColor} />
            <StatCard title="Overdue Clients" value={stats.overdueCount} icon={AlertTriangle} sub="No payment in 60+ days" highlight={stats.overdueCount > 0} accent={stats.overdueCount > 0 ? '#dc2626' : officerColor} />
          </div>

          {/* MoM chart — styled line */}
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
                          payload={payload?.map(p => ({
                            name: chartMetric === 'new_clients' ? 'New Clients' : chartMetric === 'cases' ? 'Cases' : 'Revenue',
                            value: p.value as number,
                            color: officerColor,
                          }))}
                          label={label}
                          metric={chartMetric}
                        />
                      )}
                    />
                    <Line
                      type="monotone" dataKey="value" stroke={officerColor} strokeWidth={2.5}
                      dot={{ r: 5, fill: officerColor, strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Outstanding table */}
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

          {/* Overdue table */}
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
              <Input
                placeholder="Officer name" value={newOfficerName}
                onChange={e => setNewOfficerName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newOfficerName.trim()) addOfficerMutation.mutate(newOfficerName.trim()); }}
              />
              <Button onClick={() => newOfficerName.trim() && addOfficerMutation.mutate(newOfficerName.trim())} disabled={!newOfficerName.trim() || addOfficerMutation.isPending} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {officers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No officers yet</p>
              ) : officers.map(o => (
                <div key={o.id} className="flex items-center justify-between px-3 py-2 rounded-md border">
                  <span className="text-sm font-medium">{o.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeOfficerMutation.mutate(o.id)} disabled={removeOfficerMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Clients ────────────────────────────────────────────────── */}
      <Dialog open={showAssignClients} onOpenChange={v => { setShowAssignClients(v); if (!v) setAssignSearch(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-4">
          <DialogHeader><DialogTitle>Assign Clients to Sales Officers</DialogTitle></DialogHeader>
          <Input placeholder="Search clients or branches…" value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
          <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Sales Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientPairs.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No clients found</TableCell></TableRow>
                ) : filteredClientPairs.map(p => {
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
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAssignClients(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
