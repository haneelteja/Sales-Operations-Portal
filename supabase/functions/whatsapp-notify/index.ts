import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipient {
  label: string;
  type: 'individual';
  identifier: string;
}

interface NotifyRequest {
  message: string;
  recipients: Recipient[];
}

interface SendResult {
  label: string;
  identifier: string;
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

      try {
        console.log(`📤 Sending to [${recipient.label}] ${identifier}`);
        const result = await sendToIndividual(identifier, message, apiUrl, apiKey);
        console.log(`${result.success ? '✅' : '❌'} [${recipient.label}] status=${result.status}`);
        results.push({
          label: recipient.label,
          identifier,
          success: result.success,
          apiStatus: result.status,
          apiBody: result.body,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Exception notifying [${recipient.label}]:`, errMsg);
        results.push({ label: recipient.label, identifier, success: false, error: errMsg });
      }
    }

    const allSucceeded = results.every((r) => r.success);
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
