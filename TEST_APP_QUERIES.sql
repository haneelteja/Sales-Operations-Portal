-- Test the exact queries used by the application
-- Run these to verify the app will work

-- Query 1: Used in ConfigurationManagement.tsx (line 98)
SELECT 
    sku, 
    bottles_per_case
FROM factory_pricing
ORDER BY sku ASC;

-- Query 2: Used in ConfigurationManagement.tsx (line 110)
SELECT 
    sku
FROM factory_pricing
ORDER BY sku ASC;

-- Query 3: Used in ConfigurationManagement.tsx (line 275)
SELECT 
    *
FROM factory_pricing
ORDER BY pricing_date DESC;

