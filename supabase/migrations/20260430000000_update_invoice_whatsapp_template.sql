UPDATE whatsapp_templates
SET
  template_content = 'Dear {customerName},
Kindly review the attached invoice for the recent Stock Delivered. We request you to process the payment at your earliest convenience.
Thank you for your continued partnership.',
  placeholders = ARRAY['customerName']
WHERE message_type = 'invoice'
  AND is_default = true;
