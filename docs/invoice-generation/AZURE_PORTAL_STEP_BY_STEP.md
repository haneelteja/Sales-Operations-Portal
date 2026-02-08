# Azure Portal - OneDrive Setup Step-by-Step Guide

**Date:** January 27, 2026  
**Visual Guide for Azure Portal Setup**

---

## 🎯 Step 1: Navigate to Microsoft Entra ID

1. In the Azure Portal dashboard, look for **"Microsoft Entra ID"** in the left sidebar
2. Click on **"Microsoft Entra ID"** (it may also appear as **"Azure Active Directory"**)
3. This will open the Microsoft Entra ID overview page

---

## 📝 Step 2: Create App Registration

1. In the Microsoft Entra ID left menu, click on **"App registrations"**
2. Click the **"+ New registration"** button at the top
3. Fill in the registration form:

   **Name:**
   ```
   Aamodha Operations Portal - OneDrive
   ```

   **Supported account types:**
   - Choose **"Accounts in any organizational directory and personal Microsoft accounts"** (multi-tenant)
   - OR **"Single tenant"** if you only want your organization's accounts
   
   **Redirect URI (Optional):**
   - Type: **Web**
   - URI: `http://localhost:8080/auth/onedrive/callback`
   - (This is optional for server-side OAuth flow)

4. Click **"Register"**

---

## 🔑 Step 3: Copy Application (Client) ID

After registration, you'll see the **Overview** page:

1. Find **"Application (client) ID"**
2. Click the **copy icon** next to it
3. **Save this value** - This is your `ONEDRIVE_CLIENT_ID`
4. Also note the **"Directory (tenant) ID"** - This is your `ONEDRIVE_TENANT_ID`
   - If using multi-tenant, you can use `common` instead

---

## 🔐 Step 4: Create Client Secret

1. In the left menu, click **"Certificates & secrets"**
2. Under **"Client secrets"** tab, click **"+ New client secret"**
3. Fill in:
   - **Description:** `OneDrive Invoice Storage`
   - **Expires:** Choose **24 months** (or your preferred duration)
4. Click **"Add"**
5. **⚠️ IMPORTANT:** Copy the **Value** immediately (you won't see it again!)
   - This is your `ONEDRIVE_CLIENT_SECRET`
   - The **Secret ID** is NOT what you need - you need the **Value**

---

## 🔓 Step 5: Configure API Permissions

1. In the left menu, click **"API permissions"**
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Search for and select these permissions:
   - ✅ `Files.ReadWrite` - Read and write user files
   - ✅ `Sites.ReadWrite.All` - Read and write all site collections (for SharePoint/OneDrive)
   - ✅ `offline_access` - Maintain access to data (required for refresh tokens)
6. Click **"Add permissions"**
7. **Grant admin consent** (if you're an admin):
   - Click **"Grant admin consent for [Your Organization]"**
   - Confirm by clicking **"Yes"**
   - You should see green checkmarks next to each permission

---

## 🎫 Step 6: Get Refresh Token

### Option A: Using OAuth 2.0 Playground (Easiest)

1. Go to [OAuth 2.0 Playground](https://oauthplayground.com/)
2. Click the **gear icon (⚙️)** in the top right corner
3. Check **"Use your own OAuth credentials"**
4. Enter:
   - **OAuth Client ID:** Your `ONEDRIVE_CLIENT_ID` from Step 3
   - **OAuth Client Secret:** Your `ONEDRIVE_CLIENT_SECRET` from Step 4
5. In the left sidebar, scroll down to find **"Microsoft"**
6. Expand **"Microsoft"** and select:
   - `https://graph.microsoft.com/Files.ReadWrite`
   - `https://graph.microsoft.com/Sites.ReadWrite.All`
   - `offline_access`
7. Click **"Authorize APIs"**
8. Sign in with your Microsoft account (the account that will own the OneDrive)
9. Grant permissions when prompted
10. After authorization, you'll see an authorization code
11. Click **"Exchange authorization code for tokens"**
12. Copy the **refresh_token** value from the response
    - This is your `ONEDRIVE_REFRESH_TOKEN`

### Option B: Using Azure Portal (Advanced)

1. In your app registration, go to **"Authentication"**
2. Add a redirect URI:
   - Type: **Web**
   - URI: `https://oauthplayground.com/` (or your callback URL)
3. Use a tool like Postman or a custom script to perform OAuth flow
4. Follow Microsoft's OAuth 2.0 authorization code flow

---

## 📋 Step 7: Summary of Values to Collect

After completing all steps, you should have:

| Value | Where to Find | Example |
|-------|---------------|---------|
| `ONEDRIVE_CLIENT_ID` | App Registration → Overview → Application (client) ID | `12345678-abcd-1234-abcd-123456789abc` |
| `ONEDRIVE_CLIENT_SECRET` | App Registration → Certificates & secrets → Value | `abc123~DEF456ghi789...` |
| `ONEDRIVE_TENANT_ID` | App Registration → Overview → Directory (tenant) ID | `87654321-dcba-4321-dcba-cba987654321` OR `common` |
| `ONEDRIVE_REFRESH_TOKEN` | OAuth Playground → Exchange code → refresh_token | `0.AXkA...` (long token) |

---

## 🔒 Step 8: Configure Supabase Edge Function Secrets

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Secrets**
3. Add each secret:

   **Secret 1:**
   - Name: `ONEDRIVE_CLIENT_ID`
   - Value: [Your Client ID from Step 3]
   - Click **"Add"**

   **Secret 2:**
   - Name: `ONEDRIVE_CLIENT_SECRET`
   - Value: [Your Client Secret Value from Step 4]
   - Click **"Add"**

   **Secret 3:**
   - Name: `ONEDRIVE_TENANT_ID`
   - Value: [Your Tenant ID from Step 3] OR `common` for multi-tenant
   - Click **"Add"**

   **Secret 4:**
   - Name: `ONEDRIVE_REFRESH_TOKEN`
   - Value: [Your Refresh Token from Step 6]
   - Click **"Add"**

---

## 🚀 Step 9: Deploy Edge Functions

### Option A: Using Supabase CLI

```bash
# Navigate to your project directory
cd "c:\Users\Haneel Teja\Cursor Applications\Aamodha-Operations-Portal---V1"

# Deploy token function
supabase functions deploy onedrive-token

# Deploy upload function
supabase functions deploy onedrive-upload
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **"Create a new function"**
3. Name: `onedrive-token`
4. Copy code from `supabase/functions/onedrive-token/index.ts`
5. Paste into the editor
6. Click **"Deploy"**
7. Repeat for `onedrive-upload` function

---

## ✅ Step 10: Test the Integration

### Test Token Refresh

1. Go to Supabase Dashboard → **Edge Functions** → `onedrive-token`
2. Click **"Invoke"** tab
3. Click **"Invoke function"**
4. You should see a response with `accessToken`

### Test File Upload

1. Go to **Edge Functions** → `onedrive-upload`
2. Click **"Invoke"** tab
3. Use this test payload:
```json
{
  "fileName": "test.txt",
  "fileData": "SGVsbG8gV29ybGQ=",
  "mimeType": "text/plain"
}
```
4. Click **"Invoke function"**
5. Check your OneDrive - you should see `test.txt` uploaded

---

## ⚙️ Step 11: Configure in Application

1. Open your application
2. Navigate to **Application Configuration** tab
3. Find **"Storage Provider"** configuration
4. Select **"OneDrive"** from the dropdown
5. Click anywhere outside to save (auto-saves)
6. Update **"Invoice folder path"** if needed:
   - For OneDrive: `Invoice` or `Documents/Invoice`
   - (No "MyDrive/" prefix needed)

---

## 🔍 Troubleshooting

### Error: "Selected user account does not exist in tenant 'Microsoft Services'"
**This is the most common error when setting up OneDrive integration.**

**What it means:**
- Your Microsoft account doesn't match the tenant configured in your app registration
- You're using a personal account (@outlook.com, @hotmail.com) but the app is single-tenant
- Your account belongs to a different organization than the app registration

**Quick Fix - Change to Multi-Tenant:**

1. In Azure Portal, go to your app registration
2. Click **"Authentication"** in the left menu
3. Scroll to **"Supported account types"**
4. Select: **"Accounts in any organizational directory and personal Microsoft accounts"**
5. Click **"Save"** at the top
6. Wait 1-2 minutes for changes to propagate
7. Try the OAuth flow again in OAuth Playground

**Alternative Solutions:**

- **Use a work/school account:** If you have a work Microsoft account, use that instead
- **Check tenant ID:** Ensure you're using the correct tenant ID (or `common` for multi-tenant)

**After fixing, update Supabase secrets:**
- If you changed to multi-tenant, set `ONEDRIVE_TENANT_ID` to `common` in Supabase Edge Function secrets

### Error: "AADSTS70011: Invalid scope"
- **Solution:** Ensure you've added `offline_access` permission in API permissions

### Error: "AADSTS65005: Invalid client"
- **Solution:** Verify Client ID and Client Secret match the app registration

### Error: "AADSTS7000215: Invalid client secret"
- **Solution:** Make sure you copied the **Value** (not Secret ID) from Certificates & secrets

### Error: "Token refresh failed: invalid_grant"
- **Solution:** Refresh token may have expired. Generate a new one using OAuth Playground

### Error: "Insufficient privileges to complete the operation"
- **Solution:** Ensure admin consent is granted for all API permissions

---

## 📚 Quick Reference

**Azure Portal Navigation:**
```
Azure Portal → Microsoft Entra ID → App registrations → [Your App]
```

**Key Sections:**
- **Overview** → Client ID, Tenant ID
- **Certificates & secrets** → Client Secret
- **API permissions** → Permissions configuration
- **Authentication** → Redirect URIs

---

**Status:** Ready for Azure Portal Setup
