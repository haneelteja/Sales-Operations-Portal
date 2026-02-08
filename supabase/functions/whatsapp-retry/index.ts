import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryRequest {
  messageLogId?: string; // If provided, retry specific message
  autoRetry?: boolean; // If true, retry all eligible failed messages
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
    const { messageLogId, autoRetry = false }: RetryRequest = await req.json().catch(() => ({}));

    // Get retry configuration
    const { data: configData } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['whatsapp_retry_max', 'whatsapp_retry_interval_minutes', 'whatsapp_failure_notification_email']);

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    const maxRetries = parseInt(config.whatsapp_retry_max || '3', 10);
    const retryIntervalMinutes = parseInt(config.whatsapp_retry_interval_minutes || '30', 10);
    const failureEmail = config.whatsapp_failure_notification_email || 'pega2023test@gmail.com';

    if (messageLogId) {
      // Retry specific message
      const { data: logEntry, error: logError } = await supabase
        .from('whatsapp_message_logs')
        .select('*')
        .eq('id', messageLogId)
        .single();

      if (logError || !logEntry) {
        throw new Error(`Message log not found: ${logError?.message || 'Unknown error'}`);
      }

      if (logEntry.status !== 'failed') {
        return new Response(
          JSON.stringify({ success: false, error: 'Message is not in failed status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (logEntry.retry_count >= logEntry.max_retries) {
        // Send failure notification
        await sendFailureNotification(failureEmail, logEntry, supabaseUrl, supabaseAnonKey);
        return new Response(
          JSON.stringify({ success: false, error: 'Max retries exceeded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Retry the message by calling whatsapp-send
      const retryResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: logEntry.customer_id,
          messageType: logEntry.message_type,
          triggerType: logEntry.trigger_type,
          templateId: logEntry.template_id,
          customMessage: logEntry.message_content,
          attachmentUrl: logEntry.attachment_url,
          attachmentType: logEntry.attachment_type,
        }),
      });

      const retryResult = await retryResponse.json();

      // Update retry count
      await supabase
        .from('whatsapp_message_logs')
        .update({
          retry_count: logEntry.retry_count + 1,
        })
        .eq('id', messageLogId);

      return new Response(
        JSON.stringify(retryResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (autoRetry) {
      // Auto-retry all eligible failed messages
      const retryCutoffTime = new Date();
      retryCutoffTime.setMinutes(retryCutoffTime.getMinutes() - retryIntervalMinutes);

      const { data: failedMessages, error: fetchError } = await supabase
        .from('whatsapp_message_logs')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', maxRetries)
        .or(`updated_at.lt.${retryCutoffTime.toISOString()},updated_at.is.null`);

      if (fetchError) {
        throw new Error(`Failed to fetch failed messages: ${fetchError.message}`);
      }

      const results = [];
      for (const message of failedMessages || []) {
        try {
          const retryResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId: message.customer_id,
              messageType: message.message_type,
              triggerType: message.trigger_type,
              templateId: message.template_id,
              customMessage: message.message_content,
              attachmentUrl: message.attachment_url,
              attachmentType: message.attachment_type,
            }),
          });

          const retryResult = await retryResponse.json();

          // Update retry count
          await supabase
            .from('whatsapp_message_logs')
            .update({
              retry_count: message.retry_count + 1,
            })
            .eq('id', message.id);

          results.push({ messageId: message.id, success: retryResult.success });

          // If still failed after max retries, send notification
          if (!retryResult.success && message.retry_count + 1 >= maxRetries) {
            await sendFailureNotification(failureEmail, message, supabaseUrl, supabaseAnonKey);
          }
        } catch (error) {
          results.push({
            messageId: message.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          retried: results.length,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Either messageLogId or autoRetry=true must be provided');
    }
  } catch (error) {
    console.error('WhatsApp retry error:', error);
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
 * Send failure notification email
 */
async function sendFailureNotification(
  email: string,
  logEntry: any,
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
        subject: `[WhatsApp] Message Failed - ${logEntry.message_type}`,
        html: `
          <h2>WhatsApp Message Failure Alert</h2>
          <p><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Customer:</strong> ${logEntry.customer_name}</p>
          <p><strong>WhatsApp Number:</strong> ${logEntry.whatsapp_number}</p>
          <p><strong>Message Type:</strong> ${logEntry.message_type}</p>
          <p><strong>Trigger:</strong> ${logEntry.trigger_type}</p>
          <p><strong>Status:</strong> Failed</p>
          <p><strong>Retry Count:</strong> ${logEntry.retry_count}/${logEntry.max_retries}</p>
          <p><strong>Failure Reason:</strong></p>
          <pre>${logEntry.failure_reason || 'Unknown error'}</pre>
          <p><strong>Message Log ID:</strong> ${logEntry.id}</p>
          <p>Please investigate and ensure WhatsApp messaging is functioning correctly.</p>
          <hr>
          <p><em>This is an automated message from Aamodha Operations Portal.</em></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send failure notification email');
    }
  } catch (error) {
    console.error('Error sending failure notification:', error);
  }
}
