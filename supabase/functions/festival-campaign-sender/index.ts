import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch API config
    const { data: configRows } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['whatsapp_enabled', 'whatsapp_api_key', 'whatsapp_api_url']);

    const config: Record<string, string> = {};
    for (const row of configRows || []) config[row.config_key] = row.config_value;

    if (config.whatsapp_enabled !== 'true' || !config.whatsapp_api_key) {
      return new Response(
        JSON.stringify({ skipped: 'WhatsApp not enabled or API key missing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = config.whatsapp_api_key;
    const apiUrl = config.whatsapp_api_url || 'https://api.360messenger.com';

    // Find all campaigns due right now
    const { data: dueCampaigns, error: fetchErr } = await supabase
      .from('festival_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10000);

    if (fetchErr) throw new Error(`Failed to fetch campaigns: ${fetchErr.message}`);
    if (!dueCampaigns || dueCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalProcessed = 0;

    for (const campaign of dueCampaigns) {
      // Mark as sending immediately to prevent duplicate processing
      await supabase
        .from('festival_campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaign.id);

      // Fetch template
      let templateContent = '';
      if (campaign.template_id) {
        const { data: tmpl } = await supabase
          .from('whatsapp_templates')
          .select('template_content')
          .eq('id', campaign.template_id)
          .single();
        if (tmpl) templateContent = tmpl.template_content;
      }

      if (!templateContent) {
        await supabase
          .from('festival_campaigns')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', campaign.id);
        continue;
      }

      // Get pending recipients
      const { data: recipients } = await supabase
        .from('festival_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending')
        .limit(10000);

      if (!recipients || recipients.length === 0) {
        await supabase
          .from('festival_campaigns')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', campaign.id);
        continue;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          // Substitute placeholders
          const message = templateContent.replace(/\{(\w+)\}/g, (_match, key) => {
            const subs: Record<string, string> = {
              customerName: recipient.client_name,
              contactName: recipient.contact_name,
            };
            return subs[key] ?? _match;
          });

          // Send text message
          const textForm = new URLSearchParams({
            phonenumber: recipient.phone,
            text: message,
            '360notify-medium': 'wordpress_order_notification',
          });

          const textRes = await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: textForm.toString(),
          });

          if (!textRes.ok) {
            const errText = await textRes.text();
            throw new Error(`API ${textRes.status}: ${errText.slice(0, 200)}`);
          }

          // Send media as a separate message if present (non-fatal if it fails)
          if (campaign.media_url && campaign.media_type) {
            try {
              const mediaBody = {
                phonenumber: recipient.phone,
                type: campaign.media_type,
                [campaign.media_type]: { link: campaign.media_url, caption: '' },
              };
              await fetch(`${apiUrl}/sendMessage/${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mediaBody),
              });
            } catch (_) {
              // Media send failure is non-fatal; text was already delivered
            }
          }

          await supabase
            .from('festival_campaign_recipients')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', recipient.id);

          sentCount++;

          // 300ms delay per recipient to avoid rate limiting
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          await supabase
            .from('festival_campaign_recipients')
            .update({ status: 'failed', error_msg: errMsg })
            .eq('id', recipient.id);
          failedCount++;
        }
      }

      const finalStatus = failedCount === recipients.length ? 'failed' : 'sent';
      await supabase
        .from('festival_campaigns')
        .update({
          status: finalStatus,
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      totalProcessed++;
    }

    return new Response(
      JSON.stringify({ processed: totalProcessed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Festival campaign sender error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
