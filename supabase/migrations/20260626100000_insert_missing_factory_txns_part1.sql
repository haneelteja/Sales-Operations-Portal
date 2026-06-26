-- Insert missing factory transactions (Part 1: 2025-03-31 to 2025-09-29)
-- Source: Elma vs Factory reconciliation — all rows have Factory Qty = 0
-- SKU mapping applied: 500 EC→EL 500 ml, 250 P→P 250 ml, 1000 P→P 1000 ml,
--   750 AL→AL 750 ml, 500 P→P 500 ml, 750 P→P 750 ml, 250 EC→250 EC
-- customer_id looked up by dealer_name ILIKE + area ILIKE; NULL if not found
-- NOT EXISTS guard prevents duplicates on (date, sku, quantity, description, type)

WITH new_txns (txn_date, description, sku, qty, amount, dlr, area) AS (VALUES
  -- Mar 2025
  ('2025-03-31'::date,'Jubile Festa in 1000 ml','P 1000 ml',60,6839.28,'Jubile Festa',null::text),
  ('2025-03-31'::date,'Jubile Festa in 500 ml','P 500 ml',120,14726.40,'Jubile Festa',null::text),
  ('2025-03-31'::date,'Tilaks kitchen','P 500 ml',325,39884.00,'Tilaks kitchen','Madhapur'),
  -- Apr 2025
  ('2025-04-02'::date,'Deccan kitchen 750 ml','AL 750 ml',36,3568.32,'Deccan kitchen','Film nagar'),
  ('2025-04-11'::date,'Deccan kitchen 250 ml','250 EC',21,3122.28,'Deccan kitchen','Film nagar'),
  ('2025-04-11'::date,'Deccan kitchen 750 ml','AL 750 ml',58,5748.96,'Deccan kitchen','Film nagar'),
  ('2025-04-18'::date,'The English café','AL 750 ml',69,6872.32,'The English café','Nanakramguda'),
  ('2025-04-29'::date,'This is it café','P 500 ml',64,7854.08,'This is it café','Sanikpuri'),
  -- May 2025
  ('2025-05-03'::date,'Biryanis and More, Ameerpet','P 1000 ml',44,5015.47,'Biryanis and More','Ameerpet'),
  ('2025-05-06'::date,'Deccan kitchen 750 ml','AL 750 ml',78,7731.36,'Deccan kitchen','Film nagar'),
  ('2025-05-13'::date,'Gismat-Ameerpet','P 500 ml',135,16567.20,'Jismat','Ameerpet'),
  ('2025-05-13'::date,'Gismat-Dilshuknagar','P 500 ml',150,18408.00,'Jismat','Dilshuknagar'),
  ('2025-05-17'::date,'Biryanis and More, Nizampet','P 1000 ml',75,8549.10,'Biryanis and More','Nizampet'),
  ('2025-05-17'::date,'Biryanis and More, Tirumalagiri','P 1000 ml',75,8549.10,'Biryanis and More','Tirumalagiri'),
  ('2025-05-18'::date,'Biryanis and More, Ongole','P 1000 ml',310,35336.28,'Biryanis and More','Ongole'),
  ('2025-05-20'::date,'Gismat-Ameerpet','P 500 ml',140,17180.80,'Jismat','Ameerpet'),
  ('2025-05-20'::date,'Gismat-Chandha Nagar','P 500 ml',40,4908.80,'Jismat','Chandha Nagar'),
  ('2025-05-24'::date,'Biryanis and More, Khammam','P 1000 ml',250,28497.00,'Biryanis and More','Khammam'),
  ('2025-05-24'::date,'Biryanis and More, Warangal','P 1000 ml',370,42175.56,'Biryanis and More','Warangal'),
  ('2025-05-28'::date,'Deccan kitchen 250 ml','250 EC',39,5798.52,'Deccan kitchen','Film nagar'),
  ('2025-05-28'::date,'Deccan kitchen 750 ml','P 750 ml',132,13083.84,'Deccan kitchen','Film nagar'),
  ('2025-05-28'::date,'Gismat-Dilshuknagar','P 500 ml',153,18776.16,'Jismat','Dilshuknagar'),
  ('2025-05-28'::date,'This is it café','P 500 ml',110,13499.20,'This is it café','Sanikpuri'),
  ('2025-05-29'::date,'Gismat-Ameerpet','P 500 ml',100,12272.00,'Jismat','Ameerpet'),
  ('2025-05-29'::date,'Gismat-Pragathi nagar','P 500 ml',50,6136.00,'Jismat','Pragathi nagar'),
  ('2025-05-30'::date,'Atias Kitchen','P 1000 ml',85,9688.98,'Atias Kitchen','Gandipet'),
  ('2025-05-30'::date,'Biryanis and More, Gachibowli','P 1000 ml',130,14818.44,'Biryanis and More','Gachibowli'),
  ('2025-05-30'::date,'Gismat-Kondapur','P 500 ml',160,19635.20,'Jismat','Kondapur'),
  ('2025-05-31'::date,'Biryanis and More, Ameerpet','P 1000 ml',115,13108.62,'Biryanis and More','Ameerpet'),
  ('2025-05-31'::date,'House Party','P 500 ml',73,8958.56,'House party','Sanikpuri'),
  -- Jun 2025
  ('2025-06-06'::date,'Gismat-Chandha Nagar','P 500 ml',120,14726.40,'Jismat','Chandha Nagar'),
  ('2025-06-08'::date,'Gismat-Ameerpet','P 500 ml',58,7117.76,'Jismat','Ameerpet'),
  ('2025-06-12'::date,'Fusion Aroma','P 1000 ml',20,2279.76,'Fusion Aroma','Nallagandla'),
  ('2025-06-12'::date,'Gismat-Dilshuknagar','P 500 ml',125,15340.00,'Jismat','Dilshuknagar'),
  ('2025-06-15'::date,'Biryanis and More, Gachibowli','P 1000 ml',125,14248.50,'Biryanis and More','Gachibowli'),
  ('2025-06-15'::date,'Tilaks kitchen','P 500 ml',28,3436.16,'Tilaks kitchen','Madhapur'),
  ('2025-06-17'::date,'Gismat-Ameerpet','P 500 ml',150,18408.00,'Jismat','Ameerpet'),
  ('2025-06-21'::date,'Gismat-Dilshuknagar','P 500 ml',50,6136.00,'Jismat','Dilshuknagar'),
  ('2025-06-21'::date,'Tilaks kitchen','P 500 ml',55,6749.60,'Tilaks kitchen','Madhapur'),
  ('2025-06-22'::date,'Biryanis and More, Narakoduru','P 1000 ml',160,18238.08,'Biryanis and More','Narakoduru'),
  ('2025-06-22'::date,'Gismat-Lakshmipuram','P 500 ml',160,19635.20,'Jismat','Lakshmipuram'),
  ('2025-06-24'::date,'Biryanis and More, Gachibowli','P 1000 ml',-10,-1139.88,'Biryanis and More','Gachibowli'),
  ('2025-06-26'::date,'Gismat-Dilshuknagar','P 500 ml',85,10431.20,'Jismat','Dilshuknagar'),
  ('2025-06-26'::date,'Mid land 1000 ml - TS','P 1000 ml',64,7295.23,'Mid land','Telangana'),
  ('2025-06-27'::date,'Gismat-Ameerpet','P 500 ml',40,4908.80,'Jismat','Ameerpet'),
  ('2025-06-30'::date,'Gismat-Chandha Nagar','P 500 ml',50,6136.00,'Jismat','Chandha Nagar'),
  ('2025-06-30'::date,'Gismat-Pragathi nagar','P 500 ml',50,6136.00,'Jismat','Pragathi nagar'),
  -- Jul 2025
  ('2025-07-01'::date,'Gismat-Kondapur','P 500 ml',30,3681.60,'Jismat','Kondapur'),
  ('2025-07-02'::date,'Gismat-Ameerpet','P 500 ml',105,12885.60,'Jismat','Ameerpet'),
  ('2025-07-03'::date,'Gismat-Dilshuknagar','P 500 ml',100,12272.00,'Jismat','Dilshuknagar'),
  ('2025-07-06'::date,'Biryanis and More, Gachibowli','P 1000 ml',100,11398.80,'Biryanis and More','Gachibowli'),
  ('2025-07-06'::date,'Gismat-Kondapur','P 500 ml',30,3681.60,'Jismat','Kondapur'),
  ('2025-07-09'::date,'Gismat-Kondapur','P 500 ml',80,9817.60,'Jismat','Kondapur'),
  ('2025-07-09'::date,'Tilaks kitchen','P 500 ml',90,11044.80,'Tilaks kitchen','Madhapur'),
  -- ⚠ 07/12: client name says "750 ml" but SKU is P 500 ml per source data
  ('2025-07-12'::date,'Deccan kitchen 750 ml','P 500 ml',50,6136.00,'Deccan kitchen','Film nagar'),
  ('2025-07-12'::date,'Gismat-Ameerpet','P 500 ml',70,8590.40,'Jismat','Ameerpet'),
  ('2025-07-12'::date,'Gismat-Chandha Nagar','P 500 ml',80,9817.60,'Jismat','Chandha Nagar'),
  ('2025-07-14'::date,'Biryanis and More, Warangal','P 1000 ml',-15,-1709.82,'Biryanis and More','Warangal'),
  ('2025-07-14'::date,'Gismat-Dilshuknagar','P 500 ml',80,9817.60,'Jismat','Dilshuknagar'),
  ('2025-07-15'::date,'Biryanis and More, Ongole','P 1000 ml',190,21657.72,'Biryanis and More','Ongole'),
  ('2025-07-15'::date,'Gismat-Lakshmipuram','P 500 ml',100,12272.00,'Jismat','Lakshmipuram'),
  ('2025-07-15'::date,'Mid land 750 ml - TS','AL 750 ml',80,7929.60,'Mid land','Telangana'),
  ('2025-07-16'::date,'Benguluru Bhavan','P 500 ml',60,7363.20,'Benguluru Bhavan','Kondapur'),
  ('2025-07-16'::date,'Gismat-Kondapur','P 500 ml',49,6013.28,'Jismat','Kondapur'),
  ('2025-07-18'::date,'Gismat-Ameerpet','P 500 ml',100,12272.00,'Jismat','Ameerpet'),
  ('2025-07-22'::date,'Biryanis and More, Khammam','P 1000 ml',250,28497.00,'Biryanis and More','Khammam'),
  ('2025-07-22'::date,'Mid land 750 ml - AP','AL 750 ml',130,12885.60,'Mid land',null),
  ('2025-07-23'::date,'Biryanis and More, Tirumalagiri','P 1000 ml',50,5699.40,'Biryanis and More','Tirumalagiri'),
  ('2025-07-24'::date,'Gismat-DilshukNagar','P 500 ml',100,12272.00,'Jismat','Dilshuknagar'),
  ('2025-07-25'::date,'Biryanis and More, Gachibowli','P 1000 ml',50,5699.40,'Biryanis and More','Gachibowli'),
  ('2025-07-25'::date,'Biryanis and More, Warangal','P 1000 ml',250,28497.00,'Biryanis and More','Warangal'),
  ('2025-07-26'::date,'Gismat-Ameerpet','P 500 ml',70,8590.40,'Jismat','Ameerpet'),
  ('2025-07-27'::date,'Biryanis and More, Ongole','P 1000 ml',-5,-569.94,'Biryanis and More','Ongole'),
  ('2025-07-29'::date,'Biryanis and More, Nizampet','P 1000 ml',50,5699.40,'Biryanis and More','Nizampet'),
  ('2025-07-29'::date,'Gismat-Ameerpet','P 500 ml',20,2454.40,'Jismat','Ameerpet'),
  ('2025-07-29'::date,'Gismat-Pragathi Nagar','P 500 ml',50,6136.00,'Jismat','Pragathi nagar'),
  -- Aug 2025
  ('2025-08-02'::date,'Jagan Pan House 1000 ml','P 1000 ml',80,9119.04,'Jagan Pan House',null),
  ('2025-08-02'::date,'Mid land 750 ml - TS','AL 750 ml',210,20815.20,'Mid land','Telangana'),
  ('2025-08-02'::date,'jagan Pan House 500 ml','P 500 ml',30,3681.60,'Jagan Pan House',null),
  ('2025-08-05'::date,'Gismat-Chandha Nagar','P 500 ml',50,6136.00,'Jismat','Chandha Nagar'),
  ('2025-08-05'::date,'Gismat-DilshukNagar','P 500 ml',50,6136.00,'Jismat','Dilshuknagar'),
  ('2025-08-08'::date,'Biryanis and More, Gachibowli','P 1000 ml',100,11398.80,'Biryanis and More','Gachibowli'),
  ('2025-08-08'::date,'Gismat-DilshukNagar','P 500 ml',100,12272.00,'Jismat','Dilshuknagar'),
  ('2025-08-08'::date,'Gismat-Kondapur','P 500 ml',100,12272.00,'Jismat','Kondapur'),
  ('2025-08-08'::date,'Gismat-Lakshmipuram','P 500 ml',150,18408.00,'Jismat','Lakshmipuram'),
  ('2025-08-13'::date,'Mid land 750 ml - AP','AL 750 ml',300,29736.00,'Mid land',null),
  ('2025-08-14'::date,'Maryadha Ramanna - Kondapur','P 500 ml',105,12885.60,'Maryadha Ramanna','Kondapur'),
  ('2025-08-16'::date,'Gismat-Ameerpet','P 500 ml',90,11044.80,'Jismat','Ameerpet'),
  ('2025-08-16'::date,'Maryadha Ramanna - L B Nagar','P 500 ml',100,12272.00,'Maryadha Ramanna','L B Nagar'),
  ('2025-08-20'::date,'Biryanis and More, Chandha Nagar','P 1000 ml',50,5699.40,'Biryanis and More','Chandha Nagar'),
  ('2025-08-20'::date,'Tilaks kitchen','P 500 ml',35,4295.20,'Tilaks kitchen','Madhapur'),
  ('2025-08-21'::date,'Alley 91 - 250 ml','250 EC',10,1486.80,'Alley 91','Nanakramguda'),
  ('2025-08-22'::date,'Gismat-DilshukNagar','P 500 ml',50,6136.00,'Jismat','Dilshuknagar'),
  ('2025-08-25'::date,'Alley 91','P 500 ml',25,3068.00,'Alley 91','Nanakramguda'),
  ('2025-08-25'::date,'Chaitanya''s Modern Kitchen','EL 500 ml',20,2265.60,'Chaitanya''s Modern Kitchen',null),
  ('2025-08-25'::date,'Gismat-Ameerpet','P 500 ml',100,12272.00,'Jismat','Ameerpet'),
  ('2025-08-26'::date,'Biryanis and More, Gachibowli','P 1000 ml',85,9688.98,'Biryanis and More','Gachibowli'),
  ('2025-08-26'::date,'Gismat-Kondapur','P 500 ml',50,6136.00,'Jismat','Kondapur'),
  ('2025-08-26'::date,'Maryadha Ramanna - Kondapur','P 500 ml',100,12272.00,'Maryadha Ramanna','Kondapur'),
  ('2025-08-26'::date,'Mid land 750 ml - TS','AL 750 ml',295,29240.40,'Mid land','Telangana'),
  ('2025-08-26'::date,'Tilaks kitchen','P 500 ml',100,12272.00,'Tilaks kitchen','Madhapur'),
  ('2025-08-29'::date,'Maryadha Ramanna - L B Nagar','P 500 ml',45,5522.40,'Maryadha Ramanna','L B Nagar'),
  -- Sep 2025
  ('2025-09-01'::date,'Gismat-DilshukNagar','P 500 ml',80,9817.60,'Jismat','Dilshuknagar'),
  ('2025-09-01'::date,'Gismat-Kondapur','P 500 ml',65,7976.80,'Jismat','Kondapur'),
  ('2025-09-05'::date,'Gismat-DilshukNagar','P 500 ml',120,14726.40,'Jismat','Dilshuknagar'),
  ('2025-09-06'::date,'Biryanis and More, Warangal','P 1000 ml',250,28497.00,'Biryanis and More','Warangal'),
  ('2025-09-08'::date,'Alley 91 - 250 ml','250 EC',7,1040.76,'Alley 91','Nanakramguda'),
  ('2025-09-08'::date,'Atias Kitchen','P 1000 ml',42,4787.50,'Atias Kitchen','Gandipet'),
  ('2025-09-08'::date,'Tilaks kitchen','P 500 ml',98,12026.56,'Tilaks kitchen','Madhapur'),
  ('2025-09-09'::date,'Gismat-Ameerpet','P 1000 ml',100,11398.80,'Jismat','Ameerpet'),
  ('2025-09-12'::date,'Chaitanya''s Modern Kitchen','P 1000 ml',50,5699.40,'Chaitanya''s Modern Kitchen',null),
  ('2025-09-12'::date,'Gismat-Pragathi Nagar','P 500 ml',50,6136.00,'Jismat','Pragathi nagar'),
  ('2025-09-16'::date,'Biryanis and More, Gachibowli','P 1000 ml',100,11398.80,'Biryanis and More','Gachibowli'),
  ('2025-09-16'::date,'Deccan kitchen 750 ml','P 750 ml',25,2478.00,'Deccan kitchen','Film nagar'),
  ('2025-09-16'::date,'Gismat-Dilshuknagar','P 500 ml',75,9204.00,'Jismat','Dilshuknagar'),
  ('2025-09-17'::date,'Biryanis and More, Khammam','P 1000 ml',300,34196.40,'Biryanis and More','Khammam'),
  ('2025-09-17'::date,'Maryadha Ramanna - Kondapur','P 500 ml',100,12272.00,'Maryadha Ramanna','Kondapur'),
  ('2025-09-18'::date,'Alley 91 - 250 ml','250 EC',15,2230.20,'Alley 91','Nanakramguda'),
  ('2025-09-18'::date,'Biryanis and More, Chandha Nagar','P 1000 ml',50,5699.40,'Biryanis and More','Chandha Nagar'),
  ('2025-09-18'::date,'Biryanis and More, Tirumalagiri','P 1000 ml',50,5699.40,'Biryanis and More','Tirumalagiri'),
  ('2025-09-18'::date,'Chaitanya''s Modern Kitchen','AL 500 ml',29,3558.88,'Chaitanya''s Modern Kitchen',null),
  ('2025-09-18'::date,'Gismat-Kondapur','P 500 ml',120,14726.40,'Jismat','Kondapur'),
  ('2025-09-19'::date,'Biryanis and More, Narakoduru','P 1000 ml',175,19947.90,'Biryanis and More','Narakoduru'),
  ('2025-09-19'::date,'Biryanis and More, Ongole','P 1000 ml',325,37046.10,'Biryanis and More','Ongole'),
  ('2025-09-19'::date,'Gismat-Lakshmipuram','P 500 ml',200,24544.00,'Jismat','Lakshmipuram'),
  ('2025-09-23'::date,'Alley 91','P 500 ml',33,4049.76,'Alley 91','Nanakramguda'),
  ('2025-09-23'::date,'Chaitanya''s Modern Kitchen','AL 500 ml',27,3313.44,'Chaitanya''s Modern Kitchen',null),
  ('2025-09-23'::date,'Deccan kitchen 250 ml','250 EC',35,5203.80,'Deccan kitchen','Film nagar'),
  ('2025-09-23'::date,'Deccan kitchen 750 ml','P 750 ml',30,2973.60,'Deccan kitchen','Film nagar'),
  ('2025-09-24'::date,'Gismat-Dilshuknagar','P 500 ml',120,14726.40,'Jismat','Dilshuknagar'),
  ('2025-09-26'::date,'Gismat-Ameerpet','P 500 ml',70,8590.40,'Jismat','Ameerpet'),
  ('2025-09-26'::date,'Maryadha Ramanna - L B Nagar','P 500 ml',50,6136.00,'Maryadha Ramanna','L B Nagar'),
  ('2025-09-27'::date,'Gismat-Chandha Nagar','P 500 ml',50,6136.00,'Jismat','Chandha Nagar'),
  ('2025-09-29'::date,'Maryadha Ramanna - L B Nagar','P 500 ml',80,9817.60,'Maryadha Ramanna','L B Nagar')
)
INSERT INTO public.factory_payables
  (transaction_date, description, sku, quantity, amount, transaction_type, customer_id, created_at, updated_at)
SELECT
  t.txn_date,
  t.description,
  t.sku,
  t.qty,
  t.amount,
  'production',
  (
    SELECT c.id FROM public.customers c
    WHERE (t.dlr IS NULL OR c.client_name ILIKE t.dlr)
      AND (t.area IS NULL OR c.branch ILIKE t.area)
    ORDER BY c.id
    LIMIT 1
  ),
  NOW(),
  NOW()
FROM new_txns t
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables fp
  WHERE fp.transaction_date::date = t.txn_date
    AND fp.sku                    = t.sku
    AND fp.quantity               = t.qty
    AND fp.description            = t.description
    AND fp.transaction_type       = 'production'
);
