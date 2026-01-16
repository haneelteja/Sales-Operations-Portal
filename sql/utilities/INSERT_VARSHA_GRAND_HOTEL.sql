-- ==============================================
-- INSERT VARSHA GRAND HOTEL CUSTOMER
-- Add this client to the customers table
-- ==============================================

INSERT INTO customers (
  client_name, 
  branch, 
  sku, 
  price_per_bottle,
  is_active
)
VALUES 
  ('Varsha grand Hotel', 'Bachupally', '1000 P', NULL, true)
ON CONFLICT ON CONSTRAINT customers_client_branch_sku_unique DO UPDATE 
SET 
  sku = EXCLUDED.sku,
  price_per_bottle = EXCLUDED.price_per_bottle,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the customer was added
SELECT 
  id,
  client_name,
  branch,
  sku,
  price_per_bottle,
  price_per_case,
  is_active
FROM customers
WHERE UPPER(TRIM(client_name)) = 'VARSHA GRAND HOTEL'
  AND UPPER(TRIM(branch)) = 'BACHUPALLY';

-- Note: You may need to update price_per_bottle and price_per_case manually
-- if you have the pricing information
