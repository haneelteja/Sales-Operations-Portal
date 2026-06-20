-- Fix three rows that are stored as vendor_id='GMG' but should be 'GMG labels'
-- per the authoritative spreadsheet:
--   2025-11-06  Maryadha Ramanna  P 500 ml    qty -1000
--   2025-12-31  Benguluru Bhavan  P 500 ml    qty -2080
--   2025-12-31  Element E7        P 1000 ml   qty -1404

UPDATE label_purchases
SET vendor_id    = 'GMG labels',
    description  = NULL
WHERE purchase_date = '2025-11-06'
  AND quantity      = -1000
  AND sku           = 'P 500 ml'
  AND vendor_id     = 'GMG';

UPDATE label_purchases
SET vendor_id    = 'GMG labels',
    description  = NULL
WHERE purchase_date = '2025-12-31'
  AND quantity      = -2080
  AND sku           = 'P 500 ml'
  AND vendor_id     = 'GMG';

UPDATE label_purchases
SET vendor_id    = 'GMG labels',
    description  = NULL
WHERE purchase_date = '2025-12-31'
  AND quantity      = -1404
  AND sku           = 'P 1000 ml'
  AND vendor_id     = 'GMG';
