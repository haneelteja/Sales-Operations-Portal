/**
 * WhatsApp PDF Proxy
 *
 * Serves PDFs from the whatsapp-attachments Supabase Storage bucket with an
 * explicit Content-Disposition header so 360Messenger/WhatsApp shows the
 * correct filename (e.g. INV-2026-02-022.pdf) instead of "Untitled".
 *
 * GET ?path=temp/INV-2026-02-022.pdf&filename=INV-2026-02-022.pdf&access_key=SECRET
 * - path: storage path in whatsapp-attachments bucket (required)
 * - filename: value for Content-Disposition (optional; defaults to path basename)
 * - access_key: must match WHATSAPP_PDF_PROXY_ACCESS_KEY (required)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BUCKET = 'whatsapp-attachments';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  const filenameQuery = url.searchParams.get('filename');
  const accessKey = url.searchParams.get('access_key');
  // Optional: filename in path e.g. /functions/v1/whatsapp-pdf-proxy/INV-2026-02-026.pdf (some providers use URL path for document name)
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const proxySegment = pathSegments[pathSegments.length - 1];
  const filenameFromPath = proxySegment && proxySegment.includes('.') ? proxySegment : null;
  const filename = filenameQuery || filenameFromPath;

  const expectedKey = Deno.env.get('WHATSAPP_PDF_PROXY_ACCESS_KEY');
  if (!expectedKey || accessKey !== expectedKey) {
    console.log('[whatsapp-pdf-proxy] Unauthorized: missing or invalid access_key');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!path || path.includes('..')) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    console.log('[whatsapp-pdf-proxy] Not found:', path, error?.message ?? 'no data');
    return new Response(
      JSON.stringify({ error: error?.message ?? 'File not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const dispositionFilename = filename || path.split('/').pop() || 'invoice.pdf';
  const safeFilename = dispositionFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  console.log('[whatsapp-pdf-proxy] Serving PDF:', path, 'as', safeFilename);

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
});
