-- ==============================================
-- UPDATE ALL CUSTOMERS WITH WHATSAPP NUMBER
-- ==============================================
-- Updates all customers with WhatsApp number +919666526666
-- Date: 2025-01-27
-- ==============================================

-- Update all customers with the WhatsApp number
UPDATE customers
SET 
    whatsapp_number = '+919666526666',
    updated_at = NOW()
WHERE whatsapp_number IS NULL OR whatsapp_number != '+919666526666';

-- Verify the update
SELECT 
    id,
    client_name,
    branch,
    whatsapp_number,
    updated_at,
    CASE 
        WHEN whatsapp_number = '+919666526666' THEN '✓ Updated Successfully'
        ELSE '✗ Update Failed'
    END as status
FROM customers
ORDER BY client_name, branch
LIMIT 50;

-- Count customers with WhatsApp number
SELECT 
    COUNT(*) as total_customers,
    COUNT(whatsapp_number) as customers_with_whatsapp,
    COUNT(*) FILTER (WHERE whatsapp_number = '+919666526666') as customers_with_target_number
FROM customers;
