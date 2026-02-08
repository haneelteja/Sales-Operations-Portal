# Troubleshooting "Unauthorized" Error

## 🔴 Error: "Token refresh failed: Unauthorized"

This error means Google OAuth is rejecting your credentials. Let's fix it step by step.

---

## Step 1: Verify Secrets Are Set Correctly

### Check Secrets in Supabase

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Verify all 3 secrets exist:
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `GOOGLE_REFRESH_TOKEN`

3. **Check Secret Values:**
   - `GOOGLE_CLIENT_ID` should look like: `123456789-abc123def456.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` should look like: `GOCSPX-abc123def456`
   - `GOOGLE_REFRESH_TOKEN` should look like: `1//0abc123def456...` (starts with `1//`)

---

## Step 2: Verify Refresh Token Is Valid

### Common Issues:

1. **Refresh Token Expired**
   - Refresh tokens can expire if:
     - Not used for 6 months
     - User revoked access
     - User changed password
   - **Solution:** Get a new refresh token

2. **Refresh Token Not Obtained with Correct Scopes**
   - Must include: `https://www.googleapis.com/auth/drive.file`
   - **Solution:** Get new token with correct scopes

3. **Refresh Token from Wrong OAuth Client**
   - Token must match the Client ID/Secret
   - **Solution:** Ensure token matches your OAuth credentials

---

## Step 3: Get a New Refresh Token

### Using OAuth 2.0 Playground (Easiest)

1. **Go to:** https://developers.google.com/oauthplayground/

2. **Configure Playground:**
   - Click ⚙️ (gear icon) in top right
   - ✅ Check "Use your own OAuth credentials"
   - Enter your `GOOGLE_CLIENT_ID`
   - Enter your `GOOGLE_CLIENT_SECRET`
   - Click "Close"

3. **Select Scopes:**
   - In left panel, scroll to "Drive API v3"
   - ✅ Select: `https://www.googleapis.com/auth/drive.file`
   - (Or select `https://www.googleapis.com/auth/drive` for full access)

4. **Authorize:**
   - Click "Authorize APIs" button
   - Sign in with your Google account
   - Click "Allow" to grant permissions

5. **Get Refresh Token:**
   - Click "Exchange authorization code for tokens"
   - **Copy the Refresh Token** (starts with `1//...`)

6. **Update Secret:**
   - Go to Supabase → Project Settings → Edge Functions → Secrets
   - Edit `GOOGLE_REFRESH_TOKEN`
   - Paste new refresh token
   - Click "Save"

---

## Step 4: Verify OAuth App Configuration

### Check Google Cloud Console

1. **Go to:** https://console.cloud.google.com/
2. **Select your project**
3. **Navigate to:** APIs & Services → Credentials
4. **Click on your OAuth 2.0 Client ID**

5. **Verify:**
   - ✅ Application type: "Web application"
   - ✅ Authorized redirect URIs includes: `https://developers.google.com/oauthplayground`
   - ✅ Google Drive API is enabled

6. **Enable Google Drive API:**
   - Go to: APIs & Services → Library
   - Search for "Google Drive API"
   - Click "Enable" if not already enabled

---

## Step 5: Test with Correct Credentials

### Test Token Refresh Again

1. **Update refresh token** in Supabase secrets (if you got a new one)
2. **Wait 10-30 seconds** for secrets to propagate
3. **Test function again:**
   - Edge Functions → `google-drive-token` → Invoke
   - Method: POST
   - Body: `{}`
   - Click "Invoke Function"

### Expected Success Response:
```json
{
  "accessToken": "ya29.a0AfH6SMB...",
  "expiresIn": 3600
}
```

---

## Step 6: Check Function Logs

### View Detailed Error

1. Go to **Edge Functions** → `google-drive-token`
2. Click **Logs** tab
3. Look for the most recent invocation
4. Check error details

**Common Error Messages:**

- `"invalid_grant"` → Refresh token expired or invalid
- `"invalid_client"` → Client ID or Secret is wrong
- `"unauthorized_client"` → OAuth app not configured correctly
- `"access_denied"` → User didn't grant permissions

---

## Step 7: Alternative - Use Service Account (Advanced)

If OAuth continues to fail, consider using a Service Account instead:

### Benefits:
- ✅ No refresh token expiration
- ✅ More reliable for server-to-server operations
- ✅ Better for automated systems

### Setup:
1. Create Service Account in Google Cloud Console
2. Download JSON key file
3. Share Google Drive folder with service account email
4. Update Edge Function to use service account credentials

**Note:** This requires code changes to the Edge Function.

---

## 🔍 Debugging Checklist

- [ ] Secrets are set in Supabase (all 3)
- [ ] Client ID matches Google Cloud Console
- [ ] Client Secret matches Google Cloud Console
- [ ] Refresh token is recent (obtained today)
- [ ] Refresh token obtained with `drive.file` scope
- [ ] Google Drive API is enabled in Google Cloud Console
- [ ] OAuth app is configured as "Web application"
- [ ] Authorized redirect URI includes OAuth Playground
- [ ] Function logs checked for detailed error

---

## 💡 Quick Fix Steps

1. **Get new refresh token** from OAuth Playground
2. **Update `GOOGLE_REFRESH_TOKEN`** secret in Supabase
3. **Wait 30 seconds** for propagation
4. **Test again**

---

## 📝 Test Command

After updating refresh token, test with:

```bash
curl -X POST \
  https://qkvmdrtfhpcvwvqjuyuu.supabase.co/functions/v1/google-drive-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Double-check all credentials** match exactly
2. **Get a completely new refresh token** (don't reuse old one)
3. **Verify OAuth app is in "Testing" or "Production" mode**
4. **Check Google Cloud Console quotas** (not exceeded)
5. **Review function logs** for specific error codes

**Common Mistake:** Copying refresh token with extra spaces or newlines. Make sure it's exactly as shown in OAuth Playground.

---

## ✅ Success Indicators

When working correctly:
- Token refresh returns `accessToken` and `expiresIn`
- File upload returns `id`, `webViewLink`, `webContentLink`
- Files appear in Google Drive
- No errors in function logs
