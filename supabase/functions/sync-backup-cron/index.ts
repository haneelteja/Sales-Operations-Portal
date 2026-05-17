/**
 * sync-backup-cron
 *
 * Called by the app whenever the user saves a new backup schedule time (IST).
 * Converts the IST time to UTC and updates the cron-job.org job schedule via API
 * so the cron fires at the exact right UTC moment — no 15-minute window guessing.
 *
 * Required secrets:
 *   CRONJOB_ORG_API_KEY   — API key from cron-job.org account settings
 *   BACKUP_CRONJOB_JOB_ID — numeric job ID from the cron-job.org job URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Convert HH:MM IST string to { hour, minute } in UTC */
function istToUtc(timeIST: string): { hour: number; minute: number } {
  const [h, m] = timeIST.split(':').map(Number);
  let utcMinute = m - 30;
  let utcHour = h - 5;
  if (utcMinute < 0) { utcMinute += 60; utcHour -= 1; }
  if (utcHour < 0) { utcHour += 24; }
  return { hour: utcHour, minute: utcMinute };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { timeIST } = await req.json();
    if (!timeIST || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeIST)) {
      return new Response(
        JSON.stringify({ error: 'timeIST is required in HH:MM 24h format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('CRONJOB_ORG_API_KEY');
    const jobId  = Deno.env.get('BACKUP_CRONJOB_JOB_ID');

    if (!apiKey || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing CRONJOB_ORG_API_KEY or BACKUP_CRONJOB_JOB_ID in secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { hour, minute } = istToUtc(timeIST);

    const cronRes = await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job: {
          schedule: {
            timezone: 'UTC',
            hours:   [hour],
            minutes: [minute],
            mdays:   [-1],
            months:  [-1],
            wdays:   [-1],
          },
        },
      }),
    });

    if (!cronRes.ok) {
      const errText = await cronRes.text();
      console.error('[sync-backup-cron] cron-job.org API error:', cronRes.status, errText);
      return new Response(
        JSON.stringify({ error: `cron-job.org returned ${cronRes.status}: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-backup-cron] Updated job ${jobId} → ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} UTC (${timeIST} IST)`);

    return new Response(
      JSON.stringify({ success: true, timeIST, utcHour: hour, utcMinute: minute }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[sync-backup-cron] error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
