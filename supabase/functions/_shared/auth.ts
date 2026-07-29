import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type CorsHeaders = Record<string, string>;

/**
 * Build CORS headers.
 * In production set ALLOWED_ORIGIN env var to your domain (e.g. https://app.aamodha.com).
 * Falls back to the request origin in development when the env var is absent.
 */
export function buildCorsHeaders(req: Request): CorsHeaders {
  const allowedOrigin =
    Deno.env.get('ALLOWED_ORIGIN') ?? req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Verify the caller is an authenticated admin.
 * Returns a 401/403 Response on failure, or null on success.
 */
export async function requireAdmin(
  req: Request,
  corsHeaders: CorsHeaders,
): Promise<Response | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Validate the JWT using the anon-key client (does NOT grant elevated rights).
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (!user || authError) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Confirm the authenticated user holds the admin role in user_management.
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: record } = await adminClient
    .from('user_management')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (record?.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden: admin access required' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  return null; // caller is a verified admin
}
