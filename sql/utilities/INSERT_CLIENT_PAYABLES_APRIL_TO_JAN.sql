-- ==============================================
-- INSERT CLIENT PAYABLES (PAYMENTS) FOR APRIL 2025 TO JANUARY 2026
-- This script inserts payment transactions (transaction_type = 'payment')
-- Payments are money received from clients
-- Negative amounts are converted to positive using ABS()
-- 
-- IMPORTANT: This script prevents duplicates - it will NOT insert if the same payment already exists
-- It does NOT delete existing records - it only adds new ones that don't exist
-- ==============================================

WITH payment_data AS (
  SELECT * FROM (VALUES 
    ('4/17/2025', 'Tilaks kitchen', 'Madhapur', -10040),
    ('4/21/2025', 'Element E7', 'Kukatpally', -1260),
    ('4/27/2025', 'Element E7', 'Kukatpally', -18000),
    ('5/1/2025', 'Tilaks kitchen', 'Madhapur', -3560),
    ('5/2/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('5/5/2025', 'Fusion Aroma', 'Nallagandla', -3100),
    ('5/5/2025', 'Tilaks kitchen', 'Madhapur', -12000),
    ('5/5/2025', 'Tilaks kitchen', 'Madhapur', -700),
    ('5/8/2025', 'Element E7', 'Kukatpally', -17100),
    ('5/18/2025', 'Biryanis and More', 'Ameerpet', -192),
    ('5/21/2025', 'Golden Pavilion', 'Banjara Hills', -6610),
    ('5/22/2025', 'Element E7', 'Kukatpally', -21600),
    ('5/27/2025', 'Atias Kitchen', 'Gandipet', -3696),
    ('5/27/2025', 'Deccan kitchen', 'Film nagar', -4042.5),
    ('5/27/2025', 'Deccan kitchen', 'Film nagar', -16356),
    ('5/27/2025', 'House Party', 'Sanikpuri', -12060),
    ('5/27/2025', 'This is it café', 'Sanikpuri', -6660),
    ('5/29/2025', 'Biryanis and More', 'Ameerpet', -18560),
    ('6/2/2025', 'Tilaks kitchen', 'Madhapur', -30000),
    ('6/8/2025', 'Biryanis and More', 'Ameerpet', -18560),
    ('6/10/2025', 'Fusion Aroma', 'Nallagandla', -206.33),
    ('6/11/2025', 'Atias Kitchen', 'Gandipet', -14280),
    ('6/11/2025', 'Gismat', 'Ameerpet', -19920),
    ('6/12/2025', 'Gismat', 'Kondapur', -25000),
    ('6/13/2025', 'Golden Pavilion', 'Banjara Hills', -10000),
    ('6/14/2025', 'Gismat', 'Kondapur', -3400),
    ('6/15/2025', 'Biryanis and More', 'Ameerpet', -19000),
    ('6/16/2025', 'Gismat', 'Ameerpet', -40000),
    ('6/16/2025', 'Tilaks kitchen', 'Madhapur', -10000),
    ('6/17/2025', 'Biryanis and More', 'Ameerpet', -45000),
    ('6/18/2025', 'Gismat', 'Dilshuknagar', -46148),
    ('6/19/2025', 'Element E7', 'Kukatpally', -26100),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', -13500),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', -13500),
    ('6/25/2025', 'Good Vibes', 'Khajaguda', -5130),
    ('6/27/2025', 'Golden Pavilion', 'Banjara Hills', -8524),
    ('6/27/2025', 'This is it café', 'Sanikpuri', -25020),
    ('6/27/2025', 'Tilaks kitchen', 'Madhapur', -15000),
    ('6/28/2025', 'Gismat', 'Ameerpet', -2330),
    ('6/28/2025', 'Gismat', 'Pragathi Nagar', -12600),
    ('7/1/2025', 'Element E7', 'Kukatpally', -19800),
    ('7/2/2025', 'Gismat', 'Ameerpet', -6640),
    ('7/2/2025', 'Gismat', 'DilshukNagar', -22410),
    ('7/5/2025', 'Fusion Aroma', 'Nallagandla', -8700),
    ('7/9/2025', 'Gismat', 'Ameerpet', -37848),
    ('7/16/2025', 'Tilaks kitchen', 'Madhapur', -20000),
    ('7/18/2025', 'Tonique', 'Vijayawada', -15000),
    ('7/19/2025', 'Biryanis and More', 'Ameerpet', -9600),
    ('7/22/2025', 'Element E7', 'Kukatpally', -18360),
    ('7/23/2025', 'Gismat', 'Ameerpet', -28801),
    ('7/24/2025', 'Biryanis and More', 'Ameerpet', -66600),
    ('7/24/2025', 'Golden Pavilion', 'Banjara Hills', -20000),
    ('7/25/2025', 'House Party', 'Sanikpuri', -13500),
    ('7/27/2025', 'Biryanis and More', 'Ameerpet', -30000),
    ('7/27/2025', 'Biryanis and More', 'Ameerpet', -960),
    ('7/28/2025', 'Biryanis and More', 'Ameerpet', -5100),
    ('7/28/2025', 'Tonique', 'Vijayawada', -12216),
    ('8/1/2025', 'Tilaks kitchen', 'Madhapur', -17000),
    ('8/1/2025', 'Atias Kitchen', 'Gandipet', -7560),
    ('8/1/2025', 'Gismat', 'Ameerpet', -31040),
    ('8/2/2025', 'Gismat', 'Dilshuknagar', -46480),
    ('8/3/2025', 'Benguluru Bhavan', 'Kondapur', -35360),
    ('8/4/2025', 'Chandhu Poda Marriage Order', 'Ongole', -25000),
    ('8/4/2025', 'This is it café', 'Sanikpuri', -27360),
    ('8/5/2025', 'Element E7', 'Kukatpally', -14400),
    ('8/5/2025', 'Biryanis and More', 'Ameerpet', -20000),
    ('8/6/2025', 'Gismat', 'Kondapur', -29534),
    ('8/7/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('8/7/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('8/11/2025', 'Alley 91', 'Nanakramguda', -9200),
    ('8/12/2025', 'Chandhu Poda Marriage Order', 'Ongole', -24980),
    ('8/13/2025', 'Gismat', 'Dilshuknagar', -24900),
    ('8/13/2025', 'Gismat', 'Lakshmipuram', -27200),
    ('8/18/2025', 'Tilaks Kitchen', 'Madhapur', -17000),
    ('8/18/2025', 'Element E7', 'Kukatpally', -18000),
    ('8/20/2025', 'Biryanis and More', 'Ameerpet', -45000),
    ('8/21/2025', 'Blossamin Spa', 'Tirumalagiri', -8100),
    ('8/23/2025', 'krigo', 'Elluru', -12876),
    ('8/25/2025', 'Element E7', 'Kukatpally', -4860),
    ('8/26/2025', 'This is it café', 'Sanikpuri', -27000),
    ('8/27/2025', 'Benguluru Bhavan', 'Kondapur', -20230),
    ('8/28/2025', 'Gismat', 'Ameerpet', -3320),
    ('8/30/2025', 'Good Vibes', 'Khajaguda', -3800),
    ('8/30/2025', 'Biryanis and More', 'Ameerpet', -8920),
    ('8/30/2025', 'Biryanis and More', 'Ameerpet', -45000),
    ('8/31/2025', 'House Party', 'Sanikpuri', -13500),
    ('9/3/2025', 'Benguluru Bhavan', 'Kondapur', -23800),
    ('9/3/2025', 'Gismat', 'Pragathi nagar', -10000),
    ('9/4/2025', 'Biryanis and More', 'Ameerpet', -21100),
    ('9/5/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', -3000),
    ('9/6/2025', 'Gismat', 'Ameerpet', -16600),
    ('9/7/2025', 'Alley 91', 'Nanakramguda', -10000),
    ('9/7/2025', 'Alley 91', 'Nanakramguda', -2000),
    ('9/8/2025', 'Golden pavilion', 'Banjara Hills', -7552),
    ('9/8/2025', 'Golden pavilion', 'Banjara Hills', -8400),
    ('9/9/2025', 'Tilaks kitchen', 'Madhapur', -22950),
    ('9/10/2025', 'Gismat', 'Kondapur', -24900),
    ('9/10/2025', 'Biryanis and More', 'Ameerpet', -31500),
    ('9/11/2025', 'Maryadha Ramanna ', ' Kondapur', -34850),
    ('9/11/2025', 'Maryadha Ramanna ', ' L B Nagar', -24650),
    ('9/11/2025', 'The English café', 'Nanakramguda', -12480),
    ('9/12/2025', 'Deccan kitchen', 'Film nagar', -45240),
    ('9/12/2025', 'Deccan kitchen', 'Film nagar', -7507.5),
    ('9/12/2025', 'Tara South Indian', 'Hitech City', -10000),
    ('9/14/2025', 'Gismat', 'Dilshuknagar', -8300),
    ('9/15/2025', 'Gismat', 'Chandha nagar', -40000),
    ('9/17/2025', 'Tilaks Kitchen', 'Madhapur', -16660),
    ('9/17/2025', 'Benguluru Bhavan', 'Kondapur', -34000),
    ('9/20/2025', 'Gismat', 'Lakshmipuram', -17000),
    ('9/24/2025', 'Tilaks Kitchen', 'Madhapur', -10050),
    ('9/27/2025', 'Jagan Pan House', 'Bhoodan Pochampally', -8200),
    ('9/27/2025', 'Gismat', 'Dilshuknagar', -33200),
    ('9/29/2025', 'House Party', 'Sanikpuri', -23940),
    ('10/1/2025', 'Biryanis and More', 'Ameerpet', -20800),
    ('10/1/2025', 'House Party', 'Sanikpuri', -16560),
    ('10/3/2025', 'Benguluru Bhavan', 'Kondapur', -15130),
    ('10/3/2025', 'Gismat', 'Chandha nagar', -8500),
    ('10/6/2025', 'Gismat', 'Dilshuknagar', -33150),
    ('10/6/2025', 'Gismat', 'Ameerpet', -43840),
    ('10/6/2025', 'Biryanis and More', 'Ameerpet', -20800),
    ('10/6/2025', 'Biryanis and More', 'Ameerpet', -45000),
    ('10/6/2025', 'Benguluru Bhavan', 'Kondapur', -37400),
    ('10/10/2025', 'Alley 91', 'Nanakramguda', -10600),
    ('10/13/2025', 'Mid land', 'Telangana', -11904),
    ('10/13/2025', 'Mid land 750 ml ', 'Telangana', -88096),
    ('10/14/2025', 'Golden pavilion', 'Banjara Hills', -25000),
    ('10/15/2025', 'Gismat', 'Kondapur', -10790),
    ('10/17/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', -17500),
    ('10/18/2025', 'Gismat', 'Dilshuknagar', -30600),
    ('10/18/2025', 'Element E7', 'Kukatpally', -36000),
    ('10/18/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('10/21/2025', 'Maryadha Ramanna ', ' L B Nagar', -23800),
    ('10/21/2025', 'Maryadha Ramanna ', ' Kondapur', -35870),
    ('10/22/2025', 'Tara South Indian', 'Hitech City', -10000),
    ('10/25/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('10/25/2025', 'Gismat', 'Ameerpet', -17000),
    ('10/25/2025', 'Biryanis and More', 'Ameerpet', -20000),
    ('10/29/2025', 'Benguluru Bhavan', 'Kondapur', -34000),
    ('10/31/2025', 'Gismat', 'Chandha nagar', -20000),
    ('10/31/2025', 'Gismat', 'Kondapur', -20400),
    ('10/31/2025', 'soul of south', 'Film nagar', -8330),
    ('11/2/2025', 'Biryanis and More', 'Ameerpet', -3480),
    ('11/3/2025', 'Gismat', 'Pragathi nagar', -10800),
    ('11/3/2025', 'House Party', 'Sanikpuri', -23760),
    ('11/5/2025', 'Gismat', 'Dilshuknagar', -4250),
    ('11/6/2025', 'Biryanis and More', 'Ameerpet', -54000),
    ('11/6/2025', 'Gismat', 'Dilshuknagar', -20400),
    ('11/7/2025', 'Gismat', 'Ameerpet', -17000),
    ('11/7/2025', 'This is it café', 'Sanikpuri', -16920),
    ('11/9/2025', 'Alley 91', 'Nanakramguda', -5400),
    ('11/9/2025', 'Alley 91', 'Nanakramguda', -2000),
    ('11/11/2025', 'Benguluru Bhavan', 'Kondapur', -1800),
    ('11/15/2025', 'Biryanis and More', 'Ameerpet', -19200),
    ('11/17/2025', 'Golden pavilion', 'Banjara Hills', -20000),
    ('11/18/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', -17500),
    ('11/18/2025', 'Gismat', 'Ameerpet', -22950),
    ('11/18/2025', 'Gismat', 'kondapur', -7000),
    ('11/19/2025', 'Benguluru Bhavan', 'Kondapur', -37400),
    ('11/19/2025', 'Intercity', 'Bachupally', -34000),
    ('11/22/2025', 'Gismat', 'Kondapur', -10000),
    ('11/24/2025', 'Element E7', 'Kukatpally', -18000),
    ('11/25/2025', 'Gismat', 'Tenali', -5000),
    ('11/27/2025', 'Tara South Indian', 'Hitech City', -10000),
    ('11/28/2025', 'Maryadha Ramanna ', ' L B Nagar', -49300),
    ('11/29/2025', 'Intercity', 'Bachupally', -30000),
    ('12/3/2025', 'Biryanis and More', 'Ameerpet', -19200),
    ('12/4/2025', 'Gismat', 'Ameerpet', -17000),
    ('12/4/2025', 'Gismat', 'Dilshuknagar', -26350),
    ('12/4/2025', 'Benguluru Bhavan', 'Kondapur', -25500),
    ('12/6/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', -30000),
    ('12/6/2025', 'Biryanis and More', 'Ameerpet', -50000),
    ('12/6/2025', 'soul of south', 'Film nagar', -8500),
    ('12/6/2025', 'Gismat', 'Lakshmipuram', -25000),
    ('12/7/2025', 'Alley 91', 'Nanakramguda', -10000),
    ('12/7/2025', 'Alley 91', 'Nanakramguda', -2000),
    ('12/9/2025', 'Gismat', 'Kondapur', -10000),
    ('12/11/2025', 'Gismat', 'Chandha Nagar', -10000),
    ('12/11/2025', 'Intercity', 'Bachupally', -47200),
    ('12/13/2025', 'Mid land 750 ml ', 'Andhra Pradesh', -30000),
    ('12/14/2025', 'Gismat', 'Kondapur', -10000),
    ('12/16/2025', 'Gismat', 'Dilshuknagar', -20400),
    ('12/17/2025', 'Element E7', 'Kukatpally', -54360),
    ('12/18/2025', '1980s Milatry Hotel', 'Khajaguda', -13920),
    ('12/19/2025', 'This is it café', 'Sanikpuri', -30240),
    ('12/20/2025', 'Gismat', 'Kondapur', -10000),
    ('12/22/2025', 'Maryadha Ramanna ', ' Kondapur', -20230),
    ('12/22/2025', 'Benguluru Bhavan', 'Kondapur', -34000),
    ('12/23/2025', 'Biryanis and More', 'Ameerpet', -19200),
    ('12/23/2025', 'Mid land 750 ml ', 'Andhra Pradesh', -35000),
    ('12/23/2025', 'House Party', 'Sanikpuri', -32400),
    ('12/24/2025', 'AAHA', 'Khajaguda', -15000),
    ('12/24/2025', 'Tawalogy', 'Gandipet', -8700),
    ('12/24/2025', 'Biryanis and More', 'Ameerpet', -9000),
    ('12/26/2025', 'Gismat', 'Chandha Nagar', -10000),
    ('12/26/2025', 'Intercity', 'Bachupally', -50000),
    ('12/27/2025', 'Tilaks kitchen', 'Madhapur', -13600),
    ('12/27/2025', 'Gismat', 'Kondapur', -7400),
    ('12/31/2025', 'This is it café', 'Sanikpuri', -18360),
    ('1/1/2026', 'Happy Monkeys', 'Nagole', -9000),
    ('1/2/2026', 'Biryanis and More', 'Ameerpet', -12600),
    ('1/2/2026', 'Biryanis and More', 'Ameerpet', -19800),
    ('1/3/2026', 'Intercity', 'Bachupally', -60000),
    ('1/4/2026', 'Gismat', 'Dilshuknagar', -45050),
    ('1/5/2026', 'Chaitanya''s Modern Kitchen', 'Khajaguda', -30000),
    ('1/5/2026', 'soul of south', 'Film nagar', -9350),
    ('1/6/2026', 'Alley 91', 'Nanakramguda', -21600),
    ('1/6/2026', 'Alley 91', 'Nanakramguda', -19400),
    ('1/6/2026', 'Gismat', 'Main office', -1700),
    ('1/6/2026', 'Hiyya Chrono Jail Mandi', 'Madhapur', -1530),
    ('1/8/2026', 'Biryanis and More', 'Ameerpet', -28800),
    ('1/8/2026', 'Gismat', 'Ameerpet', -13600),
    ('1/12/2026', 'Hiyya Chrono Jail Mandi', 'Madhapur', -31960)
  ) AS t(transaction_date_str, client_name, branch, amount)
),
-- Convert date and prepare data with normalization
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle case variations and trailing spaces)
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(client_name)) = 'ELEMENT E7' THEN 'Element E7'
      WHEN UPPER(TRIM(client_name)) = 'BIRYANIS AND MORE' THEN 'Biryanis and More'
      WHEN UPPER(TRIM(client_name)) = 'FUSION AROMA' THEN 'Fusion Aroma'
      WHEN UPPER(TRIM(client_name)) = 'GOLDEN PAVILION' OR UPPER(TRIM(client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(client_name)) = 'ATIAS KITCHEN' THEN 'Atias Kitchen'
      WHEN UPPER(TRIM(client_name)) = 'DECCAN KITCHEN' THEN 'Deccan kitchen'
      WHEN UPPER(TRIM(client_name)) = 'HOUSE PARTY' THEN 'House Party'
      WHEN UPPER(TRIM(client_name)) = 'THIS IS IT CAFÉ' THEN 'This is it café'
      WHEN UPPER(TRIM(client_name)) = 'GISMAT' THEN 'Gismat'
      WHEN UPPER(TRIM(client_name)) = 'GOOD VIBES' THEN 'Good Vibes'
      WHEN UPPER(TRIM(client_name)) = 'TONIQUE' THEN 'Tonique'
      WHEN UPPER(TRIM(client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(client_name)) = 'CHANDHU PODA MARRIAGE ORDER' THEN 'Chandhu Poda Marriage Order'
      WHEN UPPER(TRIM(client_name)) = 'ALLEY 91' THEN 'Alley 91'
      WHEN UPPER(TRIM(client_name)) = 'BLOSSAMIN SPA' THEN 'Blossamin Spa'
      WHEN UPPER(TRIM(client_name)) LIKE 'KRIGO%' THEN 'Krigo'
      WHEN UPPER(TRIM(client_name)) = 'CHAITANYA''S MODERN KITCHEN' THEN 'Chaitanya''s Modern Kitchen'
      WHEN UPPER(TRIM(client_name)) LIKE 'MARYADHA RAMANNA%' THEN 'Maryadha Ramanna'
      WHEN UPPER(TRIM(client_name)) = 'THE ENGLISH CAFÉ' THEN 'The English café'
      WHEN UPPER(TRIM(client_name)) = 'TARA SOUTH INDIAN' THEN 'Tara South Indian'
      WHEN UPPER(TRIM(client_name)) = 'JAGAN PAN HOUSE' THEN 'Jagan Pan House'
      WHEN UPPER(TRIM(client_name)) LIKE 'MID LAND%' THEN 'Mid land'
      WHEN UPPER(TRIM(client_name)) = 'SOUL OF SOUTH' THEN 'soul of south'
      WHEN UPPER(TRIM(client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(client_name)) = 'TAWALOGY' THEN 'Tawalogy'
      WHEN UPPER(TRIM(client_name)) = '1980S MILATRY HOTEL' THEN '1980s Milatry Hotel'
      WHEN UPPER(TRIM(client_name)) = 'HAPPY MONKEYS' THEN 'Happy Monkeys'
      WHEN UPPER(TRIM(client_name)) = 'HIYYA CHRONO JAIL MANDI' THEN 'Hiyya Chrono Jail Mandi'
      ELSE TRIM(client_name)
    END as client_name,
    -- Normalize branch names (handle case variations and trailing spaces)
    CASE 
      WHEN UPPER(TRIM(branch)) = 'MADHAPUR' THEN 'Madhapur'
      WHEN UPPER(TRIM(branch)) = 'KUKATPALLY' THEN 'Kukatpally'
      WHEN UPPER(TRIM(branch)) = 'AMEERPET' THEN 'Ameerpet'
      WHEN UPPER(TRIM(branch)) = 'BANJARA HILLS' THEN 'Banjara Hills'
      WHEN UPPER(TRIM(branch)) = 'GANDIPET' THEN 'Gandipet'
      WHEN UPPER(TRIM(branch)) = 'FILM NAGAR' THEN 'Film nagar'
      WHEN UPPER(TRIM(branch)) = 'SANIKPURI' THEN 'Sanikpuri'
      WHEN UPPER(TRIM(branch)) = 'NALLAGANDLA' THEN 'Nallagandla'
      WHEN UPPER(TRIM(branch)) = 'KONDAPUR' THEN 'Kondapur'
      WHEN UPPER(TRIM(branch)) = 'DILSHUKNAGAR' OR UPPER(TRIM(branch)) = 'DILSHUK NAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(branch)) = 'KHAJAGUDA' THEN 'Khajaguda'
      WHEN UPPER(TRIM(branch)) = 'PRAGATHI NAGAR' OR UPPER(TRIM(branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(branch)) = 'VIJAYAWADA' THEN 'Vijayawada'
      WHEN UPPER(TRIM(branch)) = 'ONGOLE' THEN 'Ongole'
      WHEN UPPER(TRIM(branch)) = 'NANAKRAMGUDA' THEN 'Nanakramguda'
      WHEN UPPER(TRIM(branch)) = 'TIRUMALAGIRI' THEN 'Tirumalagiri'
      WHEN UPPER(TRIM(branch)) = 'ELLURU' THEN 'Elluru'
      WHEN UPPER(TRIM(branch)) = 'BOODAN POCHAMPALLY' OR UPPER(TRIM(branch)) = 'BHOODAN POCHAMPALLY' THEN 'Bhoodan Pochampally'
      WHEN UPPER(TRIM(branch)) LIKE '%L B NAGAR%' OR UPPER(TRIM(branch)) LIKE 'L B NAGAR%' THEN 'L B Nagar'
      WHEN UPPER(TRIM(branch)) = 'HITECH CITY' THEN 'Hitech City'
      WHEN UPPER(TRIM(branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(branch)) = 'LAKSHMIPURAM' THEN 'Lakshmipuram'
      WHEN UPPER(TRIM(branch)) = 'TELANGANA' THEN 'Telangana'
      WHEN UPPER(TRIM(branch)) = 'ANDHRA PRADESH' THEN 'Andhra Pradesh'
      WHEN UPPER(TRIM(branch)) = 'BACHUPALLY' THEN 'Bachupally'
      WHEN UPPER(TRIM(branch)) = 'TENALI' THEN 'Tenali'
      WHEN UPPER(TRIM(branch)) = 'MAIN OFFICE' THEN 'Main office'
      WHEN UPPER(TRIM(branch)) = 'NAGOLE' THEN 'Nagole'
      ELSE TRIM(branch)
    END as branch,
    ABS(amount) as amount  -- Convert negative to positive
  FROM payment_data
)
INSERT INTO sales_transactions (
  customer_id,
  transaction_type,
  amount,
  total_amount,
  quantity,
  sku,
  description,
  transaction_date
)
SELECT DISTINCT ON (pd.transaction_date, pd.client_name, pd.branch, pd.amount)
  (SELECT id FROM customers 
   WHERE UPPER(TRIM(client_name)) = UPPER(TRIM(pd.client_name))
     AND UPPER(TRIM(branch)) = UPPER(TRIM(pd.branch))
     AND is_active = true
   LIMIT 1) as customer_id,
  'payment'::TEXT as transaction_type,
  pd.amount,
  pd.amount as total_amount,  -- total_amount same as amount for payments
  NULL as quantity,  -- Payments don't have quantity
  NULL as sku,  -- Payments don't need SKU
  'Payment received' as description,
  pd.transaction_date
FROM prepared_data pd
-- Only insert if customer exists and payment doesn't already exist
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
    AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
    AND c.is_active = true
)
-- Prevent duplicates: Only insert if this exact payment doesn't already exist
AND NOT EXISTS (
  SELECT 1 
  FROM sales_transactions st
  INNER JOIN customers c ON st.customer_id = c.id
  WHERE UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
    AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
    AND st.transaction_date = pd.transaction_date
    AND st.transaction_type = 'payment'
    AND ABS(st.amount - pd.amount) < 0.01
)
ORDER BY pd.transaction_date, pd.client_name, pd.branch, pd.amount;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Summary of imported payments
SELECT 
  'Payments Imported' as status,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_date >= '2025-04-01' 
  AND transaction_date <= '2026-01-31'
  AND transaction_type = 'payment';

-- Show imported payments with customer details
SELECT 
  c.client_name,
  c.branch,
  st.transaction_date,
  st.amount as payment_amount,
  st.description
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2026-01-31'
  AND st.transaction_type = 'payment'
ORDER BY st.transaction_date, c.client_name, c.branch;

-- Check for any payments that couldn't be matched to customers
-- (This should return 0 rows since the INSERT statement filters unmatched payments)
SELECT 
  'Payments Without Customer' as status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM sales_transactions
WHERE transaction_date >= '2025-04-01' 
  AND transaction_date <= '2026-01-31'
  AND transaction_type = 'payment'
  AND customer_id IS NULL;
