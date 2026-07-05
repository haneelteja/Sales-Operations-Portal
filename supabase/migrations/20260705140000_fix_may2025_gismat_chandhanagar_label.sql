-- Fix May 2025 Gismat Chandha Nagar label entry.
-- 20260704250000 inserted with client_id=a24068ac (old/wrong ID).
-- Correct ID used in sales transactions is 54bf3b3d (Gismat Chandha Nagar).

UPDATE public.label_purchases
SET client_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb'
WHERE client_id = 'a24068ac-2a15-479a-8292-7422adf32f21'
  AND purchase_date = '2025-05-31'
  AND total_amount = 720
  AND vendor_id = 'GMG';
