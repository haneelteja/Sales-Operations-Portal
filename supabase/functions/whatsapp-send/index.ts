import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppSendRequest {
  customerId: string;
  messageType: 'stock_delivered' | 'invoice' | 'payment_reminder' | 'festival';
  triggerType: 'auto' | 'scheduled' | 'manual';
  templateId?: string;
  customMessage?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  scheduledFor?: string;
  placeholders?: Record<string, string>; // Custom placeholder values
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const {
      customerId,
      messageType,
      triggerType,
      templateId,
      customMessage,
      attachmentUrl,
      attachmentType,
      scheduledFor,
      placeholders = {},
    }: WhatsAppSendRequest = await req.json();

    // Validate required fields
    if (!customerId || !messageType || !triggerType) {
      throw new Error('customerId, messageType, and triggerType are required');
    }

    // Step 1: Get WhatsApp configuration
    const { data: configData, error: configError } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', [
        'whatsapp_enabled',
        `whatsapp_${messageType}_enabled`,
        'whatsapp_api_key',
        'whatsapp_api_url',
        'whatsapp_retry_max',
        'whatsapp_failure_notification_email',
      ]);

    if (configError) {
      throw new Error(`Failed to fetch config: ${configError.message}`);
    }

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    // Check if WhatsApp is enabled
    if (config.whatsapp_enabled !== 'true') {
      return new Response(
        JSON.stringify({ success: false, error: 'WhatsApp messaging is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this message type is enabled
    if (config[`whatsapp_${messageType}_enabled`] !== 'true') {
      return new Response(
        JSON.stringify({ success: false, error: `${messageType} messages are disabled` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = config.whatsapp_api_key;
    const apiUrl = config.whatsapp_api_url || 'https://api.360messenger.com';
    const maxRetries = parseInt(config.whatsapp_retry_max || '3', 10);
    const failureEmail = config.whatsapp_failure_notification_email || 'pega2023test@gmail.com';

    if (!apiKey) {
      throw new Error('WhatsApp API key not configured');
    }

    // Step 2: Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, client_name, whatsapp_number')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${customerError?.message || 'Unknown error'}`);
    }

    // Log API configuration (mask sensitive data) - after customer is fetched
    console.log('WhatsApp API Configuration:', {
      apiUrl,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
      messageType,
      customerId,
      customerName: customer.client_name,
      whatsappNumber: customer.whatsapp_number,
    });

    if (!customer.whatsapp_number) {
      throw new Error(`Customer ${customer.client_name} does not have a WhatsApp number`);
    }

    // Validate WhatsApp number format
    const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
    if (!whatsappRegex.test(customer.whatsapp_number.replace(/\s/g, ''))) {
      throw new Error(`Invalid WhatsApp number format: ${customer.whatsapp_number}`);
    }

    // Step 3: Get template or use custom message
    let messageContent = customMessage;
    let templateIdToUse = templateId;

    if (!messageContent) {
      // Fetch template
      let templateQuery = supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('message_type', messageType)
        .eq('is_active', true);

      if (templateId) {
        templateQuery = templateQuery.eq('id', templateId);
      } else {
        // Use default template
        templateQuery = templateQuery.eq('is_default', true);
      }

      const { data: template, error: templateError } = await templateQuery.single();

      if (templateError || !template) {
        throw new Error(`Template not found: ${templateError?.message || 'Unknown error'}`);
      }

      templateIdToUse = template.id;
      messageContent = template.template_content;

      // Replace placeholders
      const defaultPlaceholders: Record<string, string> = {
        customerName: customer.client_name,
        ...placeholders,
      };

      // Replace placeholders in template
      messageContent = (messageContent ?? '').replace(/\{(\w+)\}/g, (match, key) => {
        return defaultPlaceholders[key] || match;
      });
    }
    if (!messageContent) {
      throw new Error('Message content is required');
    }

    // Step 4: Create message log entry
    const { data: logEntry, error: logError } = await supabase
      .from('whatsapp_message_logs')
      .insert({
        customer_id: customerId,
        customer_name: customer.client_name,
        whatsapp_number: customer.whatsapp_number,
        message_type: messageType,
        trigger_type: triggerType,
        status: 'pending',
        message_content: messageContent,
        template_id: templateIdToUse,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        max_retries: maxRetries,
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error(`Failed to create log entry: ${logError?.message || 'Unknown error'}`);
    }

    const logId = logEntry.id;

    // Step 5: Send message via 360Messenger API
    // When attachment is present: send text first (main path), then try media as fallback (provider may support PDF).
    try {
      let apiResponse: any;

      // --- Helper: send text message (reliable path) ---
      const sendTextMessage = async (): Promise<any> => {
        const endpoint = `/sendMessage/${apiKey}`;
        const fullUrl = `${apiUrl}${endpoint}`;
        console.log(`📤 Sending WhatsApp message via 360Messenger API: ${fullUrl}`);
        console.log(`📱 To: ${customer.whatsapp_number}, Message length: ${messageContent.length} chars`);
        const formData = new URLSearchParams();
        formData.append('phonenumber', customer.whatsapp_number);
        formData.append('text', messageContent);
        formData.append('360notify-medium', 'wordpress_order_notification');
        const textResponse = await fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        if (!textResponse.ok) {
          const responseText = await textResponse.text();
          let errorData: any = { error: responseText || 'Unknown error' };
          try {
            if (responseText) errorData = JSON.parse(responseText);
            if (!errorData.error) errorData.error = errorData.message || errorData.statusText || 'Unknown error';
          } catch (_) {}
          throw new Error(`API returned ${textResponse.status}: ${JSON.stringify(errorData)}`);
        }
        try {
          const responseText = await textResponse.text();
          return responseText ? JSON.parse(responseText) : { success: true, status: textResponse.status };
        } catch (_) {
          return { success: true, status: textResponse.status, statusText: textResponse.statusText };
        }
      };

      // --- Helper: try to send media (fallback; do not throw) ---
      const trySendMedia = async (): Promise<boolean> => {
        if (!attachmentUrl || !attachmentType) return false;
        const mediaEndpointVariants = [
          '/api/v1/messages/media', '/v1/messages/media', '/api/messages/media',
          '/messages/media', '/api/v1/messages', '/v1/messages',
        ];
        for (const endpoint of mediaEndpointVariants) {
          try {
            const mediaResponse = await fetch(`${apiUrl}${endpoint}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: customer.whatsapp_number,
                message: messageContent,
                media_url: attachmentUrl,
                media_type: attachmentType,
              }),
            });
            if (mediaResponse.ok) {
              console.log(`✅ Media (PDF) sent successfully via ${endpoint}`);
              return true;
            }
          } catch (err) {
            console.log(`Media endpoint ${endpoint} failed:`, err instanceof Error ? err.message : err);
          }
        }
        console.log('Media fallback: provider did not accept PDF; text+link was already sent.');
        return false;
      };

      if (attachmentUrl && attachmentType) {
        // Main path: send text first (reliable). Then try media as fallback; do not fail if media fails.
        apiResponse = await sendTextMessage();
        const mediaSent = await trySendMedia();
        apiResponse = { ...apiResponse, mediaSent };
      } else {
        apiResponse = await sendTextMessage();
      }

      // Step 6: Update log with success
      await supabase
        .from('whatsapp_message_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          api_response: apiResponse,
        })
        .eq('id', logId);

      return new Response(
        JSON.stringify({
          success: true,
          messageLogId: logId,
          apiResponse,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      // Update log with failure
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError || 'Unknown error');

      // Only update log if logId exists
      if (logId) {
        try {
          await supabase
            .from('whatsapp_message_logs')
            .update({
              status: 'failed',
              failure_reason: errorMessage,
              retry_count: 0, // Will be incremented by retry function
            })
            .eq('id', logId);
        } catch (updateError) {
          console.error('Failed to update log entry:', updateError);
        }
      }

      // Send failure notification if max retries exceeded (handled by retry function)
      // For now, just return error
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          messageLogId: logId || null,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
