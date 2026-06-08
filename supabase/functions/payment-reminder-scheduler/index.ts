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
      force || isTimeInCurrentWindow(s.send_time_ist)
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

    // Fetch aggregated outstanding per customer via RPC (avoids full table scan)
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

    // Fetch ALL customer rows (active + inactive) — the customers table has multiple rows
    // per dealer (one per pricing period). Transactions reference old pricing-period IDs
    // that are now is_active=false, so filtering to is_active=true would hide those customers.
    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('id, client_name, whatsapp_number, is_active');

    if (custError) throw new Error(`Failed to fetch customers: ${custError.message}`);

    // Map every customer row ID → client_name (covers all pricing periods)
    const idToDealerName = new Map<string, string>(
      (allCustomers || []).map((c) => [c.id, c.client_name])
    );

    // Map client_name → the best row to use for sending (active row preferred, must have WhatsApp number)
    const dealerInfo = new Map<string, { id: string; dealer_name: string; whatsapp_number: string }>();
    for (const c of (allCustomers || [])) {
      if (!c.whatsapp_number) continue;
      const existing = dealerInfo.get(c.client_name);
      if (!existing || (!existing.is_active && c.is_active)) {
        dealerInfo.set(c.client_name, { id: c.id, dealer_name: c.client_name, whatsapp_number: c.whatsapp_number });
      }
    }

    // Aggregate outstanding + oldest sale date PER DEALER (across all pricing-period IDs)
    const dealerData = new Map<string, { outstanding: number; oldestSaleDate: string | null; invoiceCount: number }>();
    const noWhatsappDealers: string[] = [];

    // Build a set of dealer names that have at least one outstanding customer_id
    const dealersWithOutstanding = new Set<string>();
    for (const [customerId] of customerData.entries()) {
      const dealerName = idToDealerName.get(customerId);
      if (dealerName) dealersWithOutstanding.add(dealerName);
    }

    for (const [customerId, data] of customerData.entries()) {
      const dealerName = idToDealerName.get(customerId);
      if (!dealerName) continue;
      if (!dealerInfo.has(dealerName)) continue; // no WhatsApp number → skip
      if (!dealerData.has(dealerName)) {
        dealerData.set(dealerName, { outstanding: 0, oldestSaleDate: null, invoiceCount: 0 });
      }
      const entry = dealerData.get(dealerName)!;
      entry.outstanding += data.outstanding;
      entry.invoiceCount += data.invoiceCount;
      if (data.oldestSaleDate && (!entry.oldestSaleDate || data.oldestSaleDate < entry.oldestSaleDate)) {
        entry.oldestSaleDate = data.oldestSaleDate;
      }
    }

    // Identify dealers with outstanding balance but no WhatsApp number configured
    for (const dealerName of dealersWithOutstanding) {
      if (!dealerInfo.has(dealerName)) {
        noWhatsappDealers.push(dealerName);
      }
    }

    // Fetch contacts for all dealers that have outstanding amounts
    const dealerNamesWithOutstanding = [...dealersWithOutstanding];
    const { data: contactsData } = await supabase
      .from('client_contacts')
      .select('client_name, contact_name, phone, role')
      .in('client_name', dealerNamesWithOutstanding)
      .eq('is_active', true);

    // Map dealer name → list of active contacts
    const dealerContacts = new Map<string, Array<{ contact_name: string; phone: string; role: string }>>();
    for (const c of (contactsData || [])) {
      if (!dealerContacts.has(c.client_name)) dealerContacts.set(c.client_name, []);
      dealerContacts.get(c.client_name)!.push({ contact_name: c.contact_name, phone: c.phone, role: c.role });
    }

    const now = new Date();
    const results = [];

    for (const schedule of matchingSchedules) {
      const daysOverdueMs = schedule.days_overdue * 24 * 60 * 60 * 1000;
      const minOutstanding = schedule.min_outstanding_amount ?? 0;

      // Find dealers eligible for this schedule
      const notYetOverdue: string[] = [];
      const eligibleDealers = Array.from(dealerData.entries())
        .filter(([dealerName, data]) => {
          if (data.outstanding <= 0) return false;
          if (data.outstanding < minOutstanding) return false;
          if (!data.oldestSaleDate) return false;
          const oldestDate = new Date(data.oldestSaleDate);
          const overdue = now.getTime() - oldestDate.getTime() >= daysOverdueMs;
          if (!overdue) notYetOverdue.push(dealerName);
          return overdue;
        })
        .map(([dealerName]) => dealerName);

      if (eligibleDealers.length === 0) {
        results.push({ scheduleId: schedule.id, scheduleName: schedule.name, sent: 0, skipped: 0, reason: 'No eligible customers' });
        continue;
      }

      // Dedup: skip dealers already reminded by this schedule within days_overdue days.
      // Bypassed when force=true (manual trigger) so the button always re-sends to all eligible customers.
      let newDealers = eligibleDealers;
      let dedupSkippedCount = 0;
      if (!force) {
        const dedupWindowAgo = new Date(now.getTime() - daysOverdueMs).toISOString();
        const eligibleActiveIds = eligibleDealers.map((name) => dealerInfo.get(name)!.id);
        const { data: recentLogs } = await supabase
          .from('payment_reminder_logs')
          .select('customer_id')
          .eq('schedule_id', schedule.id)
          .in('customer_id', eligibleActiveIds)
          .gte('triggered_at', dedupWindowAgo);

        const recentIds = new Set((recentLogs || []).map((l: { customer_id: string }) => l.customer_id));
        newDealers = eligibleDealers.filter((name) => !recentIds.has(dealerInfo.get(name)!.id));
        dedupSkippedCount = eligibleDealers.length - newDealers.length;
      }

      let sent = 0;
      let failed = 0;
      const sentCustomers: Array<{ name: string; outstanding: string; daysOverdue: number }> = [];
      const failedCustomers: Array<{ name: string; reason: string }> = [];
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const sendWithRateLimitRetry = async (body: object): Promise<{ success: boolean; messageLogId?: string; error?: string }> => {
        // Supabase rate-limits edge function invocations; retry once after the specified window
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          // 429 Too Many Requests — honour the Retry-After header or fall back to 10s
          if (res.status === 429) {
            const retryAfterMs = parseInt(res.headers.get('retry-after') || '10000', 10) + 500;
            await sleep(retryAfterMs);
            continue;
          }

          // Read body once as text, then try to parse as JSON so we always have the raw body for error reporting
          let rawBody = '';
          let result: { success?: boolean; messageLogId?: string; error?: string } = {};
          try {
            rawBody = await res.text();
            result = rawBody ? JSON.parse(rawBody) : {};
          } catch (_) {
            // Non-JSON response (HTML error page, Supabase gateway error, cold-start failure, etc.)
            return { success: false, error: `HTTP ${res.status}: ${rawBody.slice(0, 300)}` };
          }

          // Supabase rate limit returned as 200 with error message inside the body
          if (!result.success && typeof result.error === 'string' && result.error.toLowerCase().includes('rate limit')) {
            const match = result.error.match(/(\d+)ms/);
            const retryMs = match ? parseInt(match[1], 10) + 500 : 10000;
            await sleep(retryMs);
            continue;
          }

          // If the call failed but the function returned no error string, attach the HTTP status so it's visible in logs
          if (!result.success && !result.error) {
            result.error = `HTTP ${res.status} from whatsapp-send (empty error body)`;
          }

          return result as { success: boolean; messageLogId?: string; error?: string };
        }
        return { success: false, error: 'Rate limit: max retries exceeded' };
      };

      for (const dealerName of newDealers) {
        const customer = dealerInfo.get(dealerName)!;
        const data = dealerData.get(dealerName)!;

        const daysOverdueActual = Math.floor(
          (now.getTime() - new Date(data.oldestSaleDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        const outstandingFormatted = `₹${data.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

        const placeholders = {
          customerName: customer.dealer_name,
          amount: outstandingFormatted,            // matches templates using {amount}
          outstandingAmount: outstandingFormatted, // matches templates using {outstandingAmount}
          invoiceCount: data.invoiceCount.toString(),
          daysOverdue: daysOverdueActual.toString(),
          oldestInvoiceDate: new Date(data.oldestSaleDate!).toLocaleDateString('en-IN'),
        };

        // Determine recipients: use contacts if any, otherwise fall back to customer's WhatsApp number
        const contacts = dealerContacts.get(dealerName) || [];
        const recipients: Array<{ phone?: string; label: string }> =
          contacts.length > 0
            ? contacts.map((c) => ({ phone: c.phone, label: `${c.contact_name} (${c.role})` }))
            : [{ label: 'customer' }]; // no toPhone → whatsapp-send uses customer.whatsapp_number

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
          sentCustomers.push({ name: customer.dealer_name, outstanding: outstandingFormatted, daysOverdue: daysOverdueActual });
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

      results.push({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        daysOverdue: schedule.days_overdue,
        eligible: eligibleDealers.length,
        alreadySentInWindow: dedupSkippedCount,
        newlySent: sent,
        failed,
        notYetOverdue,
        sentCustomers,
        failedCustomers,
      });
    }

    // console.log('[payment-reminder-scheduler] results:', JSON.stringify(results));

    // Send summary email — best-effort, non-blocking
    const totalSent = results.reduce((s, r) => s + (r.newlySent ?? 0), 0);
    const totalFailed = results.reduce((s, r) => s + (r.failed ?? 0), 0);
    // Only email when at least one message was sent. Pure-failure runs are logged in
    // payment_reminder_logs (failure_reason column) but do not trigger a summary email
    // to avoid daily spam when the WhatsApp API is consistently failing.
    if (totalSent > 0) {
      const istNow = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000)
        .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const scheduleBlocks = results
        .filter((r) => (r.newlySent ?? 0) > 0 || (r.failed ?? 0) > 0)
        .map((r) => {
          const sentRows = (r.sentCustomers ?? []).map((c: { name: string; outstanding: string; daysOverdue: number }, i: number) =>
            `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#b45309">${c.outstanding}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280">${c.daysOverdue} days</td>
            </tr>`
          ).join('');

          const failedBlock = (r.failedCustomers ?? []).length > 0
            ? `<div style="margin-top:12px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626">Failed to send (${r.failedCustomers.length})</p>
                ${(r.failedCustomers as Array<{ name: string; reason: string }>).map((c) => `<p style="margin:2px 0;font-size:13px;color:#7f1d1d">${c.name} — ${c.reason}</p>`).join('')}
              </div>`
            : '';

          return `
            <div style="margin-bottom:28px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <span style="font-size:15px;font-weight:700;color:#111827">${r.scheduleName}</span>
                <span style="font-size:12px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:12px">${r.daysOverdue ?? '—'}-day overdue</span>
                <span style="font-size:12px;color:#16a34a;background:#f0fdf4;padding:2px 8px;border-radius:12px;font-weight:600">${r.newlySent ?? 0} sent</span>
              </div>
              ${(r.sentCustomers ?? []).length > 0 ? `
              <table style="border-collapse:collapse;width:100%;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
                <thead>
                  <tr style="background:#f3f4f6">
                    <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;font-weight:600">Customer</th>
                    <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;color:#374151;font-weight:600">Outstanding</th>
                    <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;color:#374151;font-weight:600">Overdue</th>
                  </tr>
                </thead>
                <tbody>${sentRows}</tbody>
              </table>` : ''}
              ${failedBlock}
            </div>`;
        }).join('');

      fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
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
      JSON.stringify({ triggered: true, force, currentIST, scheduleCount: matchingSchedules.length, results, noWhatsappDealers }),
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
