# Create Edge Functions in Supabase - Step-by-Step Guide

## 🎯 Objective

Create two Edge Functions in Supabase:
1. `google-drive-token` - Refreshes Google OAuth access tokens
2. `google-drive-upload` - Uploads files to Google Drive

---

## 📋 Prerequisites

✅ Supabase project created  
✅ Google OAuth credentials obtained  
✅ Secrets ready to configure (we'll add them after creating functions)

---

## 🚀 Step 1: Create `google-drive-token` Function

### 1.1 Navigate to Edge Functions

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in the left sidebar

### 1.2 Create New Function

1. Click **New Function** button (top right)
2. Function name: `google-drive-token`
3. Click **Create Function**

### 1.3 Copy Function Code

1. Open the function editor (code editor will appear)
2. **Delete all existing code** in the editor
3. Copy the entire code from: `supabase/functions/google-drive-token/index.ts`
4. Paste into the editor

**Or copy this code directly:**

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
      console.error('Token refresh error:', error);
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

### 1.4 Deploy Function

1. Click **Deploy** button (top right)
2. Wait for deployment to complete (you'll see "Deployed successfully" message)
3. ✅ Function is now live!

---

## 🚀 Step 2: Create `google-drive-upload` Function

### 2.1 Create New Function

1. Still in **Edge Functions** page
2. Click **New Function** button again
3. Function name: `google-drive-upload`
4. Click **Create Function**

### 2.2 Copy Function Code

1. **Delete all existing code** in the editor
2. Copy the entire code from: `supabase/functions/google-drive-upload/index.ts`
3. Paste into the editor

**Or copy this code directly:**

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

    if (!fileName || !fileData) {
      throw new Error('fileName and fileData are required');
    }

    // Get access token (call the token refresh function)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    const tokenResponse = await fetch(
      `${supabaseUrl}/functions/v1/google-drive-token`,
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

    // Create multipart body for Google Drive API
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const metadata = {
      name: fileName,
      ...(folderId && { parents: [folderId] }),
    };

    const encoder = new TextEncoder();
    const metadataPart = encoder.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`
    );
    const endBoundary = encoder.encode(`\r\n--${boundary}--\r\n`);

    const body = new Uint8Array(metadataPart.length + fileBuffer.length + endBoundary.length);
    body.set(metadataPart, 0);
    body.set(fileBuffer, metadataPart.length);
    body.set(endBoundary, metadataPart.length + fileBuffer.length);

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
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
    const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;
    const webContentLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return new Response(
      JSON.stringify({
        id: fileId,
        webViewLink,
        webContentLink,
        name: uploadData.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in google-drive-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 2.3 Deploy Function

1. Click **Deploy** button
2. Wait for deployment to complete
3. ✅ Function is now live!

---

## 🔐 Step 3: Configure Secrets

### 3.1 Navigate to Secrets

1. In Supabase Dashboard, go to **Project Settings** (gear icon)
2. Click **Edge Functions** in the left sidebar
3. Click **Secrets** tab

### 3.2 Add Google OAuth Secrets

Click **Add Secret** for each:

**Secret 1: GOOGLE_CLIENT_ID**
- Name: `GOOGLE_CLIENT_ID`
- Value: Your Google OAuth Client ID (from Google Cloud Console)
- Click **Save**

**Secret 2: GOOGLE_CLIENT_SECRET**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: Your Google OAuth Client Secret (from Google Cloud Console)
- Click **Save**

**Secret 3: GOOGLE_REFRESH_TOKEN**
- Name: `GOOGLE_REFRESH_TOKEN`
- Value: Your refresh token (from OAuth Playground - see `GOOGLE_DRIVE_SETUP.md`)
- Click **Save**

---

## ✅ Step 4: Verify Functions Are Deployed

### 4.1 Check Function List

1. Go back to **Edge Functions** page
2. You should see both functions:
   - ✅ `google-drive-token`
   - ✅ `google-drive-upload`

### 4.2 Test Token Refresh Function

1. Click on `google-drive-token` function
2. Click **Invoke** tab
3. Method: **POST**
4. Body: `{}`
5. Click **Invoke Function**
6. **Expected Response:**
   ```json
   {
     "accessToken": "ya29.a0AfH6SMB...",
     "expiresIn": 3600
   }
   ```

**If you get an error:**
- Check secrets are set correctly
- Verify refresh token is valid
- Check function logs for details

### 4.3 Test File Upload Function

1. Click on `google-drive-upload` function
2. Click **Invoke** tab
3. Method: **POST**
4. Body:
   ```json
   {
     "fileName": "test.txt",
     "folderId": null,
     "fileData": "SGVsbG8gV29ybGQ=",
     "mimeType": "text/plain"
   }
   ```
5. Click **Invoke Function**
6. **Expected Response:**
   ```json
   {
     "id": "1ABC123...",
     "webViewLink": "https://drive.google.com/file/d/1ABC123.../view",
     "webContentLink": "https://drive.google.com/uc?export=download&id=1ABC123...",
     "name": "test.txt"
   }
   ```

---

## 📝 Quick Checklist

- [ ] `google-drive-token` function created and deployed
- [ ] `google-drive-upload` function created and deployed
- [ ] `GOOGLE_CLIENT_ID` secret added
- [ ] `GOOGLE_CLIENT_SECRET` secret added
- [ ] `GOOGLE_REFRESH_TOKEN` secret added
- [ ] Token refresh test successful
- [ ] File upload test successful

---

## 🐛 Troubleshooting

### Issue: "Function not found" when testing

**Solution:**
- Ensure functions are deployed (click "Deploy" button)
- Check function names match exactly: `google-drive-token`, `google-drive-upload`
- Wait a few seconds after deployment

### Issue: "Refresh token not provided"

**Solution:**
- Go to **Project Settings** → **Edge Functions** → **Secrets**
- Verify `GOOGLE_REFRESH_TOKEN` is set
- Check secret name is exactly `GOOGLE_REFRESH_TOKEN` (case-sensitive)

### Issue: "Token refresh failed: invalid_grant"

**Solution:**
- Refresh token may be expired or revoked
- Get a new refresh token from OAuth Playground
- Update `GOOGLE_REFRESH_TOKEN` secret

### Issue: "Failed to get access token" in upload function

**Solution:**
- Token refresh function must work first
- Test `google-drive-token` function separately
- Check function logs for detailed errors

---

## 🎯 Next Steps After Functions Are Created

1. ✅ **Test Functions** - Use the test page or Supabase Dashboard
2. ✅ **Create Word Template** - `public/templates/invoice-template.docx`
3. ✅ **Configure Environment Variables** - Company details
4. ✅ **Integrate with SalesEntry** - Add invoice generation hooks
5. ✅ **Test End-to-End** - Create transaction and verify invoice generation

---

## 📚 Related Documentation

- **Google Drive Setup**: `GOOGLE_DRIVE_SETUP.md` - OAuth setup guide
- **Testing Guide**: `TESTING_GUIDE.md` - Comprehensive testing instructions
- **Quick Test**: `QUICK_TEST.md` - 5-minute test guide
- **Implementation**: `IMPLEMENTATION_GUIDE.md` - Integration steps

---

## 💡 Tips

- **Function Names**: Must match exactly (case-sensitive)
- **Secrets**: Are automatically available to functions via `Deno.env.get()`
- **Deployment**: Functions deploy immediately when you click "Deploy"
- **Logs**: Check function logs in Supabase Dashboard for debugging
- **CORS**: Functions include CORS headers automatically

---

**Need Help?** Check function logs in Supabase Dashboard → Edge Functions → Function → Logs tab.
