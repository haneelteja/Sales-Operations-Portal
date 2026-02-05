/**
 * Backup Scheduler
 *
 * Runs on a fixed schedule (e.g. every 15 minutes). Reads backup_schedule_time_ist
 * and backup_enabled from invoice_configurations; if backup is enabled and current
 * time in IST matches the configured time (within the current 15-minute window),
 * invokes database-backup with trigger: 'automatic'.
 *
 * This allows the Application Configuration "Database Backup Time" to control
 * when the daily backup runs without changing cron.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Get current time in IST as HH:MM (24h) */
function getCurrentISTTime(): string {
  const now = new Date();
  const utcMs = now.getTime();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);
  const h = istDate.getUTCHours();
  const m = istDate.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Check if configured time (e.g. "14:00") falls within the current 15-minute window */
function isTimeInCurrentWindow(configuredTime: string, windowMinutes: number = 15): boolean {
  const [ch, cm] = configuredTime.trim().split(':').map(Number);
  const configuredMins = ch * 60 + cm;

  const now = new Date();
  const utcMs = now.getTime();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);
  const currentMins = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();

  const windowStart = Math.floor(currentMins / windowMinutes) * windowMinutes;
  const windowEnd = windowStart + windowMinutes;
  return configuredMins >= windowStart && configuredMins < windowEnd;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: configData, error: configError } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['backup_enabled', 'backup_schedule_time_ist']);

    if (configError) {
      throw new Error(`Failed to fetch config: ${configError.message}`);
    }

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    if (config.backup_enabled === 'false') {
      return new Response(
        JSON.stringify({ triggered: false, reason: 'Backup is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scheduleTime = (config.backup_schedule_time_ist || '14:00').trim();
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(scheduleTime)) {
      return new Response(
        JSON.stringify({ triggered: false, reason: `Invalid backup_schedule_time_ist: ${scheduleTime}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentIST = getCurrentISTTime();
    if (!isTimeInCurrentWindow(scheduleTime)) {
      return new Response(
        JSON.stringify({
          triggered: false,
          reason: 'Current time does not match schedule',
          currentIST,
          scheduleTime,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backupUrl = `${supabaseUrl}/functions/v1/database-backup`;
    const backupRes = await fetch(backupUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'automatic' }),
    });

    const backupResult = await backupRes.json().catch(() => ({}));
    if (!backupRes.ok) {
      console.error('[backup-scheduler] database-backup failed:', backupRes.status, backupResult);
      return new Response(
        JSON.stringify({
          triggered: true,
          success: false,
          error: backupResult.error || backupRes.statusText,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        triggered: true,
        success: backupResult.success !== false,
        currentIST,
        scheduleTime,
        logId: backupResult.logId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[backup-scheduler] error:', error);
    return new Response(
      JSON.stringify({
        triggered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
