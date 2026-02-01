# Test Google Drive API in OAuth Playground

## 🎯 Purpose

Testing in OAuth Playground verifies that your credentials work correctly before using them in Supabase Edge Functions.

---

## ✅ Step-by-Step Testing

### Step 1: Verify You're on Step 3

You should already be at **Step 3: Configure request to API** in the OAuth Playground.

### Step 2: Test List Files in Google Drive

This will verify your access token works with Google Drive API.

#### Configure the Request:

1. **HTTP Method:** Select `GET` (should already be selected)

2. **Request URI:** Enter:
   ```
   https://www.googleapis.com/drive/v3/files
   ```

3. **Add Query Parameters (Optional):**
   - Click "Add query parameters"
   - Add parameter:
     - **Name:** `pageSize`
     - **Value:** `10`
   - This limits results to 10 files for testing

4. **Content-Type:** Leave as `application/json`

5. **Request Body:** Leave empty (we're using GET)

#### Send the Request:

1. Click **"Send the request"** button

2. **Expected Success Response:**
   ```json
   {
     "kind": "drive#fileList",
     "files": [
       {
         "kind": "drive#file",
         "id": "1ABC123...",
         "name": "example.docx",
         "mimeType": "application/vnd.google-apps.document"
       },
       ...
     ]
   }
   ```

   This means:
   - ✅ Your refresh token is valid
   - ✅ Your access token was obtained successfully
   - ✅ Google Drive API access is working
   - ✅ Your credentials are correct

---

### Step 3: Test Upload a File (Optional)

To test file upload capability:

1. **HTTP Method:** Change to `POST`

2. **Request URI:** Enter:
   ```
   https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
   ```

3. **Content-Type:** Change to `multipart/related; boundary=foo_bar_baz`

4. **Request Body:** Enter:
   ```
   --foo_bar_baz
   Content-Type: application/json; charset=UTF-8

   {
     "name": "test-invoice.docx"
   }

   --foo_bar_baz
   Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

   Hello World
   --foo_bar_baz--
   ```

5. Click **"Send the request"**

6. **Expected Success Response:**
   ```json
   {
     "kind": "drive#file",
     "id": "1ABC123...",
     "name": "test-invoice.docx",
     "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
   }
   ```

---

## ✅ What This Confirms

If both tests succeed, it confirms:

1. ✅ **Refresh Token is Valid:** The token refresh worked
2. ✅ **Access Token Works:** Google accepted the access token
3. ✅ **Drive API Access:** You can read/write to Google Drive
4. ✅ **Credentials Match:** Client ID, Secret, and Refresh Token are all correct

---

## 🎯 Next Steps After Successful Test

Once the OAuth Playground tests succeed:

1. **Update Supabase Secrets:**
   - Use the **exact same credentials** that worked in the playground
   - `GOOGLE_CLIENT_ID` = `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = `GOCSPX-YOUR_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN` = `YOUR_REFRESH_TOKEN_FROM_OAUTH_PLAYGROUND`

2. **Test Supabase Edge Function:**
   - Go to Supabase → Edge Functions → `google-drive-token` → Invoke
   - Method: POST
   - Body: `{}`
   - Should return `accessToken` and `expiresIn`

---

## 🔍 Troubleshooting

### Error: "Invalid Credentials"
- Check that Client ID and Secret match what's in Google Cloud Console
- Verify the refresh token is from the same OAuth client

### Error: "Insufficient Permissions"
- Make sure you selected `https://www.googleapis.com/auth/drive.file` scope in Step 1
- Re-authorize with the correct scope if needed

### Error: "Access Denied"
- Check that Google Drive API is enabled in Google Cloud Console
- Verify your Google account has access to Drive

---

## 📝 Notes

- OAuth Playground is for **testing only** - don't use it in production
- The access token expires in ~1 hour - refresh tokens don't expire (unless revoked)
- If tests fail, the issue is with credentials, not the Supabase function
- If tests succeed, the Supabase function should work once secrets are updated
