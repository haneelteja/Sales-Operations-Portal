import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Edit, Trash2 } from 'lucide-react';

interface PaymentReminderSchedule {
  id: string;
  name: string;
  days_overdue: number;
  send_time_ist: string;
  min_outstanding_amount: number;
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

const DEFAULT_FORM = { name: '', days_overdue: 7, send_time_ist: '10:00', min_outstanding_amount: 0 };

/** Returns the next UTC Date at which send_time_ist (HH:MM IST) will fire. */
function getNextRunDate(sendTimeIST: string): Date {
  const [h, m] = sendTimeIST.split(':').map(Number);
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const now = new Date();
  const nowIST = new Date(now.getTime() + istOffsetMs);

  // Build today's fire time as a UTC Date representing that IST clock time
  const todayFireUTC = new Date(Date.UTC(
    nowIST.getUTCFullYear(),
    nowIST.getUTCMonth(),
    nowIST.getUTCDate(),
    h - 5,        // subtract IST offset hours
    m - 30,       // subtract IST offset minutes (JS Date handles underflow)
    0,
  ));

  return todayFireUTC > now
    ? todayFireUTC
    : new Date(todayFireUTC.getTime() + 24 * 60 * 60 * 1000);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export const PaymentReminderSchedules: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentReminderSchedule | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['payment-reminder-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminder_schedules')
        .select('*')
        .order('days_overdue', { ascending: true });
      if (error) throw error;
      return data as PaymentReminderSchedule[];
    },
  });

  // Fetch most recent triggered_at per schedule_id for "Last Run" column
  const { data: lastRunMap } = useQuery({
    queryKey: ['payment-reminder-last-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminder_logs')
        .select('schedule_id, triggered_at')
        .order('triggered_at', { ascending: false });
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.schedule_id && !map.has(row.schedule_id)) {
          map.set(row.schedule_id, row.triggered_at);
        }
      }
      return map;
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['payment-reminder-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminder_logs')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as PaymentReminderLog[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof DEFAULT_FORM) => {
      if (editingSchedule) {
        const { error } = await supabase
          .from('payment_reminder_schedules')
          .update(values)
          .eq('id', editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_reminder_schedules')
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
      toast({ title: 'Success', description: editingSchedule ? 'Schedule updated' : 'Schedule added' });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('payment_reminder_schedules')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] }),
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_reminder_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-last-runs'] });
      toast({ title: 'Deleted', description: 'Schedule removed' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const openAdd = () => {
    setEditingSchedule(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (schedule: PaymentReminderSchedule) => {
    setEditingSchedule(schedule);
    setForm({ name: schedule.name, days_overdue: schedule.days_overdue, send_time_ist: schedule.send_time_ist, min_outstanding_amount: schedule.min_outstanding_amount ?? 0 });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSchedule(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!form.days_overdue || form.days_overdue < 1) {
      toast({ title: 'Validation', description: 'Days overdue must be at least 1', variant: 'destructive' });
      return;
    }
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(form.send_time_ist)) {
      toast({ title: 'Validation', description: 'Time must be in HH:MM format (e.g. 10:00)', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
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
              Automated WhatsApp reminders sent to customers with outstanding balances
            </CardDescription>
          </div>
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Schedules table */}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading schedules...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Days Overdue</TableHead>
                <TableHead className="text-center">Min. Outstanding</TableHead>
                <TableHead className="text-center">Send Time (IST)</TableHead>
                <TableHead className="text-center">Last Run</TableHead>
                <TableHead className="text-center">Next Run</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(schedules ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                    No schedules configured. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                (schedules ?? []).map((schedule) => {
                  const lastRun = lastRunMap?.get(schedule.id);
                  const nextRun = schedule.is_enabled ? getNextRunDate(schedule.send_time_ist) : null;
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell className="text-center">{schedule.days_overdue} days</TableCell>
                      <TableCell className="text-center">
                        {schedule.min_outstanding_amount > 0
                          ? `₹${schedule.min_outstanding_amount.toLocaleString('en-IN')}`
                          : <span className="text-gray-400">Any</span>}
                      </TableCell>
                      <TableCell className="text-center">{schedule.send_time_ist}</TableCell>
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
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: schedule.id, is_enabled: checked })
                            }
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(schedule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
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
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Reminder Logs</h4>
          {(recentLogs ?? []).length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4 border rounded-md">
              No logs yet — reminders will appear here once sent
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Triggered At</TableHead>
                    <TableHead>Failure Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentLogs ?? []).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.customer_name}</TableCell>
                      <TableCell className="text-right">
                        ₹{log.outstanding_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            log.status === 'sent'
                              ? 'default'
                              : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(log.triggered_at).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-sm text-red-600 max-w-[200px] truncate">
                        {log.failure_reason ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 7-Day Reminder"
              />
            </div>
            <div className="space-y-2">
              <Label>Days Overdue</Label>
              <Input
                type="number"
                min={1}
                value={form.days_overdue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, days_overdue: parseInt(e.target.value, 10) || 1 }))
                }
              />
              <p className="text-xs text-gray-500">
                Customers whose oldest outstanding sale is at least this many days old will receive a reminder
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Outstanding Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.min_outstanding_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_outstanding_amount: parseFloat(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-gray-500">
                Only remind customers whose outstanding balance is at least this amount. Set to 0 to remind all.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Send Time IST (24h format)</Label>
              <Input
                value={form.send_time_ist}
                onChange={(e) => setForm((f) => ({ ...f, send_time_ist: e.target.value }))}
                placeholder="10:00"
              />
              <p className="text-xs text-gray-500">Reminders will fire within the 15-minute window containing this time</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
