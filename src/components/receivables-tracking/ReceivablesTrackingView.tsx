import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAction } from '@/lib/auditLogger';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, TrendingUp, Download, Search, Loader2, StickyNote, X, Wallet, Receipt, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type ExcelJS from 'exceljs';
import { importExcelJS } from '@/lib/heavyImports';
import { LedgerDrawer } from './LedgerDrawer';
import { FollowupNotesDrawer } from './FollowupNotesDrawer';
import { fetchReceivablesTracking, type RawRow, type FetchResult } from '@/lib/receivablesUtils';

// ── Types ────────────────────────────────────────────────────────────────────

type SortCol = 'name' | 'outstanding' | 'expectedNext' | 'daysOverdue' | 'pmtStatus' | 'followup' | 'assignee';

interface AssigneeEntry { name: string; bgClass: string; }

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSIGNEE_PALETTE_CLASSES = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivablesTrackingView() {
  const [sortCol, setSortCol] = useState<SortCol>('followup');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterClient, setFilterClient] = useState('');
  const [filterMinOutstanding, setFilterMinOutstanding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNotes, setFilterNotes] = useState('');
  const [filterFollowupStatus, setFilterFollowupStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [activeNotes, setActiveNotes] = useState<{
    customerId: string;
    dealerName: string;
    branch: string;
    outstanding: number;
    key: string;
  } | null>(null);

  const [activeLedger, setActiveLedger] = useState<{
    customerId: string;
    dealerName: string;
    branch: string;
    outstanding: number;
  } | null>(null);

  const { data, isLoading } = useQuery<FetchResult>({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  const { data: customerAssignees = [] } = useQuery({
    queryKey: ['customer-assignees'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('customer_assignee')
        .select('customer_id, assignee_name');
      if (error) throw error;
      return rows ?? [];
    },
    staleTime: 30000,
  });

  const { data: assigneeListRaw } = useQuery({
    queryKey: ['assignee-list-config'],
    queryFn: async () => {
      const { data: row } = await supabase
        .from('invoice_configurations')
        .select('config_value')
        .eq('config_key', 'assignee_list')
        .maybeSingle();
      return row?.config_value ?? '[]';
    },
    staleTime: 60000,
  });

  const assigneeList: AssigneeEntry[] = useMemo(() => {
    try {
      const parsed = JSON.parse(assigneeListRaw ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.map((x, i): AssigneeEntry | null => {
        const defaultBg = ASSIGNEE_PALETTE_CLASSES[i % ASSIGNEE_PALETTE_CLASSES.length];
        if (typeof x === 'string') return { name: x, bgClass: defaultBg };
        if (x && typeof x.name === 'string') return { name: x.name, bgClass: x.bgClass || defaultBg };
        return null;
      }).filter((x): x is AssigneeEntry => x !== null && x.name !== '');
    } catch {
      return [];
    }
  }, [assigneeListRaw]);

  const assigneeMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of customerAssignees) {
      map[row.customer_id] = row.assignee_name;
    }
    return map;
  }, [customerAssignees]);

  const assigneeMutation = useMutation({
    mutationFn: async ({ customer_id, assignee_name }: { customer_id: string; assignee_name: string | null }) => {
      if (!assignee_name) {
        const { error } = await supabase.from('customer_assignee').delete().eq('customer_id', customer_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customer_assignee').upsert(
          { customer_id, assignee_name, updated_at: new Date().toISOString() },
          { onConflict: 'customer_id' }
        );
        if (error) throw error;
      }
    },
    onSuccess: (_result, variables) => {
      logAction({ action: 'UPDATE', entityType: 'customer_assignee', description: `Assignee updated for customer ${variables.customer_id}: ${variables.assignee_name ?? 'unassigned'}`, newValues: { customer_id: variables.customer_id, assignee_name: variables.assignee_name } });
      queryClient.invalidateQueries({ queryKey: ['customer-assignees'] });
    },
  });

  const handleAssigneeChange = useCallback((customerId: string, name: string | null) => {
    assigneeMutation.mutate({ customer_id: customerId, assignee_name: name });
  }, [assigneeMutation]);

  const { toast } = useToast();

  const clearFollowupDateMutation = useMutation({
    mutationFn: async ({ dealerName, branch }: { dealerName: string; branch: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('client_followups')
        .update({ next_followup_date: null, updated_at: new Date().toISOString() })
        .eq('dealer_name', dealerName)
        .eq('branch', branch);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables-tracking'] });
      toast({ title: 'Follow-up date cleared' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleSort = useCallback((col: SortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }, [sortCol]);

  const displayRows = useMemo(() => {
    if (!data?.rows) return [];

    let rows = data.rows.map(row => {
      const isOverdue = row.outstanding > 0 && !!row.nextFollowupDate && row.nextFollowupDate < today;
      return { ...row, isOverdue };
    });

    if (filterClient.trim()) {
      const q = filterClient.toLowerCase();
      rows = rows.filter(r =>
        r.dealerName.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.comments.toLowerCase().includes(q)
      );
    }

    if (filterMinOutstanding.trim()) {
      const min = parseFloat(filterMinOutstanding.replace(/,/g, ''));
      if (!isNaN(min)) rows = rows.filter(r => r.outstanding >= min);
    }

    if (filterStatus) {
      rows = rows.filter(r => r.paymentStatus === filterStatus);
    }

    if (filterNotes.trim()) {
      const q = filterNotes.toLowerCase();
      rows = rows.filter(r => r.comments.toLowerCase().includes(q));
    }

    if (filterFollowupStatus) {
      const todayStr = today;
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
      switch (filterFollowupStatus) {
        case 'not_set':
          rows = rows.filter(r => !r.nextFollowupDate);
          break;
        case 'overdue':
          rows = rows.filter(r => !!r.nextFollowupDate && r.nextFollowupDate < todayStr);
          break;
        case 'upcoming':
          rows = rows.filter(r => !!r.nextFollowupDate && r.nextFollowupDate >= todayStr && r.nextFollowupDate <= sevenDaysStr);
          break;
        case 'set':
          rows = rows.filter(r => !!r.nextFollowupDate);
          break;
      }
    }

    if (filterAssignee) {
      if (filterAssignee === '__unassigned__') {
        rows = rows.filter(r => !assigneeMap[r.customerId]);
      } else {
        rows = rows.filter(r => assigneeMap[r.customerId] === filterAssignee);
      }
    }

    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'name': cmp = a.dealerName.localeCompare(b.dealerName); break;
        case 'outstanding': cmp = a.outstanding - b.outstanding; break;
        case 'expectedNext':
          cmp = (a.expectedNextPayment ?? '').localeCompare(b.expectedNextPayment ?? ''); break;
        case 'daysOverdue':
          cmp = (a.paymentDaysOverdue ?? -1) - (b.paymentDaysOverdue ?? -1); break;
        case 'pmtStatus': cmp = a.paymentStatus.localeCompare(b.paymentStatus); break;
        case 'followup':
          if (!a.nextFollowupDate && !b.nextFollowupDate) { cmp = 0; break; }
          if (!a.nextFollowupDate) { cmp = 1; break; }
          if (!b.nextFollowupDate) { cmp = -1; break; }
          cmp = a.nextFollowupDate.localeCompare(b.nextFollowupDate); break;
        case 'assignee':
          cmp = (assigneeMap[a.customerId] ?? '').localeCompare(assigneeMap[b.customerId] ?? ''); break;
        default: cmp = b.outstanding - a.outstanding;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data?.rows, filterClient, filterMinOutstanding, filterStatus, filterNotes, filterFollowupStatus, filterAssignee, sortCol, sortDir, assigneeMap, today]);

  const overdueCount = useMemo(
    () => displayRows.filter(r => r.isOverdue).length,
    [displayRows]
  );

  const totalOutstanding = useMemo(
    () => (data?.rows ?? []).reduce((sum, r) => sum + (r.outstanding ?? 0), 0),
    [data?.rows]
  );

  const handleExport = async () => {
    const ExcelJS = await importExcelJS();
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Aamodha Operations Portal';
    const ws = wb.addWorksheet('Receivables');

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    const overdueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    const normalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    ws.columns = [
      { key: 'client', width: 28 },
      { key: 'branch', width: 22 },
      { key: 'outstanding', width: 18 },
      { key: 'expectedNext', width: 22 },
      { key: 'daysOverdue', width: 16 },
      { key: 'pmtStatus', width: 18 },
      { key: 'comments', width: 40 },
      { key: 'followup', width: 18 },
      { key: 'assignee', width: 20 },
    ];

    ws.mergeCells('A1:I1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Receivables Tracker Report';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    ws.mergeCells('A2:I2');
    ws.getCell('A2').value = `Generated: ${new Date().toLocaleDateString('en-IN')}`;
    ws.getCell('A2').font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:I3');
    ws.getCell('A3').value = `Overdue Clients: ${overdueCount}   |   Collections This Month: ₹${(data?.collectionsThisMonth ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    ws.getCell('A3').font = { size: 10, color: { argb: 'FF333333' } };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]);

    const headerRow = ws.addRow([
      'Client', 'Branch', 'Outstanding (₹)',
      'Expected Next Payment', 'Payment Days Overdue',
      'Payment Status', 'Latest Note', 'Next Follow-up', 'Assignee',
    ]);
    headerRow.height = 20;
    headerRow.eachCell(cell => {
      cell.fill = headerFill;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    const fmtDateXlsx = (d: string | null) =>
      d ? new Date(d).toLocaleDateString('en-IN') : '—';

    for (const row of displayRows) {
      const dataRow = ws.addRow([
        row.dealerName,
        row.branch,
        row.outstanding,
        fmtDateXlsx(row.expectedNextPayment),
        row.paymentDaysOverdue !== null ? row.paymentDaysOverdue : 'N/A',
        row.paymentStatus,
        row.comments || '',
        row.nextFollowupDate ? new Date(row.nextFollowupDate).toLocaleDateString('en-IN') : '—',
        assigneeMap[row.customerId] || '—',
      ]);
      dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = row.isOverdue ? overdueFill : normalFill;
        cell.border = thinBorder;
        if (col === 3) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FFC00000' } };
        }
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receivables_${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';

  const getFollowupStyle = (dateStr: string | null | undefined): { badge: string; text: string } => {
    if (!dateStr) return { badge: 'bg-gray-100 text-gray-500 border-gray-200', text: 'text-gray-400' };
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff < 0) return { badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-600' };
    if (diff <= 1) return { badge: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-600' };
    return { badge: 'bg-green-100 text-green-700 border-green-200', text: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeRow = activeNotes ? displayRows.find(r => r.key === activeNotes.key) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Receivables Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track outstanding balances and follow-up schedules for all clients
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Clients</p>
                <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Outstanding &amp; follow-up date passed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 rounded-lg">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-3xl font-bold text-orange-600">
                  {fmt(totalOutstanding)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sum of all client balances
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collections This Month</p>
                <p className="text-3xl font-bold text-green-600">
                  {fmt(data?.collectionsThisMonth ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, branch, notes..."
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pmt Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="DUE SOON">Due Soon</SelectItem>
            <SelectItem value="ON TRACK">On Track</SelectItem>
            <SelectItem value="No Payments">No Payments</SelectItem>
            <SelectItem value="Only 1 Payment">Only 1 Payment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFollowupStatus || '__all__'} onValueChange={v => setFilterFollowupStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Follow-up" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Follow-ups</SelectItem>
            <SelectItem value="overdue">Follow-up Overdue</SelectItem>
            <SelectItem value="upcoming">Due in 7 Days</SelectItem>
            <SelectItem value="set">Has Follow-up Date</SelectItem>
            <SelectItem value="not_set">No Follow-up Set</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[140px]">
          <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-medium pointer-events-none">Min ₹</span>
          <Input
            placeholder="0"
            value={filterMinOutstanding}
            onChange={e => setFilterMinOutstanding(e.target.value.replace(/[^0-9.]/g, ''))}
            className="pl-12 w-[140px]"
            title="Minimum outstanding amount"
          />
        </div>

        {assigneeList.length > 0 && (
          <Select value={filterAssignee || '__all__'} onValueChange={v => setFilterAssignee(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Assignees</SelectItem>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {assigneeList.map(a => (
                <SelectItem key={a.name} value={a.name}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 inline-block ${a.bgClass}`} />
                    {a.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(filterClient || filterStatus || filterAssignee || filterMinOutstanding || filterFollowupStatus || filterNotes) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFilterClient('');
              setFilterStatus('');
              setFilterAssignee('');
              setFilterMinOutstanding('');
              setFilterFollowupStatus('');
              setFilterNotes('');
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      {displayRows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-md">
          {(filterClient || filterMinOutstanding || filterStatus || filterNotes || filterFollowupStatus || filterAssignee)
            ? 'No clients match the current filters.'
            : 'No clients with outstanding balances found.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b text-left">
                {(['name', 'outstanding', 'expectedNext', 'daysOverdue', 'pmtStatus', null, 'followup', 'assignee', null, null] as const).map((col, i) => {
                  const labels = ['Client Branch', 'Outstanding', 'Expected Next Pmt', 'Days Overdue', 'Pmt Status', 'Latest Note', 'Next Follow-up', 'Assignee', 'Log', 'Ledger'];
                  const rightAlign = i === 1 || i === 3;
                  const minW = i === 5 ? 'min-w-[240px]' : '';
                  if (!col) {
                    return <th key={i} className={`px-4 py-3 font-semibold whitespace-nowrap ${rightAlign ? 'text-right' : ''} ${minW}`}>{labels[i]}</th>;
                  }
                  const isActive = sortCol === col;
                  return (
                    <th
                      key={i}
                      className={`px-4 py-3 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-muted/80 transition-colors ${rightAlign ? 'text-right' : ''} ${minW}`}
                      onClick={() => handleSort(col as SortCol)}
                    >
                      <span className={`inline-flex items-center gap-1 ${rightAlign ? 'flex-row-reverse' : ''}`}>
                        {labels[i]}
                        {isActive
                          ? sortDir === 'asc'
                            ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                            : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                          : <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                        }
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <tr
                  key={row.key}
                  className={`border-b last:border-0 transition-colors ${
                    row.isOverdue ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Client Branch */}
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium leading-tight">{row.dealerName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{row.branch}</div>
                    {row.isOverdue && (
                      <Badge variant="destructive" className="mt-1.5 text-xs">
                        Overdue
                      </Badge>
                    )}
                  </td>

                  {/* Outstanding */}
                  <td className="px-4 py-3 text-right font-bold text-red-600 whitespace-nowrap align-top">
                    {fmt(row.outstanding)}
                  </td>

                  {/* Expected Next Payment */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {row.expectedNextPayment ? (
                      <span className="text-sm">{fmtDate(row.expectedNextPayment)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">N/A</span>
                    )}
                  </td>

                  {/* Payment Days Overdue */}
                  <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                    {row.paymentDaysOverdue === null ? (
                      <span className="text-muted-foreground/50">N/A</span>
                    ) : row.paymentDaysOverdue > 0 ? (
                      <span className="font-semibold text-red-600">{row.paymentDaysOverdue}d</span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {row.paymentStatus === 'OVERDUE' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">OVERDUE</span>
                    ) : row.paymentStatus === 'DUE SOON' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">DUE SOON</span>
                    ) : row.paymentStatus === 'ON TRACK' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ON TRACK</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.paymentStatus}</span>
                    )}
                  </td>

                  {/* Latest Note (read-only) */}
                  <td className="px-4 py-3 align-top max-w-xs">
                    {row.comments ? (
                      <p className="text-sm text-foreground line-clamp-2">{row.comments}</p>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">No notes yet</span>
                    )}
                  </td>

                  {/* Next Follow-up Date */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {(() => {
                      const style = getFollowupStyle(row.nextFollowupDate || null);
                      return row.nextFollowupDate ? (
                        <div className="flex items-center gap-1 group">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
                            {fmtDate(row.nextFollowupDate)}
                          </span>
                          <button
                            type="button"
                            title="Remove follow-up date"
                            onClick={() => clearFollowupDateMutation.mutate({ dealerName: row.dealerName, branch: row.branch })}
                            disabled={clearFollowupDateMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-0.5 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-400 border-gray-200 italic">
                          Not set
                        </span>
                      );
                    })()}
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3 align-top">
                    {assigneeList.length > 0 ? (
                      <div className="flex items-center gap-1.5 min-w-[130px]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                            assigneeMap[row.customerId]
                              ? (assigneeList.find(a => a.name === assigneeMap[row.customerId])?.bgClass ?? 'bg-gray-400')
                              : 'bg-gray-300'
                          }`}
                        />
                        <select
                          value={assigneeMap[row.customerId] ?? ''}
                          onChange={e => handleAssigneeChange(row.customerId, e.target.value || null)}
                          aria-label="Assignee"
                          className="text-xs border border-border rounded-md px-2 py-1 bg-background outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground flex-1"
                        >
                          <option value="">Unassigned</option>
                          {assigneeList.map(a => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">—</span>
                    )}
                  </td>

                  {/* Log button */}
                  <td className="px-4 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground border-border/60 bg-muted/30 hover:bg-muted/60"
                      onClick={() =>
                        setActiveNotes({
                          customerId: row.customerId,
                          dealerName: row.dealerName,
                          branch: row.branch,
                          outstanding: row.outstanding,
                          key: row.key,
                        })
                      }
                    >
                      <StickyNote className="h-4 w-4 mr-1" />
                      Log
                    </Button>
                  </td>

                  {/* View Ledger button */}
                  <td className="px-4 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-blue-600 hover:text-blue-700 border-blue-200 bg-blue-50/40 hover:bg-blue-50"
                      onClick={() =>
                        setActiveLedger({
                          customerId: row.customerId,
                          dealerName: row.dealerName,
                          branch: row.branch,
                          outstanding: row.outstanding,
                        })
                      }
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      View Ledger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {displayRows.length} client{displayRows.length !== 1 ? 's' : ''} with outstanding balance
      </p>

      {/* Follow-up Notes Drawer */}
      {activeNotes && (
        <FollowupNotesDrawer
          open={!!activeNotes}
          onClose={() => setActiveNotes(null)}
          customerId={activeNotes.customerId}
          dealerName={activeNotes.dealerName}
          branch={activeNotes.branch}
          outstanding={activeNotes.outstanding}
          currentFollowupDate={activeRow?.nextFollowupDate ?? ''}
        />
      )}

      {/* Ledger Drawer */}
      {activeLedger && (
        <LedgerDrawer
          open={!!activeLedger}
          onClose={() => setActiveLedger(null)}
          customerId={activeLedger.customerId}
          dealerName={activeLedger.dealerName}
          branch={activeLedger.branch}
          outstanding={activeLedger.outstanding}
        />
      )}
    </div>
  );
}
