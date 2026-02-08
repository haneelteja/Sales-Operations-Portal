# WhatsApp Edge Functions - Deploy via Supabase Dashboard

**Date:** January 27, 2026  
**Method:** Supabase Dashboard (No CLI Required)

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy whatsapp-send Function

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions:**
   - Click **"Edge Functions"** in the left sidebar
   - Click **"Create a new function"** or find existing `whatsapp-send`

3. **Create/Edit Function:**
   - **Function Name:** `whatsapp-send`
   - **Copy entire code** from: `supabase/functions/whatsapp-send/index.ts`
   - **Paste** into the function editor
   - Click **"Deploy"** or **"Save"**

4. **Verify Deployment:**
   - Function should show as "Active"
   - Check for any syntax errors

---

### Step 2: Deploy whatsapp-retry Function

1. **Create New Function:**
   - Click **"Create a new function"**
   - **Function Name:** `whatsapp-retry`

2. **Add Function Code:**
   - **Copy entire code** from: `supabase/functions/whatsapp-retry/index.ts`
   - **Paste** into the function editor
   - Click **"Deploy"** or **"Save"**

3. **Verify Deployment:**
   - Function should show as "Active"

---

### Step 3: Configure Edge Function Secrets

**Required Secrets:**
These should already be set for other Edge Functions, but verify:

1. **Go to Edge Functions → Secrets**
2. **Verify these secrets exist:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key
   - `SUPABASE_ANON_KEY` - Anonymous key

3. **If missing, add them:**
   - Click **"Add new secret"**
   - Enter name and value
   - Click **"Save"**

**Where to find these values:**
- **SUPABASE_URL:** Project Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY:** Project Settings → API → service_role key (secret)
- **SUPABASE_ANON_KEY:** Project Settings → API → anon/public key

---

### Step 4: Verify Configuration

**Check API Key is Set:**
```sql
SELECT config_key, config_value 
FROM invoice_configurations 
WHERE config_key = 'whatsapp_api_key';
```

**Should return:**
```
whatsapp_api_key | 1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq
```

**Enable WhatsApp (if not already enabled):**
```sql
UPDATE invoice_configurations
SET config_value = 'true'
WHERE config_key = 'whatsapp_enabled';
```

---

### Step 5: Test Edge Function

**Via Supabase Dashboard:**

1. **Go to Edge Functions → whatsapp-send**
2. **Click "Invoke" or "Test"**
3. **Use this test payload:**
```json
{
  "customerId": "your-customer-id-here",
  "messageType": "invoice",
  "triggerType": "manual",
  "customMessage": "Test WhatsApp message from Aamodha Operations Portal"
}
```

**Note:** Replace `your-customer-id-here` with an actual customer ID from your database.

**Check Logs:**
- Go to Edge Functions → whatsapp-send → Logs
- Look for successful execution or errors

---

## ✅ Deployment Checklist

- [ ] `whatsapp-send` function deployed
- [ ] `whatsapp-retry` function deployed
- [ ] Edge Function secrets configured
- [ ] API key verified in database
- [ ] WhatsApp enabled in configuration
- [ ] Test message sent successfully
- [ ] Logs show no errors

---

## 🧪 Testing After Deployment

### Test 1: Send Test Message

**Get a Customer ID:**
```sql
SELECT id, client_name, whatsapp_number 
FROM customers 
WHERE whatsapp_number IS NOT NULL 
LIMIT 1;
```

**Test via Dashboard:**
1. Edge Functions → whatsapp-send → Invoke
2. Use payload with real customer ID
3. Check response for success

### Test 2: Check Message Logs

```sql
SELECT * 
FROM whatsapp_message_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

Should show the test message with status "sent" or "failed"

---

## 🐛 Troubleshooting

### Function Not Found
- Ensure function name is exactly `whatsapp-send` and `whatsapp-retry`
- Check function is deployed and active

### Secret Not Found Error
- Verify all three secrets are set
- Check secret names are exact (case-sensitive)

### API Key Error
- Verify API key in database: `SELECT * FROM invoice_configurations WHERE config_key = 'whatsapp_api_key'`
- Check API key is correct (no extra spaces)

### Customer Not Found
- Verify customer ID exists
- Check customer has `whatsapp_number` field populated

---

## 📚 Next Steps After Deployment

1. **Build Frontend Components:**
   - WhatsApp Configuration Section
   - WhatsApp Logs Dialog
   - Template Editor

2. **Integrate with Workflows:**
   - Invoice generation → Send WhatsApp
   - Order delivery → Send notification

3. **Set Up Scheduled Jobs:**
   - Payment reminder cron job

---

**Status:** Ready for Deployment  
**API Key:** ✅ Configured  
**Next Action:** Deploy Edge Functions via Dashboard
