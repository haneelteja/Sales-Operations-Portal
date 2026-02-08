# WhatsApp Integration - Quick Start Guide

**Date:** January 27, 2026  
**Provider:** 360Messenger WhatsApp API

---

## 📋 What's Been Created

### 1. Documentation
- ✅ **Complete Specification** (`WHATSAPP_INTEGRATION_SPECIFICATION.md`)
  - Full functional and technical specification
  - API integration details
  - Database schema
  - Component requirements

### 2. Database
- ✅ **Migration File** (`supabase/migrations/20250127000004_create_whatsapp_integration.sql`)
  - `whatsapp_message_logs` table
  - `whatsapp_templates` table
  - RLS policies
  - Default templates
  - Configuration entries

### 3. Backend
- ✅ **Edge Function: whatsapp-send** (`supabase/functions/whatsapp-send/index.ts`)
  - Sends messages via 360Messenger API
  - Template processing
  - Error handling
  - Logging

### 4. Frontend
- ✅ **Service Layer** (`src/services/whatsappService.ts`)
  - API wrapper functions
  - Template management
  - Log fetching
  - Configuration management

---

## 🚀 Next Steps

### Step 1: Run Database Migration

```bash
# In Supabase Dashboard → SQL Editor
# Run the migration file:
supabase/migrations/20250127000004_create_whatsapp_integration.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### Step 2: Deploy Edge Function

```bash
# Deploy whatsapp-send function
supabase functions deploy whatsapp-send
```

**Required Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### Step 3: Configure 360Messenger API

1. Get your API key from 360Messenger dashboard
2. Go to **Application Configuration** → **WhatsApp Settings**
3. Enter:
   - API Key
   - API URL (default: `https://api.360messenger.com`)
   - Other settings

### Step 4: Create Frontend Components

**Components to Create:**

1. **WhatsAppConfigurationSection.tsx**
   - Location: `src/components/user-management/WhatsAppConfigurationSection.tsx`
   - Purpose: WhatsApp settings UI in Application Configuration tab

2. **WhatsAppLogsDialog.tsx**
   - Location: `src/components/user-management/WhatsAppLogsDialog.tsx`
   - Purpose: View message logs with filters and pagination

3. **TemplateEditorDialog.tsx**
   - Location: `src/components/user-management/TemplateEditorDialog.tsx`
   - Purpose: Create/edit message templates

4. **ManualMessageSender.tsx** (Optional)
   - Location: `src/components/user-management/ManualMessageSender.tsx`
   - Purpose: Send manual WhatsApp messages

### Step 5: Integrate with Existing Workflows

**Invoice Generation:**
```typescript
// In invoice generation hook/service
import { sendWhatsAppMessage } from '@/services/whatsappService';

// After invoice PDF is generated
if (whatsappEnabled && invoiceEnabled) {
  await sendWhatsAppMessage({
    customerId: invoice.customer_id,
    messageType: 'invoice',
    triggerType: 'auto',
    attachmentUrl: invoice.pdf_file_url,
    attachmentType: 'pdf',
    placeholders: {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      amount: invoice.total_amount.toString(),
      dueDate: invoice.due_date || '',
      invoiceLink: invoice.pdf_file_url || '',
    },
  });
}
```

**Order Delivery:**
```typescript
// When order status changes to "delivered"
if (whatsappEnabled && stockDeliveredEnabled) {
  await sendWhatsAppMessage({
    customerId: order.customer_id,
    messageType: 'stock_delivered',
    triggerType: 'auto',
    placeholders: {
      orderNumber: order.order_number,
      deliveryDate: order.delivery_date,
      items: order.items.join(', '),
    },
  });
}
```

### Step 6: Set Up Payment Reminder Cron

Create Edge Function: `whatsapp-payment-reminders`

**Schedule:** Daily at 2:00 AM

**Logic:**
1. Get invoices with due dates matching reminder schedule (T+3, T+7)
2. Check if payment received
3. Send reminder if not paid
4. Log results

---

## 🧪 Testing

### Test Manual Message Sending

1. Go to Application Configuration
2. Navigate to WhatsApp Settings
3. Use manual message sender (if implemented)
4. Select customer
5. Choose template or write custom message
6. Send and verify in logs

### Test Auto Messages

1. Generate an invoice
2. Check WhatsApp logs for invoice message
3. Verify message sent successfully
4. Check Google Drive/OneDrive for PDF attachment

### Test Templates

1. Edit a template
2. Preview with sample data
3. Save template
4. Send test message using template

---

## 📝 Configuration Checklist

- [ ] Database migration run successfully
- [ ] Edge Function deployed
- [ ] API key configured
- [ ] WhatsApp enabled in settings
- [ ] Message types enabled (as needed)
- [ ] Templates created/edited
- [ ] Retry settings configured
- [ ] Failure notification email set
- [ ] Payment reminder days configured

---

## 🔧 Troubleshooting

### Messages Not Sending

1. **Check API Key:**
   - Verify API key is correct
   - Check API key has required permissions

2. **Check Configuration:**
   - Ensure WhatsApp is enabled
   - Ensure message type is enabled

3. **Check Customer Data:**
   - Verify customer has WhatsApp number
   - Verify WhatsApp number format is correct

4. **Check Edge Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for error messages

### Template Not Found

- Ensure template exists for message type
- Ensure template is active
- Check if default template is set

### API Errors

- Verify API URL is correct
- Check API rate limits
- Verify API key permissions
- Check 360Messenger API documentation

---

## 📚 Related Documentation

- `WHATSAPP_INTEGRATION_SPECIFICATION.md` - Complete specification
- `IMPLEMENTATION_STATUS.md` - Current implementation status
- 360Messenger API Documentation (external)

---

## 🎯 Priority Implementation Order

1. **High Priority:**
   - Complete Edge Function: whatsapp-retry
   - Create WhatsAppConfigurationSection component
   - Create WhatsAppLogsDialog component
   - Integrate with invoice generation

2. **Medium Priority:**
   - Create TemplateEditorDialog component
   - Set up payment reminder cron
   - Integrate with order delivery

3. **Low Priority:**
   - Manual message sender component
   - Message analytics
   - Bulk messaging

---

**Status:** Foundation Complete - Ready for Component Development  
**Next Action:** Create frontend components and integrate with workflows
