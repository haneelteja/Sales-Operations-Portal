/**
 * Backup Scheduler
 *
 * Triggered by cron-job.org at the exact UTC time that corresponds to the
 * user-configured IST backup time (set via sync-backup-cron edge function).
 * No longer needs 15-minute window matching — cron fires at the right moment.
 *
 * Guard: skips if an automatic backup already succeeded or is in progress
 * within the last 20 hours to prevent accidental double-runs.
 *
 * Auth: set BACKUP_CRON_SECRET in Supabase Edge Function secrets and pass it as
 * the x-backup-cron-secret header (or Authorization: Bearer <secret>).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-backup-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Auth: require BACKUP_CRON_SECRET
  const cronSecret   = Deno.env.get('BACKUP_CRON_SECRET');
  const customHeader = req.headers.get('x-backup-cron-secret')?.trim() ?? '';
  const authHeader   = req.headers.get('Authorization') ?? '';
  const bearer       = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerSecret = customHeader || bearer;

  if (!cronSecret || headerSecret !== cronSecret) {
    const reason = !cronSecret
      ? 'BACKUP_CRON_SECRET not set in Supabase Edge Function secrets'
      : 'Secret mismatch or missing. Send header: x-backup-cron-secret with the exact secret';
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: reason }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl        = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check backup_enabled flag
    const { data: configData } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .eq('config_key', 'backup_enabled')
      .single();

    if (configData?.config_value === 'false') {
      return new Response(
        JSON.stringify({ triggered: false, reason: 'Backup is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dedup guard: skip if automatic backup already succeeded/in-progress in last 20 hours
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const { data: recentBackup } = await supabase
      .from('backup_logs')
      .select('id, status, started_at')
      .eq('backup_type', 'automatic')
      .in('status', ['success', 'in_progress'])
      .gte('started_at', twentyHoursAgo)
      .limit(1)
      .maybeSingle();

    if (recentBackup) {
      return new Response(
        JSON.stringify({
          triggered: false,
          reason: `Automatic backup already ran at ${recentBackup.started_at} (status: ${recentBackup.status})`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger the backup using supabase.functions.invoke (handles auth correctly)
    const { data: backupResult, error: invokeError } = await supabase.functions.invoke('database-backup', {
      body: { trigger: 'automatic' },
    });

    if (invokeError) {
      console.error('[backup-scheduler] database-backup invocation error:', invokeError);
      return new Response(
        JSON.stringify({ triggered: true, success: false, error: invokeError.message || String(invokeError) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!backupResult?.success) {
      console.error('[backup-scheduler] database-backup returned failure:', backupResult);
      return new Response(
        JSON.stringify({ triggered: true, success: false, error: backupResult?.error || 'Backup failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[backup-scheduler] triggered successfully:', backupResult);

    return new Response(
      JSON.stringify({ triggered: true, success: true, logId: backupResult.logId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[backup-scheduler] error:', error);
    return new Response(
      JSON.stringify({ triggered: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
