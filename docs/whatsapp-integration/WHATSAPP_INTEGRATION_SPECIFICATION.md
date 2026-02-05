# WhatsApp Integration Specification - 360Messenger API

**Date:** January 27, 2026  
**Provider:** 360Messenger WhatsApp API  
**Status:** Specification Complete - Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Message Types & Triggers](#message-types--triggers)
4. [Database Schema](#database-schema)
5. [API Integration](#api-integration)
6. [Application Configuration](#application-configuration)
7. [Message Templates](#message-templates)
8. [Scheduling & Retries](#scheduling--retries)
9. [Error Handling](#error-handling)
10. [Frontend Components](#frontend-components)
11. [Security & Access Control](#security--access-control)

---

## 1. Overview

### 1.1 Purpose
Integrate 360Messenger WhatsApp API to enable automated and manual WhatsApp messaging for:
- Stock delivery notifications
- Invoice sharing
- Payment reminders
- Festival/salutation messages

### 1.2 Key Features
- ✅ Template-based and free-form messages
- ✅ PDF invoice attachments
- ✅ Configurable message types (enable/disable)
- ✅ Scheduled messaging (payment reminders, festivals)
- ✅ Retry mechanism (3 attempts)
- ✅ Comprehensive message logging
- ✅ Failure notifications via email
- ✅ Manager-only access control

### 1.3 Authentication
- **Method:** API Key-based authentication
- **Storage:** Supabase Edge Function secrets
- **Security:** Never expose API key to frontend

---

## 2. Architecture

### 2.1 System Components

```
┌─────────────────┐
│  React Frontend │
│  (Manager UI)   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │
│  - Configs      │
│  - Templates    │
│  - Message Logs │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Edge Functions │
│  - whatsapp-send│
│  - whatsapp-retry│
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 360Messenger API│
└─────────────────┘
```

### 2.2 Data Flow

1. **Auto-Triggered Messages:**
   - Event occurs (invoice generated, stock delivered)
   - Edge Function triggered
   - Fetch customer WhatsApp number
   - Fetch template
   - Send via 360Messenger API
   - Log result

2. **Scheduled Messages:**
   - Cron job checks for due reminders
   - Fetch customers with pending payments
   - Send payment reminders
   - Log results

3. **Manual Messages:**
   - Manager selects customer
   - Chooses template or writes message
   - Sends via UI
   - Edge Function handles API call
   - Log result

---

## 3. Message Types & Triggers

### 3.1 Stock Delivered Notification

**Trigger:** Automatically on stock delivery confirmation  
**Type:** Template or free-form  
**Attachment:** Optional  
**When:** After order status changes to "delivered"

**Template Placeholders:**
- `{customerName}` - Customer name
- `{orderNumber}` - Order number
- `{deliveryDate}` - Delivery date
- `{items}` - List of items delivered

### 3.2 Invoice Message

**Trigger:** Immediately after invoice generation  
**Type:** Template-based  
**Attachment:** PDF invoice (mandatory)  
**When:** After invoice PDF is generated

**Template Placeholders:**
- `{customerName}` - Customer name
- `{invoiceNumber}` - Invoice number
- `{invoiceDate}` - Invoice date
- `{amount}` - Invoice amount
- `{dueDate}` - Payment due date
- `{invoiceLink}` - Link to view invoice

**Attachment:** PDF file from Google Drive/OneDrive

### 3.3 Payment Reminder Message

**Trigger:** Scheduled  
**Schedule:** T+3 days, T+7 days after invoice date  
**Type:** Template-based  
**Configurable:** Days after invoice (default: 3, 7)

**Template Placeholders:**
- `{customerName}` - Customer name
- `{invoiceNumber}` - Invoice number
- `{amount}` - Outstanding amount
- `{dueDate}` - Payment due date
- `{daysOverdue}` - Days past due date

### 3.4 Festival / Salutation Messages

**Trigger:** Scheduled  
**Type:** Free-form or template-based  
**Editable:** Message content per festival/event  
**Schedule:** Configurable dates per festival

**Template Placeholders:**
- `{customerName}` - Customer name
- `{festivalName}` - Festival/event name

---

## 4. Database Schema

### 4.1 WhatsApp Message Logs Table

```sql
CREATE TABLE whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'stock_delivered', 'invoice', 'payment_reminder', 'festival'
  trigger_type VARCHAR(20) NOT NULL, -- 'auto', 'scheduled', 'manual'
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  message_content TEXT,
  template_id UUID REFERENCES whatsapp_templates(id),
  attachment_url TEXT,
  attachment_type VARCHAR(50), -- 'pdf', 'image', etc.
  failure_reason TEXT,
  api_response JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_whatsapp_logs_customer ON whatsapp_message_logs(customer_id);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_message_logs(status);
CREATE INDEX idx_whatsapp_logs_type ON whatsapp_message_logs(message_type);
CREATE INDEX idx_whatsapp_logs_scheduled ON whatsapp_message_logs(scheduled_for) WHERE scheduled_for IS NOT NULL;
```

### 4.2 WhatsApp Templates Table

```sql
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  message_type VARCHAR(50) NOT NULL,
  template_content TEXT NOT NULL,
  placeholders TEXT[], -- Array of placeholder names
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_whatsapp_templates_type ON whatsapp_templates(message_type);
CREATE INDEX idx_whatsapp_templates_active ON whatsapp_templates(is_active);
```

### 4.3 Configuration Entries

Add to `invoice_configurations` table:

```sql
-- WhatsApp Integration Settings
INSERT INTO invoice_configurations (config_key, config_value, config_type, description) VALUES
  ('whatsapp_enabled', 'true', 'boolean', 'Enable WhatsApp messaging'),
  ('whatsapp_stock_delivered_enabled', 'true', 'boolean', 'Enable stock delivered notifications'),
  ('whatsapp_invoice_enabled', 'true', 'boolean', 'Enable invoice messages'),
  ('whatsapp_payment_reminder_enabled', 'true', 'boolean', 'Enable payment reminders'),
  ('whatsapp_festival_enabled', 'true', 'boolean', 'Enable festival messages'),
  ('whatsapp_api_key', '', 'string', '360Messenger API Key'),
  ('whatsapp_api_url', 'https://api.360messenger.com', 'string', '360Messenger API Base URL'),
  ('whatsapp_retry_max', '3', 'number', 'Maximum retry attempts'),
  ('whatsapp_retry_interval_minutes', '30', 'number', 'Retry interval in minutes'),
  ('whatsapp_failure_notification_email', 'pega2023test@gmail.com', 'string', 'Email for failure notifications'),
  ('whatsapp_payment_reminder_days', '3,7', 'string', 'Days after invoice for payment reminders (comma-separated)')
ON CONFLICT (config_key) DO NOTHING;
```

---

## 5. API Integration

### 5.1 360Messenger API Endpoints

**Base URL:** Configurable (default: `https://api.360messenger.com`)

**Send Text Message:**
```
POST /api/v1/messages/text
Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: application/json
Body:
{
  "to": "+919876543210",
  "message": "Hello {customerName}, your invoice {invoiceNumber} is ready.",
  "template_id": "optional_template_id"
}
```

**Send Media Message:**
```
POST /api/v1/messages/media
Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: multipart/form-data
Body:
  to: +919876543210
  message: "Your invoice is attached"
  media: (file)
  media_type: pdf
```

### 5.1.1 360Messenger API v1.0 vs v2.0 (for invoice PDF)

| Use case | Recommended API | Notes |
|----------|-----------------|--------|
| **Send text message** | v1.0 **Send Message** (`POST /sendMessage/{apiKey}`) | Currently used; works with form params `phonenumber`, `text`, `360notify-medium`. |
| **Send invoice PDF** | v1.0 **Send Message** with `file_url` first; then v2.0 **Send Message** / **URL Download Media** if documented | Our edge function tries v1 `/sendMessage` with `file_url`, `document_url`, etc.; then v2-style paths (`/v2/sendMessage`, `/v2/messages`, `/v2/media/url`) with JSON body. If the PDF still does not appear in WhatsApp, check 360Messenger’s Postman/API docs for the exact v2.0 **Send Message** or **URL Download Media** path and body (e.g. document link). |
| **Get status / pending** | v1.0 `getStatus`, `pending` or v2.0 **Get Sent Message Status**, **Get All Pending Messages** | Use for delivery status or retries. |

**Suitable for our app:** Keep using **WhatsApp API v1.0 → Send Message** for text (and for document when `file_url` is supported). If 360Messenger provides a dedicated v2.0 **Send Message** or **URL Download Media** endpoint that accepts a document URL, add that exact path/body to the edge function.

### 5.2 Edge Function: `whatsapp-send`

**Purpose:** Send WhatsApp messages via 360Messenger API

**Input:**
```typescript
{
  customerId: string;
  messageType: 'stock_delivered' | 'invoice' | 'payment_reminder' | 'festival';
  triggerType: 'auto' | 'scheduled' | 'manual';
  templateId?: string;
  customMessage?: string;
  attachmentUrl?: string;
  scheduledFor?: string; // ISO timestamp
}
```

**Process:**
1. Validate customer exists and has WhatsApp number
2. Check if message type is enabled
3. Fetch template if templateId provided
4. Replace placeholders with actual values
5. Call 360Messenger API
6. Log result to database
7. Handle retries on failure

**Output:**
```typescript
{
  success: boolean;
  messageLogId: string;
  apiResponse?: any;
  error?: string;
}
```

### 5.3 Edge Function: `whatsapp-retry`

**Purpose:** Retry failed messages

**Process:**
1. Find messages with status='failed' and retry_count < max_retries
2. Wait for retry_interval
3. Call whatsapp-send again
4. Update retry_count
5. Send failure notification if max retries exceeded

---

## 6. Application Configuration

### 6.1 WhatsApp Settings Section

Add new section in Application Configuration tab:

**Enable/Disable Toggles:**
- ✅ WhatsApp Integration (Master toggle)
- ✅ Stock Delivered Notifications
- ✅ Invoice Messages
- ✅ Payment Reminders
- ✅ Festival Messages

**Configuration Fields:**
- API Key (masked input, show/hide toggle)
- API Base URL
- Max Retries
- Retry Interval (minutes)
- Failure Notification Email
- Payment Reminder Days (comma-separated)

**Template Management:**
- List of templates per message type
- Edit template button
- Create new template button
- Preview template with sample data

### 6.2 Message Logs Viewer

**Dialog Component:** `WhatsAppLogsDialog`

**Features:**
- Paginated table (20 per page)
- Filters:
  - Status (Pending/Sent/Failed)
  - Message Type
  - Trigger Type
  - Date Range
- Sort by:
  - Date & Time
  - Status
  - Customer Name
- Columns:
  - Date & Time
  - Customer Name
  - WhatsApp Number
  - Message Type
  - Trigger Type
  - Status
  - Retry Count
  - Failure Reason
  - Actions (View Details, Retry)

---

## 7. Message Templates

### 7.1 Template Structure

**Stock Delivered Template:**
```
Hello {customerName},

Your order {orderNumber} has been delivered on {deliveryDate}.

Items delivered:
{items}

Thank you for your business!
```

**Invoice Template:**
```
Dear {customerName},

Your invoice {invoiceNumber} dated {invoiceDate} for ₹{amount} is ready.

Due Date: {dueDate}

View invoice: {invoiceLink}

Thank you!
```

**Payment Reminder Template:**
```
Hello {customerName},

This is a friendly reminder that your invoice {invoiceNumber} for ₹{amount} is {daysOverdue} days overdue.

Due Date: {dueDate}

Please make the payment at your earliest convenience.

Thank you!
```

### 7.2 Placeholder Validation

**Rules:**
- Placeholders must be in format `{placeholderName}`
- Placeholder names must match available data fields
- Template must be validated before saving
- Preview with sample data before saving

**Available Placeholders by Type:**
- **Stock Delivered:** customerName, orderNumber, deliveryDate, items
- **Invoice:** customerName, invoiceNumber, invoiceDate, amount, dueDate, invoiceLink
- **Payment Reminder:** customerName, invoiceNumber, amount, dueDate, daysOverdue
- **Festival:** customerName, festivalName

---

## 8. Scheduling & Retries

### 8.1 Payment Reminder Scheduling

**Implementation:**
- Cron job runs daily at 2:00 AM
- Checks invoices with due dates matching reminder schedule
- Creates scheduled message entries
- Edge Function processes scheduled messages

**Schedule Calculation:**
- T+3: Invoice date + 3 days
- T+7: Invoice date + 7 days
- Only send if payment not received

### 8.2 Retry Mechanism

**Retry Logic:**
1. Message fails → Status = 'failed'
2. Wait for retry_interval (default: 30 minutes)
3. Retry up to max_retries (default: 3)
4. After max retries → Send failure notification email
5. Status remains 'failed'

**Retry Conditions:**
- API timeout
- API error (5xx)
- Rate limit exceeded
- Network error

**No Retry:**
- Invalid WhatsApp number
- Customer not found
- Template not found
- Invalid API key

---

## 9. Error Handling

### 9.1 Validation Rules

**WhatsApp Number:**
- Format: +[country code][number]
- Example: +919876543210
- Must be 10-15 digits after country code
- Validate before sending

**Template Placeholders:**
- All placeholders must be replaced
- Missing placeholder → Error
- Invalid placeholder → Warning, skip

**Attachment:**
- Max size: 10 MB
- Allowed types: PDF, JPG, PNG
- Must be accessible URL

### 9.2 Failure Scenarios

**API Failures:**
- Network timeout → Retry
- 5xx error → Retry
- 4xx error → Log and notify (no retry)
- Rate limit → Retry after delay

**Data Failures:**
- Customer not found → Log error, notify
- Invalid WhatsApp number → Log error, notify
- Template missing → Use default template or error

### 9.3 Failure Notifications

**Email Content:**
```
Subject: WhatsApp Message Failed - {Message Type}

Customer: {Customer Name}
WhatsApp: {WhatsApp Number}
Message Type: {Type}
Trigger: {Auto/Scheduled/Manual}
Failure Reason: {Reason}
Timestamp: {Date & Time}
Retry Count: {Count}
```

---

## 10. Frontend Components

### 10.1 WhatsAppConfigurationSection

**Location:** Application Configuration Tab

**Components:**
- `WhatsAppEnableToggle` - Master enable/disable
- `MessageTypeToggles` - Per-message-type toggles
- `WhatsAppApiConfig` - API key, URL configuration
- `RetryConfig` - Retry settings
- `TemplateManager` - Template list and editor
- `WhatsAppLogsButton` - Opens logs dialog

### 10.2 TemplateEditorDialog

**Features:**
- Template name input
- Message type selector
- Template content editor (textarea)
- Placeholder helper (shows available placeholders)
- Preview button (shows rendered template)
- Save/Cancel buttons
- Validation feedback

### 10.3 WhatsAppLogsDialog

**Features:**
- Filter panel (status, type, trigger, date range)
- Sortable table columns
- Pagination controls
- Row actions (view details, retry)
- Export to CSV (optional)

### 10.4 ManualMessageSender

**Features:**
- Customer selector (searchable dropdown)
- Message type selector
- Template selector or custom message
- Attachment upload (for manual messages)
- Preview before sending
- Send button

---

## 11. Security & Access Control

### 11.1 Role-Based Access

**Manager Role Only:**
- View WhatsApp configuration
- Edit WhatsApp settings
- View message logs
- Send manual messages
- Edit templates

**RLS Policies:**
```sql
-- WhatsApp logs: Managers can view
CREATE POLICY "Managers can view WhatsApp logs"
  ON whatsapp_message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );

-- Templates: Managers can manage
CREATE POLICY "Managers can manage templates"
  ON whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );
```

### 11.2 API Key Security

- Store API key in Supabase Edge Function secrets only
- Never expose to frontend
- Mask in UI (show last 4 characters only)
- Rotate key capability

---

## 12. Implementation Checklist

### Phase 1: Database & Configuration
- [ ] Create `whatsapp_message_logs` table
- [ ] Create `whatsapp_templates` table
- [ ] Add configuration entries
- [ ] Set up RLS policies

### Phase 2: Edge Functions
- [ ] Create `whatsapp-send` function
- [ ] Create `whatsapp-retry` function
- [ ] Implement API integration
- [ ] Add retry logic

### Phase 3: Frontend Components
- [ ] WhatsApp configuration section
- [ ] Template editor dialog
- [ ] Message logs dialog
- [ ] Manual message sender

### Phase 4: Integration
- [ ] Integrate with invoice generation
- [ ] Integrate with order delivery
- [ ] Set up payment reminder cron
- [ ] Test all message types

### Phase 5: Testing & Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] User documentation
- [ ] API documentation

---

## 13. API Reference

### 13.1 360Messenger API (Assumed)

**Note:** Actual API endpoints may vary. Adjust based on 360Messenger documentation.

**Send Text:**
- Endpoint: `POST /api/v1/messages/text`
- Auth: Bearer token
- Rate Limit: Check API docs

**Send Media:**
- Endpoint: `POST /api/v1/messages/media`
- Auth: Bearer token
- Max File Size: 10 MB

---

## 14. Future Enhancements

- Message delivery status webhooks
- Two-way messaging support
- Message analytics dashboard
- Bulk messaging capabilities
- Message scheduling UI
- Template versioning

---

**Status:** Specification Complete  
**Next Step:** Begin implementation  
**Estimated Timeline:** 2-3 weeks
