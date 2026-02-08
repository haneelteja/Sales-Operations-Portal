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
    const storedRefreshToken = refreshToken || Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!storedRefreshToken) {
      throw new Error('Refresh token not provided. Set GOOGLE_REFRESH_TOKEN secret in Supabase Edge Functions.');
    }

    // Get client credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.');
    }

    // Exchange refresh token for access token
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
      
      // Enhanced debugging for unauthorized_client error
      const debugInfo: Record<string, any> = {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: error,
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
      
      // Provide specific guidance for unauthorized_client
      if (error.error === 'unauthorized_client') {
        const expectedClientId = '616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com';
        const expectedClientSecretPrefix = 'GOCSPX-';
        const expectedClientSecretSuffix = '_wYb';
        const actualClientSecretPrefix = clientSecret?.substring(0, 7) || 'MISSING';
        const actualClientSecretSuffix = clientSecret?.substring(clientSecret.length - 4) || 'MISSING';
        const clientSecretMatches = clientSecret?.startsWith(expectedClientSecretPrefix) && 
                                     clientSecret?.endsWith(expectedClientSecretSuffix);
        
        const errorMessage = {
          error: 'Token refresh failed: Unauthorized',
          reason: 'Client ID, Client Secret, or Refresh Token mismatch',
          explanation: 'Refresh tokens are tied to the specific Client ID/Secret pair that created them. They cannot be mixed.',
          expectedClientId: expectedClientId,
          actualClientId: clientId || 'MISSING',
          clientIdMatches: clientId === expectedClientId,
          expectedClientSecretPrefix: expectedClientSecretPrefix,
          actualClientSecretPrefix: actualClientSecretPrefix,
          expectedClientSecretSuffix: expectedClientSecretSuffix,
          actualClientSecretSuffix: actualClientSecretSuffix,
          clientSecretMatches: clientSecretMatches,
          clientIdExists: !!clientId,
          clientSecretExists: !!clientSecret,
          clientSecretLength: clientSecret?.length || 0,
          refreshTokenExists: !!storedRefreshToken,
          refreshTokenPreview: storedRefreshToken ? `${storedRefreshToken.substring(0, 20)}...` : 'MISSING',
          refreshTokenLength: storedRefreshToken?.length || 0,
          troubleshooting: [
            `1. Expected GOOGLE_CLIENT_ID: "${expectedClientId}"`,
            `2. Actual GOOGLE_CLIENT_ID: "${clientId || 'MISSING'}"`,
            `3. Client ID Match: ${clientId === expectedClientId ? 'YES ✓' : 'NO ✗'}`,
            `4. Expected GOOGLE_CLIENT_SECRET starts with: "${expectedClientSecretPrefix}"`,
            `5. Actual GOOGLE_CLIENT_SECRET starts with: "${actualClientSecretPrefix}"`,
            `6. Expected GOOGLE_CLIENT_SECRET ends with: "${expectedClientSecretSuffix}"`,
            `7. Actual GOOGLE_CLIENT_SECRET ends with: "${actualClientSecretSuffix}"`,
            `8. Client Secret Match: ${clientSecretMatches ? 'YES ✓' : 'NO ✗'}`,
            '9. If Client Secret doesn\'t match, get it from Google Cloud Console → APIs & Services → Credentials',
            '10. Ensure GOOGLE_REFRESH_TOKEN was obtained using the SAME Client ID/Secret pair',
          ],
          solution: 'Update all three secrets (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) to use the same OAuth client that worked in OAuth Playground.',
        };
        
        console.error('Detailed unauthorized_client error:', errorMessage);
        
        return new Response(
          JSON.stringify(errorMessage),
          {
            status: 500,
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
        error: error.message || 'Internal server error',
        hint: 'Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set in Edge Function secrets.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
