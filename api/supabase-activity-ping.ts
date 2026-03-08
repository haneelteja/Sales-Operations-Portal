import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * GET /api/supabase-activity-ping
 *
 * Performs a minimal Supabase query (SELECT 1 via RPC) to keep the free-tier
 * project active. Intended to be called by a cron (e.g. GitHub Actions) 1–2
 * times per week. Do not call frequently to stay within free limits.
 */
export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.rpc('ping');

    if (error) {
      console.error('[supabase-activity-ping] RPC error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, ping: data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[supabase-activity-ping]', message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
