import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Edit, Trash2, Send, ChevronLeft, ChevronRight, Download, ArrowUpDown } from 'lucide-react';
import { exportJsonToExcel } from '@/services/export/excelExport';
import { useAuditLog } from '@/hooks/useAuditLog';

// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface PaymentReminderSchedule {
  id: string;
  name: string;
  days_of_week: number[];
  send_time_ist: string;
  min_outstanding_amount: number;
  is_recurring: boolean;
  start_date: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentReminderLog {
  id: string;
  schedule_id: string | null;
  customer_id: string;
  customer_name: string;
  outstanding_amount: number;
  status: 'sent' | 'failed' | 'skipped';
  failure_reason: string | null;
  triggered_at: string;
}

// 15-minute interval time slots (00:00 → 23:45)
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const label = new Date(2000, 0, 1, h, m).toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  return { value: `${hh}:${mm}`, label };
});

const DEFAULT_FORM = {
  name: '',
  days_of_week: [1, 3, 5] as number[], // Mon, Wed, Fri default
  send_time_ist: '10:00',
  min_outstanding_amount: 0,
  is_recurring: true,
  start_date: '',
};

/**
 * Returns the next UTC Date at which this day-of-week schedule will fire.
 * Looks ahead up to 7 days from now (IST).
 */
function getNextRunDate(
  sendTimeIST: string,
  daysOfWeek: number[],
  isEnabled: boolean,
): Date | null {
  if (!isEnabled || daysOfWeek.length === 0) return null;

  const [h, m] = sendTimeIST.split(':').map(Number);
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + istOffsetMs);
  const currentMins = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();
  const targetMins = h * 60 + m;

  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const checkIST = new Date(nowIST.getTime() + daysAhead * 86400000);
    const dayOfWeek = checkIST.getUTCDay();
    if (!daysOfWeek.includes(dayOfWeek)) continue;
    // If today, target time must still be at least 15 min in the future
    if (daysAhead === 0 && currentMins >= targetMins + 15) continue;

    // Build UTC equivalent of IST day at send_time_ist
    const fireUTC = new Date(Date.UTC(
      checkIST.getUTCFullYear(),
      checkIST.getUTCMonth(),
      checkIST.getUTCDate(),
      h - 5, m - 30, 0,
    ));
    return fireUTC;
  }
  return null;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDays(days: number[]): string {
  if (!days || days.length === 0) return '—';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1,2,3,4,5].every(d => days.includes(d))) return 'Mon–Fri';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return [...days].sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(', ');
}

export const PaymentReminderSchedules: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentReminderSchedule | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const LOGS_PAGE_SIZE = logsExpanded ? 20 : 5;
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatus, setLogsStatus] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');
  const [logsMonth, setLogsMonth] = useState('');
  const [logsSortField, setLogsSortField] = useState<'triggered_at' | 'customer_name' | 'outstanding_amount'>('triggered_at');
  const [logsSortDir, setLogsSortDir] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['payment-reminder-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminder_schedules')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as PaymentReminderSchedule[];
    },
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['payment-reminder-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminder_logs')
        .select('*')
        .order('triggered_at', { ascending: false });
      if (error) throw error;
      return data as PaymentReminderLog[];
    },
  });

  const { data: lastRunMap } = useQuery({
    queryKey: ['payment-reminder-last-runs'],
    queryFn: async () => {
      const map = new Map<string, string>();
      for (const row of allLogs) {
        if (row.schedule_id && !map.has(row.schedule_id)) map.set(row.schedule_id, row.triggered_at);
      }
      return map;
    },
    enabled: allLogs.length > 0,
  });

  const availableLogMonths = useMemo(() => {
    const months = new Set<string>();
    allLogs.forEach((l) => { if (l.triggered_at) months.add(l.triggered_at.slice(0, 7)); });
    return [...months].sort().reverse();
  }, [allLogs]);

  const filteredLogs = useMemo(() => {
    let logs = allLogs;
    if (logsSearch.trim()) {
      const q = logsSearch.trim().toLowerCase();
      logs = logs.filter((l) => l.customer_name.toLowerCase().includes(q));
    }
    if (logsStatus !== 'all') logs = logs.filter((l) => l.status === logsStatus);
    if (logsMonth) logs = logs.filter((l) => l.triggered_at?.startsWith(logsMonth));
    return [...logs].sort((a, b) => {
      let cmp = 0;
      if (logsSortField === 'triggered_at') cmp = new Date(a.triggered_at).getTime() - new Date(b.triggered_at).getTime();
      else if (logsSortField === 'customer_name') cmp = a.customer_name.localeCompare(b.customer_name);
      else cmp = a.outstanding_amount - b.outstanding_amount;
      return logsSortDir === 'asc' ? cmp : -cmp;
    });
  }, [allLogs, logsSearch, logsStatus, logsMonth, logsSortField, logsSortDir]);

  const totalLogsPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((logsPage - 1) * LOGS_PAGE_SIZE, logsPage * LOGS_PAGE_SIZE);

  const toggleLogsSort = (field: typeof logsSortField) => {
    if (logsSortField === field) setLogsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setLogsSortField(field); setLogsSortDir('desc'); }
    setLogsPage(1);
  };

  const exportLogs = () => {
    const rows = filteredLogs.map((l) => ({
      'Customer': l.customer_name,
      'Outstanding (₹)': l.outstanding_amount,
      'Status': l.status,
      'Triggered At': new Date(l.triggered_at).toLocaleString('en-IN'),
      'Failure Reason': l.failure_reason ?? '',
    }));
    exportJsonToExcel(rows, 'Reminder Logs', 'Payment_Reminder_Logs');
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof DEFAULT_FORM) => {
      const payload = {
        name: values.name,
        days_of_week: values.days_of_week,
        send_time_ist: values.send_time_ist,
        min_outstanding_amount: values.min_outstanding_amount,
        is_recurring: values.is_recurring,
        start_date: values.start_date || null,
      };
      if (editingSchedule) {
        const { error } = await supabase.from('payment_reminder_schedules').update(payload).eq('id', editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payment_reminder_schedules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      const daysLabel = formatDays(variables.days_of_week);
      log({
        action: editingSchedule ? 'UPDATE' : 'CREATE',
        entityType: 'payment_reminder_schedule',
        entityId: editingSchedule?.id,
        description: `Payment reminder schedule ${editingSchedule ? 'updated' : 'added'}: "${variables.name}" — ${daysLabel} at ${variables.send_time_ist} IST, min ₹${variables.min_outstanding_amount}`,
        newValues: variables,
      });
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
      toast({ title: 'Success', description: editingSchedule ? 'Schedule updated' : 'Schedule added' });
      closeDialog();
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase.from('payment_reminder_schedules').update({ is_enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      log({ action: 'UPDATE', entityType: 'payment_reminder_schedule', entityId: variables.id, description: `Payment reminder schedule ${variables.is_enabled ? 'enabled' : 'disabled'}`, newValues: { is_enabled: variables.is_enabled } });
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_reminder_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      log({ action: 'DELETE', entityType: 'payment_reminder_schedule', entityId: id, description: `Payment reminder schedule deleted: ID ${id}` });
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-last-runs'] });
      toast({ title: 'Deleted', description: 'Schedule removed' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const openAdd = () => { setEditingSchedule(null); setForm(DEFAULT_FORM); setIsDialogOpen(true); };
  const openEdit = (s: PaymentReminderSchedule) => {
    setEditingSchedule(s);
    setForm({
      name: s.name,
      days_of_week: s.days_of_week ?? [1, 2, 3, 4, 5],
      send_time_ist: s.send_time_ist,
      min_outstanding_amount: s.min_outstanding_amount ?? 0,
      is_recurring: s.is_recurring !== false,
      start_date: s.start_date ?? '',
    });
    setIsDialogOpen(true);
  };
  const closeDialog = () => { setIsDialogOpen(false); setEditingSchedule(null); setForm(DEFAULT_FORM); };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }
    if (form.days_of_week.length === 0) {
      toast({ title: 'Validation', description: 'Select at least one day of the week', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  const handleSendReminders = () => {
    setIsSendingManual(true);

    supabase.functions.invoke('payment-reminder-scheduler', { body: { force: true } })
      .then(({ data, error }) => {
        if (error) return;
        const totalSent = (data?.results ?? []).reduce(
          (sum: number, r: { newlySent?: number }) => sum + (r.newlySent ?? 0), 0
        );
        const totalSchedules = data?.scheduleCount ?? 0;
        const noWhatsapp: string[] = data?.noWhatsappDealers ?? [];
        const lines: string[] = [];
        if (totalSchedules === 0) lines.push('No enabled schedules found.');
        else lines.push(`${totalSent} reminder(s) sent across ${totalSchedules} schedule(s).`);
        if (noWhatsapp.length > 0) lines.push(`⚠️ ${noWhatsapp.length} customer(s) skipped — no WhatsApp number.`);
        toast({ title: 'Payment Reminders Sent', description: lines.join(' ') });
        setLogsPage(1);
        queryClient.invalidateQueries({ queryKey: ['payment-reminder-logs'] });
        queryClient.invalidateQueries({ queryKey: ['payment-reminder-last-runs'] });
        queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
      })
      .catch(() => {});

    toast({ title: 'Sending Payment Reminders', description: 'Reminders are being sent in the background.' });
    const refreshAt = [30000, 60000, 120000, 180000];
    refreshAt.forEach((delay) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['payment-reminder-logs'] });
        queryClient.invalidateQueries({ queryKey: ['payment-reminder-last-runs'] });
      }, delay);
    });
    setTimeout(() => setIsSendingManual(false), 10000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Payment Reminder Schedules
            </CardTitle>
            <CardDescription>
              Automated WhatsApp reminders — configure which days, what time, and minimum outstanding threshold
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSendReminders} disabled={isSendingManual} className="flex items-center gap-2">
              {isSendingManual ? (
                <><div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Sending...</>
              ) : (
                <><Send className="h-4 w-4" />Send Now</>
              )}
            </Button>
            <Button onClick={openAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />Add Schedule
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading schedules...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Days</TableHead>
                <TableHead className="text-center">Time (IST)</TableHead>
                <TableHead className="text-center">Min. Outstanding</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Last Run</TableHead>
                <TableHead className="text-center">Next Run</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(schedules ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-6">
                    No schedules configured. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                (schedules ?? []).map((schedule) => {
                  const lastRun = lastRunMap?.get(schedule.id);
                  const nextRun = schedule.is_enabled
                    ? getNextRunDate(schedule.send_time_ist, schedule.days_of_week ?? [1,2,3,4,5], schedule.is_enabled)
                    : null;
                  const isRecurring = schedule.is_recurring !== false;
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(schedule.days_of_week ?? []).sort((a, b) => a - b).map((d) => (
                            <span key={d} className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              {DAY_LABELS[d]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        {TIME_SLOTS.find((s) => s.value === schedule.send_time_ist)?.label ?? schedule.send_time_ist}
                      </TableCell>
                      <TableCell className="text-center">
                        {schedule.min_outstanding_amount > 0
                          ? `₹${schedule.min_outstanding_amount.toLocaleString('en-IN')}`
                          : <span className="text-gray-400">Any</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isRecurring ? 'secondary' : 'outline'} className="text-xs">
                          {isRecurring ? 'Recurring' : 'One-time'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {lastRun ? formatDateTime(new Date(lastRun)) : '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {nextRun ? (
                          <span className="text-blue-600 font-medium">{formatDateTime(nextRun)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={schedule.is_enabled}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: schedule.id, is_enabled: checked })}
                          />
                          <Badge variant={schedule.is_enabled ? 'default' : 'secondary'}>
                            {schedule.is_enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(schedule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(schedule.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* Recent logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Recent Reminder Logs
              {allLogs.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500">{filteredLogs.length} of {allLogs.length}</span>
              )}
            </h4>
            {filteredLogs.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportLogs} className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />Export
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Input
              placeholder="Search customer…"
              value={logsSearch}
              onChange={(e) => { setLogsSearch(e.target.value); setLogsPage(1); }}
              className="h-8 w-44 text-sm"
            />
            <select
              aria-label="Filter by status"
              value={logsStatus}
              onChange={(e) => { setLogsStatus(e.target.value as typeof logsStatus); setLogsPage(1); }}
              className="h-8 border border-border rounded-md px-2 text-sm bg-background text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
            {availableLogMonths.length > 0 && (
              <select
                aria-label="Filter by month"
                value={logsMonth}
                onChange={(e) => { setLogsMonth(e.target.value); setLogsPage(1); }}
                className="h-8 border border-border rounded-md px-2 text-sm bg-background text-foreground"
              >
                <option value="">All months</option>
                {availableLogMonths.map((m) => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            )}
            {(logsSearch || logsStatus !== 'all' || logsMonth) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                onClick={() => { setLogsSearch(''); setLogsStatus('all'); setLogsMonth(''); setLogsPage(1); }}>
                Clear
              </Button>
            )}
          </div>

          {allLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4 border rounded-md">No logs yet — reminders will appear here once sent</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4 border rounded-md">No logs match the current filters</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button type="button" className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleLogsSort('customer_name')}>
                          Customer <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button type="button" className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors" onClick={() => toggleLogsSort('outstanding_amount')}>
                          Outstanding <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>
                        <button type="button" className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleLogsSort('triggered_at')}>
                          Triggered At <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Failure Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLogs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.customer_name}</TableCell>
                        <TableCell className="text-right">₹{l.outstanding_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={l.status === 'sent' ? 'default' : l.status === 'failed' ? 'destructive' : 'secondary'}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{new Date(l.triggered_at).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm text-red-600 max-w-[200px] truncate">{l.failure_reason ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-xs text-gray-500">
                  {((logsPage - 1) * LOGS_PAGE_SIZE) + 1}–{Math.min(logsPage * LOGS_PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
                </span>
                <div className="flex items-center gap-2">
                  {logsExpanded && (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => setLogsPage((p) => Math.max(1, p - 1))} disabled={logsPage === 1} className="h-7 w-7 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs px-2">{logsPage} / {totalLogsPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))} disabled={logsPage === totalLogsPages} className="h-7 w-7 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {filteredLogs.length > 5 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => { setLogsExpanded((e) => !e); setLogsPage(1); }}>
                      {logsExpanded ? 'Show less' : `Show all ${filteredLogs.length}`}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Add / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">

            {/* Name */}
            <div className="space-y-1.5">
              <Label>Schedule Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Weekly Wednesday Reminder"
              />
            </div>

            {/* Days of week */}
            <div className="space-y-1.5">
              <Label>Send on these days</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      form.days_of_week.includes(day)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.days_of_week.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Every {form.days_of_week.sort((a, b) => a - b).map(d => DAY_FULL[d]).join(', ')}
                </p>
              )}
            </div>

            {/* Send time */}
            <div className="space-y-1.5">
              <Label>Send Time (IST)</Label>
              <Select value={form.send_time_ist} onValueChange={(val) => setForm((f) => ({ ...f, send_time_ist: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Fires within the 15-minute window containing this time</p>
            </div>

            {/* Threshold */}
            <div className="space-y-1.5">
              <Label>Minimum Outstanding Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.min_outstanding_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_outstanding_amount: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Only send to clients whose outstanding balance ≥ this amount. Set to 0 for all clients.
              </p>
            </div>

            {/* Recurring / One-time */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Recurring</p>
                <p className="text-xs text-muted-foreground">
                  {form.is_recurring
                    ? 'Fires every week on the selected days'
                    : 'Fires once on the next matching day, then auto-disables'}
                </p>
              </div>
              <Switch
                checked={form.is_recurring}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_recurring: checked }))}
              />
            </div>

            {/* Start date */}
            <div className="space-y-1.5">
              <Label>Start Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Leave blank to activate immediately.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
