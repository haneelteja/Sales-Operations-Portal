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
  /** Google Drive file ID; used to build direct-download URL for sending PDF as document */
  attachmentFileId?: string;
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
      attachmentFileId,
      scheduledFor,
      placeholders = {},
    }: WhatsAppSendRequest = await req.json();

    // Do NOT pass Google Drive uc?export=download URL to the API: it often returns an HTML virus-scan
    // page (uc.html) instead of the PDF, so the recipient gets an HTML file. We fetch the real PDF
    // in the edge function and send it only as binary (multipart). Use documentUrl only when it's
    // not a Drive link (e.g. a direct CDN URL).
    const isDrivePdf =
      attachmentFileId && (attachmentType === 'application/pdf' || attachmentType === 'document');
    const documentUrl = !isDrivePdf ? attachmentUrl : undefined;

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

      // --- Helper: fetch real PDF bytes from Google Drive ---
      // Prefer Drive API (same OAuth as upload) so we get raw bytes; fallback to public URLs with browser User-Agent.
      const driveFetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      const logDriveFetch = (label: string, res: Response, bodyPreview?: string) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/pdf')) {
          console.log(`[Drive fetch] ${label} status=${res.status} contentType=${ct.slice(0, 50)}${bodyPreview != null ? ` bodyPreview=${bodyPreview.slice(0, 120)}` : ''}`);
        }
      };
      const fetchGoogleDrivePdfBytes = async (fileId: string): Promise<ArrayBuffer | null> => {
        // 1) Drive API with OAuth (same token as upload) – most reliable
        try {
          const tokenRes = await fetch(`${supabaseUrl}/functions/v1/google-drive-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({}),
          });
          if (tokenRes.ok) {
            const { accessToken } = await tokenRes.json();
            if (accessToken) {
              const apiRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              const ct = (apiRes.headers.get('content-type') || '').toLowerCase();
              if (apiRes.ok && (ct.includes('application/pdf') || ct.includes('application/octet-stream'))) {
                const buf = await apiRes.arrayBuffer();
                if (buf.byteLength > 0 && buf.byteLength < 20 * 1024 * 1024) {
                  console.log(`[Drive fetch] Got PDF via Drive API, size=${buf.byteLength}`);
                  return buf;
                }
              }
              logDriveFetch('Drive API', apiRes);
            }
          } else {
            console.log(`[Drive fetch] google-drive-token failed status=${tokenRes.status}`);
          }
        } catch (e) {
          console.log('[Drive fetch] Drive API error:', e instanceof Error ? e.message : String(e));
        }

        // 2) Public URLs with browser User-Agent (avoid 403 / HTML)
        const tryPublicUrl = async (url: string): Promise<ArrayBuffer | null> => {
          const r = await fetch(url, { redirect: 'follow', headers: driveFetchHeaders });
          const ct = (r.headers.get('content-type') || '').toLowerCase();
          if (r.ok && ct.includes('application/pdf')) {
            const buf = await r.arrayBuffer();
            if (buf.byteLength > 0 && buf.byteLength < 20 * 1024 * 1024) return buf;
          }
          if (ct.includes('text/html')) {
            const html = await r.text();
            logDriveFetch('public URL (HTML)', r, html.slice(0, 200));
            const m = html.match(/confirm=([a-zA-Z0-9_-]+)/) || html.match(/["']confirm["']\s*:\s*["']([^"']+)["']/);
            if (m) {
              const sep = url.includes('?') ? '&' : '?';
              const withConfirm = url.includes('confirm=') ? url : `${url}${sep}confirm=${m[1]}`;
              const r2 = await fetch(withConfirm, { redirect: 'follow', headers: driveFetchHeaders });
              const ct2 = (r2.headers.get('content-type') || '').toLowerCase();
              if (r2.ok && ct2.includes('application/pdf')) {
                const buf = await r2.arrayBuffer();
                if (buf.byteLength > 0 && buf.byteLength < 20 * 1024 * 1024) return buf;
              }
              logDriveFetch('public URL +confirm', r2);
            }
          } else {
            logDriveFetch('public URL', r);
          }
          return null;
        };
        const urls = [
          `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
          `https://drive.google.com/u/0/uc?export=download&id=${fileId}&confirm=t`,
          `https://drive.google.com/uc?export=download&id=${fileId}`,
        ];
        for (const url of urls) {
          try {
            const buf = await tryPublicUrl(url);
            if (buf) return buf;
          } catch (_) {}
        }
        return null;
      };

      // --- Helper: try to send document/PDF (fallback; do not throw) ---
      const trySendDocument = async (): Promise<boolean> => {
        const logResponse = async (res: Response, label: string) => {
          if (!res.ok) {
            const body = await res.text();
            console.log(`[WhatsApp document] ${label} status=${res.status} body=${body.slice(0, 300)}`);
          }
        };

        // When we have a Drive file ID: fetch PDF, then send via URL so 360Messenger can fetch the file.
        // 360Messenger has no /sendDocument (404) and /sendMessage with multipart returns 200 but only delivers text.
        // So we upload the PDF to Supabase Storage, get a signed URL, and send that URL via /sendMessage (url param).
        if (attachmentFileId && (attachmentType === 'application/pdf' || attachmentType === 'document')) {
          const pdfBytes = await fetchGoogleDrivePdfBytes(attachmentFileId);
          if (pdfBytes && pdfBytes.byteLength > 0) {
            const caption = (messageContent || '').slice(0, 1024);
            let documentUrlToSend: string | null = null;

            // Upload PDF to Supabase Storage and get a signed URL (360Messenger will fetch this URL to get the PDF).
            // Use invoice number as filename so WhatsApp shows e.g. "INV-2026-02-022.pdf" instead of "Untitled".
            const whatsappBucket = 'whatsapp-attachments';
            const invoiceNumber = (placeholders?.invoiceNumber ?? placeholders?.invoice_number ?? 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'invoice';
            const pdfFileName = `${invoiceNumber}.pdf`;
            const tempPath = `temp/${pdfFileName}`;
            try {
              const { error: uploadError } = await supabase.storage
                .from(whatsappBucket)
                .upload(tempPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
              if (!uploadError) {
                // Option 2: Use proxy URL so the PDF is served with Content-Disposition filename (fixes "Untitled" in WhatsApp)
                const proxyAccessKey = Deno.env.get('WHATSAPP_PDF_PROXY_ACCESS_KEY');
                if (proxyAccessKey) {
                  // Put filename in URL path so 360Messenger/WhatsApp may use it when they ignore Content-Disposition
                  const proxyUrl = `${supabaseUrl}/functions/v1/whatsapp-pdf-proxy/${encodeURIComponent(pdfFileName)}?path=${encodeURIComponent(tempPath)}&access_key=${encodeURIComponent(proxyAccessKey)}`;
                  documentUrlToSend = proxyUrl;
                  console.log('[WhatsApp document] Using whatsapp-pdf-proxy URL for PDF (Content-Disposition filename)');
                } else {
                  const { data: signed, error: signError } = await supabase.storage
                    .from(whatsappBucket)
                    .createSignedUrl(tempPath, 3600); // 1 hour for 360Messenger to fetch
                  if (!signError && signed?.signedUrl) {
                    documentUrlToSend = signed.signedUrl;
                    console.log('[WhatsApp document] Using Supabase Storage signed URL for PDF (set WHATSAPP_PDF_PROXY_ACCESS_KEY for filename fix)');
                  } else {
                    console.log('[WhatsApp document] createSignedUrl failed:', signError?.message ?? 'no url');
                  }
                }
              } else {
                console.log('[WhatsApp document] Storage upload failed:', uploadError.message, '(create bucket', whatsappBucket, 'in Supabase Dashboard if missing)');
              }
            } catch (e) {
              console.log('[WhatsApp document] Storage error:', e instanceof Error ? e.message : String(e));
            }

            if (documentUrlToSend) {
              // Send document via /sendMessage with url param (360Messenger fetches URL and sends as media)
              const urlParamNames = ['url', 'file_url', 'document_url', 'document', 'file', 'media_url'];
              for (const param of urlParamNames) {
                try {
                  const formParams: Record<string, string> = {
                    phonenumber: customer.whatsapp_number,
                    text: caption,
                    '360notify-medium': 'wordpress_order_notification',
                    [param]: documentUrlToSend,
                  };
                  const res = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams(formParams).toString(),
                  });
                  if (res.ok) {
                    console.log(`✅ Document (PDF) sent via /sendMessage with param ${param}`);
                    return true;
                  }
                  await logResponse(res, `/sendMessage ${param}`);
                } catch (err) {
                  console.log(`Document /sendMessage ${param} failed:`, err instanceof Error ? err.message : err);
                }
              }
            }

            // Fallback: /sendMessage multipart (returns 200 but 360Messenger may only deliver text)
            try {
              const form = new FormData();
              form.append('phonenumber', customer.whatsapp_number);
              form.append('text', caption);
              form.append('360notify-medium', 'wordpress_order_notification');
              form.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'invoice.pdf');
              const uploadRes = await fetch(`${apiUrl}/sendMessage/${apiKey}`, { method: 'POST', body: form });
              if (uploadRes.ok) {
                console.log('✅ Document (PDF) sent via /sendMessage multipart file (fallback)');
                return true;
              }
              await logResponse(uploadRes, '/sendMessage multipart');
            } catch (err) {
              console.log('Document /sendMessage multipart failed:', err instanceof Error ? err.message : err);
            }
          } else {
            console.log('Could not fetch PDF bytes from Google Drive; skipping document send to avoid sending HTML.');
          }
          return false;
        }

        // When we only have a non-Drive URL (e.g. CDN): pass URL to API.
        if (!documentUrl || !attachmentType) return false;
        const docUrl = documentUrl;
        const formParamNames = ['url', 'file_url', 'document_url', 'document', 'file', 'image_url', 'media_url'];
        for (const param of formParamNames) {
          try {
            const formParams: Record<string, string> = {
              phonenumber: customer.whatsapp_number,
              text: (messageContent || '').slice(0, 1024),
              '360notify-medium': 'wordpress_order_notification',
              [param]: docUrl,
            };
            const res = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams(formParams).toString(),
            });
            if (res.ok) {
              console.log(`✅ Document sent via /sendMessage with param ${param}`);
              return true;
            }
            await logResponse(res, `/sendMessage ${param}`);
          } catch (err) {
            console.log(`Document /sendMessage ${param} failed:`, err instanceof Error ? err.message : err);
          }
        }
        const chatId = customer.whatsapp_number.replace(/\D/g, '') + '@c.us';
        const v2SendPaths = ['/v2/message/send', '/v2/message/sendMessage'];
        for (const path of v2SendPaths) {
          try {
            const res = await fetch(`${apiUrl}${path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({ chatId, text: (messageContent || '').slice(0, 1024), url: docUrl }),
            });
            if (res.ok) {
              console.log(`✅ Document sent via v2 ${path}`);
              return true;
            }
            await logResponse(res, `v2 ${path}`);
          } catch (err) {
            console.log(`Document v2 ${path} failed:`, err instanceof Error ? err.message : err);
          }
        }
        const docEndpoints = [
          { path: '/sendDocument/' + apiKey, body: (): string => new URLSearchParams({
            phonenumber: customer.whatsapp_number,
            document: docUrl,
            caption: (messageContent || '').slice(0, 1024),
            '360notify-medium': 'wordpress_order_notification',
          }).toString() },
          { path: '/sendDocument/' + apiKey, body: (): string => new URLSearchParams({
            phonenumber: customer.whatsapp_number,
            file_url: docUrl,
            '360notify-medium': 'wordpress_order_notification',
          }).toString() },
        ];
        for (const { path, body } of docEndpoints) {
          try {
            const res = await fetch(`${apiUrl}${path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: body(),
            });
            if (res.ok) {
              console.log(`✅ Document sent via ${path}`);
              return true;
            }
            await logResponse(res, path);
          } catch (err) {
            console.log(`Document endpoint ${path} failed:`, err instanceof Error ? err.message : err);
          }
        }
        console.log('Document fallback: provider did not accept PDF; text+link was already sent.');
        return false;
      };

      const hasDocument = attachmentType && (documentUrl || attachmentUrl || (attachmentFileId && (attachmentType === 'application/pdf' || attachmentType === 'document')));
      if (hasDocument) {
        apiResponse = await sendTextMessage();
        const documentSent = await trySendDocument();
        apiResponse = { ...apiResponse, documentSent };
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
