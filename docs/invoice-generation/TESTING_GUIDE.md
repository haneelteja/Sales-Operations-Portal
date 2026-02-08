# Invoice Generation System - Testing Guide

## 🧪 Step-by-Step Testing Instructions

---

## Prerequisites

✅ Edge Functions created in Supabase  
✅ Secrets configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`)  
✅ Database migration completed

---

## Step 1: Verify Edge Functions Are Deployed

### Check Functions in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Verify both functions exist:
   - ✅ `google-drive-token`
   - ✅ `google-drive-upload`

### Verify Function Code

**For `google-drive-token`:**
- Should handle POST requests
- Should read `GOOGLE_REFRESH_TOKEN` from environment
- Should return `{ accessToken, expiresIn }`

**For `google-drive-upload`:**
- Should handle POST requests
- Should accept `{ fileName, folderId, fileData, mimeType }`
- Should return `{ id, webViewLink, webContentLink }`

---

## Step 2: Test Token Refresh Function

### Method 1: Using Supabase Dashboard

1. Go to **Edge Functions** → `google-drive-token`
2. Click **Invoke** tab
3. Set method to **POST**
4. Leave body empty: `{}`
5. Click **Invoke Function**
6. **Expected Response:**
   ```json
   {
     "accessToken": "ya29.a0AfH6SMB...",
     "expiresIn": 3600
   }
   ```

### Method 2: Using cURL

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-drive-token \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Replace:**
- `YOUR_PROJECT_REF` - Your Supabase project reference (e.g., `qkvmdrtfhpcvwvqjuyuu`)
- `YOUR_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Expected Response:**
```json
{
  "accessToken": "ya29.a0AfH6SMB...",
  "expiresIn": 3600
}
```

### Method 3: Using Browser Console

Open browser console on your app and run:

```javascript
const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co';
const anonKey = 'YOUR_SUPABASE_ANON_KEY';

fetch(`${supabaseUrl}/functions/v1/google-drive-token`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
})
.then(res => res.json())
.then(data => console.log('Token:', data))
.catch(err => console.error('Error:', err));
```

### Troubleshooting Token Refresh

**Error: "Refresh token not provided"**
- ✅ Check `GOOGLE_REFRESH_TOKEN` secret is set in Supabase
- ✅ Verify secret name is exactly `GOOGLE_REFRESH_TOKEN` (case-sensitive)
- ✅ Check function logs: **Edge Functions** → `google-drive-token` → **Logs**

**Error: "Google OAuth credentials not configured"**
- ✅ Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- ✅ Verify credentials match Google Cloud Console

**Error: "Token refresh failed: invalid_grant"**
- ✅ Refresh token may be expired or revoked
- ✅ Get a new refresh token from OAuth Playground
- ✅ Update `GOOGLE_REFRESH_TOKEN` secret

---

## Step 3: Test File Upload Function

### Method 1: Using Supabase Dashboard

1. Go to **Edge Functions** → `google-drive-upload`
2. Click **Invoke** tab
3. Set method to **POST**
4. Use this test body:
   ```json
   {
     "fileName": "test-invoice.docx",
     "folderId": null,
     "fileData": "SGVsbG8gV29ybGQ=",
     "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
   }
   ```
   (Note: `SGVsbG8gV29ybGQ=` is base64 for "Hello World")
5. Click **Invoke Function**
6. **Expected Response:**
   ```json
   {
     "id": "1ABC123...",
     "webViewLink": "https://drive.google.com/file/d/1ABC123.../view",
     "webContentLink": "https://drive.google.com/uc?export=download&id=1ABC123...",
     "name": "test-invoice.docx"
   }
   ```

### Method 2: Using cURL

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-drive-upload \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-invoice.docx",
    "folderId": null,
    "fileData": "SGVsbG8gV29ybGQ=",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }'
```

### Method 3: Create Test File and Upload

Create a simple test script `test-upload.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Google Drive Upload</title>
</head>
<body>
  <h1>Test Google Drive Upload</h1>
  <button onclick="testUpload()">Test Upload</button>
  <pre id="result"></pre>

  <script>
    const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

    async function testUpload() {
      // Create a simple text file
      const content = 'This is a test invoice file';
      const base64Content = btoa(content);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/google-drive-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: 'test-invoice-' + Date.now() + '.txt',
            folderId: null,
            fileData: base64Content,
            mimeType: 'text/plain',
          }),
        });

        const result = await response.json();
        document.getElementById('result').textContent = JSON.stringify(result, null, 2);

        if (result.id) {
          alert('Upload successful! File ID: ' + result.id);
          window.open(result.webViewLink, '_blank');
        }
      } catch (error) {
        document.getElementById('result').textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

### Troubleshooting File Upload

**Error: "Failed to get access token"**
- ✅ Token refresh function must work first (test Step 2)
- ✅ Check `google-drive-token` function is deployed and accessible

**Error: "Upload failed: insufficientFilePermissions"**
- ✅ Check OAuth scopes include `https://www.googleapis.com/auth/drive.file`
- ✅ Verify refresh token was obtained with correct scopes

**Error: "fileName and fileData are required"**
- ✅ Ensure request body includes both `fileName` and `fileData`
- ✅ Verify `fileData` is base64 encoded

---

## Step 4: Test End-to-End Invoice Generation

### Create Test Transaction

1. Go to your app's **Client Transactions** page
2. Create a test sale transaction:
   - Select a client
   - Enter quantity: `10`
   - Select SKU
   - Enter amount: `1000`
   - Click **Submit**

### Verify Invoice Generation

**Check Database:**
```sql
-- Get latest invoice
SELECT * FROM invoices 
ORDER BY created_at DESC 
LIMIT 1;

-- Check invoice number was generated
SELECT invoice_number, transaction_id, status 
FROM invoices 
WHERE transaction_id = 'YOUR_TRANSACTION_ID';
```

**Check Google Drive:**
1. Go to Google Drive
2. Navigate to `Invoices/2026/01-January/` (or current month)
3. Verify files exist:
   - `INV-2026-01-XXX.docx`
   - `INV-2026-01-XXX.pdf` (if PDF generation is implemented)

**Check Invoice Record:**
```sql
-- Verify file URLs are stored
SELECT 
  invoice_number,
  word_file_url,
  pdf_file_url,
  storage_provider,
  folder_path
FROM invoices 
WHERE transaction_id = 'YOUR_TRANSACTION_ID';
```

### Test Invoice Download

1. In the transaction table, find the transaction with invoice
2. Click **Download Invoice** button (if implemented)
3. Verify file downloads correctly
4. Open file and verify content matches transaction data

---

## Step 5: Test Invoice Regeneration

### Update Transaction

1. Edit the test transaction created in Step 4
2. Change amount or quantity
3. Save changes

### Verify Invoice Updated

**Check Database:**
```sql
-- Check last_regenerated_at was updated
SELECT 
  invoice_number,
  last_regenerated_at,
  updated_at
FROM invoices 
WHERE transaction_id = 'YOUR_TRANSACTION_ID';
```

**Check Google Drive:**
- Old files should be replaced (or versioned)
- New files should reflect updated transaction data

---

## Step 6: Test Error Handling

### Test Missing Secrets

1. Temporarily remove `GOOGLE_REFRESH_TOKEN` secret
2. Try to generate invoice
3. Verify error message is user-friendly
4. Restore secret

### Test Invalid Refresh Token

1. Set `GOOGLE_REFRESH_TOKEN` to invalid value
2. Try to generate invoice
3. Verify error handling
4. Restore valid token

### Test Network Failure

1. Disconnect internet
2. Try to generate invoice
3. Verify graceful error handling
4. Reconnect and verify retry works

---

## ✅ Testing Checklist

- [ ] Token refresh function returns access token
- [ ] File upload function uploads to Google Drive
- [ ] Invoice number is generated correctly
- [ ] Invoice record is created in database
- [ ] Word document is generated
- [ ] Files are uploaded to Google Drive
- [ ] File URLs are stored in invoice record
- [ ] Invoice download links work
- [ ] Invoice regeneration works on transaction update
- [ ] Error handling works for missing credentials
- [ ] Error handling works for invalid tokens
- [ ] Error handling works for network failures

---

## 🐛 Common Issues & Solutions

### Issue: Functions return 404

**Solution:**
- Verify function names match exactly: `google-drive-token`, `google-drive-upload`
- Check Supabase URL is correct
- Ensure functions are deployed (not just created)

### Issue: CORS errors

**Solution:**
- Edge Functions include CORS headers automatically
- Check browser console for specific error
- Verify request includes `Authorization` header

### Issue: "Function not found"

**Solution:**
- Check function is deployed: **Edge Functions** → Function → **Deploy**
- Verify function name in URL matches exactly
- Check function logs for errors

### Issue: Files not appearing in Google Drive

**Solution:**
- Check Google Drive folder structure: `Invoices/YYYY/MM-MonthName/`
- Verify OAuth scopes include file creation
- Check function logs for upload errors
- Verify folder creation logic works

---

## 📊 Performance Testing

### Test Concurrent Invoices

1. Create multiple transactions simultaneously
2. Verify all invoices generate correctly
3. Check no duplicate invoice numbers
4. Verify all files upload successfully

### Test Large Files

1. Create invoice with large transaction data
2. Verify file upload completes
3. Check file size limits aren't exceeded

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Token Refresh:
[ ] Success
[ ] Failed - Error: ___________

File Upload:
[ ] Success - File ID: ___________
[ ] Failed - Error: ___________

Invoice Generation:
[ ] Success - Invoice Number: ___________
[ ] Failed - Error: ___________

Invoice Download:
[ ] Success
[ ] Failed - Error: ___________

Invoice Regeneration:
[ ] Success
[ ] Failed - Error: ___________

Notes:
_______________________________________
_______________________________________
```

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. ✅ Integrate with SalesEntry component (see `IMPLEMENTATION_GUIDE.md`)
2. ✅ Create Word template (`public/templates/invoice-template.docx`)
3. ✅ Configure environment variables
4. ✅ Deploy to production
5. ✅ Monitor function logs for errors
6. ✅ Set up alerts for failed invoice generations

---

## 📞 Support

If tests fail:
1. Check function logs in Supabase Dashboard
2. Verify all secrets are set correctly
3. Check Google Cloud Console for API errors
4. Review error messages in test responses
5. Refer to `GOOGLE_DRIVE_SETUP.md` for detailed setup
