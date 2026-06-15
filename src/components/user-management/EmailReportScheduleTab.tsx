import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface EmailReportSchedule {
  id: string;
  report_type: string;
  label: string;
  enabled: boolean;
  send_time: string;
  recipient_email: string;
  last_sent_at: string | null;
}

const REPORT_DESCRIPTIONS: Record<string, string> = {
  orders_payment_status: 'Table of all clients with overdue (>30 days) or due soon (15–30 days) outstanding invoices — client, branch, invoice count, outstanding amount, oldest invoice date.',
  payment_followup: 'Action-oriented list grouped by Overdue and Due Soon, including WhatsApp number for easy follow-up.',
  credit_risk: 'Per client/branch credit limit (= avg monthly sales), current outstanding, % used, and status — Over Limit / Warning / OK.',
};

const EmailReportScheduleTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendingType, setSendingType] = useState<string | null>(null);

  const { data: schedules = [], isLoading } = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: async (schedule: Pick<EmailReportSchedule, 'id' | 'enabled' | 'send_time' | 'recipient_email'>) => {
      const { error } = await supabase
        .from('email_report_schedules')
        .update({
          enabled: schedule.enabled,
          send_time: schedule.send_time,
          recipient_email: schedule.recipient_email,
        })
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
        // force + type passed as query params via options.headers trick isn't available,
        // so we read them from the body inside the function when present
      });
      if (error) throw error;
      if (result?.success) {
        const status = result.results?.[reportType];
        toast({ title: 'Email sent', description: status ?? 'Report dispatched successfully.' });
        queryClient.invalidateQueries({ queryKey: ['email-report-schedules'] });
      } else {
        toast({ title: 'Error', description: result?.error ?? 'Failed to send email.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSendingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading schedules…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.id}
          schedule={schedule}
          description={REPORT_DESCRIPTIONS[schedule.report_type] ?? ''}
          isSending={sendingType === schedule.report_type}
          onSave={(patch) => updateMutation.mutate({ id: schedule.id, ...patch })}
          onSendNow={() => handleSendNow(schedule.report_type)}
          isSaving={updateMutation.isPending}
        />
      ))}
    </div>
  );
};

// ─── Per-schedule card (self-contained local state) ──────────────────────────

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
    ? new Date(schedule.last_sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <CardTitle className="text-base">{schedule.label}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
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
            <p className="text-xs text-muted-foreground">Sent during the matching IST hour (e.g. 09:00 → sent between 9–10 AM IST)</p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={onSendNow}
              disabled={isSending || isSaving}
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Send Now
            </Button>
            <Button
              size="sm"
              onClick={() => onSave({ enabled, send_time: sendTime, recipient_email: recipientEmail })}
              disabled={!isDirty || isSaving || isSending}
            >
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
