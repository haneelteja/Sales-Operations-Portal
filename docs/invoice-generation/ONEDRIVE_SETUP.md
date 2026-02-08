# OneDrive Integration Setup Guide

**Date:** January 27, 2026  
**Purpose:** Configure Microsoft OneDrive for invoice document storage

---

## 📋 Prerequisites

1. Microsoft Azure account (free tier available)
2. Access to Azure Portal
3. OneDrive account (personal or business)

---

## 🔧 Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name:** `Aamodha Operations Portal - OneDrive`
   - **Supported account types:** Choose based on your needs:
     - **Single tenant** (for organization only)
     - **Multi-tenant** (for any Microsoft account)
   - **Redirect URI:** 
     - Type: **Web**
     - URI: `http://localhost:8080/auth/onedrive/callback` (for local testing)
5. Click **Register**
6. Note down:
   - **Application (client) ID** → This is your `ONEDRIVE_CLIENT_ID`
   - **Directory (tenant) ID** → This is your `ONEDRIVE_TENANT_ID`

---

## 🔑 Step 2: Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `OneDrive Invoice Storage`
4. Choose expiration (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT:** Copy the **Value** immediately (you won't see it again)
   - This is your `ONEDRIVE_CLIENT_SECRET`

---

## 🔐 Step 3: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `Files.ReadWrite` - Read and write user files
   - `Sites.ReadWrite.All` - Read and write all site collections (if using SharePoint)
   - `offline_access` - Maintain access to data (required for refresh tokens)
6. Click **Add permissions**
7. Click **Grant admin consent** (if you're an admin) or request admin consent

---

## 🎯 Step 4: Get Refresh Token

### Option A: Using OAuth 2.0 Playground (Recommended)

1. Go to [OAuth 2.0 Playground](https://oauthplayground.com/)
2. Click the gear icon (⚙️) in the top right
3. Check **Use your own OAuth credentials**
4. Enter:
   - **OAuth Client ID:** Your `ONEDRIVE_CLIENT_ID`
   - **OAuth Client Secret:** Your `ONEDRIVE_CLIENT_SECRET`
5. In the left panel, scroll to **Microsoft**
6. Select:
   - `https://graph.microsoft.com/Files.ReadWrite`
   - `https://graph.microsoft.com/Sites.ReadWrite.All`
   - `offline_access`
7. Click **Authorize APIs**
8. Sign in with your Microsoft account
9. Grant permissions
10. After authorization, you'll see an authorization code
11. Click **Exchange authorization code for tokens**
12. Copy the **refresh_token** value
    - This is your `ONEDRIVE_REFRESH_TOKEN`

### Option B: Using PowerShell Script

```powershell
# Install Microsoft.Graph module if needed
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Files.ReadWrite", "Sites.ReadWrite.All", "offline_access"

# Get refresh token (requires custom script)
# Note: This is a simplified example - actual implementation may vary
```

---

## 🔒 Step 5: Configure Supabase Edge Function Secrets

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ONEDRIVE_CLIENT_ID` | Your Azure App Client ID | Application ID from Azure |
| `ONEDRIVE_CLIENT_SECRET` | Your Azure App Client Secret | Secret value (not secret ID) |
| `ONEDRIVE_TENANT_ID` | Your Azure Tenant ID | Directory ID (or use `common` for multi-tenant) |
| `ONEDRIVE_REFRESH_TOKEN` | Your refresh token | Token from OAuth flow |

**Note:** For multi-tenant apps, you can use `common` as the tenant ID.

---

## ✅ Step 6: Deploy Edge Functions

Deploy the OneDrive Edge Functions to Supabase:

```bash
# Deploy token function
supabase functions deploy onedrive-token

# Deploy upload function
supabase functions deploy onedrive-upload
```

Or deploy via Supabase Dashboard:
1. Go to **Edge Functions**
2. Create new function: `onedrive-token`
3. Copy code from `supabase/functions/onedrive-token/index.ts`
4. Create new function: `onedrive-upload`
5. Copy code from `supabase/functions/onedrive-upload/index.ts`

---

## 🧪 Step 7: Test OneDrive Integration

### Test Token Refresh

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/onedrive-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJub...",
  "expiresIn": 3600,
  "refreshToken": "..."
}
```

### Test File Upload

```bash
# First, encode a test file to base64
# Then:
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/onedrive-upload \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileData": "SGVsbG8gV29ybGQ=",
    "mimeType": "text/plain"
  }'
```

---

## ⚙️ Step 8: Configure Storage Provider in Application

1. Navigate to **Application Configuration** tab in the portal
2. Find **Storage Provider** configuration
3. Select **OneDrive** from the dropdown
4. Click **Save** (changes take effect immediately)

---

## 📁 Step 9: Configure Folder Path

1. In **Application Configuration** tab
2. Find **Invoice folder path**
3. Click **Edit**
4. Enter your OneDrive folder path:
   - **Example:** `Invoice` (uploads to root/Invoice)
   - **Example:** `Documents/Invoice` (uploads to Documents/Invoice)
   - **Note:** OneDrive doesn't require "MyDrive/" prefix like Google Drive
5. Click **Save**

---

## 🔍 Troubleshooting

### Error: "Selected user account does not exist in tenant 'Microsoft Services'"
**This error occurs when:**
- You're using a personal Microsoft account (@outlook.com, @hotmail.com, @live.com) with a single-tenant app registration
- Your account belongs to a different Azure AD tenant than the app registration
- The app registration is configured for a specific organization but you're using a different account

**Solutions:**

**Option 1: Change App Registration to Multi-Tenant (Recommended)**
1. Go to Azure Portal → **Microsoft Entra ID** → **App registrations**
2. Select your app registration
3. Click **"Authentication"** in the left menu
4. Under **"Supported account types"**, select:
   - ✅ **"Accounts in any organizational directory and personal Microsoft accounts"**
5. Click **"Save"**
6. Try the OAuth flow again with your personal Microsoft account

**Option 2: Use a Work/School Account**
- If you have a work or school Microsoft account (@yourcompany.com), use that instead
- Ensure the account belongs to the same tenant as your app registration

**Option 3: Use Correct Tenant ID**
- If using a work/school account, ensure `ONEDRIVE_TENANT_ID` matches your organization's tenant ID
- For personal accounts with multi-tenant apps, use `common` as the tenant ID

### Error: "Refresh token not provided"
- **Solution:** Ensure `ONEDRIVE_REFRESH_TOKEN` is set in Supabase Edge Function secrets

### Error: "Client credentials not configured"
- **Solution:** Verify `ONEDRIVE_CLIENT_ID` and `ONEDRIVE_CLIENT_SECRET` are set correctly

### Error: "Token refresh failed: invalid_grant"
- **Solution:** Refresh token may have expired. Generate a new refresh token using OAuth Playground

### Error: "Insufficient privileges"
- **Solution:** Ensure API permissions are granted and admin consent is provided in Azure Portal

### Error: "Upload failed: 403 Forbidden"
- **Solution:** Check that `Files.ReadWrite` permission is granted and consented

---

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [OneDrive API Reference](https://docs.microsoft.com/en-us/onedrive/developer/rest-api/)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---

## 🔄 Switching Between Providers

You can switch between Google Drive and OneDrive at any time:

1. Go to **Application Configuration** tab
2. Change **Storage Provider** to desired provider
3. Update **Invoice folder path** if needed
4. New invoices will use the selected provider
5. Existing invoices remain in their original storage location

---

## ✅ Verification Checklist

- [ ] Azure app registered
- [ ] Client secret created and copied
- [ ] API permissions configured and consented
- [ ] Refresh token obtained
- [ ] All secrets added to Supabase Edge Functions
- [ ] Edge functions deployed
- [ ] Token refresh tested successfully
- [ ] File upload tested successfully
- [ ] Storage provider configured in Application Configuration
- [ ] Folder path configured
- [ ] Test invoice generated and uploaded to OneDrive

---

**Status:** Ready for Testing
