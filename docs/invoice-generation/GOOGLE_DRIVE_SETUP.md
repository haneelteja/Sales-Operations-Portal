# Google Drive Setup Guide

## Step-by-Step Instructions for Storing Credentials in Supabase Edge Function Secrets

---

## Prerequisites

✅ OAuth client created  
✅ Database migration completed  
✅ Invoice number generation tested

---

## Step 1: Get OAuth Refresh Token

### Option A: Using OAuth 2.0 Playground (Easiest)

1. **Go to OAuth 2.0 Playground**
   - Visit: https://developers.google.com/oauthplayground/

2. **Configure OAuth Playground**
   - Click the gear icon (⚙️) in the top right
   - Check "Use your own OAuth credentials"
   - Enter your `Client ID` and `Client Secret` from Google Cloud Console
   - Click "Close"

3. **Select Scopes**
   - In the left panel, find "Drive API v3"
   - Select these scopes:
     - `https://www.googleapis.com/auth/drive.file` (Create, edit, and delete only files you create)
     - `https://www.googleapis.com/auth/drive` (Full access - if you need to access existing files)
   - Click "Authorize APIs"

4. **Authorize**
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back to the playground

5. **Exchange Authorization Code for Tokens**
   - Click "Exchange authorization code for tokens"
   - Copy the **Refresh Token** (starts with `1//...`)

### Option B: Using Your Application (More Secure)

If you prefer to implement OAuth flow in your app:

1. **Create OAuth Flow Component**
   ```typescript
   // src/components/auth/GoogleOAuth.tsx
   // This would handle the OAuth redirect flow
   ```

2. **Get Refresh Token**
   - After user authorizes, Google redirects with authorization code
   - Exchange code for access token and refresh token
   - Store refresh token securely

---

## Step 2: Store Credentials in Supabase Edge Function Secrets

### Method 1: Via Supabase Dashboard (Recommended)

1. **Navigate to Edge Functions**
   - Go to your Supabase project dashboard
   - Click **Edge Functions** in the left sidebar
   - Click **Secrets** tab (or go to **Project Settings** → **Edge Functions** → **Secrets**)

2. **Add Secrets**
   Click **Add Secret** for each credential:

   **Secret 1: Google Client ID**
   - Name: `GOOGLE_CLIENT_ID`
   - Value: Your Google OAuth Client ID
   - Click **Save**

   **Secret 2: Google Client Secret**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: Your Google OAuth Client Secret
   - Click **Save**

   **Secret 3: Google Refresh Token**
   - Name: `GOOGLE_REFRESH_TOKEN`
   - Value: Your refresh token from Step 1
   - Click **Save**

### Method 2: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set GOOGLE_CLIENT_ID=your-client-id
supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret
supabase secrets set GOOGLE_REFRESH_TOKEN=your-refresh-token

# Verify secrets are set
supabase secrets list
```

---

## Step 3: Create Supabase Edge Function for Google Drive Token Refresh

Create an Edge Function to securely handle token refresh:

### 3.1 Create Function Directory

```bash
mkdir -p supabase/functions/google-drive-token
```

### 3.2 Create Function File

Create `supabase/functions/google-drive-token/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { refreshToken } = await req.json();
    const storedRefreshToken = refreshToken || Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!storedRefreshToken) {
      throw new Error('Refresh token not provided');
    }

    // Get client credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
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
      const error = await tokenResponse.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 3.3 Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy google-drive-token

# Or via Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Click "New Function"
# 3. Name it "google-drive-token"
# 4. Paste the code above
# 5. Click "Deploy"
```

---

## Step 4: Create Edge Function for File Upload

Create another Edge Function to handle file uploads securely:

### 4.1 Create Function File

Create `supabase/functions/google-drive-upload/index.ts`:

```typescript
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

    // Get access token (call the token refresh function)
    const tokenResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { accessToken } = await tokenResponse.json();

    // Convert base64 to buffer
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=boundary`,
        },
        body: createMultipartBody(fileName, folderId, fileBuffer, mimeType),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Upload failed: ${JSON.stringify(error)}`);
    }

    const uploadData = await uploadResponse.json();

    // Get file URL
    const fileUrl = `https://drive.google.com/file/d/${uploadData.id}/view`;

    return new Response(
      JSON.stringify({
        id: uploadData.id,
        webViewLink: fileUrl,
        webContentLink: `https://drive.google.com/uc?export=download&id=${uploadData.id}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function createMultipartBody(
  fileName: string,
  folderId: string | null,
  fileBuffer: Uint8Array,
  mimeType: string
): Uint8Array {
  const boundary = 'boundary';
  const metadata = {
    name: fileName,
    ...(folderId && { parents: [folderId] }),
  };

  const metadataPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const endBoundary = `\r\n--${boundary}--\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const filePartBytes = encoder.encode(filePart);
  const endBytes = encoder.encode(endBoundary);

  const totalLength = metadataBytes.length + filePartBytes.length + fileBuffer.length + endBytes.length;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(metadataBytes, offset);
  offset += metadataBytes.length;
  result.set(filePartBytes, offset);
  offset += filePartBytes.length;
  result.set(fileBuffer, offset);
  offset += fileBuffer.length;
  result.set(endBytes, offset);

  return result;
}
```

### 4.2 Deploy Upload Function

```bash
supabase functions deploy google-drive-upload
```

---

## Step 5: Update Google Drive Adapter

Update `src/services/cloudStorage/googleDriveAdapter.ts` to use Edge Functions:

```typescript
// Update the getAccessToken method:
private async getAccessToken(): Promise<string> {
  if (this.accessToken) {
    return this.accessToken;
  }

  // Call Supabase Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-drive-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
    return this.accessToken;
  } catch (error) {
    logger.error('Error getting Google Drive access token:', error);
    throw new Error('Google Drive authentication failed');
  }
}

// Update uploadFile to use Edge Function:
async uploadFile(...) {
  // Use Edge Function for upload instead of direct API call
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/google-drive-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      fileName,
      folderId,
      fileData: Buffer.from(file).toString('base64'),
      mimeType,
    }),
  });
  
  // ... rest of the code
}
```

---

## Step 6: Verify Setup

### Test Token Refresh

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/google-drive-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "accessToken": "ya29.a0...",
  "expiresIn": 3600
}
```

### Test File Upload

Create a test file and upload it via the Edge Function.

---

## Troubleshooting

### Issue: "Refresh token expired"

**Solution**: 
- Refresh tokens can expire if:
  - User revokes access
  - Token hasn't been used for 6 months
  - User changes password
- Get a new refresh token using OAuth Playground

### Issue: "Invalid client credentials"

**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check they match the OAuth client in Google Cloud Console

### Issue: "Insufficient permissions"

**Solution**:
- Ensure you selected the correct scopes:
  - `https://www.googleapis.com/auth/drive.file` (minimum)
  - `https://www.googleapis.com/auth/drive` (full access)

### Issue: Edge Function not accessible

**Solution**:
- Verify function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs google-drive-token`
- Ensure CORS headers are set correctly

---

## Security Best Practices

1. ✅ **Never commit credentials** - Use Supabase secrets only
2. ✅ **Use Edge Functions** - Keep credentials server-side
3. ✅ **Limit scopes** - Use `drive.file` instead of `drive` if possible
4. ✅ **Rotate tokens** - Refresh tokens periodically
5. ✅ **Monitor usage** - Check Google Cloud Console for unusual activity

---

## Next Steps

After completing this setup:

1. ✅ Test invoice generation with a sample transaction
2. ✅ Verify files are uploaded to Google Drive
3. ✅ Check file organization (Invoices/YYYY/MM-MonthName/)
4. ✅ Test download links
5. ⏳ Implement PDF generation (if not done)
6. ⏳ Add error handling and retries

---

## Quick Reference

**Secrets to Set:**
- `GOOGLE_CLIENT_ID` - Your OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your OAuth Client Secret  
- `GOOGLE_REFRESH_TOKEN` - Your refresh token

**Edge Functions to Deploy:**
- `google-drive-token` - Token refresh
- `google-drive-upload` - File upload

**Test Commands:**
```bash
# List secrets
supabase secrets list

# Deploy functions
supabase functions deploy google-drive-token
supabase functions deploy google-drive-upload

# View logs
supabase functions logs google-drive-token
```
