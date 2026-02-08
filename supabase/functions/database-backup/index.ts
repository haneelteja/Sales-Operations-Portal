import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  trigger: 'automatic' | 'manual';
  triggered_by?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { trigger, triggered_by }: BackupRequest = await req.json().catch(() => ({}));
    const backupType = trigger || 'automatic';

    // Get backup configuration (including schedule time for automatic filename)
    const { data: configData, error: configError } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['backup_folder_path', 'backup_notification_email', 'backup_enabled', 'backup_schedule_time_ist']);

    if (configError) {
      throw new Error(`Failed to fetch backup config: ${configError.message}`);
    }

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    // Check if backup is enabled
    if (config.backup_enabled === 'false') {
      return new Response(
        JSON.stringify({ success: false, error: 'Backup is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backupFolderPath = config.backup_folder_path || 'MyDrive/Invoice';
    const notificationEmail = config.backup_notification_email || 'pega2023test@gmail.com';

    // Generate backup file name (IST-aware). Automatic: use backup_schedule_time_ist (e.g. 14:00 -> 14-00); Manual: current IST time
    const { dateStr: istDateStr, timeStr: istTimeStr } = getISTDateAndTime();
    const scheduleTime = (config.backup_schedule_time_ist || '14:00').trim();
    const scheduledTimeStr = /^([01]?\d|2[0-3]):[0-5]\d$/.test(scheduleTime)
      ? scheduleTime.replace(':', '-')
      : '14-00';
    const timeStr = backupType === 'automatic' ? scheduledTimeStr : istTimeStr;
    const fileName = `SQL_Backup_${istDateStr}_${timeStr}_IST.sql.gz`;

    const startedAtMs = Date.now();

    // Create backup log entry
    const { data: logEntry, error: logError } = await supabase
      .from('backup_logs')
      .insert({
        backup_type: backupType,
        status: 'in_progress',
        file_name: fileName,
        triggered_by: triggered_by || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error(`Failed to create backup log: ${logError?.message || 'Unknown error'}`);
    }

    const logId = logEntry.id;

    try {
      // Step 1: Generate database dump
      // Note: In Supabase, we need to use pg_dump via connection string
      // For Edge Functions, we'll use Supabase's database connection
      const dbUrl = Deno.env.get('DATABASE_URL') || Deno.env.get('SUPABASE_DB_URL');
      
      if (!dbUrl) {
        throw new Error('Database URL not configured. Set DATABASE_URL or SUPABASE_DB_URL in Edge Function secrets.');
      }

      // Use pg_dump command (requires Deno exec or external service)
      // For now, we'll use Supabase's REST API to export data
      // This is a simplified approach - full pg_dump requires database access
      
      // Alternative: Use Supabase's database dump API if available
      // Or use a PostgreSQL client library to generate dump
      
      // For production, consider using Supabase's built-in backup feature
      // or a dedicated backup service
      
      // Placeholder: Generate a backup file
      // In production, replace this with actual pg_dump execution
      const backupContent = `-- Database Backup
-- Generated: ${new Date().toISOString()}
-- This is a placeholder backup file
-- Replace with actual pg_dump output in production
`;

      // Compress backup (using Deno's built-in compression)
      const encoder = new TextEncoder();
      const data = encoder.encode(backupContent);
      const compressed = await compressGzip(data);

      // Step 2: Upload to Google Drive
      const base64Data = btoa(String.fromCharCode(...compressed));

      const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/google-drive-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
          folderPath: backupFolderPath,
          mimeType: 'application/gzip',
        }),
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(`Google Drive upload failed: ${uploadError.error || uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();

      // Step 3: Update backup log with success and execution duration
      const fileId = uploadResult.id || uploadResult.fileId;
      const fileUrl = uploadResult.webViewLink || uploadResult.fileUrl || uploadResult.webContentLink;
      const completedAt = new Date().toISOString();
      const executionDurationSeconds = Math.round((Date.now() - startedAtMs) / 1000 * 100) / 100;

      await supabase
        .from('backup_logs')
        .update({
          status: 'success',
          file_size_bytes: compressed.length,
          google_drive_file_id: fileId,
          google_drive_path: fileUrl || `${backupFolderPath}/${fileName}`,
          completed_at: completedAt,
          execution_duration_seconds: executionDurationSeconds,
        })
        .eq('id', logId);

      return new Response(
        JSON.stringify({
          success: true,
          logId,
          fileName,
          fileSize: compressed.length,
          googleDrivePath: fileUrl,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      // Update backup log with failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase
        .from('backup_logs')
        .update({
          status: 'failed',
          failure_reason: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logId);

      // Send failure notification email
      try {
        await sendFailureNotification(notificationEmail, {
          backupType,
          fileName,
          error: errorMessage,
          logId,
        }, supabaseUrl, supabaseAnonKey);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          logId,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Get current date and time in IST (UTC+5:30) for backup filename
 */
function getISTDateAndTime(): { dateStr: string; timeStr: string } {
  const now = new Date();
  const utcMs = now.getTime();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);
  const dateStr = istDate.toISOString().slice(0, 10);
  const h = istDate.getUTCHours();
  const m = istDate.getUTCMinutes();
  const timeStr = `${String(h).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
  return { dateStr, timeStr };
}

/**
 * Compress data using gzip
 */
async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  writer.write(data);
  writer.close();

  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Send failure notification email
 */
async function sendFailureNotification(
  email: string,
  details: {
    backupType: string;
    fileName: string;
    error: string;
    logId: string;
  },
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<void> {
  // Use existing email function or create a new one
  // For now, we'll call a generic email function
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `[Database Backup] Backup Failed - ${new Date().toLocaleDateString()}`,
        html: `
          <h2>Database Backup Failure Alert</h2>
          <p><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Backup Type:</strong> ${details.backupType}</p>
          <p><strong>Status:</strong> Failed</p>
          <p><strong>File Name:</strong> ${details.fileName}</p>
          <p><strong>Failure Details:</strong></p>
          <pre>${details.error}</pre>
          <p><strong>Backup ID:</strong> ${details.logId}</p>
          <p>Please investigate and ensure backups are functioning correctly.</p>
          <hr>
          <p><em>This is an automated message from Aamodha Operations Portal.</em></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email send failed: ${emailResponse.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Don't throw - email failure shouldn't fail the backup log update
  }
}
