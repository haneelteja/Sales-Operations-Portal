-- ==============================================
-- GET CUSTOMER FOR WHATSAPP TEST
-- ==============================================
-- Run this to get a customer ID with WhatsApp number for testing
-- ==============================================

SELECT 
    id,
    client_name,
    branch,
    whatsapp_number,
    is_active
FROM customers
WHERE whatsapp_number IS NOT NULL
  AND is_active = true
ORDER BY client_name, branch
LIMIT 5;
