-- Bulk update mrp_per_bottle based on provided MRP list (2026-07-24)
-- Updates all pricing rows for each (client_name, branch, sku) combination.

UPDATE customers SET mrp_per_bottle = 7
WHERE client_name = 'Alley 91' AND branch = 'Nanakramguda' AND sku = '250 EC';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'Alley 91' AND branch = 'Nanakramguda' AND sku = 'P 250 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Alley 91' AND branch = 'Nanakramguda' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'Angana Caters' AND branch = 'Hyderabad' AND sku = 'P 250 ml';

UPDATE customers SET mrp_per_bottle = 50
WHERE client_name = 'Ballu Kitchen' AND branch = 'Kondapur' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Benguluru Bhavan' AND branch = 'Kondapur' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 42
WHERE client_name = 'Biryanis and More' AND sku = 'P 1000 ml'
  AND branch IN ('Ameerpet','Chandha Nagar','Gachibowli','Khammam','Narakoduru','Nizampet','Ongole','Tirumalagiri','Warangal');

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Chaitanya''s Modern Kitchen' AND branch = 'Khajaguda' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 20
WHERE client_name = 'Chandhu Poda Marriage Order' AND branch = 'Ongole' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 40
WHERE client_name = 'Element E7' AND branch = 'Kukatpally' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Embassy Twilight' AND branch = 'Financial District' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'First Cut' AND branch = 'Gowlidoddi' AND sku = 'P 250 ml';

-- Gismat/Jismat: match both names since branches were partially renamed in DB
UPDATE customers SET mrp_per_bottle = 30
WHERE client_name IN ('Gismat','Jismat') AND sku = 'P 500 ml'
  AND branch IN ('Ameerpet','Chandha Nagar','Dilshuknagar','Hyderabad','Kondapur','Pragathi nagar','Tenali');

UPDATE customers SET mrp_per_bottle = 50
WHERE client_name = 'Golden Pavilion' AND branch = 'Banjara Hills' AND sku = 'AL 750 ml';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'Gunugu Caters' AND branch = 'Gowlidoddi' AND sku = 'EL 250 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Happy Monkeys' AND branch = 'Nagole' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Hiyya Chrono Jail Mandi' AND branch = 'Madhapur' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Hiyya Dino Mandi' AND branch = 'Kukatpally' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'House party' AND branch = 'Sanikpuri' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 7
WHERE client_name = 'Illuzion' AND branch = 'Jubliee Hills' AND sku = 'EL 250 ml';

UPDATE customers SET mrp_per_bottle = 100
WHERE client_name = 'Illuzion' AND branch = 'Jubliee Hills' AND sku = 'P 750 ml';

-- café name: use ILIKE prefix to handle encoding variations
UPDATE customers SET mrp_per_bottle = 30
WHERE client_name ILIKE 'Iron hill caf%' AND branch = 'Madhapur' AND sku = 'P 500 ml';

-- lowercase j: ILIKE handles case insensitivity
UPDATE customers SET mrp_per_bottle = 30
WHERE client_name ILIKE 'jagan Pan House' AND branch = 'Bhoodan Pochampally' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Krigo' AND branch = 'Elluru' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Maryadha Ramanna' AND branch = 'Kondapur' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Maryadha Ramanna' AND branch = 'L B Nagar' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'One Bite' AND branch = 'Jeedimetla' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 20
WHERE client_name = 'One Bite' AND branch = 'Jeedimetla' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Soul of South' AND branch = 'Film nagar' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Soul of South' AND branch = 'Financial District' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Sri Sri group' AND branch = 'Khammam' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'SSKL' AND branch = 'Kalamandir - Hyderabad' AND sku = 'P 250 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Tara South Indian' AND branch = 'Hitech City' AND sku = 'P 500 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Tawalogy' AND branch = 'Gandipet' AND sku = 'P 1000 ml';

UPDATE customers SET mrp_per_bottle = 10
WHERE client_name = 'Thangedu' AND branch = 'Hitech City' AND sku = 'EL 250 ml';

UPDATE customers SET mrp_per_bottle = 30
WHERE client_name = 'Thatha Kottu Tiffins' AND branch = 'Madhapur' AND sku = 'P 500 ml';

-- café name: use ILIKE prefix to handle encoding variations
UPDATE customers SET mrp_per_bottle = 30
WHERE client_name ILIKE 'This is it caf%' AND branch = 'Sanikpuri' AND sku = 'P 500 ml';
