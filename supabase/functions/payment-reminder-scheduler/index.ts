/**
 * Payment Reminder Scheduler
 *
 * Triggered by an external cron (every 15 minutes) OR manually from the app UI.
 *
 * Auth: PAYMENT_REMINDER_CRON_SECRET via x-reminder-cron-secret header (cron),
 *       OR a valid Supabase user JWT via Authorization: Bearer (manual trigger).
 *
 * Body params:
 *   force: true  — skip the 15-minute time-window check (used by manual trigger)
 *
 * Dedup: per schedule, a customer is skipped if already reminded within
 *        schedule.days_overdue days (not a fixed 24 hours).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-reminder-cron-secret',
};

function getCurrentISTTime(): string {
  const now = new Date();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const h = istDate.getUTCHours();
  const m = istDate.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isTimeInCurrentWindow(configuredTime: string, windowMinutes = 15): boolean {
  const [ch, cm] = configuredTime.trim().split(':').map(Number);
  const configuredMins = ch * 60 + cm;
  const now = new Date();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const currentMins = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
  const windowStart = Math.floor(currentMins / windowMinutes) * windowMinutes;
  const windowEnd = windowStart + windowMinutes;
  return configuredMins >= windowStart && configuredMins < windowEnd;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Auth: cron secret OR valid Supabase user JWT
  const cronSecret = Deno.env.get('PAYMENT_REMINDER_CRON_SECRET');
  const customHeader = req.headers.get('x-reminder-cron-secret')?.trim() ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerSecret = customHeader || bearer;

  const isCronAuth = !!cronSecret && headerSecret === cronSecret;
  let isManualTrigger = false;

  if (!isCronAuth) {
    // Try validating as a Supabase user JWT (for manual trigger from the app)
    if (bearer) {
      const authClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await authClient.auth.getUser(bearer);
      if (user) {
        isManualTrigger = true;
      } else {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const reason = !cronSecret
        ? 'PAYMENT_REMINDER_CRON_SECRET not set in Supabase Edge Function secrets'
        : 'Secret mismatch or missing. Send header: x-reminder-cron-secret with the exact secret';
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: reason }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Parse body — force flag bypasses the time-window check
  let force = isManualTrigger;
  try {
    const body = await req.json();
    if (body?.force === true) force = true;
  } catch { /* no body or not JSON */ }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check global WhatsApp toggles + notification email
    const { data: configData } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['whatsapp_enabled', 'whatsapp_payment_reminder_enabled', 'backup_notification_email']);

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => { config[item.config_key] = item.config_value; });
    const notificationEmail = config.backup_notification_email || 'pega2023test@gmail.com';

    if (config.whatsapp_enabled !== 'true' || config.whatsapp_payment_reminder_enabled !== 'true') {
      return new Response(
        JSON.stringify({ triggered: false, reason: 'WhatsApp payment reminders are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch enabled schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_reminder_schedules')
      .select('*')
      .eq('is_enabled', true);

    if (schedulesError) throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);

    const currentIST = getCurrentISTTime();
    const todayIST = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(0, 10);

    // If force=true, run all enabled schedules ignoring time window
    const matchingSchedules = (schedules || []).filter((s) =>
      (force || isTimeInCurrentWindow(s.send_time_ist)) &&
      (!s.start_date || s.start_date <= todayIST)
    );

    if (matchingSchedules.length === 0) {
      return new Response(
        JSON.stringify({
          triggered: false,
          reason: force
            ? 'No enabled schedules found (or all blocked by start_date)'
            : 'No schedules match current time window',
          currentIST,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all transactions to compute outstanding per customer
    const { data: transactions, error: txError } = await supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, transaction_date')
      .order('transaction_date', { ascending: true });

    if (txError) throw new Error(`Failed to fetch transactions: ${txError.message}`);

    // Compute outstanding + oldest sale date per customer
    const customerData = new Map<string, { outstanding: number; oldestSaleDate: string | null }>();
    for (const tx of transactions || []) {
      if (!customerData.has(tx.customer_id)) {
        customerData.set(tx.customer_id, { outstanding: 0, oldestSaleDate: null });
      }
      const entry = customerData.get(tx.customer_id)!;
      if (tx.transaction_type === 'sale') {
        entry.outstanding += tx.amount || 0;
        if (!entry.oldestSaleDate || tx.transaction_date < entry.oldestSaleDate) {
          entry.oldestSaleDate = tx.transaction_date;
        }
      } else if (tx.transaction_type === 'payment') {
        entry.outstanding -= tx.amount || 0;
      }
    }

    // Fetch active customers with WhatsApp numbers
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, dealer_name, whatsapp_number')
      .eq('is_active', true)
      .not('whatsapp_number', 'is', null);

    if (custError) throw new Error(`Failed to fetch customers: ${custError.message}`);

    const customerMap = new Map((customers || []).map((c) => [c.id, c]));
    const now = new Date();
    const results = [];

    for (const schedule of matchingSchedules) {
      const daysOverdueMs = schedule.days_overdue * 24 * 60 * 60 * 1000;
      const minOutstanding = schedule.min_outstanding_amount ?? 0;

      // Find customers eligible for this schedule
      const eligibleIds = Array.from(customerData.entries())
        .filter(([customerId, data]) => {
          if (data.outstanding <= 0) return false;
          if (data.outstanding < minOutstanding) return false;
          if (!data.oldestSaleDate) return false;
          if (!customerMap.has(customerId)) return false;
          const oldestDate = new Date(data.oldestSaleDate);
          return now.getTime() - oldestDate.getTime() >= daysOverdueMs;
        })
        .map(([id]) => id);

      if (eligibleIds.length === 0) {
        results.push({ scheduleId: schedule.id, scheduleName: schedule.name, sent: 0, skipped: 0, reason: 'No eligible customers' });
        continue;
      }

      // Dedup: skip customers already reminded by this schedule within days_overdue days
      const dedupWindowAgo = new Date(now.getTime() - daysOverdueMs).toISOString();
      const { data: recentLogs } = await supabase
        .from('payment_reminder_logs')
        .select('customer_id')
        .eq('schedule_id', schedule.id)
        .gte('triggered_at', dedupWindowAgo);

      const recentIds = new Set((recentLogs || []).map((l: { customer_id: string }) => l.customer_id));
      const newIds = eligibleIds.filter((id) => !recentIds.has(id));

      let sent = 0;
      let failed = 0;
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const customerId of newIds) {
        const customer = customerMap.get(customerId)!;
        const data = customerData.get(customerId)!;

        const daysOverdueActual = Math.floor(
          (now.getTime() - new Date(data.oldestSaleDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        const outstandingFormatted = `₹${data.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

        let whatsappLogId: string | null = null;
        let status: 'sent' | 'failed' = 'sent';
        let failureReason: string | null = null;

        try {
          const sendRes = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId,
              messageType: 'payment_reminder',
              triggerType: 'scheduled',
              placeholders: {
                customerName: customer.dealer_name,
                outstandingAmount: outstandingFormatted,
                daysOverdue: daysOverdueActual.toString(),
                oldestInvoiceDate: new Date(data.oldestSaleDate!).toLocaleDateString('en-IN'),
              },
            }),
          });

          const sendResult = await sendRes.json().catch(() => ({}));
          if (sendResult.success) {
            whatsappLogId = sendResult.messageLogId ?? null;
            sent++;
          } else {
            status = 'failed';
            failureReason = sendResult.error || 'Unknown error from whatsapp-send';
            failed++;
          }
        } catch (e) {
          status = 'failed';
          failureReason = e instanceof Error ? e.message : String(e);
          failed++;
        }

        await supabase.from('payment_reminder_logs').insert({
          schedule_id: schedule.id,
          customer_id: customerId,
          customer_name: customer.dealer_name,
          outstanding_amount: data.outstanding,
          whatsapp_message_log_id: whatsappLogId,
          status,
          failure_reason: failureReason,
        });

        // Avoid hitting WhatsApp API rate limits
        await sleep(1000);
      }

      results.push({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        daysOverdue: schedule.days_overdue,
        eligible: eligibleIds.length,
        alreadySentInWindow: recentIds.size,
        newlySent: sent,
        failed,
      });
    }

    console.log('[payment-reminder-scheduler] results:', JSON.stringify(results));

    // Send summary email — best-effort, non-blocking
    const totalSent = results.reduce((s, r) => s + (r.newlySent ?? 0), 0);
    const totalFailed = results.reduce((s, r) => s + (r.failed ?? 0), 0);
    if (totalSent > 0 || totalFailed > 0) {
      const istNow = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000)
        .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const scheduleRows = results.map((r) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${r.scheduleName}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${r.daysOverdue ?? '—'} days</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${r.eligible ?? 0}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#16a34a"><strong>${r.newlySent ?? 0}</strong></td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${(r.failed ?? 0) > 0 ? '#dc2626' : '#6b7280'}">${r.failed ?? 0}</td>
        </tr>`
      ).join('');

      fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: notificationEmail,
          subject: `Payment Reminders Sent — ${totalSent} sent, ${totalFailed} failed (${istNow} IST)`,
          html: `
            <h2 style="margin:0 0 16px">Payment Reminder Summary</h2>
            <p><strong>Run time:</strong> ${istNow} IST</p>
            <p><strong>Trigger:</strong> ${force ? 'Manual' : 'Scheduled (cron)'}</p>
            <p><strong>Total sent:</strong> <span style="color:#16a34a">${totalSent}</span> &nbsp;|&nbsp; <strong>Total failed:</strong> <span style="color:#dc2626">${totalFailed}</span></p>
            <table style="border-collapse:collapse;width:100%;margin-top:16px;font-size:14px">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">Schedule</th>
                  <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Overdue</th>
                  <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Eligible</th>
                  <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Sent</th>
                  <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Failed</th>
                </tr>
              </thead>
              <tbody>${scheduleRows}</tbody>
            </table>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
            <p style="color:#6b7280;font-size:12px"><em>Automated message from Aamodha Operations Portal.</em></p>
          `,
        }),
      }).catch((err) => console.error('[payment-reminder-scheduler] summary email error:', err));
    }

    return new Response(
      JSON.stringify({ triggered: true, force, currentIST, scheduleCount: matchingSchedules.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[payment-reminder-scheduler] error:', error);
    return new Response(
      JSON.stringify({ triggered: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
