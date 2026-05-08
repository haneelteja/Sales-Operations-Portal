import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipient {
  label: string;
  type: 'individual' | 'group';
  identifier: string;
}

interface NotifyRequest {
  message: string;
  recipients: Recipient[];
}

interface SendResult {
  label: string;
  identifier: string;
  type: string;
  success: boolean;
  apiStatus?: number;
  apiBody?: string;
  error?: string;
}

async function sendToIndividual(
  identifier: string,
  message: string,
  apiUrl: string,
  apiKey: string
): Promise<{ success: boolean; status: number; body: string }> {
  const formData = new URLSearchParams();
  formData.append('phonenumber', identifier);
  formData.append('text', message);
  formData.append('360notify-medium', 'wordpress_order_notification');

  const res = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  const body = await res.text();
  return { success: res.ok, status: res.status, body: body.slice(0, 500) };
}

async function sendToGroup(
  identifier: string,
  message: string,
  apiUrl: string,
  apiKey: string
): Promise<{ success: boolean; status: number; body: string; attemptUsed: string }> {
  // Attempt 1: phonenumber field (same as individual — try first in case provider supports it)
  const attempt1Form = new URLSearchParams({
    phonenumber: identifier,
    text: message,
    '360notify-medium': 'wordpress_order_notification',
  });
  const res1 = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: attempt1Form.toString(),
  });
  const body1 = await res1.text();
  console.log(`[group attempt1 phonenumber] status=${res1.status} body=${body1.slice(0, 300)}`);
  if (res1.ok) return { success: true, status: res1.status, body: body1, attemptUsed: 'phonenumber' };

  // Attempt 2: group_id field
  const attempt2Form = new URLSearchParams({
    group_id: identifier,
    text: message,
    '360notify-medium': 'wordpress_order_notification',
  });
  const res2 = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: attempt2Form.toString(),
  });
  const body2 = await res2.text();
  console.log(`[group attempt2 group_id] status=${res2.status} body=${body2.slice(0, 300)}`);
  if (res2.ok) return { success: true, status: res2.status, body: body2, attemptUsed: 'group_id' };

  // Attempt 3: chatId field (used by some WhatsApp automation APIs)
  const attempt3Form = new URLSearchParams({
    chatId: identifier,
    text: message,
    '360notify-medium': 'wordpress_order_notification',
  });
  const res3 = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: attempt3Form.toString(),
  });
  const body3 = await res3.text();
  console.log(`[group attempt3 chatId] status=${res3.status} body=${body3.slice(0, 300)}`);
  if (res3.ok) return { success: true, status: res3.status, body: body3, attemptUsed: 'chatId' };

  // Attempt 4: WABA JSON format with "to" field
  const res4 = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: identifier,
      type: 'text',
      text: { body: message },
    }),
  });
  const body4 = await res4.text();
  console.log(`[group attempt4 WABA JSON to] status=${res4.status} body=${body4.slice(0, 300)}`);
  if (res4.ok) return { success: true, status: res4.status, body: body4, attemptUsed: 'waba_json_to' };

  // All attempts failed — return last failure with all details
  return {
    success: false,
    status: res3.status,
    body: `attempt1(phonenumber)=${res1.status}:${body1.slice(0, 100)} | attempt2(group_id)=${res2.status}:${body2.slice(0, 100)} | attempt3(chatId)=${res3.status}:${body3.slice(0, 100)} | attempt4(WABA)=${res4.status}:${body4.slice(0, 100)}`,
    attemptUsed: 'all_failed',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, recipients }: NotifyRequest = await req.json();

    if (!message || !recipients?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'message and recipients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: configData, error: configError } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['whatsapp_enabled', 'whatsapp_api_key', 'whatsapp_api_url']);

    if (configError) throw new Error(`Failed to fetch config: ${configError.message}`);

    const config: Record<string, string> = {};
    (configData || []).forEach((item) => { config[item.config_key] = item.config_value; });

    if (config.whatsapp_enabled !== 'true') {
      return new Response(
        JSON.stringify({ success: false, error: 'WhatsApp messaging is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = config.whatsapp_api_key;
    const apiUrl = config.whatsapp_api_url || 'https://api.360messenger.com';

    if (!apiKey) throw new Error('WhatsApp API key not configured');

    const results: SendResult[] = [];

    for (const recipient of recipients) {
      const identifier = recipient.identifier?.trim();
      if (!identifier) continue;

      const isGroup = recipient.type === 'group' || identifier.includes('@g.us');

      try {
        if (isGroup) {
          console.log(`📤 Sending to GROUP [${recipient.label}] identifier=${identifier}`);
          const result = await sendToGroup(identifier, message, apiUrl, apiKey);
          console.log(`${result.success ? '✅' : '❌'} Group [${recipient.label}] attemptUsed=${result.attemptUsed} status=${result.status}`);
          results.push({
            label: recipient.label,
            identifier,
            type: 'group',
            success: result.success,
            apiStatus: result.status,
            apiBody: result.body,
          });
        } else {
          console.log(`📤 Sending to INDIVIDUAL [${recipient.label}] identifier=${identifier}`);
          const result = await sendToIndividual(identifier, message, apiUrl, apiKey);
          console.log(`${result.success ? '✅' : '❌'} Individual [${recipient.label}] status=${result.status} body=${result.body.slice(0, 100)}`);
          results.push({
            label: recipient.label,
            identifier,
            type: 'individual',
            success: result.success,
            apiStatus: result.status,
            apiBody: result.body,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Exception notifying [${recipient.label}]:`, errMsg);
        results.push({ label: recipient.label, identifier, type: recipient.type, success: false, error: errMsg });
      }
    }

    const allSucceeded = results.every((r) => r.success);
    console.log('whatsapp-notify results:', JSON.stringify(results));
    return new Response(
      JSON.stringify({ success: allSucceeded, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('whatsapp-notify error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
