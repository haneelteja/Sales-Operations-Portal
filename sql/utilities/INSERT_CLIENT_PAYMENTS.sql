-- ==============================================
-- INSERT CLIENT PAYMENTS INTO SALES TRANSACTIONS
-- This script inserts payment transactions (transaction_type = 'payment')
-- Payments are money received from clients
-- ==============================================

WITH payment_data AS (
  SELECT * FROM (VALUES 
    ('4/17/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -10040),
    ('4/21/2025', 'Element E7', 'Kukatpally', '1000 P', -1260),
    ('4/27/2025', 'Element E7', 'Kukatpally', '1000 P', -18000),
    ('5/1/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -3560),
    ('5/2/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('5/5/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', -3100),
    ('5/5/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -12000),
    ('5/5/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -700),
    ('5/8/2025', 'Element E7', 'Kukatpally', '1000 P', -17100),
    ('5/21/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', -6610),
    ('5/22/2025', 'Element E7', 'Kukatpally', '1000 P', -21600),
    ('5/27/2025', 'Atias Kitchen', 'Gandipet', '1000 P', -3696),
    ('5/27/2025', 'Deccan kitchen', 'Film nagar', '250 EC', -4042.5),
    ('5/27/2025', 'Deccan kitchen', 'Film nagar', '750 P', -16356),
    ('5/27/2025', 'House Party', 'Sanikpuri', '500 P', -12060),
    ('5/27/2025', 'This is it café', 'Sanikpuri', '500 P', -6660),
    ('5/29/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -18560),
    ('6/2/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -30000),
    ('6/8/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -18560),
    ('6/10/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', -206.33),
    ('6/11/2025', 'Atias Kitchen', 'Gandipet', '1000 P', -14280),
    ('6/11/2025', 'Gismat', 'Ameerpet', '500 P', -19920),
    ('6/12/2025', 'Gismat', 'Kondapur', '500 P', -25000),
    ('6/13/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', -10000),
    ('6/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -19000),
    ('6/16/2025', 'Gismat', 'Ameerpet', '500 P', -40000),
    ('6/16/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -10000),
    ('6/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -45000),
    ('6/18/2025', 'Gismat', 'Dilshuknagar', '500 P', -46148),
    ('6/19/2025', 'Element E7', 'Kukatpally', '1000 P', -26100),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -13500),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -13500),
    ('6/25/2025', 'Good Vibes', 'Khajaguda', '500 P', -5130),
    ('6/27/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', -8524),
    ('6/27/2025', 'This is it café', 'Sanikpuri', '500 P', -25020),
    ('6/27/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -15000),
    ('6/28/2025', 'Gismat', 'Ameerpet', '500 P', -2330),
    ('6/28/2025', 'Gismat', 'Pragathi Nagar', '500 P', -12600),
    ('7/1/2025', 'Element E7', 'Kukatpally', '1000 P', -19800),
    ('7/2/2025', 'Gismat', 'Ameerpet', '500 P', -6640),
    ('7/2/2025', 'Gismat', 'DilshukNagar', '500 P', -22410),
    ('7/5/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', -8700),
    ('7/9/2025', 'Gismat', 'Ameerpet', '500 P', -37848),
    ('7/16/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -20000),
    ('7/18/2025', 'Tonique', 'Vijayawada', '1000 P', -15000),
    ('7/19/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9600),
    ('7/22/2025', 'Element E7', 'Kukatpally', '1000 P', -18360),
    ('7/23/2025', 'Gismat', 'Ameerpet', '500 P', -28801),
    ('7/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -66600),
    ('7/24/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', -20000),
    ('7/25/2025', 'House Party', 'Sanikpuri', '500 P', -13500),
    ('7/27/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -30000),
    ('7/28/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -5100),
    ('7/28/2025', 'Tonique', 'Vijayawada', '1000 P', -12216),
    ('8/1/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -17000),
    ('8/1/2025', 'Atias Kitchen', 'Gandipet', '1000 P', -7560),
    ('8/1/2025', 'Gismat', 'Ameerpet', '500 P', -31040),
    ('8/2/2025', 'Gismat', 'Dilshuknagar', '500 P', -46480),
    ('8/3/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -35360),
    ('8/4/2025', 'Chandhu Poda Marriage Order', 'Ongole', '250 P', -25000),
    ('8/4/2025', 'This is it café', 'Sanikpuri', '500 P', -27360),
    ('8/5/2025', 'Element E7', 'Kukatpally', '1000 P', -14400),
    ('8/5/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -20000),
    ('8/6/2025', 'Gismat', 'Kondapur', '500 P', -29534),
    ('8/7/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('8/7/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('8/11/2025', 'Alley 91', 'Nanakramguda', '500 P', -9200),
    ('8/12/2025', 'Chandhu Poda Marriage Order', 'Ongole', '250 P', -24980),
    ('8/13/2025', 'Gismat', 'Dilshuknagar', '500 P', -24900),
    ('8/13/2025', 'Gismat', 'Lakshmipuram', '500 P', -27200),
    ('8/18/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', -17000),
    ('8/18/2025', 'Element E7', 'Kukatpally', '1000 P', -18000),
    ('8/20/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -45000),
    ('8/21/2025', 'Blossamin Spa', 'Tirumalagiri', '250 P', -8100),
    ('8/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -40000),
    ('8/23/2025', 'krigo', 'Elluru', '1000 P', -12876),
    ('8/25/2025', 'Element E7', 'Kukatpally', '1000 P', -4860),
    ('8/26/2025', 'This is it café', 'Sanikpuri', '500 P', -27000),
    ('8/27/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -20230),
    ('8/28/2025', 'Gismat', 'Ameerpet', '500 P', -3320),
    ('8/30/2025', 'Good Vibes', 'Khajaguda', '500 P', -3800),
    ('8/30/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -8920),
    ('8/30/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -45000),
    ('8/31/2025', 'House Party', 'Sanikpuri', '500 P', -13500),
    ('9/3/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -23800),
    ('9/3/2025', 'Gismat', 'Pragathi nagar', '500 P', -10000),
    ('9/4/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -21100),
    ('9/5/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', -3000),
    ('9/6/2025', 'Gismat', 'Ameerpet', '500 P', -16600),
    ('9/7/2025', 'Alley 91', 'Nanakramguda', '500 P', -10000),
    ('9/7/2025', 'Alley 91', 'Nanakramguda', '250 EC', -2000),
    ('9/8/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', -7552),
    ('9/8/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', -8400),
    ('9/9/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -22950),
    ('9/10/2025', 'Gismat', 'Kondapur', '500 P', -24900),
    ('9/10/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -31500),
    ('9/11/2025', 'Maryadha Ramanna', 'Kondapur', '500 P', -34850),
    ('9/11/2025', 'Maryadha Ramanna', 'L B Nagar', '500 P', -24650),
    ('9/11/2025', 'The English café', 'Nanakramguda', '750 P', -12480),
    ('9/12/2025', 'Deccan kitchen', 'Film nagar', '750 P', -45240),
    ('9/12/2025', 'Deccan kitchen', 'Film nagar', '250 EC', -7507.5),
    ('9/12/2025', 'Tara South Indian', 'Hitech City', '500 P', -10000),
    ('9/14/2025', 'Gismat', 'Dilshuknagar', '500 P', -8300),
    ('9/15/2025', 'Gismat', 'Chandha nagar', '500 P', -40000),
    ('9/17/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', -16660),
    ('9/17/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -34000),
    ('9/20/2025', 'Gismat', 'Lakshmipuram', '500 P', -17000),
    ('9/24/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', -10050),
    ('9/27/2025', 'Jagan Pan House', 'Bhoodan Pochampally', '1000 P', -8200),
    ('9/27/2025', 'Gismat', 'Dilshuknagar', '500 P', -33200),
    ('9/29/2025', 'House Party', 'Sanikpuri', '500 P', -23940),
    ('10/1/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -20800),
    ('10/1/2025', 'House Party', 'Sanikpuri', '500 P', -16560),
    ('10/3/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -15130),
    ('10/3/2025', 'Gismat', 'Chandha nagar', '500 P', -8500),
    ('10/6/2025', 'Gismat', 'Dilshuknagar', '500 P', -33150),
    ('10/6/2025', 'Gismat', 'Ameerpet', '500 P', -43840),
    ('10/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -20800),
    ('10/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -45000),
    ('10/6/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -37400),
    ('10/10/2025', 'Alley 91', 'Nanakramguda', '500 P', -10600),
    ('10/13/2025', 'Mid land ', 'Telangana', '500 P', -11904),
    ('10/13/2025', 'Mid land 750 ml ', 'Telangana', '750 AL', -88096),
    ('10/14/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', -25000),
    ('10/15/2025', 'Gismat', 'Kondapur', '500 P', -10790),
    ('10/17/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', -17500),
    ('10/18/2025', 'Gismat', 'Dilshuknagar', '500 P', -30600),
    ('10/18/2025', 'Element E7', 'Kukatpally', '1000 P', -36000),
    ('10/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('10/21/2025', 'Maryadha Ramanna', 'L B Nagar', '500 P', -23800),
    ('10/21/2025', 'Maryadha Ramanna', 'Kondapur', '500 P', -35870),
    ('10/22/2025', 'Tara South Indian', 'Hitech City', '500 P', -10000),
    ('10/25/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('10/25/2025', 'Gismat', 'Ameerpet', '500 P', -17000),
    ('10/25/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -20000),
    ('10/29/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -34000),
    ('10/31/2025', 'Gismat', 'Chandha nagar', '500 P', -20000),
    ('10/31/2025', 'Gismat', 'Kondapur', '500 P', -20400),
    ('10/31/2025', 'soul of south', 'Film nagar', '500 P', -8330),
    ('11/3/2025', 'Gismat', 'Pragathi nagar', '500 P', -10800),
    ('11/3/2025', 'House Party', 'Sanikpuri', '500 P', -23760),
    ('11/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -54000),
    ('11/6/2025', 'Gismat', 'Dilshuknagar', '500 P', -20400),
    ('11/7/2025', 'Gismat', 'Ameerpet', '500 P', -17000),
    ('11/7/2025', 'This is it café', 'Sanikpuri', '500 P', -16920),
    ('11/9/2025', 'Alley 91', 'Nanakramguda', '500 P', -5400),
    ('11/9/2025', 'Alley 91', 'Nanakramguda', '250 EC', -2000),
    ('11/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -19200),
    ('11/17/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', -20000),
    ('11/18/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', -17500),
    ('11/18/2025', 'Gismat', 'Ameerpet', '500 P', -22950),
    ('11/18/2025', 'Gismat', 'kondapur', '500 P', -7000),
    ('11/19/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -37400),
    ('11/19/2025', 'Intercity', 'Bachupally', '500 EC', -34000),
    ('11/22/2025', 'Gismat', 'Kondapur', '500 P', -10000),
    ('11/24/2025', 'Element E7', 'Kukatpally', '1000 P', -18000),
    ('11/25/2025', 'Gismat', 'Tenali', '500 P', -5000),
    ('11/27/2025', 'Tara South Indian', 'Hitech City', '500 P', -10000),
    ('11/28/2025', 'Maryadha Ramanna', 'L B Nagar', '500 P', -49300),
    ('11/29/2025', 'Intercity', 'Bachupally', '500 EC', -30000),
    ('12/3/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -19200),
    ('12/4/2025', 'Gismat', 'Ameerpet', '500 P', -17000),
    ('12/4/2025', 'Gismat', 'Dilshuknagar', '500 P', -26350),
    ('12/4/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -25500),
    ('12/6/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', -30000),
    ('12/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -50000),
    ('12/6/2025', 'soul of south', 'Film nagar', '500 P', -8500),
    ('12/6/2025', 'Gismat', 'Lakshmipuram', '500 P', -25000),
    ('12/7/2025', 'Alley 91', 'Nanakramguda', '500 P', -10000),
    ('12/7/2025', 'Alley 91', 'Nanakramguda', '250 EC', -2000),
    ('12/9/2025', 'Gismat', 'Kondapur', '500 P', -10000),
    ('12/11/2025', 'Gismat', 'Chandha Nagar', '500 P', -10000),
    ('12/11/2025', 'Intercity', 'Bachupally', '500 EC', -47200),
    ('12/13/2025', 'Mid land 750 ml ', 'Andhra Pradesh', '750 AL', -30000),
    ('12/14/2025', 'Gismat', 'Kondapur', '500 P', -10000),
    ('12/16/2025', 'Gismat', 'Dilshuknagar', '500 P', -20400),
    ('12/17/2025', 'Element E7', 'Kukatpally', '1000 P', -54360),
    ('12/18/2025', '1980s Milatry Hotel', 'Khajaguda', '750 AL', -13920),
    ('12/19/2025', 'This is it café', 'Sanikpuri', '500 P', -30240),
    ('12/20/2025', 'Gismat', 'Kondapur', '500 P', -10000),
    ('12/22/2025', 'Maryadha Ramanna', 'Kondapur', '500 P', -20230),
    ('12/22/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', -34000),
    ('12/23/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -19200),
    ('12/23/2025', 'Mid land 750 ml ', 'Andhra Pradesh', '750 AL', -35000),
    ('12/23/2025', 'House Party', 'Sanikpuri', '500 P', -32400),
    ('12/24/2025', 'AAHA', 'Khajaguda', '500 AL', -15000),
    ('12/24/2025', 'Tawalogy', 'Gandipet', '1000 P', -8700),
    ('12/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', -9000),
    ('12/26/2025', 'Gismat', 'Chandha Nagar', '500 P', -10000),
    ('12/26/2025', 'Intercity', 'Bachupally', '500 EC', -50000),
    ('12/27/2025', 'Tilaks kitchen', 'Madhapur', '500 P', -13600),
    ('12/27/2025', 'Gismat', 'Kondapur', '500 P', -7400),
    ('12/31/2025', 'This is it café', 'Sanikpuri', '500 P', -18360),
    ('1/1/2026', 'Happy Monkeys', 'Nagole', '500 P', -9000),
    ('1/2/2026', 'Biryanis and More', 'Ameerpet', '1000 P', -12600),
    ('1/2/2026', 'Biryanis and More', 'Ameerpet', '1000 P', -19800),
    ('1/3/2026', 'Intercity', 'Bachupally', '500 EC', -60000),
    ('1/4/2026', 'Gismat', 'Dilshuknagar', '500 P', -45050),
    ('1/5/2026', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', -30000),
    ('1/5/2026', 'soul of south', 'Film nagar', '500 P', -9350),
    ('1/6/2026', 'Alley 91', 'Nanakramguda', '500 P', -21600),
    ('1/6/2026', 'Alley 91', 'Nanakramguda', '250 EC', -19400),
    ('1/6/2026', 'Gismat', 'Main office', '500 P', -1700),
    ('1/6/2026', 'Hiyya Chrono Jail Mandi', 'Madhapur', '500 P', -1530),
    ('1/8/2026', 'Biryanis and More', 'Ameerpet', '1000 P', -28800),
    ('1/8/2026', 'Gismat', 'Ameerpet', '500 P', -13600),
    ('1/12/2026', 'Hiyya Chrono Jail Mandi', 'Madhapur', '500 P', -31960)
  ) AS t(transaction_date_str, client_name, branch, sku, amount)
),
-- Convert date and normalize client/branch names
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle variations)
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(client_name)) = 'GOLDEN PAVILION' OR UPPER(TRIM(client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(client_name)) LIKE 'MID LAND%' THEN 'Mid land'
      WHEN UPPER(TRIM(client_name)) = 'JAGAN PAN HOUSE' THEN 'jagan Pan House'
      WHEN UPPER(TRIM(client_name)) = 'KRIGO' THEN 'Krigo'
      ELSE TRIM(client_name)
    END as client_name,
    -- Normalize branch names
    CASE 
      WHEN UPPER(TRIM(branch)) = 'DILSHUKNAGAR' OR UPPER(TRIM(branch)) = 'DILSHUKNAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(branch)) = 'CHANDHA NAGAR' OR UPPER(TRIM(branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(branch)) = 'KONDAPUR' THEN 'Kondapur'
      ELSE TRIM(branch)
    END as branch,
    sku,
    -- Convert negative amount to positive (payment received)
    ABS(amount) as amount
  FROM payment_data
)
INSERT INTO sales_transactions (
  customer_id,
  transaction_type,
  amount,
  quantity,
  sku,
  description,
  transaction_date
)
SELECT 
  c.id as customer_id,
  'payment'::TEXT as transaction_type,
  pd.amount,
  NULL as quantity,  -- Payments don't have quantity
  pd.sku,
  'Payment received' as description,
  pd.transaction_date
FROM prepared_data pd
INNER JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

-- Verify the import
SELECT 
  'Payment Transactions Imported' as status,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount_received,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_type = 'payment'
  AND transaction_date >= '2025-04-01';

-- Show payments by client (summary)
SELECT 
  c.client_name,
  c.branch,
  COUNT(*) as payment_count,
  SUM(st.amount) as total_payments_received
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_type = 'payment'
  AND st.transaction_date >= '2025-04-01'
GROUP BY c.client_name, c.branch
ORDER BY total_payments_received DESC, c.client_name, c.branch;
