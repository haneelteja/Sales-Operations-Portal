import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Aamodha Operations <onboarding@resend.dev>';
    const recipientEmail = 'nalluruhaneel@gmail.com';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch yesterday's logs (IST-aware: use 24h window ending now)
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dateLabel = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!logs || logs.length === 0) {
      console.log(`No audit logs for ${dateLabel}. Skipping email.`);
      return new Response(
        JSON.stringify({ success: true, message: 'No logs to report today' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group logs by user
    const byUser: Record<string, typeof logs> = {};
    for (const log of logs) {
      const key = log.username ?? 'Unknown';
      if (!byUser[key]) byUser[key] = [];
      byUser[key].push(log);
    }

    // Count by action type
    const createCount = logs.filter(l => l.action === 'CREATE').length;
    const updateCount = logs.filter(l => l.action === 'UPDATE').length;
    const deleteCount = logs.filter(l => l.action === 'DELETE').length;

    const formatTime = (iso: string) =>
      new Date(iso).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      });

    const actionBadge = (action: string) => {
      const colors: Record<string, string> = {
        CREATE: '#166534',
        UPDATE: '#1e40af',
        DELETE: '#991b1b',
      };
      const bg: Record<string, string> = {
        CREATE: '#dcfce7',
        UPDATE: '#dbeafe',
        DELETE: '#fee2e2',
      };
      return `<span style="background:${bg[action]??'#f3f4f6'};color:${colors[action]??'#374151'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${action}</span>`;
    };

    const userSections = Object.entries(byUser).map(([username, userLogs]) => `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 8px;color:#1e293b;font-size:15px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
          👤 ${username} — ${userLogs.length} action${userLogs.length > 1 ? 's' : ''}
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Time</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Action</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Module</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${userLogs.map(log => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 8px;color:#475569;white-space:nowrap;">${formatTime(log.created_at)}</td>
                <td style="padding:6px 8px;">${actionBadge(log.action)}</td>
                <td style="padding:6px 8px;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:3px;font-size:11px;">${log.entity_type}</code></td>
                <td style="padding:6px 8px;color:#1e293b;">${log.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Audit Report — ${dateLabel}</title>
</head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:white;padding:32px 30px;text-align:center;">
      <h1 style="margin:0;font-size:22px;">Daily Activity Report</h1>
      <p style="margin:6px 0 0;opacity:0.85;font-size:15px;">${dateLabel} — Aamodha Operations Portal</p>
    </div>

    <div style="padding:28px 30px;">
      <!-- Summary -->
      <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#dcfce7;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#166534;">${createCount}</div>
          <div style="font-size:13px;color:#166534;font-weight:500;">Created</div>
        </div>
        <div style="flex:1;min-width:120px;background:#dbeafe;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#1e40af;">${updateCount}</div>
          <div style="font-size:13px;color:#1e40af;font-weight:500;">Updated</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fee2e2;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#991b1b;">${deleteCount}</div>
          <div style="font-size:13px;color:#991b1b;font-weight:500;">Deleted</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#475569;">${logs.length}</div>
          <div style="font-size:13px;color:#475569;font-weight:500;">Total</div>
        </div>
      </div>

      <!-- Per-user breakdown -->
      <h2 style="font-size:17px;color:#1e293b;margin:0 0 16px;">Activity by User</h2>
      ${userSections}
    </div>

    <div style="text-align:center;padding:16px 30px 24px;color:#94a3b8;font-size:13px;border-top:1px solid #f1f5f9;">
      Aamodha Operations Portal — Auto-generated daily report
    </div>
  </div>
</body>
</html>`.trim();

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not set. Logging report instead.');
      console.log(`Daily report for ${dateLabel}: ${logs.length} total actions`);
      return new Response(
        JSON.stringify({ success: false, message: 'RESEND_API_KEY not configured', logs: logs.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject: `Daily Activity Report — ${dateLabel} (${logs.length} actions)`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend error:', emailData);
      return new Response(
        JSON.stringify({ success: false, error: emailData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Daily audit email sent for ${dateLabel}: ${logs.length} actions, Resend ID: ${emailData.id}`);

    return new Response(
      JSON.stringify({ success: true, logs: logs.length, resendId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
