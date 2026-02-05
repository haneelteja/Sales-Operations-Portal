# WhatsApp Integration - Edge Function Deployment Guide

**Date:** January 27, 2026  
**Provider:** 360Messenger WhatsApp API

---

## 🚀 Deployment Steps

### Step 1: Deploy Edge Functions

**Deploy whatsapp-send:**
```bash
supabase functions deploy whatsapp-send
```

**Deploy whatsapp-retry:**
```bash
supabase functions deploy whatsapp-retry
```

**Deploy whatsapp-pdf-proxy (serves PDFs with correct filename for WhatsApp):**
```bash
supabase functions deploy whatsapp-pdf-proxy
```
**Note:** `supabase/config.toml` has `verify_jwt = false` for this function so 360Messenger can GET the PDF URL without an Authorization header. The proxy still validates the `access_key` query param.

**Or deploy all at once:**
```bash
supabase functions deploy whatsapp-send whatsapp-retry whatsapp-pdf-proxy
```

---

### Step 2: Configure Edge Function Secrets

**Required Secrets:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for database access)
- `SUPABASE_ANON_KEY` - Anonymous key (for function-to-function calls)

**Set secrets via Supabase CLI:**
```bash
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_ANON_KEY=your_anon_key

# Optional: for correct PDF filename in WhatsApp (recommended)
supabase secrets set WHATSAPP_PDF_PROXY_ACCESS_KEY=your_long_random_secret_32_chars_or_more
```

**Or via Supabase Dashboard:**
1. Go to **Edge Functions** → **Secrets**
2. Add each secret:
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL
   - Click **Save**
3. Repeat for `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`

---

### Step 3: Configure 360Messenger API Key

**Option A: Via Application Configuration UI (Recommended)**
1. Go to **Application Configuration** → **WhatsApp Settings**
2. Find **"WhatsApp API Key"** field
3. Enter your API key: `1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq`
4. Click **Save**

**Option B: Via Database (Direct)**
```sql
UPDATE invoice_configurations
SET config_value = '1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq'
WHERE config_key = 'whatsapp_api_key';
```

**Option C: Via Supabase Dashboard SQL Editor**
```sql
-- Update API key
UPDATE invoice_configurations
SET config_value = '1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq'
WHERE config_key = 'whatsapp_api_key';

-- Verify
SELECT config_key, config_value 
FROM invoice_configurations 
WHERE config_key = 'whatsapp_api_key';
```

---

### Step 4: Configure Other WhatsApp Settings

**Via Application Configuration UI:**
1. Go to **Application Configuration** → **WhatsApp Settings**
2. Configure:
   - ✅ Enable WhatsApp Integration
   - ✅ Enable message types (Stock Delivered, Invoice, Payment Reminder, Festival)
   - API URL: `https://api.360messenger.com` (or your custom URL)
   - Max Retries: `3`
   - Retry Interval: `30` minutes
   - Failure Notification Email: `pega2023test@gmail.com`
   - Payment Reminder Days: `3,7`

**Or via SQL:**
```sql
-- Enable WhatsApp
UPDATE invoice_configurations SET config_value = 'true' WHERE config_key = 'whatsapp_enabled';

-- Enable message types
UPDATE invoice_configurations SET config_value = 'true' WHERE config_key = 'whatsapp_stock_delivered_enabled';
UPDATE invoice_configurations SET config_value = 'true' WHERE config_key = 'whatsapp_invoice_enabled';
UPDATE invoice_configurations SET config_value = 'true' WHERE config_key = 'whatsapp_payment_reminder_enabled';
UPDATE invoice_configurations SET config_value = 'true' WHERE config_key = 'whatsapp_festival_enabled';

-- Set API URL
UPDATE invoice_configurations SET config_value = 'https://api.360messenger.com' WHERE config_key = 'whatsapp_api_url';
```

---

### Step 5: Verify Deployment

**Test Edge Function:**
```bash
# Test whatsapp-send function
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-send \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-customer-id",
    "messageType": "invoice",
    "triggerType": "manual",
    "customMessage": "Test message"
  }'
```

**Or use Supabase Dashboard:**
1. Go to **Edge Functions** → **whatsapp-send**
2. Click **"Invoke"** or **"Test"**
3. Use test payload:
```json
{
  "customerId": "your-customer-id",
  "messageType": "invoice",
  "triggerType": "manual",
  "customMessage": "Test WhatsApp message"
}
```

---

## 🔐 Security Notes

### API Key Storage

**Current Implementation:**
- API key is stored in `invoice_configurations` table
- Accessible via RLS policies (Manager role only)
- Edge Function reads from database

**Security Best Practices:**
- ✅ API key is never exposed to frontend
- ✅ Only Managers can view/edit via UI
- ✅ Edge Function uses service role key for database access
- ⚠️ Consider storing in Edge Function secrets for additional security

**To Store in Edge Function Secrets (Optional):**
```bash
supabase secrets set WHATSAPP_API_KEY=1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq
```

Then update Edge Function to read from `Deno.env.get('WHATSAPP_API_KEY')` as fallback.

---

## 📋 Configuration Checklist

- [ ] Edge Functions deployed (`whatsapp-send`, `whatsapp-retry`, `whatsapp-pdf-proxy`)
- [ ] Required secrets configured (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)
- [ ] 360Messenger API key configured
- [ ] WhatsApp enabled in settings
- [ ] Message types enabled (as needed)
- [ ] API URL configured
- [ ] Retry settings configured
- [ ] Failure notification email set
- [ ] Payment reminder days configured
- [ ] Test message sent successfully

---

## 🧪 Testing

### Test 1: Send Manual Message

1. Go to Application Configuration
2. Navigate to WhatsApp Settings
3. Use manual message sender (when implemented)
4. Select a customer with WhatsApp number
5. Send test message
6. Check WhatsApp logs for success

### Test 2: Verify API Integration

**Check Edge Function Logs:**
1. Go to Supabase Dashboard → Edge Functions → whatsapp-send
2. Click **"Logs"**
3. Look for successful API calls
4. Verify no authentication errors

### Test 3: Test Retry Mechanism

1. Temporarily use invalid API key
2. Send a message (should fail)
3. Check retry function is called
4. Restore valid API key
5. Verify retry succeeds

---

## 🐛 Troubleshooting

### Issue: "API key not configured"
**Solution:**
- Verify API key is set in `invoice_configurations` table
- Check `config_key = 'whatsapp_api_key'`
- Ensure value is not empty

### Issue: "Customer not found"
**Solution:**
- Verify customer ID exists in `customers` table
- Check customer has `whatsapp_number` field populated
- Verify WhatsApp number format: `+919876543210`

### Issue: "Template not found"
**Solution:**
- Check `whatsapp_templates` table has default templates
- Verify template `is_active = true`
- Ensure template `message_type` matches request

### Issue: Edge Function deployment failed
**Solution:**
- Check all required secrets are set
- Verify function code syntax
- Check Supabase Dashboard for error messages
- Review Edge Function logs

---

## 📚 Next Steps

After deployment:
1. ✅ Test manual message sending
2. ✅ Integrate with invoice generation
3. ✅ Set up payment reminder cron job
4. ✅ Create frontend UI components
5. ✅ Test all message types

---

**Status:** Ready for Deployment  
**API Key Provided:** ✅  
**Next Action:** Deploy Edge Functions and Configure API Key
