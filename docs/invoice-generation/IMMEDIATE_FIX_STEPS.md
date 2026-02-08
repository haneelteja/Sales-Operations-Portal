# Immediate Fix Steps - Google Drive Token Error

## 🔴 Current Issue
Getting `500 Token refresh failed: Unauthorized` when testing `google-drive-token` function.

---

## ✅ Step 1: Update Supabase Secrets (CRITICAL)

Go to **Supabase Dashboard** → **Edge Functions** → **Secrets** and update these **3 secrets**:

### Secret 1: `GOOGLE_CLIENT_ID`
**Value:**
```
616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com
```

### Secret 2: `GOOGLE_CLIENT_SECRET`
**Value:**
```
GOCSPX-YOUR_CLIENT_SECRET
```
⚠️ **Replace with your actual client secret from Google Cloud Console**

### Secret 3: `GOOGLE_REFRESH_TOKEN`
**Value:**
```
YOUR_REFRESH_TOKEN_FROM_OAUTH_PLAYGROUND
```
⚠️ **Replace with your actual refresh token from OAuth Playground**

**⚠️ IMPORTANT:**
- Copy values exactly (no spaces before/after)
- Wait 30 seconds after saving for secrets to propagate

---

## ✅ Step 2: Deploy Updated Function Code

The function code needs enhanced error logging. Update it:

1. Go to **Edge Functions** → `google-drive-token` → **Code**
2. **Replace the entire code** with the updated version (see below)
3. Click **Deploy** or **Save**

### Updated Code:

```typescript
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
        refreshTokenExists: !!storedRefreshToken,
        refreshTokenPreview: storedRefreshToken ? `${storedRefreshToken.substring(0, 10)}...` : 'MISSING',
        refreshTokenLength: storedRefreshToken?.length || 0,
      };
      
      console.error('Token refresh error:', debugInfo);
      
      // Provide specific guidance for unauthorized_client
      if (error.error === 'unauthorized_client') {
        const errorMessage = {
          error: 'Token refresh failed: Unauthorized',
          reason: 'Client ID, Client Secret, or Refresh Token mismatch',
          explanation: 'Refresh tokens are tied to the specific Client ID/Secret pair that created them. They cannot be mixed.',
          currentClientId: clientId || 'MISSING',
          expectedClientId: '616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com',
          clientIdMatches: clientId === '616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com',
          clientIdExists: !!clientId,
          clientSecretExists: !!clientSecret,
          clientSecretLength: clientSecret?.length || 0,
          refreshTokenExists: !!storedRefreshToken,
          refreshTokenLength: storedRefreshToken?.length || 0,
          troubleshooting: [
            '1. Ensure GOOGLE_CLIENT_ID matches your OAuth Client ID',
            '2. Ensure GOOGLE_CLIENT_SECRET matches your OAuth Client Secret',
            '3. Ensure GOOGLE_REFRESH_TOKEN matches the token from OAuth Playground',
            '4. All three secrets must use the SAME OAuth client',
          ],
          solution: 'Update all three secrets (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) to use the same OAuth client.',
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
```

---

## ✅ Step 3: Test Again

1. **Wait 30 seconds** after updating secrets and deploying code
2. Go to **Edge Functions** → `google-drive-token` → **Invoke**
3. Method: **POST**
4. Request Body: `{}`
5. Click **Invoke Function**

### Expected Success:
```json
{
  "accessToken": "ya29.a0AfH6SMB...",
  "expiresIn": 3600
}
```

### If Still Getting Error:
Check the **Logs** tab - the enhanced error logging will show:
- What Client ID is currently set
- Whether it matches the expected value
- Which secret is incorrect

---

## 🔍 Verify Secrets Are Correct

After updating, check the function logs. The error response will show:
- `currentClientId`: What's actually in your secrets
- `expectedClientId`: What it should be
- `clientIdMatches`: Whether they match

If `clientIdMatches: false`, the secret wasn't updated correctly.

---

## ✅ Quick Checklist

- [ ] Updated `GOOGLE_CLIENT_ID` secret
- [ ] Updated `GOOGLE_CLIENT_SECRET` secret  
- [ ] Updated `GOOGLE_REFRESH_TOKEN` secret
- [ ] Deployed updated function code
- [ ] Waited 30 seconds
- [ ] Tested function
- [ ] Checked logs if error persists

---

## 🆘 Still Not Working?

1. **Check Function Logs:**
   - Go to **Edge Functions** → `google-drive-token` → **Logs**
   - Look for "Detailed unauthorized_client error"
   - Check `currentClientId` vs `expectedClientId`

2. **Verify Secrets:**
   - Go back to **Secrets** page
   - Double-check all 3 secrets are saved correctly
   - Make sure no extra spaces

3. **Try Deleting and Re-adding:**
   - Delete each secret
   - Wait 10 seconds
   - Add them back with exact values
