-- ==============================================
-- UPDATE PAYMENT REMINDER TEMPLATE
-- ==============================================
-- Updates the default payment reminder template with a professional and friendly message
-- Date: 2025-01-27
-- ==============================================

UPDATE whatsapp_templates
SET 
  template_content = 'Dear {customerName},

We hope this message finds you well. 

This is a friendly reminder regarding your outstanding balance of {outstandingAmount} from {invoiceCount} pending invoice(s).

Oldest Invoice Date: {oldestInvoiceDate}
Days Overdue: {daysOverdue} days

We value our business relationship with you and would appreciate your prompt attention to this matter. If you have already made the payment, please ignore this message.

For any queries or to discuss payment arrangements, please feel free to contact us.

Thank you for your continued partnership!

Best regards,
Aamodha Enterprises',
  placeholders = ARRAY['customerName', 'outstandingAmount', 'invoiceCount', 'oldestInvoiceDate', 'daysOverdue'],
  updated_at = NOW()
WHERE template_name = 'Payment Reminder - Default' 
  AND message_type = 'payment_reminder';

-- Verify the update
SELECT 
  template_name,
  message_type,
  template_content,
  placeholders,
  is_default,
  updated_at
FROM whatsapp_templates
WHERE message_type = 'payment_reminder'
ORDER BY is_default DESC, created_at DESC;
