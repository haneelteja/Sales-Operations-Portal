-- Allow any authenticated user to read WhatsApp templates (was blocked by user_management join)
CREATE POLICY "Authenticated users can read WhatsApp templates"
  ON whatsapp_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Ensure all default templates exist (re-insert if missing)
INSERT INTO whatsapp_templates (template_name, message_type, template_content, placeholders, is_active, is_default) VALUES
  (
    'Stock Delivered - Default',
    'stock_delivered',
    'Hello {customerName}, Your order {orderNumber} has been delivered on {deliveryDate}. Items: {items}. Thank you!',
    ARRAY['customerName', 'orderNumber', 'deliveryDate', 'items'],
    true, true
  ),
  (
    'Invoice - Default',
    'invoice',
    'Dear {customerName}, Kindly review the attached invoice for the recent Stock Delivered. We request you to process the payment at your earliest convenience. Thank you for your continued partnership.',
    ARRAY['customerName'],
    true, true
  ),
  (
    'Payment Reminder - Default',
    'payment_reminder',
    'Dear {customerName}, This is a gentle reminder that you have an outstanding balance of ₹{amount} with us. Request you to clear the dues at the earliest. Thank you.',
    ARRAY['customerName', 'amount'],
    true, true
  ),
  (
    'Festival - Default',
    'festival',
    'Dear {customerName}, Warm wishes to you and your family on this auspicious occasion! Thank you for your continued trust and partnership. 🎉',
    ARRAY['customerName'],
    true, true
  )
ON CONFLICT (template_name) DO NOTHING;
