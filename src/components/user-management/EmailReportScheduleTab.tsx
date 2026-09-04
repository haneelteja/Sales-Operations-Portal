import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, Send, Loader2, CheckCircle2, XCircle, User, Download, UserX } from 'lucide-react';

interface EmailReportSchedule {
  id: string;
  report_type: string;
  label: string;
  enabled: boolean;
  send_time: string;
  recipient_email: string;
  last_sent_at: string | null;
}

interface EmailReportLog {
  id: string;
  report_type: string;
  label: string;
  recipient_email: string;
  subject: string | null;
  status: 'success' | 'error';
  error_message: string | null;
  triggered_by: string;
  sent_at: string;
}

const REPORT_DESCRIPTIONS: Record<string, string> = {
  orders_payment_status: 'Table of all clients with overdue (>30 days) or due soon (15–30 days) outstanding invoices — client, branch, invoice count, outstanding amount, oldest invoice date.',
  payment_followup: 'Mirrors the Receivables Tracker — all active clients with outstanding balance, classified by follow-up date: Overdue (date passed), Upcoming (date set), or No Date.',
  credit_risk: 'Per client/branch credit limit (= avg monthly sales × payment ratio), current outstanding, % used, and status — Over Limit / Warning / OK.',
};

type Tab = 'schedule' | 'reports';

const EmailReportScheduleTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [sendingType, setSendingType] = useState<string | null>(null);

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['email-report-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_report_schedules')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as EmailReportSchedule[];
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['email-report-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_report_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as EmailReportLog[];
    },
    enabled: activeTab === 'reports',
  });

  const updateMutation = useMutation({
    mutationFn: async (schedule: Pick<EmailReportSchedule, 'id' | 'enabled' | 'send_time' | 'recipient_email'>) => {
      const { error } = await supabase
        .from('email_report_schedules')
        .update({ enabled: schedule.enabled, send_time: schedule.send_time, recipient_email: schedule.recipient_email })
        .eq('id', schedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-report-schedules'] });
      toast({ title: 'Saved', description: 'Email report schedule updated.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSendNow = async (reportType: string) => {
    setSendingType(reportType);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-report-emails', {
        body: { force: true, type: reportType },
      });
      if (error) throw error;
      if (result?.success) {
        const status = result.results?.[reportType];
        toast({ title: 'Email sent', description: status ?? 'Report dispatched successfully.' });
        queryClient.invalidateQueries({ queryKey: ['email-report-schedules'] });
        queryClient.invalidateQueries({ queryKey: ['email-report-logs'] });
      } else {
        toast({ title: 'Error', description: result?.error ?? 'Failed to send email.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSendingType(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(['schedule', 'reports'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'pb-3 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab === 'schedule' ? 'Schedule' : 'Sent Reports'}
            </button>
          ))}
        </nav>
      </div>

      {/* Schedule tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {schedulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading schedules…</span>
            </div>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                description={REPORT_DESCRIPTIONS[schedule.report_type] ?? ''}
                isSending={sendingType === schedule.report_type}
                onSave={(patch) => updateMutation.mutate({ id: schedule.id, ...patch })}
                onSendNow={() => handleSendNow(schedule.report_type)}
                isSaving={updateMutation.isPending}
              />
            ))
          )}
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">On-Demand Exports</p>
            <InactiveClientsExportCard />
          </div>
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent Email Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Loading…</span>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No reports sent yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Sent At (IST)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">{log.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.subject ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{log.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize flex items-center gap-1 w-fit">
                          {log.triggered_by === 'manual' ? <User className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {log.triggered_by}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {log.status === 'success' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" /> Sent
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit" title={log.error_message ?? ''}>
                            <XCircle className="h-3 w-3" /> Error
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Inactive Clients Export Card ────────────────────────────────────────────

const InactiveClientsExportCard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch inactive clients (config-based: all customer_ids have is_active=false)
      // plus customers, followups, assignees and sale transactions in parallel.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [inactiveResult, { data: allCustomers }, { data: followups }, { data: assignees }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc('get_inactive_receivables'),
        supabase.from('customers').select('id, client_name, branch'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('client_followups').select('client_name, branch, next_followup_date').limit(10000),
        supabase.from('customer_assignee').select('customer_id, assignee_name'),
      ]);

      if (inactiveResult.error) throw inactiveResult.error;

      type InactiveRow = { customer_id: string; client_name: string; branch: string; outstanding: number | string };
      const inactiveClients = (inactiveResult.data ?? []) as InactiveRow[];

      if (inactiveClients.length === 0) {
        toast({ title: 'No inactive clients', description: 'No clients marked as inactive in configuration.' });
        return;
      }

      // Build id → pairKey map so transaction lookups are O(1)
      const customers = (allCustomers ?? []) as Array<{ id: string; client_name: string; branch: string | null }>;
      const idToPairKey = new Map<string, string>();
      for (const c of customers) {
        idToPairKey.set(c.id, `${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`);
      }

      // Collect all customer_ids for inactive pairs
      const inactivePairKeys = new Set(inactiveClients.map(ic => `${ic.client_name.toLowerCase()}|||${ic.branch.toLowerCase()}`));
      const inactiveIds = customers
        .filter(c => inactivePairKeys.has(`${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`))
        .map(c => c.id);

      // Fetch all sale transactions for inactive customer_ids
      const { data: saleTxns } = await supabase
        .from('sales_transactions')
        .select('customer_id, transaction_date')
        .in('customer_id', inactiveIds)
        .eq('transaction_type', 'sale');

      // Aggregate per-pair: first order, last order, order count
      type SaleStats = { first: string; last: string; count: number };
      const pairSaleStats = new Map<string, SaleStats>();
      for (const tx of (saleTxns ?? []) as Array<{ customer_id: string; transaction_date: string }>) {
        const pairKey = idToPairKey.get(tx.customer_id);
        if (!pairKey || !inactivePairKeys.has(pairKey)) continue;
        const cur = pairSaleStats.get(pairKey);
        if (!cur) {
          pairSaleStats.set(pairKey, { first: tx.transaction_date, last: tx.transaction_date, count: 1 });
        } else {
          if (tx.transaction_date < cur.first) cur.first = tx.transaction_date;
          if (tx.transaction_date > cur.last) cur.last = tx.transaction_date;
          cur.count++;
        }
      }

      const followupMap = new Map<string, string>(
        (followups ?? []).map((f: { client_name: string; branch: string; next_followup_date: string | null }) => [
          `${f.client_name.toLowerCase()}|||${(f.branch ?? '').toLowerCase()}`,
          f.next_followup_date ?? '',
        ])
      );
      const assigneeMap = new Map(
        (assignees ?? []).map((a: { customer_id: string; assignee_name: string }) => [a.customer_id, a.assignee_name])
      );

      const fmtDate = (d: string | null | undefined) =>
        d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      const rows = inactiveClients
        .map(ic => {
          const pairKey = `${ic.client_name.toLowerCase()}|||${ic.branch.toLowerCase()}`;
          const stats = pairSaleStats.get(pairKey);
          return {
            client: ic.client_name,
            branch: ic.branch,
            outstanding: Number(ic.outstanding),
            firstOrder: stats?.first ?? null,
            lastOrder: stats?.last ?? null,
            orderCount: stats?.count ?? 0,
            followup: followupMap.get(pairKey) || null,
            assignee: assigneeMap.get(ic.customer_id) ?? '—',
          };
        })
        .sort((a, b) => b.outstanding - a.outstanding);

      const csvHeader = ['Client', 'Branch', 'Outstanding (INR)', 'First Order', 'Last Order', 'No. of Orders', 'Next Follow-up', 'Assignee'];
      const csvRows = rows.map(r => [
        `"${r.client.replace(/"/g, '""')}"`,
        `"${r.branch.replace(/"/g, '""')}"`,
        r.outstanding.toFixed(2),
        `"${fmtDate(r.firstOrder)}"`,
        `"${fmtDate(r.lastOrder)}"`,
        r.orderCount,
        `"${fmtDate(r.followup)}"`,
        `"${r.assignee}"`,
      ]);

      const csv = [csvHeader.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inactive_Clients_${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: `${rows.length} inactive client${rows.length !== 1 ? 's' : ''} exported.` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserX className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <CardTitle className="text-base">Inactive Clients with Outstanding</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exports all clients marked inactive in configuration — includes first order, last order, order count, and outstanding balance.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download CSV
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Per-schedule card ───────────────────────────────────────────────────────

interface ScheduleCardProps {
  schedule: EmailReportSchedule;
  description: string;
  isSending: boolean;
  isSaving: boolean;
  onSave: (patch: { enabled: boolean; send_time: string; recipient_email: string }) => void;
  onSendNow: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, description, isSending, isSaving, onSave, onSendNow }) => {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [sendTime, setSendTime] = useState(schedule.send_time);
  const [recipientEmail, setRecipientEmail] = useState(schedule.recipient_email);

  const isDirty =
    enabled !== schedule.enabled ||
    sendTime !== schedule.send_time ||
    recipientEmail !== schedule.recipient_email;

  const lastSentLabel = schedule.last_sent_at
    ? new Date(schedule.last_sent_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <CardTitle className="text-base">{schedule.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={enabled ? 'default' : 'secondary'} className="text-xs">
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> Send Time (IST)
            </Label>
            <Input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Sent during the matching IST hour (e.g. 09:00 → 9–10 AM IST)</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" /> Recipient Email
            </Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Last sent: {lastSentLabel} IST
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onSendNow} disabled={isSending || isSaving}>
              {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Send Now
            </Button>
            <Button size="sm" onClick={() => onSave({ enabled, send_time: sendTime, recipient_email: recipientEmail })} disabled={!isDirty || isSaving || isSending}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailReportScheduleTab;
