import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, TrendingUp, Download, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';

// ── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  key: string;
  dealerName: string;
  branch: string;
  outstanding: number;
  lastPaymentDate: string | null;
  comments: string;
  nextFollowupDate: string;
}

interface FetchResult {
  rows: RawRow[];
  collectionsThisMonth: number;
}

type SortKey = 'outstanding-desc' | 'outstanding-asc' | 'name' | 'last-payment' | 'followup';

type LocalEdit = { comments: string; nextFollowupDate: string };

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchReceivablesTracking(): Promise<FetchResult> {
  const [txResult, custResult, followupResult] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, transaction_date'),
    supabase
      .from('customers')
      .select('id, dealer_name, client_name, branch, area'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('client_followups')
      .select('dealer_name, branch, comments, next_followup_date'),
  ]);

  if (txResult.error) throw txResult.error;
  if (custResult.error) throw custResult.error;

  const transactions = txResult.data ?? [];
  const customers = custResult.data ?? [];
  const followups = (followupResult.data ?? []) as Array<{
    dealer_name: string;
    branch: string;
    comments: string | null;
    next_followup_date: string | null;
  }>;

  // customer_id → { dealerName, branch }
  const customerMap = new Map<string, { dealerName: string; branch: string }>();
  for (const c of customers) {
    customerMap.set(c.id, {
      dealerName: (c.dealer_name || c.client_name || 'Unknown') as string,
      branch: (c.branch || c.area || '') as string,
    });
  }

  // "dealerName|||branch" → { comments, nextFollowupDate }
  const followupMap = new Map<string, { comments: string; nextFollowupDate: string }>();
  for (const f of followups) {
    followupMap.set(`${f.dealer_name}|||${f.branch}`, {
      comments: f.comments ?? '',
      nextFollowupDate: f.next_followup_date ?? '',
    });
  }

  // Aggregate sales and payments per dealer+branch
  const groups = new Map<string, {
    dealerName: string;
    branch: string;
    sales: number;
    payments: number;
    lastPaymentDate: string | null;
  }>();

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';
  let collectionsThisMonth = 0;

  for (const tx of transactions) {
    const customer = customerMap.get(tx.customer_id);
    if (!customer) continue;

    const key = `${customer.dealerName}|||${customer.branch}`;
    if (!groups.has(key)) {
      groups.set(key, {
        dealerName: customer.dealerName,
        branch: customer.branch,
        sales: 0,
        payments: 0,
        lastPaymentDate: null,
      });
    }
    const g = groups.get(key)!;

    if (tx.transaction_type === 'sale') {
      g.sales += tx.amount ?? 0;
    } else if (tx.transaction_type === 'payment') {
      g.payments += tx.amount ?? 0;
      if (!g.lastPaymentDate || (tx.transaction_date ?? '') > g.lastPaymentDate) {
        g.lastPaymentDate = tx.transaction_date ?? null;
      }
      if ((tx.transaction_date ?? '') >= monthStart) {
        collectionsThisMonth += tx.amount ?? 0;
      }
    }
  }

  // Build rows — only clients with outstanding > 0
  const rows: RawRow[] = [];
  for (const [key, g] of groups) {
    const outstanding = g.sales - g.payments;
    if (outstanding < 0.01) continue;

    const followup = followupMap.get(key) ?? { comments: '', nextFollowupDate: '' };
    rows.push({
      key,
      dealerName: g.dealerName,
      branch: g.branch,
      outstanding,
      lastPaymentDate: g.lastPaymentDate,
      comments: followup.comments,
      nextFollowupDate: followup.nextFollowupDate,
    });
  }

  return { rows, collectionsThisMonth };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivablesTrackingView() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('outstanding-desc');
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const initialized = useRef(false);

  const { data, isLoading } = useQuery<FetchResult>({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Populate local edits from fetched data once on first load
  useEffect(() => {
    if (data?.rows && !initialized.current) {
      initialized.current = true;
      const initial: Record<string, LocalEdit> = {};
      for (const row of data.rows) {
        initial[row.key] = { comments: row.comments, nextFollowupDate: row.nextFollowupDate };
      }
      setLocalEdits(initial);
    }
  }, [data?.rows]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Merge server data with local edits and compute isOverdue
  const displayRows = useMemo(() => {
    if (!data?.rows) return [];

    let rows = data.rows.map(row => {
      const edits = localEdits[row.key];
      const comments = edits?.comments ?? row.comments;
      const nextFollowupDate = edits?.nextFollowupDate ?? row.nextFollowupDate;
      const isOverdue = row.outstanding > 0 && !!nextFollowupDate && nextFollowupDate < today;
      return { ...row, comments, nextFollowupDate, isOverdue };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.dealerName.toLowerCase().includes(q) || r.branch.toLowerCase().includes(q)
      );
    }

    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.dealerName.localeCompare(b.dealerName);
        case 'outstanding-asc': return a.outstanding - b.outstanding;
        case 'last-payment':
          return (b.lastPaymentDate ?? '').localeCompare(a.lastPaymentDate ?? '');
        case 'followup':
          if (!a.nextFollowupDate && !b.nextFollowupDate) return 0;
          if (!a.nextFollowupDate) return 1;
          if (!b.nextFollowupDate) return -1;
          return a.nextFollowupDate.localeCompare(b.nextFollowupDate);
        default: // outstanding-desc
          return b.outstanding - a.outstanding;
      }
    });
  }, [data?.rows, localEdits, search, sortKey, today]);

  const overdueCount = useMemo(
    () => displayRows.filter(r => r.isOverdue).length,
    [displayRows]
  );

  const saveFollowup = useCallback(async (
    dealerName: string,
    branch: string,
    key: string,
    updates: { comments?: string; nextFollowupDate?: string }
  ) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const payload: Record<string, unknown> = {
        dealer_name: dealerName,
        branch,
        updated_at: new Date().toISOString(),
      };
      if (updates.comments !== undefined) payload.comments = updates.comments || null;
      if (updates.nextFollowupDate !== undefined) payload.next_followup_date = updates.nextFollowupDate || null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('client_followups')
        .upsert(payload, { onConflict: 'dealer_name,branch' });

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to save: ${msg}`, variant: 'destructive' });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  }, [toast]);

  const handleExport = async () => {
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
      { key: 'outstanding', width: 20 },
      { key: 'lastPayment', width: 18 },
      { key: 'comments', width: 42 },
      { key: 'followup', width: 18 },
    ];

    // Title
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Receivables Management Report';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    ws.mergeCells('A2:F2');
    ws.getCell('A2').value = `Generated: ${new Date().toLocaleDateString('en-IN')}`;
    ws.getCell('A2').font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:F3');
    ws.getCell('A3').value = `Overdue Clients: ${overdueCount}   |   Collections This Month: ₹${(data?.collectionsThisMonth ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    ws.getCell('A3').font = { size: 10, color: { argb: 'FF333333' } };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]); // spacer

    const headerRow = ws.addRow(['Client', 'Branch', 'Outstanding (₹)', 'Last Payment', 'Comments', 'Next Follow-up']);
    headerRow.height = 20;
    headerRow.eachCell(cell => {
      cell.fill = headerFill;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    for (const row of displayRows) {
      const dataRow = ws.addRow([
        row.dealerName,
        row.branch,
        row.outstanding,
        row.lastPaymentDate ? new Date(row.lastPaymentDate).toLocaleDateString('en-IN') : '—',
        row.comments || '',
        row.nextFollowupDate ? new Date(row.nextFollowupDate).toLocaleDateString('en-IN') : '—',
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
    d ? new Date(d).toLocaleDateString('en-IN') : '—';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Receivables Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track outstanding balances and follow-up schedules for all clients
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Search client or branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[210px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outstanding-desc">Outstanding (High → Low)</SelectItem>
            <SelectItem value="outstanding-asc">Outstanding (Low → High)</SelectItem>
            <SelectItem value="name">Client Name (A → Z)</SelectItem>
            <SelectItem value="last-payment">Last Payment (Recent first)</SelectItem>
            <SelectItem value="followup">Follow-up (Soonest first)</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      {displayRows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-md">
          {search.trim()
            ? 'No clients match your search.'
            : 'No clients with outstanding balances found.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b text-left">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Client Branch</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Outstanding</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Last Payment</th>
                <th className="px-4 py-3 font-semibold min-w-[220px]">Comments</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Next Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => {
                const isSaving = saving[row.key];
                const edits = localEdits[row.key];
                const commentsVal = edits?.comments ?? row.comments;
                const followupVal = edits?.nextFollowupDate ?? row.nextFollowupDate;

                return (
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

                    {/* Last Payment */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground align-top">
                      {fmtDate(row.lastPaymentDate)}
                    </td>

                    {/* Comments */}
                    <td className="px-4 py-2 align-top">
                      <textarea
                        rows={2}
                        className="w-full text-sm bg-transparent border border-transparent rounded px-2 py-1.5 resize-y focus:border-input focus:bg-background focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        value={commentsVal}
                        placeholder="Add comment..."
                        onChange={e =>
                          setLocalEdits(prev => ({
                            ...prev,
                            [row.key]: { ...prev[row.key], comments: e.target.value },
                          }))
                        }
                        onBlur={e =>
                          saveFollowup(row.dealerName, row.branch, row.key, {
                            comments: e.target.value,
                          })
                        }
                      />
                      {isSaving && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                        </span>
                      )}
                    </td>

                    {/* Next Follow-up Date */}
                    <td className="px-4 py-3 align-top">
                      <input
                        type="date"
                        className="text-sm bg-transparent border border-transparent rounded px-2 py-1.5 focus:border-input focus:bg-background focus:outline-none transition-colors w-full"
                        value={followupVal}
                        onChange={e => {
                          const val = e.target.value;
                          setLocalEdits(prev => ({
                            ...prev,
                            [row.key]: { ...prev[row.key], nextFollowupDate: val },
                          }));
                          saveFollowup(row.dealerName, row.branch, row.key, { nextFollowupDate: val });
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {displayRows.length} client{displayRows.length !== 1 ? 's' : ''} with outstanding balance
      </p>
    </div>
  );
}
