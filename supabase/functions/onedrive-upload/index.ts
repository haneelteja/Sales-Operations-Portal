/**
 * OneDrive Upload Edge Function
 * Handles secure file uploads to Microsoft OneDrive via Graph API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, folderId, fileData, mimeType } = await req.json();

    if (!fileName || !fileData) {
      throw new Error('fileName and fileData are required');
    }

    // Get access token (call the token refresh function)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    const tokenResponse = await fetch(
      `${supabaseUrl}/functions/v1/onedrive-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get access token: ${error.error || tokenResponse.statusText}`);
    }

    const { accessToken } = await tokenResponse.json();

    // Convert base64 to Uint8Array
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Build upload URL
    // If folderId is provided, upload to that folder, otherwise upload to root
    const uploadPath = folderId 
      ? `/me/drive/items/${folderId}:/${encodeURIComponent(fileName)}:/content`
      : `/me/drive/root:/${encodeURIComponent(fileName)}:/content`;

    // Upload to OneDrive using Microsoft Graph API
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0${uploadPath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': mimeType || 'application/octet-stream',
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${JSON.stringify(error)}`);
    }

    const uploadData = await uploadResponse.json();

    // Get file URLs
    const fileId = uploadData.id;
    const webUrl = uploadData.webUrl || `https://onedrive.live.com/edit.aspx?id=${fileId}`;
    const downloadUrl = uploadData['@microsoft.graph.downloadUrl'] || uploadData.downloadUrl;

    return new Response(
      JSON.stringify({
        id: fileId,
        webUrl,
        downloadUrl,
        name: uploadData.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in onedrive-upload function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
