# WhatsApp Integration - Next Steps Checklist

**Date:** January 27, 2026  
**Status:** API Key Configured ✅  
**Next:** Deploy Edge Functions

---

## ✅ Completed

- [x] Database migration run successfully
- [x] API key configured: `1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq`
- [x] Database schema created
- [x] Edge Functions code ready

---

## 🚀 Immediate Next Steps

### 1. Deploy Edge Functions (15-20 minutes)

**Via Supabase Dashboard:**

**A. Deploy whatsapp-send:**
1. Go to: https://supabase.com/dashboard → Your Project → Edge Functions
2. Click **"Create a new function"**
3. Name: `whatsapp-send`
4. Copy code from: `supabase/functions/whatsapp-send/index.ts`
5. Paste and click **"Deploy"**

**B. Deploy whatsapp-retry:**
1. Click **"Create a new function"**
2. Name: `whatsapp-retry`
3. Copy code from: `supabase/functions/whatsapp-retry/index.ts`
4. Paste and click **"Deploy"**

**C. Verify Secrets:**
- Go to Edge Functions → Secrets
- Ensure these exist:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`

---

### 2. Enable WhatsApp Integration (2 minutes)

**Run in Supabase SQL Editor:**
```sql
-- Enable WhatsApp
UPDATE invoice_configurations
SET config_value = 'true'
WHERE config_key = 'whatsapp_enabled';

-- Enable message types (optional)
UPDATE invoice_configurations
SET config_value = 'true'
WHERE config_key IN (
  'whatsapp_invoice_enabled',
  'whatsapp_stock_delivered_enabled',
  'whatsapp_payment_reminder_enabled',
  'whatsapp_festival_enabled'
);

-- Verify
SELECT config_key, config_value 
FROM invoice_configurations 
WHERE config_key LIKE 'whatsapp_%'
ORDER BY config_key;
```

---

### 3. Test Edge Function (5 minutes)

**Get a Test Customer:**
```sql
SELECT id, client_name, whatsapp_number 
FROM customers 
WHERE whatsapp_number IS NOT NULL 
LIMIT 1;
```

**Test via Supabase Dashboard:**
1. Go to Edge Functions → whatsapp-send → **"Invoke"**
2. Use this payload (replace `CUSTOMER_ID` with actual ID):
```json
{
  "customerId": "CUSTOMER_ID",
  "messageType": "invoice",
  "triggerType": "manual",
  "customMessage": "Hello! This is a test message from Aamodha Operations Portal."
}
```

**Check Results:**
```sql
SELECT * 
FROM whatsapp_message_logs 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 4. Verify 360Messenger API Endpoints (Important!)

**⚠️ Action Required:**

The Edge Function uses these endpoints:
- Text: `POST /api/v1/messages/text`
- Media: `POST /api/v1/messages/media`

**Verify these match 360Messenger API documentation:**
- Check 360Messenger API docs for correct endpoints
- Update Edge Function if endpoints differ
- Verify authentication method (Bearer token is used)

**Current API URL:** `https://api.360messenger.com`

If your API URL is different, update:
```sql
UPDATE invoice_configurations
SET config_value = 'YOUR_API_URL'
WHERE config_key = 'whatsapp_api_url';
```

---

## 📋 Post-Deployment Checklist

- [ ] Edge Functions deployed successfully
- [ ] Secrets configured
- [ ] WhatsApp enabled
- [ ] Test message sent
- [ ] Message appears in logs
- [ ] API endpoints verified
- [ ] No errors in Edge Function logs

---

## 🔄 After Testing

### Build Frontend Components (Next Phase)

1. **WhatsAppConfigurationSection**
   - Add to Application Configuration tab
   - Enable/disable toggles
   - API configuration fields

2. **WhatsAppLogsDialog**
   - View message logs
   - Filter and pagination

3. **TemplateEditorDialog**
   - Edit message templates
   - Preview functionality

### Integrate with Workflows

1. **Invoice Generation:**
   - Add WhatsApp send after PDF generation
   - Attach PDF to message

2. **Order Delivery:**
   - Send notification on delivery confirmation

3. **Payment Reminders:**
   - Set up cron job for scheduled reminders

---

## 📞 Quick Reference

**Edge Function URLs (after deployment):**
- Send: `https://YOUR_PROJECT.supabase.co/functions/v1/whatsapp-send`
- Retry: `https://YOUR_PROJECT.supabase.co/functions/v1/whatsapp-retry`

**Database Tables:**
- `whatsapp_message_logs` - Message history
- `whatsapp_templates` - Message templates
- `invoice_configurations` - Settings (whatsapp_* keys)

**Configuration Keys:**
- `whatsapp_enabled` - Master toggle
- `whatsapp_api_key` - API key ✅
- `whatsapp_api_url` - API base URL
- `whatsapp_*_enabled` - Per message type toggles

---

**Status:** Ready for Edge Function Deployment  
**Priority:** High - Deploy and test before building UI components
