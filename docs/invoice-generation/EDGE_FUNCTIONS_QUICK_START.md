# Edge Functions Quick Start Guide

## 🎯 Goal: Create 2 Edge Functions in Supabase

---

## Step 1: Create `google-drive-token` Function

### 📍 Location: Supabase Dashboard → Edge Functions

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Click "Edge Functions"** (left sidebar)

3. **Click "New Function"** button (top right)

4. **Enter Function Name:**
   ```
   google-drive-token
   ```

5. **Click "Create Function"**

6. **Copy & Paste Code:**
   - Delete all existing code in the editor
   - Open file: `supabase/functions/google-drive-token/index.ts`
   - Copy ALL code
   - Paste into Supabase editor

7. **Click "Deploy"** button (top right)

8. **Wait for "Deployed successfully" message** ✅

---

## Step 2: Create `google-drive-upload` Function

### 📍 Same Location: Edge Functions Page

1. **Click "New Function"** again

2. **Enter Function Name:**
   ```
   google-drive-upload
   ```

3. **Click "Create Function"**

4. **Copy & Paste Code:**
   - Delete all existing code
   - Open file: `supabase/functions/google-drive-upload/index.ts`
   - Copy ALL code
   - Paste into Supabase editor

5. **Click "Deploy"** button

6. **Wait for "Deployed successfully" message** ✅

---

## Step 3: Add Secrets

### 📍 Location: Project Settings → Edge Functions → Secrets

1. **Go to Project Settings** (gear icon ⚙️)

2. **Click "Edge Functions"** (left sidebar)

3. **Click "Secrets"** tab

4. **Add 3 Secrets:**

   **Secret 1:**
   - Click **"Add Secret"**
   - Name: `GOOGLE_CLIENT_ID`
   - Value: [Your Google Client ID]
   - Click **"Save"**

   **Secret 2:**
   - Click **"Add Secret"**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: [Your Google Client Secret]
   - Click **"Save"**

   **Secret 3:**
   - Click **"Add Secret"**
   - Name: `GOOGLE_REFRESH_TOKEN`
   - Value: [Your Refresh Token]
   - Click **"Save"**

---

## Step 4: Test Functions

### Test Token Refresh:

1. Go to **Edge Functions** → Click `google-drive-token`
2. Click **"Invoke"** tab
3. Method: **POST**
4. Body: `{}`
5. Click **"Invoke Function"**
6. ✅ Should return: `{ "accessToken": "...", "expiresIn": 3600 }`

### Test File Upload:

1. Go to **Edge Functions** → Click `google-drive-upload`
2. Click **"Invoke"** tab
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
5. Click **"Invoke Function"**
6. ✅ Should return file ID and Google Drive links

---

## ✅ Checklist

- [ ] `google-drive-token` function created
- [ ] `google-drive-upload` function created
- [ ] Both functions deployed
- [ ] `GOOGLE_CLIENT_ID` secret added
- [ ] `GOOGLE_CLIENT_SECRET` secret added
- [ ] `GOOGLE_REFRESH_TOKEN` secret added
- [ ] Token refresh test passed
- [ ] File upload test passed

---

## 🐛 Common Issues

**"Function not found"**
→ Make sure you clicked "Deploy" after creating

**"Refresh token not provided"**
→ Check secrets are set in Project Settings → Edge Functions → Secrets

**"Token refresh failed"**
→ Verify refresh token is valid (get new one if expired)

---

## 📝 Next Steps

After functions are working:

1. ✅ Create Word template (`public/templates/invoice-template.docx`)
2. ✅ Configure environment variables (company details)
3. ✅ Integrate with SalesEntry component
4. ✅ Test end-to-end invoice generation

---

**Detailed Guide:** See `CREATE_EDGE_FUNCTIONS.md` for complete instructions.
