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
      messageContent = messageContent.replace(/\{(\w+)\}/g, (match, key) => {
        return defaultPlaceholders[key] || match;
      });
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
    try {
      let apiResponse;

      if (attachmentUrl && attachmentType) {
        // Send media message
        // Note: 360Messenger API may require file download and multipart upload
        // For now, we'll send the URL and let the API handle it
        // Try multiple endpoint formats
        const mediaEndpointVariants = [
          '/api/v1/messages/media',
          '/v1/messages/media',
          '/api/messages/media',
          '/messages/media',
          '/api/v1/messages',
          '/v1/messages',
        ];

        let mediaResponse: Response | null = null;
        let lastMediaError: string = '';

        for (const endpoint of mediaEndpointVariants) {
          try {
            mediaResponse = await fetch(`${apiUrl}${endpoint}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: customer.whatsapp_number,
                message: messageContent,
                media_url: attachmentUrl,
                media_type: attachmentType,
              }),
            });

            if (mediaResponse.ok) {
              break; // Success, exit loop
            } else {
              let errorData: any = { error: 'Unknown error' };
              try {
                if (mediaResponse) {
                  const responseText = await mediaResponse.text();
                  if (responseText) {
                    try {
                      errorData = JSON.parse(responseText);
                      // Ensure errorData has an error property
                      if (!errorData || typeof errorData !== 'object') {
                        errorData = { error: responseText || 'Unknown error' };
                      } else if (!errorData.error) {
                        errorData.error = errorData.message || errorData.statusText || 'Unknown error';
                      }
                    } catch (parseError) {
                      errorData = { error: responseText || 'Failed to parse response' };
                    }
                  } else {
                    errorData = { 
                      error: mediaResponse.status ? `HTTP ${mediaResponse.status} ${mediaResponse.statusText || ''}` : 'Empty response' 
                    };
                  }
                }
              } catch (parseError) {
                errorData = { 
                  error: mediaResponse && mediaResponse.status 
                    ? `Failed to parse response: ${mediaResponse.status} ${mediaResponse.statusText || ''}` 
                    : 'Failed to read response' 
                };
              }
              lastMediaError = `Endpoint ${endpoint}: ${JSON.stringify(errorData)}`;
              const statusInfo = mediaResponse ? `${mediaResponse.status}` : 'No response';
              console.log(`Tried ${endpoint}, got ${statusInfo}:`, errorData);
              mediaResponse = null;
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err || 'Unknown error');
            lastMediaError = `Endpoint ${endpoint}: ${errorMsg}`;
            console.log(`Error trying ${endpoint}:`, err);
            mediaResponse = null;
          }
        }

        if (!mediaResponse || !mediaResponse.ok) {
          throw new Error(`API error: All media endpoint variants failed. Last error: ${lastMediaError}. Please verify the 360Messenger API endpoint structure.`);
        }

        // Only parse JSON if we have a successful response
        if (mediaResponse && mediaResponse.ok) {
          try {
            apiResponse = await mediaResponse.json();
          } catch (parseError) {
            // If JSON parsing fails, create a simple success response
            apiResponse = { success: true, status: mediaResponse.status, statusText: mediaResponse.statusText };
          }
        } else {
          // This should never happen due to the check above, but just in case
          throw new Error('Unexpected error: No successful media response received');
        }
      } else {
        // Send text message using 360Messenger API
        // Based on official 360Messenger API documentation from plugin source code
        // Endpoint: /sendMessage/{api_key}
        // Method: POST
        // Content-Type: application/x-www-form-urlencoded
        // Parameters: phonenumber, text, 360notify-medium (optional)
        
        const endpoint = `/sendMessage/${apiKey}`;
        const fullUrl = `${apiUrl}${endpoint}`;
        
        console.log(`📤 Sending WhatsApp message via 360Messenger API: ${fullUrl}`);
        console.log(`📱 To: ${customer.whatsapp_number}, Message length: ${messageContent.length} chars`);

        // Build form-encoded request body (not JSON)
        const formData = new URLSearchParams();
        formData.append('phonenumber', customer.whatsapp_number);
        formData.append('text', messageContent);
        formData.append('360notify-medium', 'wordpress_order_notification'); // Optional but recommended

        let textResponse: Response | null = null;
        let lastError: string = '';

        try {
          textResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (textResponse.ok) {
            console.log(`✅ Successfully sent WhatsApp message. Status: ${textResponse.status}`);
          } else {
            let errorData: any = { error: 'Unknown error' };
            try {
              if (textResponse) {
                const responseText = await textResponse.text();
                if (responseText) {
                  try {
                    errorData = JSON.parse(responseText);
                    // Ensure errorData has an error property
                    if (!errorData || typeof errorData !== 'object') {
                      errorData = { error: responseText || 'Unknown error' };
                    } else if (!errorData.error && errorData.message) {
                      errorData.error = errorData.message;
                    }
                  } catch (parseError) {
                    errorData = { error: responseText || 'Failed to parse response' };
                  }
                } else {
                  errorData = { 
                    error: textResponse.status ? `HTTP ${textResponse.status} ${textResponse.statusText || ''}` : 'Empty response' 
                  };
                }
              }
            } catch (parseError) {
              errorData = { 
                error: textResponse && textResponse.status 
                  ? `Failed to parse response: ${textResponse.status} ${textResponse.statusText || ''}` 
                  : 'Failed to read response' 
              };
            }
            const statusInfo = textResponse ? `${textResponse.status}` : 'No response';
            lastError = `API returned ${statusInfo}: ${JSON.stringify(errorData)}`;
            console.log(`❌ Failed to send WhatsApp message. ${lastError}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err || 'Unknown error');
          lastError = `Network/Request error: ${errorMsg}`;
          console.log(`❌ Error sending WhatsApp message: ${errorMsg}`);
        }

        if (!textResponse || !textResponse.ok) {
          const errorDetails = {
            message: 'Failed to send WhatsApp message via 360Messenger API',
            endpoint: fullUrl,
            lastError: lastError || 'No response received',
            lastResponseStatus: textResponse 
              ? `${textResponse.status || 'unknown'} ${textResponse.statusText || ''}`.trim() || 'No status'
              : 'No response',
            apiUrl,
            apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
            suggestion: 'Please verify: 1) API URL is correct (https://api.360messenger.com), 2) API key is valid, 3) Phone number format is correct (+country code), 4) Check 360Messenger account balance'
          };
          console.error('WhatsApp API call failed:', JSON.stringify(errorDetails, null, 2));
          throw new Error(`API error: ${JSON.stringify(errorDetails, null, 2)}`);
        }

        // Parse response
        if (textResponse && textResponse.ok) {
          try {
            const responseText = await textResponse.text();
            if (responseText) {
              try {
                apiResponse = JSON.parse(responseText);
              } catch (parseError) {
                // If JSON parsing fails, create a simple success response
                apiResponse = { 
                  success: true, 
                  status: textResponse.status, 
                  statusText: textResponse.statusText,
                  rawResponse: responseText.substring(0, 200) // Include first 200 chars for debugging
                };
              }
            } else {
              apiResponse = { success: true, status: textResponse.status, statusText: textResponse.statusText };
            }
          } catch (parseError) {
            // If parsing fails, create a simple success response
            const status = textResponse?.status || 200;
            const statusText = textResponse?.statusText || 'OK';
            apiResponse = { success: true, status, statusText };
          }
        } else {
          // This should never happen due to the check above, but just in case
          throw new Error('Unexpected error: No successful response received');
        }
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
