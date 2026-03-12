import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { refreshToken } = await req.json().catch(() => ({}));
    const storedRefreshToken = refreshToken || Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!storedRefreshToken) {
      throw new Error('Refresh token not provided. Set GOOGLE_REFRESH_TOKEN secret in Supabase Edge Functions.');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: storedRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));

      const debugInfo = {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error,
        clientIdExists: !!clientId,
        clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
        clientSecretExists: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
        clientSecretPreview: clientSecret
          ? `${clientSecret.substring(0, 8)}...${clientSecret.substring(clientSecret.length - 4)}`
          : 'MISSING',
        refreshTokenExists: !!storedRefreshToken,
        refreshTokenPreview: storedRefreshToken ? `${storedRefreshToken.substring(0, 10)}...` : 'MISSING',
        refreshTokenLength: storedRefreshToken?.length || 0,
      };

      console.error('Token refresh error:', debugInfo);

      if (error.error === 'unauthorized_client') {
        const actualClientSecretPrefix = clientSecret?.substring(0, 7) || 'MISSING';
        const actualClientSecretSuffix = clientSecret?.substring(clientSecret.length - 4) || 'MISSING';

        return new Response(
          JSON.stringify({
            error: 'Token refresh failed: Unauthorized',
            oauthError: error.error,
            oauthErrorDescription:
              error.error_description || 'The OAuth client is not authorized to use this refresh token.',
            reason:
              'Google OAuth credentials and refresh token do not belong to the same OAuth client, or the refresh token is no longer valid.',
            explanation:
              'Refresh tokens are bound to the exact Google OAuth Client ID and Client Secret that created them. If any one of those three values changes, token refresh will fail.',
            clientIdExists: !!clientId,
            clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
            clientSecretExists: !!clientSecret,
            clientSecretLength: clientSecret?.length || 0,
            clientSecretPreview: clientSecret ? `${actualClientSecretPrefix}...${actualClientSecretSuffix}` : 'MISSING',
            refreshTokenExists: !!storedRefreshToken,
            refreshTokenPreview: storedRefreshToken ? `${storedRefreshToken.substring(0, 20)}...` : 'MISSING',
            refreshTokenLength: storedRefreshToken?.length || 0,
            troubleshooting: [
              '1. Open Google Cloud Console and confirm the OAuth Client ID and Client Secret you intend to use.',
              '2. Generate a new refresh token using that exact same OAuth client.',
              '3. Update Supabase Edge Function secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.',
              '4. Redeploy google-drive-token and google-drive-upload after updating secrets.',
              '5. Retry invoice generation after the functions are redeployed.',
            ],
            solution:
              'Replace the Google Drive OAuth secrets in Supabase so all three values come from the same working Google OAuth client.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`Token refresh failed: ${error.error_description || error.error || tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in google-drive-token function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        hint: 'Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set in Edge Function secrets.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
