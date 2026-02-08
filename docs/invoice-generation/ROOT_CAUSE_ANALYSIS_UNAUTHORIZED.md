# Root Cause Analysis: `unauthorized_client` Error

## 🔴 Current Situation

**Error:** `unauthorized_client` when calling `google-drive-token` Edge Function

**What We Know:**
- ✅ Client ID matches: `YOUR_CLIENT_ID.apps.googleusercontent.com`
- ✅ Client Secret exists and has correct length (35 characters)
- ✅ Refresh Token exists and has correct length (103 characters)
- ✅ OAuth Playground test **succeeded** with same credentials
- ❌ Supabase Edge Function still returns `unauthorized_client`

---

## 🔍 Root Cause Analysis

### Most Likely Causes (in order of probability):

#### 1. **Client Secret Mismatch** (90% probability)
- The Client Secret stored in Supabase doesn't match the one used in OAuth Playground
- Even though length is correct (35 chars), the actual characters might be different
- **Why:** Copy-paste errors, extra spaces, or using a different OAuth client's secret

#### 2. **Whitespace/Encoding Issues** (5% probability)
- Extra spaces before/after the secret value
- Hidden characters or encoding issues when copying
- **Why:** Supabase secrets UI might add/remove whitespace

#### 3. **Refresh Token Mismatch** (4% probability)
- Refresh token was obtained with a different Client ID/Secret pair
- Token might have been revoked or expired
- **Why:** Token tied to different OAuth client

#### 4. **Request Format Issue** (1% probability)
- Edge Function code has a bug in how it sends the request
- **Why:** Unlikely since OAuth Playground works with same credentials

---

## ✅ Verification Steps

### Step 1: Verify Client Secret from Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - Click on it to view details

3. **Copy the Client Secret:**
   - Click **Show** next to "Client secret"
   - **Copy the EXACT value** (should start with `GOCSPX-`)
   - **Expected:** `GOCSPX-YOUR_CLIENT_SECRET`

4. **Compare with Supabase Secret:**
   - Go to Supabase → Edge Functions → Secrets
   - Check `GOOGLE_CLIENT_SECRET` value
   - **They must match EXACTLY** (character by character)

---

### Step 2: Verify Refresh Token from OAuth Playground

1. **Go to OAuth Playground:**
   - Visit: https://developers.google.com/oauthplayground/

2. **Configure with Your Credentials:**
   - Click ⚙️ (gear icon)
   - Check "Use your own OAuth credentials"
   - Enter Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - Enter Client Secret: `GOCSPX-YOUR_CLIENT_SECRET`
   - Click "Close"

3. **Get Refresh Token:**
   - Select scope: `https://www.googleapis.com/auth/drive.file`
   - Click "Authorize APIs"
   - Sign in and grant permissions
   - Click "Exchange authorization code for tokens"
   - **Copy the Refresh Token** (starts with `1//`)

4. **Compare with Supabase Secret:**
   - Go to Supabase → Edge Functions → Secrets
   - Check `GOOGLE_REFRESH_TOKEN` value
   - **They must match EXACTLY**

---

## 🔧 Fix Steps

### Option A: Update Supabase Secrets (Recommended)

1. **Delete existing secrets:**
   - Go to Supabase → Edge Functions → Secrets
   - Delete: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
   - Wait 10 seconds

2. **Add secrets with exact values:**

   **Secret 1: `GOOGLE_CLIENT_ID`**
   ```
   YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

   **Secret 2: `GOOGLE_CLIENT_SECRET`**
   ```
   GOCSPX-YOUR_CLIENT_SECRET
   ```
   ⚠️ **CRITICAL:** Copy from Google Cloud Console, verify no spaces

   **Secret 3: `GOOGLE_REFRESH_TOKEN`**
   ```
   YOUR_REFRESH_TOKEN_FROM_OAUTH_PLAYGROUND
   ```
   ⚠️ **CRITICAL:** Copy from OAuth Playground, includes `1//` prefix

3. **Wait 30 seconds** for secrets to propagate

4. **Test the function:**
   - Edge Functions → `google-drive-token` → Invoke
   - Method: POST
   - Body: `{}`
   - Click "Invoke Function"

---

### Option B: Get New Refresh Token (If Secret is Correct)

If the Client Secret is correct but still failing:

1. **Get a fresh refresh token:**
   - Use OAuth Playground (steps above)
   - Get a new refresh token
   - Update `GOOGLE_REFRESH_TOKEN` in Supabase

2. **Test again**

---

## 🧪 Enhanced Debugging

The Edge Function now logs detailed information. Check the logs for:

- `currentClientId`: Should match expected Client ID exactly
- `clientSecretLength`: Should be 35
- `refreshTokenLength`: Should be 103
- `refreshTokenPreview`: First 20 chars of refresh token

**If `currentClientId` doesn't match:**
- Update `GOOGLE_CLIENT_ID` secret

**If lengths are wrong:**
- Re-copy the secret from source (Google Cloud Console or OAuth Playground)

**If preview doesn't match:**
- Refresh token is wrong, get a new one

---

## ✅ Success Criteria

After fixing, you should see:

**Function Response:**
```json
{
  "accessToken": "ya29.a0AfH6SMB...",
  "expiresIn": 3600
}
```

**No errors in logs**

---

## 📝 Prevention

To avoid this in the future:

1. **Always copy secrets directly from source:**
   - Client Secret: Google Cloud Console
   - Refresh Token: OAuth Playground

2. **Verify no spaces:**
   - Copy to a text editor first
   - Check for leading/trailing spaces
   - Remove any extra characters

3. **Test immediately after updating:**
   - Don't wait days to test
   - Test right after updating secrets

4. **Document which OAuth client you're using:**
   - Keep a note of Client ID
   - Ensure all secrets match that client

---

## 🆘 Still Not Working?

If you've verified all secrets match exactly and it still fails:

1. **Check Google Cloud Console:**
   - Ensure OAuth client is "Web application" type
   - Ensure redirect URI includes: `https://developers.google.com/oauthplayground`
   - Ensure Google Drive API is enabled

2. **Try a completely new OAuth client:**
   - Create new OAuth 2.0 Client in Google Cloud Console
   - Get new refresh token with new client
   - Update all 3 secrets in Supabase

3. **Check Supabase logs:**
   - Look for any additional error details
   - Check if secrets are being read correctly
