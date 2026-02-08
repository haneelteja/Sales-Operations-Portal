/**
 * OneDrive Token Refresh Edge Function
 * Handles OAuth token refresh for Microsoft Graph API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get refresh token from request or use stored one
    const { refreshToken } = await req.json().catch(() => ({}));
    const storedRefreshToken = refreshToken || Deno.env.get('ONEDRIVE_REFRESH_TOKEN');

    if (!storedRefreshToken) {
      throw new Error('Refresh token not provided. Set ONEDRIVE_REFRESH_TOKEN secret in Supabase Edge Functions.');
    }

    // Get client credentials from environment
    const clientId = Deno.env.get('ONEDRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('ONEDRIVE_CLIENT_SECRET');
    const tenantId = Deno.env.get('ONEDRIVE_TENANT_ID') || 'common'; // Default to 'common' for multi-tenant

    if (!clientId || !clientSecret) {
      throw new Error('OneDrive OAuth credentials not configured. Set ONEDRIVE_CLIENT_ID and ONEDRIVE_CLIENT_SECRET secrets.');
    }

    // Exchange refresh token for access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: storedRefreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Sites.ReadWrite.All offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Token refresh error:', error);
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token || storedRefreshToken, // Use new refresh token if provided
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in onedrive-token function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        hint: 'Ensure ONEDRIVE_CLIENT_ID, ONEDRIVE_CLIENT_SECRET, ONEDRIVE_TENANT_ID (optional), and ONEDRIVE_REFRESH_TOKEN are set in Edge Function secrets.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
