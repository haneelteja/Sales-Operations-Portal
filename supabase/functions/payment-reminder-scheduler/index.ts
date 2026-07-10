/**
 * Payment Reminder Scheduler
 *
 * Triggered by an external cron (every 15 minutes) OR manually from the app UI.
 *
 * Schedule logic:
 *   - days_of_week: array of JS day numbers (0=Sun, 1=Mon, ..., 6=Sat)
 *   - send_time_ist: HH:MM within which the cron fires
 *   - min_outstanding_amount: only send to customers with outstanding >= this
 *   - is_recurring: if false, schedule is disabled after the first successful send run
 *
 * Dedup (recurring): a customer is not reminded twice on the same IST calendar day
 *                    for the same schedule.
 * One-time: after sending, the schedule's is_enabled is set to false.
 *
 * Auth: PAYMENT_REMINDER_CRON_SECRET via x-reminder-cron-secret header (cron),
 *       OR a valid Supabase user JWT via Authorization: Bearer (manual trigger).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-reminder-cron-secret',
};

/** Returns current IST time as HH:MM */
function getCurrentISTTime(): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  return `${String(istDate.getUTCHours()).padStart(2, '0')}:${String(istDate.getUTCMinutes()).padStart(2, '0')}`;
}

/** Returns current IST day of week: 0=Sun, 1=Mon, ..., 6=Sat */
function getCurrentISTDayOfWeek(): number {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  return istDate.getUTCDay();
}

/** Returns today's IST date as YYYY-MM-DD */
function getTodayIST(): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
}

function isTimeInCurrentWindow(configuredTime: string, windowMinutes = 15): boolean {
  const [ch, cm] = configuredTime.trim().split(':').map(Number);
  const configuredMins = ch * 60 + cm;
  const istDate = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000);
  const currentMins = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
  const windowStart = Math.floor(currentMins / windowMinutes) * windowMinutes;
  return configuredMins >= windowStart && configuredMins < windowStart + windowMinutes;
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
        ? 'PAYMENT_REMINDER_CRON_SECRET not set'
        : 'Secret mismatch or missing header x-reminder-cron-secret';
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: reason }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Parse body — force=true bypasses the time-window and day-of-week checks
  let force = isManualTrigger;
  try {
    const body = await req.json();
    if (body?.force === true) force = true;
  } catch { /* no body */ }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check global WhatsApp toggles
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
      .eq('is_enabled', true)
      .limit(10000);

    if (schedulesError) throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);

    const currentIST = getCurrentISTTime();
    const currentDayOfWeek = getCurrentISTDayOfWeek();
    const todayIST = getTodayIST();

    // Match schedules: day-of-week must include today AND time window must match
    const matchingSchedules = (schedules || []).filter((s) => {
      if (force) return true;
      const daysOfWeek: number[] = s.days_of_week ?? [1, 2, 3, 4, 5];
      return daysOfWeek.includes(currentDayOfWeek) && isTimeInCurrentWindow(s.send_time_ist);
    });

    if (matchingSchedules.length === 0) {
      return new Response(
        JSON.stringify({
          triggered: false,
          reason: force
            ? 'No enabled schedules found'
            : `No schedules match today (day ${currentDayOfWeek}) and current time window (${currentIST})`,
          currentIST,
          currentDayOfWeek,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch outstanding per customer
    const { data: outstandingRows, error: rpcError } = await supabase.rpc('get_customer_outstanding');
    if (rpcError) throw new Error(`Failed to fetch outstanding: ${rpcError.message}`);

    const customerData = new Map<string, { outstanding: number; oldestSaleDate: string | null; invoiceCount: number }>();
    for (const row of outstandingRows || []) {
      customerData.set(row.customer_id, {
        outstanding: Number(row.outstanding) || 0,
        oldestSaleDate: row.oldest_sale_date ?? null,
        invoiceCount: Number(row.invoice_count) || 0,
      });
    }

    // All customer rows → id-to-name map
    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('id, client_name, whatsapp_number, is_active')
      .limit(10000);
    if (custError) throw new Error(`Failed to fetch customers: ${custError.message}`);

    const idToDealerName = new Map<string, string>(
      (allCustomers || []).map((c) => [c.id, c.client_name])
    );

    // Best row per dealer for sending (prefer active + has WhatsApp)
    const dealerInfo = new Map<string, { id: string; dealer_name: string; whatsapp_number: string }>();
    for (const c of (allCustomers || [])) {
      if (!c.whatsapp_number) continue;
      const existing = dealerInfo.get(c.client_name);
      if (!existing || (!existing.is_active && c.is_active)) {
        dealerInfo.set(c.client_name, { id: c.id, dealer_name: c.client_name, whatsapp_number: c.whatsapp_number });
      }
    }

    // Aggregate outstanding PER DEALER across all customer_id rows
    const dealerData = new Map<string, { outstanding: number; oldestSaleDate: string | null; invoiceCount: number }>();
    const dealersWithOutstanding = new Set<string>();
    const noWhatsappDealers: string[] = [];

    for (const [customerId] of customerData.entries()) {
      const name = idToDealerName.get(customerId);
      if (name) dealersWithOutstanding.add(name);
    }

    for (const [customerId, data] of customerData.entries()) {
      const name = idToDealerName.get(customerId);
      if (!name) continue;
      if (!dealerInfo.has(name)) continue;
      if (!dealerData.has(name)) dealerData.set(name, { outstanding: 0, oldestSaleDate: null, invoiceCount: 0 });
      const entry = dealerData.get(name)!;
      entry.outstanding += data.outstanding;
      entry.invoiceCount += data.invoiceCount;
      if (data.oldestSaleDate && (!entry.oldestSaleDate || data.oldestSaleDate < entry.oldestSaleDate)) {
        entry.oldestSaleDate = data.oldestSaleDate;
      }
    }

    for (const name of dealersWithOutstanding) {
      if (!dealerInfo.has(name)) noWhatsappDealers.push(name);
    }

    // Fetch contacts
    const dealerNamesWithOutstanding = [...dealersWithOutstanding];
    const { data: contactsData } = await supabase
      .from('client_contacts')
      .select('client_name, contact_name, phone, role')
      .in('client_name', dealerNamesWithOutstanding)
      .eq('is_active', true);

    const dealerContacts = new Map<string, Array<{ contact_name: string; phone: string; role: string }>>();
    for (const c of (contactsData || [])) {
      if (!dealerContacts.has(c.client_name)) dealerContacts.set(c.client_name, []);
      dealerContacts.get(c.client_name)!.push({ contact_name: c.contact_name, phone: c.phone, role: c.role });
    }

    const now = new Date();
    const results = [];
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const sendWithRateLimitRetry = async (body: object): Promise<{ success: boolean; messageLogId?: string; error?: string }> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.status === 429) {
          const retryAfterMs = parseInt(res.headers.get('retry-after') || '10000', 10) + 500;
          await sleep(retryAfterMs);
          continue;
        }

        let rawBody = '';
        let result: { success?: boolean; messageLogId?: string; error?: string } = {};
        try {
          rawBody = await res.text();
          result = rawBody ? JSON.parse(rawBody) : {};
        } catch (_) {
          return { success: false, error: `HTTP ${res.status}: ${rawBody.slice(0, 300)}` };
        }

        if (!result.success && typeof result.error === 'string' && result.error.toLowerCase().includes('rate limit')) {
          const match = result.error.match(/(\d+)ms/);
          await sleep(match ? parseInt(match[1], 10) + 500 : 10000);
          continue;
        }
        if (!result.success && !result.error) result.error = `HTTP ${res.status} from whatsapp-send`;
        return result as { success: boolean; messageLogId?: string; error?: string };
      }
      return { success: false, error: 'Rate limit: max retries exceeded' };
    };

    for (const schedule of matchingSchedules) {
      const minOutstanding = schedule.min_outstanding_amount ?? 0;
      const isRecurring = schedule.is_recurring !== false; // default true

      // Eligible dealers: outstanding > threshold
      const eligibleDealers = Array.from(dealerData.entries())
        .filter(([, data]) => data.outstanding > 0 && data.outstanding >= minOutstanding)
        .map(([name]) => name);

      if (eligibleDealers.length === 0) {
        results.push({ scheduleId: schedule.id, scheduleName: schedule.name, sent: 0, skipped: 0, reason: 'No eligible customers above threshold' });
        continue;
      }

      // Dedup: for recurring, skip customers already sent today for this schedule
      let dealersToSend = eligibleDealers;
      let dedupSkipped = 0;
      if (!force) {
        const todayStartUTC = `${todayIST}T00:00:00+05:30`; // IST midnight
        const eligibleIds = eligibleDealers.map((name) => dealerInfo.get(name)!.id);
        const { data: todayLogs } = await supabase
          .from('payment_reminder_logs')
          .select('customer_id')
          .eq('schedule_id', schedule.id)
          .eq('status', 'sent')
          .in('customer_id', eligibleIds)
          .gte('triggered_at', todayStartUTC);

        const alreadySentToday = new Set((todayLogs || []).map((l: { customer_id: string }) => l.customer_id));
        dealersToSend = eligibleDealers.filter((name) => !alreadySentToday.has(dealerInfo.get(name)!.id));
        dedupSkipped = eligibleDealers.length - dealersToSend.length;
      }

      let sent = 0;
      let failed = 0;
      const sentCustomers: Array<{ name: string; outstanding: string }> = [];
      const failedCustomers: Array<{ name: string; reason: string }> = [];

      for (const dealerName of dealersToSend) {
        const customer = dealerInfo.get(dealerName)!;
        const data = dealerData.get(dealerName)!;
        const outstandingFormatted = `₹${data.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

        const placeholders = {
          customerName: customer.dealer_name,
          amount: outstandingFormatted,
          outstandingAmount: outstandingFormatted,
          invoiceCount: data.invoiceCount.toString(),
          // Keep daysOverdue for template compatibility — use days since oldest sale
          daysOverdue: data.oldestSaleDate
            ? String(Math.floor((now.getTime() - new Date(data.oldestSaleDate).getTime()) / 86400000))
            : '0',
          oldestInvoiceDate: data.oldestSaleDate
            ? new Date(data.oldestSaleDate).toLocaleDateString('en-IN')
            : '',
        };

        const contacts = dealerContacts.get(dealerName) || [];
        const recipients: Array<{ phone?: string; label: string }> =
          contacts.length > 0
            ? contacts.map((c) => ({ phone: c.phone, label: `${c.contact_name} (${c.role})` }))
            : [{ label: 'customer' }];

        let whatsappLogId: string | null = null;
        let status: 'sent' | 'failed' = 'sent';
        let failureReason: string | null = null;

        for (const recipient of recipients) {
          try {
            const sendResult = await sendWithRateLimitRetry({
              customerId: customer.id,
              messageType: 'payment_reminder',
              triggerType: 'scheduled',
              placeholders,
              ...(recipient.phone ? { toPhone: recipient.phone } : {}),
            });
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
          await sleep(1000);
        }

        if (status === 'sent') {
          sentCustomers.push({ name: customer.dealer_name, outstanding: outstandingFormatted });
        } else {
          failedCustomers.push({ name: customer.dealer_name, reason: failureReason ?? 'Unknown error' });
        }

        await supabase.from('payment_reminder_logs').insert({
          schedule_id: schedule.id,
          customer_id: customer.id,
          customer_name: customer.dealer_name,
          outstanding_amount: data.outstanding,
          whatsapp_message_log_id: whatsappLogId,
          status,
          failure_reason: failureReason,
        });
      }

      // One-time schedule: disable after this run (regardless of success/failure)
      if (!isRecurring && sent > 0) {
        await supabase
          .from('payment_reminder_schedules')
          .update({ is_enabled: false })
          .eq('id', schedule.id);
      }

      results.push({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        daysOfWeek: schedule.days_of_week,
        isRecurring,
        eligible: eligibleDealers.length,
        alreadySentToday: dedupSkipped,
        newlySent: sent,
        failed,
        sentCustomers,
        failedCustomers,
      });
    }

    // Summary email
    const totalSent = results.reduce((s, r) => s + (r.newlySent ?? 0), 0);
    const totalFailed = results.reduce((s, r) => s + (r.failed ?? 0), 0);

    if (totalSent > 0) {
      const istNow = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000)
        .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const scheduleBlocks = results
        .filter((r) => (r.newlySent ?? 0) > 0 || (r.failed ?? 0) > 0)
        .map((r) => {
          const days = (r.daysOfWeek ?? []).map((d: number) => DAY_LABELS[d] ?? d).join(', ');
          const sentRows = (r.sentCustomers ?? []).map((c: { name: string; outstanding: string }, i: number) =>
            `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#b45309">${c.outstanding}</td>
            </tr>`
          ).join('');

          const failedBlock = (r.failedCustomers ?? []).length > 0
            ? `<div style="margin-top:12px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626">Failed (${r.failedCustomers.length})</p>
                ${(r.failedCustomers as Array<{ name: string; reason: string }>).map((c) =>
                  `<p style="margin:2px 0;font-size:13px;color:#7f1d1d">${c.name} — ${c.reason}</p>`
                ).join('')}
              </div>`
            : '';

          return `
            <div style="margin-bottom:28px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <span style="font-size:15px;font-weight:700;color:#111827">${r.scheduleName}</span>
                <span style="font-size:12px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:12px">${days}</span>
                <span style="font-size:12px;color:#16a34a;background:#f0fdf4;padding:2px 8px;border-radius:12px;font-weight:600">${r.newlySent ?? 0} sent</span>
                ${!r.isRecurring ? '<span style="font-size:12px;color:#7c3aed;background:#f5f3ff;padding:2px 8px;border-radius:12px">One-time (now disabled)</span>' : ''}
              </div>
              ${(r.sentCustomers ?? []).length > 0 ? `
              <table style="border-collapse:collapse;width:100%;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
                <thead>
                  <tr style="background:#f3f4f6">
                    <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;font-weight:600">Customer</th>
                    <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;color:#374151;font-weight:600">Outstanding</th>
                  </tr>
                </thead>
                <tbody>${sentRows}</tbody>
              </table>` : ''}
              ${failedBlock}
            </div>`;
        }).join('');

      fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: notificationEmail,
          subject: `✅ Payment Reminders: ${totalSent} sent${totalFailed > 0 ? `, ${totalFailed} failed` : ''} — ${istNow}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827">
              <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0">
                <h2 style="margin:0;color:#ffffff;font-size:18px">Payment Reminder Summary</h2>
                <p style="margin:4px 0 0;color:#93c5fd;font-size:13px">${istNow} &nbsp;·&nbsp; ${force ? 'Manual trigger' : 'Scheduled (cron)'}</p>
              </div>
              <div style="background:#ffffff;padding:20px 24px;border:1px solid #e5e7eb;border-top:none">
                <div style="display:flex;gap:16px;margin-bottom:24px">
                  <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;text-align:center">
                    <div style="font-size:28px;font-weight:700;color:#16a34a">${totalSent}</div>
                    <div style="font-size:12px;color:#15803d;margin-top:2px">Reminders Sent</div>
                  </div>
                  ${totalFailed > 0 ? `<div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;text-align:center">
                    <div style="font-size:28px;font-weight:700;color:#dc2626">${totalFailed}</div>
                    <div style="font-size:12px;color:#b91c1c;margin-top:2px">Failed</div>
                  </div>` : ''}
                </div>
                ${scheduleBlocks}
              </div>
              <div style="background:#f9fafb;padding:12px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;text-align:center">
                <p style="margin:0;color:#9ca3af;font-size:11px">Automated message from Aamodha Operations Portal</p>
              </div>
            </div>
          `,
        }),
      }).catch((err) => console.error('[payment-reminder-scheduler] summary email error:', err));
    }

    return new Response(
      JSON.stringify({ triggered: true, force, currentIST, currentDayOfWeek, scheduleCount: matchingSchedules.length, results, noWhatsappDealers }),
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
