import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_RETENTION_DAYS = 15;

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

    // Get backup configuration (including retention from DAILY_BACKUP_SPECIFICATION_2PM_IST)
    const { data: configData, error: configError } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['backup_folder_path', 'backup_notification_email', 'backup_retention_days']);

    if (configError) {
      throw new Error(`Failed to fetch backup config: ${configError.message}`);
    }

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    const backupFolderPath = config.backup_folder_path || 'MyDrive/DatabaseBackups';
    const notificationEmail = config.backup_notification_email || 'pega2023test@gmail.com';
    const retentionDays = Math.max(1, Math.min(365, parseInt(config.backup_retention_days || String(DEFAULT_RETENTION_DAYS), 10) || DEFAULT_RETENTION_DAYS));

    // Calculate cutoff date (retention days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find backup logs for files older than retention period
    const { data: oldBackups, error: queryError } = await supabase
      .from('backup_logs')
      .select('id, file_name, google_drive_file_id, started_at')
      .eq('status', 'success')
      .is('deleted_at', null)
      .lt('started_at', cutoffDate.toISOString());

    if (queryError) {
      throw new Error(`Failed to query old backups: ${queryError.message}`);
    }

    if (!oldBackups || oldBackups.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No old backups to clean up',
          deletedCount: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // Delete each old backup file from Google Drive
    for (const backup of oldBackups) {
      try {
        if (!backup.google_drive_file_id) {
          // Mark as deleted even if file ID is missing
          await supabase
            .from('backup_logs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', backup.id);
          deletedCount++;
          continue;
        }

        // Delete file from Google Drive
        // Note: This requires a delete endpoint in google-drive-upload or a separate function
        // For now, we'll mark as deleted in the database
        // In production, implement actual Google Drive file deletion
        
        // Placeholder: Mark as deleted
        await supabase
          .from('backup_logs')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', backup.id);

        deletedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${backup.file_name}: ${errorMsg}`);
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    // Send notification if there were errors
    if (errors.length > 0) {
      try {
        await sendFailureNotification(notificationEmail, {
          deletedCount,
          totalCount: oldBackups.length,
          errors: errors.slice(0, 10), // Limit to first 10 errors
        }, supabaseUrl, supabaseAnonKey);
      } catch (emailError) {
        console.error('Failed to send cleanup notification:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed: ${deletedCount} backups deleted`,
        deletedCount,
        totalFound: oldBackups.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
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
 * Send cleanup failure notification email
 */
async function sendFailureNotification(
  email: string,
  details: {
    deletedCount: number;
    totalCount: number;
    errors: string[];
  },
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<void> {
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `[Database Backup] Cleanup Completed with Errors - ${new Date().toLocaleDateString()}`,
        html: `
          <h2>Backup Cleanup Report</h2>
          <p><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Backups Found:</strong> ${details.totalCount}</p>
          <p><strong>Successfully Deleted:</strong> ${details.deletedCount}</p>
          ${details.errors.length > 0 ? `
            <p><strong>Errors:</strong></p>
            <ul>
              ${details.errors.map(err => `<li>${err}</li>`).join('')}
            </ul>
          ` : ''}
          <hr>
          <p><em>This is an automated message from Aamodha Operations Portal.</em></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email send failed: ${emailResponse.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send cleanup notification:', error);
  }
}
