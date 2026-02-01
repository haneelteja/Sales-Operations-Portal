# Edge Function Request URI

## 📍 Finding Your Edge Function URL

### Format:
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/[FUNCTION_NAME]
```

---

## 🔍 How to Find Your Project Reference

### Method 1: From Supabase Dashboard
1. Go to your Supabase project dashboard
2. Look at the URL in your browser
3. It will be: `https://supabase.com/dashboard/project/[PROJECT_REF]`
4. The `[PROJECT_REF]` is your project reference

### Method 2: From Project Settings
1. Go to **Project Settings** → **General**
2. Look for **Reference ID** or **Project URL**
3. It will show: `https://[PROJECT_REF].supabase.co`

### Method 3: From Environment Variables
- Check your `.env` file or Vercel environment variables
- Look for `VITE_SUPABASE_URL`
- Extract the project reference from the URL

---

## 📋 Your Edge Function URLs

### Token Refresh Function:
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/google-drive-token
```

### File Upload Function:
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/google-drive-upload
```

---

## 🧪 Testing with cURL

### Test Token Refresh:
```bash
curl -X POST \
  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/google-drive-token \
  -H "Authorization: Bearer [YOUR_SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test File Upload:
```bash
curl -X POST \
  https://[YOUR_PROJECT_REF].supabase.co/functions/v1/google-drive-upload \
  -H "Authorization: Bearer [YOUR_SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.docx",
    "folderId": null,
    "fileData": "SGVsbG8gV29ybGQ=",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }'
```

---

## 🌐 Testing from Browser Console

```javascript
const SUPABASE_URL = 'https://[YOUR_PROJECT_REF].supabase.co';
const ANON_KEY = '[YOUR_SUPABASE_ANON_KEY]';

// Test token refresh
fetch(`${SUPABASE_URL}/functions/v1/google-drive-token`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

---

## 📝 Notes

- Replace `[YOUR_PROJECT_REF]` with your actual project reference
- Replace `[YOUR_SUPABASE_ANON_KEY]` with your Supabase anonymous key
- The `Authorization` header is required for all Edge Function calls
- Use `Bearer` token authentication
