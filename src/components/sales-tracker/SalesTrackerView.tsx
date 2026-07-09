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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  Users, TrendingUp, Package, UserPlus, AlertTriangle,
  Plus, Trash2, Settings, UserCheck,
} from 'lucide-react';
import { fetchReceivablesTracking } from '@/lib/receivablesUtils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SalesOfficer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface ClientOfficerMapping {
  client_name: string;
  branch: string;
  officer_id: string;
  assigned_at: string;
}

interface MomTx {
  transaction_date: string;
  quantity: number | null;
  customer_id: string;
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  title, value, icon: Icon, sub, highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-destructive' : ''}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className={`h-5 w-5 flex-shrink-0 mt-1 ${highlight ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SalesTrackerView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [showManageOfficers, setShowManageOfficers] = useState(false);
  const [showAssignClients, setShowAssignClients] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [assignSearch, setAssignSearch] = useState('');

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: officers = [], isLoading: officersLoading } = useQuery({
    queryKey: ['sales-officers'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('sales_officers').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as SalesOfficer[];
    },
    staleTime: 30000,
  });

  const { data: allMappings = [] } = useQuery({
    queryKey: ['customer-sales-officer'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('customer_sales_officer').select('*');
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

  // All distinct (client_name, branch) pairs for Assign Clients dialog
  const { data: allClientPairs = [] } = useQuery({
    queryKey: ['distinct-client-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('client_name, branch')
        .eq('is_active', true);
      if (error) throw error;
      const seen = new Set<string>();
      const pairs: { client_name: string; branch: string }[] = [];
      for (const r of (data ?? [])) {
        const key = `${r.client_name}|||${r.branch ?? ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ client_name: r.client_name as string, branch: (r.branch ?? '') as string });
        }
      }
      return pairs.sort((a, b) => a.client_name.localeCompare(b.client_name));
    },
    enabled: showAssignClients,
    staleTime: 60000,
  });

  // ── Derived: officer's clients & receivables rows ──────────────────────────

  const officerMappings = useMemo(
    () => allMappings.filter(m => m.officer_id === selectedOfficerId),
    [allMappings, selectedOfficerId],
  );

  const officerClientKeys = useMemo(() => {
    const set = new Set<string>();
    for (const m of officerMappings) {
      set.add(`${m.client_name.toLowerCase()}|||${(m.branch ?? '').toLowerCase()}`);
    }
    return set;
  }, [officerMappings]);

  const officerRows = useMemo(() => {
    if (!selectedOfficerId) return [];
    return (receivablesData?.rows ?? []).filter(r =>
      officerClientKeys.has(`${r.dealerName.toLowerCase()}|||${r.branch.toLowerCase()}`),
    );
  }, [receivablesData, officerClientKeys, selectedOfficerId]);

  // MoM transactions for officer's customers with outstanding (last 6 months)
  const officerCustomerIds = useMemo(() => officerRows.map(r => r.customerId), [officerRows]);

  const { data: momTransactions = [] } = useQuery({
    queryKey: ['officer-mom-transactions', selectedOfficerId, officerCustomerIds.join(',')],
    queryFn: async (): Promise<MomTx[]> => {
      if (!officerCustomerIds.length) return [];
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      const from = d.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('transaction_date, quantity, customer_id')
        .eq('transaction_type', 'sale')
        .in('customer_id', officerCustomerIds)
        .gte('transaction_date', from);
      if (error) throw error;
      return (data ?? []) as MomTx[];
    },
    enabled: !!selectedOfficerId && officerCustomerIds.length > 0,
    staleTime: 0,
  });

  // ── Stats ────────────────────────────────────────────────────────────────────

  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  const stats = useMemo(() => {
    const totalClients = officerMappings.length;

    const casesThisMonth = momTransactions
      .filter(t => t.transaction_date?.startsWith(currentMonthStr))
      .reduce((s, t) => s + (t.quantity ?? 0), 0);

    const totalOutstanding = officerRows.reduce((s, r) => s + r.outstanding, 0);

    const overdueCount = officerRows.filter(r => {
      if (!r.lastPaymentDate) return true;
      const days = (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000;
      return days > 60;
    }).length;

    const newThisMonth = officerMappings.filter(
      m => (m.assigned_at ?? '').startsWith(currentMonthStr),
    ).length;

    return { totalClients, casesThisMonth, totalOutstanding, overdueCount, newThisMonth };
  }, [officerMappings, momTransactions, officerRows, currentMonthStr]);

  // MoM chart: last 6 months
  const momChartData = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months[d.toISOString().substring(0, 7)] = 0;
    }
    for (const t of momTransactions) {
      const m = t.transaction_date?.substring(0, 7);
      if (m && m in months) months[m] += t.quantity ?? 0;
    }
    return Object.entries(months).map(([key, cases]) => ({
      month: new Date(key + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      cases,
    }));
  }, [momTransactions]);

  // Overdue = outstanding > 0 AND (never paid OR last payment > 60 days ago)
  const overdueRows = useMemo(() => officerRows.filter(r => {
    if (!r.lastPaymentDate) return true;
    const days = (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000;
    return days > 60;
  }), [officerRows]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addOfficerMutation = useMutation({
    mutationFn: async (name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('sales_officers').insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-officers'] });
      setNewOfficerName('');
      toast({ title: 'Officer added' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeOfficerMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('sales_officers').update({ is_active: false }).eq('id', id);
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
    mutationFn: async ({
      client_name, branch, officer_id,
    }: { client_name: string; branch: string; officer_id: string | null }) => {
      if (!officer_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('customer_sales_officer')
          .delete()
          .eq('client_name', client_name)
          .eq('branch', branch);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('customer_sales_officer')
          .upsert({ client_name, branch, officer_id }, { onConflict: 'client_name,branch' });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-sales-officer'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const getMappingForClient = useCallback(
    (clientName: string, branch: string) =>
      allMappings.find(m => m.client_name === clientName && m.branch === branch),
    [allMappings],
  );

  const filteredClientPairs = useMemo(() => {
    if (!assignSearch.trim()) return allClientPairs;
    const q = assignSearch.toLowerCase();
    return allClientPairs.filter(
      p => p.client_name.toLowerCase().includes(q) || p.branch.toLowerCase().includes(q),
    );
  }, [allClientPairs, assignSearch]);

  const selectedOfficer = officers.find(o => o.id === selectedOfficerId);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sales Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Track sales officer performance and client assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowManageOfficers(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Officers
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAssignClients(true)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Clients
          </Button>
        </div>
      </div>

      {/* Officer selector */}
      {officersLoading ? (
        <p className="text-sm text-muted-foreground">Loading officers…</p>
      ) : officers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No sales officers yet. Click &quot;Manage Officers&quot; to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {officers.map(o => {
            const count = allMappings.filter(m => m.officer_id === o.id).length;
            return (
              <Button
                key={o.id}
                variant={selectedOfficerId === o.id ? 'default' : 'outline'}
                onClick={() => setSelectedOfficerId(selectedOfficerId === o.id ? null : o.id)}
                className="gap-2"
              >
                {o.name}
                <Badge
                  variant={selectedOfficerId === o.id ? 'secondary' : 'outline'}
                  className="text-xs px-1.5"
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      )}

      {/* ── Officer dashboard ─────────────────────────────────────────────── */}
      {selectedOfficer && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Total Clients" value={stats.totalClients} icon={Users} />
            <StatCard
              title="Cases This Month"
              value={stats.casesThisMonth.toLocaleString('en-IN')}
              icon={Package}
            />
            <StatCard
              title="New Clients This Month"
              value={stats.newThisMonth}
              icon={UserPlus}
            />
            <StatCard
              title="Total Outstanding"
              value={fmtINR(stats.totalOutstanding)}
              icon={TrendingUp}
            />
            <StatCard
              title="Overdue Clients"
              value={stats.overdueCount}
              icon={AlertTriangle}
              sub="No payment in 60+ days"
              highlight={stats.overdueCount > 0}
            />
          </div>

          {/* MoM Cases Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Month-over-Month Cases — {selectedOfficer.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {momTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No sales data in the last 6 months
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={momChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`${v} cases`, 'Cases']} />
                    <Bar dataKey="cases" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* All Clients — Outstanding Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                All Clients — Outstanding Balances
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({officerRows.length} with balance)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {receivablesLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : officerRows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No clients with outstanding balance.
                </p>
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
                      {[...officerRows]
                        .sort((a, b) => b.outstanding - a.outstanding)
                        .map(r => (
                          <TableRow key={r.key}>
                            <TableCell className="font-medium">{r.dealerName}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{r.branch}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmtINR(r.outstanding)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.lastPaymentDate ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  r.paymentStatus === 'OVERDUE'
                                    ? 'destructive'
                                    : r.paymentStatus === 'DUE SOON'
                                    ? 'secondary'
                                    : r.paymentStatus === 'No Payments'
                                    ? 'destructive'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
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

          {/* Overdue Clients Table */}
          {overdueRows.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue Clients — No Payment in 60+ Days
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
                      {[...overdueRows]
                        .sort((a, b) => b.outstanding - a.outstanding)
                        .map(r => {
                          const daysSince = r.lastPaymentDate
                            ? Math.round(
                                (Date.now() - new Date(r.lastPaymentDate).getTime()) / 86400000,
                              )
                            : null;
                          return (
                            <TableRow key={r.key}>
                              <TableCell className="font-medium">{r.dealerName}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {r.branch}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtINR(r.outstanding)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {r.lastPaymentDate ?? 'Never'}
                              </TableCell>
                              <TableCell>
                                {daysSince !== null ? (
                                  <span className="text-destructive font-medium text-sm">
                                    {daysSince} days
                                  </span>
                                ) : (
                                  <span className="text-destructive font-medium text-sm">
                                    Never paid
                                  </span>
                                )}
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

      {/* ── Manage Officers Dialog ────────────────────────────────────────────── */}
      <Dialog open={showManageOfficers} onOpenChange={setShowManageOfficers}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Sales Officers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Officer name"
                value={newOfficerName}
                onChange={e => setNewOfficerName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOfficerName.trim()) {
                    addOfficerMutation.mutate(newOfficerName.trim());
                  }
                }}
              />
              <Button
                onClick={() =>
                  newOfficerName.trim() && addOfficerMutation.mutate(newOfficerName.trim())
                }
                disabled={!newOfficerName.trim() || addOfficerMutation.isPending}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {officers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No officers yet</p>
              ) : (
                officers.map(o => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md border"
                  >
                    <span className="text-sm font-medium">{o.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeOfficerMutation.mutate(o.id)}
                      disabled={removeOfficerMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Clients Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showAssignClients} onOpenChange={v => { setShowAssignClients(v); if (!v) setAssignSearch(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Assign Clients to Sales Officers</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search clients or branches…"
            value={assignSearch}
            onChange={e => setAssignSearch(e.target.value)}
          />
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
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientPairs.map(p => {
                    const mapping = getMappingForClient(p.client_name, p.branch);
                    return (
                      <TableRow key={`${p.client_name}|||${p.branch}`}>
                        <TableCell className="font-medium text-sm">{p.client_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.branch}</TableCell>
                        <TableCell>
                          <Select
                            value={mapping?.officer_id ?? '__none__'}
                            onValueChange={v =>
                              assignOfficerMutation.mutate({
                                client_name: p.client_name,
                                branch: p.branch,
                                officer_id: v === '__none__' ? null : v,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-48 text-sm">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {officers.map(o => (
                                <SelectItem key={o.id} value={o.id}>
                                  {o.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignClients(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
