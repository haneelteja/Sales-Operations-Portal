-- ==============================================
-- INSERT SALES TRANSACTIONS FOR JULY 2025 TO JANUARY 2026
-- This script inserts sales transactions with auto-calculated amounts
-- Amount = cases × price_per_bottle (from customers) × bottles_per_case (from factory_pricing)
-- 
-- IMPORTANT: This script prevents duplicates - it will NOT insert if the same transaction already exists
-- It does NOT delete existing records - it only adds new ones that don't exist
-- ==============================================

WITH transaction_data AS (
  SELECT * FROM (VALUES 
    ('7/1/2025', 'Alley 91', 'Nanakramguda', '500 P', 46.00),
    ('7/1/2025', 'Gismat', 'Kondapur', '500 P', 30.00),
    ('7/1/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 59.00),
    ('7/1/2025', 'This is it café', 'Sanikpuri', '500 P', 100.00),
    ('7/2/2025', 'Element E7', 'Kukatpally', '1000 P', 102.00),
    ('7/2/2025', 'Gismat', 'Ameerpet', '500 P', 103.50),
    ('7/2/2025', 'Gismat', 'Ameerpet', '500 P', 1.50),
    ('7/3/2025', 'Gismat', 'DilshukNagar', '500 P', 100.00),
    ('7/6/2025', 'House Party', 'Sanikpuri', '500 P', 55.00),
    ('7/6/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 22.00),
    ('7/6/2025', 'Gismat', 'Kondapur', '500 P', 30.00),
    ('7/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('7/9/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 90.00),
    ('7/9/2025', 'Gismat', 'Kondapur', '500 P', 80.00),
    ('7/9/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 70.00),
    ('7/11/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 90.00),
    ('7/12/2025', 'Gismat', 'Chandha Nagar', '500 P', 80.00),
    ('7/12/2025', 'Gismat', 'Ameerpet', '500 P', 70.00),
    ('7/12/2025', 'Deccan kitchen', 'Film nagar', '750 P', 50.00),
    ('7/14/2025', 'Gismat', 'DilshukNagar', '500 P', 80.00),
    ('7/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 190.00),
    ('7/15/2025', 'Gismat', 'Lakshmipuram', '500 P', 100.00),
    ('7/15/2025', 'Mid land', 'Telangana', '750 AL', 80.00),
    ('7/15/2025', 'Gismat', 'Kondapur', '500 P', 49.00),
    ('7/15/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 60.00),
    ('7/18/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('7/18/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 100.00),
    ('7/20/2025', 'House Party', 'Sanikpuri', '500 P', 50.00),
    ('7/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('7/22/2025', 'Mid land', 'Andhra Pradesh', '750 AL', 130.00),
    ('7/23/2025', 'Blossamin Spa', 'Tirumalagiri', '250 P', 35.00),
    ('7/23/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('7/24/2025', 'Gismat', 'DilshukNagar', '500 P', 100.00),
    ('7/25/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('7/25/2025', 'This is it café', 'Sanikpuri', '500 P', 50.00),
    ('7/25/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 50.00),
    ('7/25/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('7/25/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 59.00),
    ('7/26/2025', 'Blossamin Spa', 'Tirumalagiri', '250 P', 10.00),
    ('7/26/2025', 'Gismat', 'Ameerpet', '500 P', 70.00),
    ('7/26/2025', 'Element E7', 'Kukatpally', '1000 P', 80.00),
    ('7/29/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 30.00),
    ('7/29/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00),
    ('7/29/2025', 'Gismat', 'Ameerpet', '500 P', 20.00),
    ('7/29/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('7/31/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 45.00),
    ('8/2/2025', 'Jagan Pan House', 'Bhoodan Pochampally', '1000 P', 80.00),
    ('8/2/2025', 'Jagan Pan House', 'Bhoodan Pochampally', '500 P', 30.00),
    ('8/2/2025', 'Mid land', 'Telangana', '750 AL', 210.00),
    ('8/2/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 40.00),
    ('8/2/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 100.00),
    ('8/4/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 70.00),
    ('8/4/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('8/5/2025', 'Gismat', 'Dilshuknagar', '500 P', 50.00),
    ('8/5/2025', 'Gismat', 'Ameerpet', '500 P', 20.00),
    ('8/5/2025', 'Gismat', 'Chandha nagar', '500 P', 30.00),
    ('8/5/2025', 'Gismat', 'Chandha nagar', '500 P', 20.00),
    ('8/5/2025', 'Element E7', 'Kukatpally', '1000 P', 100.00),
    ('8/6/2025', 'This is it café', 'Sanikpuri', '500 P', 52.00),
    ('8/6/2025', 'House Party', 'Sanikpuri', '500 P', 42.00),
    ('8/8/2025', 'Chandhu Poda Marriage Order', 'Ongole', '250 P', 245.00),
    ('8/8/2025', 'Gismat', 'Lakshmipuram', '500 P', 150.00),
    ('8/8/2025', 'Gismat', 'Dilshuknagar', '500 P', 100.00),
    ('8/8/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('8/8/2025', 'Gismat', 'Kondapur', '500 P', 100.00),
    ('8/13/2025', 'Mid land', 'Andhra Pradesh', '750 AL', 300.00),
    ('8/14/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('8/14/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 105.00),
    ('8/15/2025', 'Alley 91', 'Nanakramguda', '500 P', 25.00),
    ('8/15/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 40.00),
    ('8/16/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 100.00),
    ('8/16/2025', 'Gismat', 'Ameerpet', '500 P', 90.00),
    ('8/20/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 35.00),
    ('8/20/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('8/21/2025', 'House Party', 'Sanikpuri', '500 P', 38.00),
    ('8/21/2025', 'This is it café', 'Sanikpuri', '500 P', 40.00),
    ('8/21/2025', 'Alley 91', 'Nanakramguda', '250 EC', 10.00),
    ('8/22/2025', 'Gismat', 'Dilshuknagar', '500 P', 50.00),
    ('8/23/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('8/23/2025', 'Element E7', 'Kukatpally', '1000 P', 27.00),
    ('8/25/2025', 'Alley 91', 'Nanakramguda', '500 P', 25.00),
    ('8/25/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 55.00),
    ('8/25/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('8/25/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 20.00),
    ('8/26/2025', 'Mid land', 'Telangana', '750 AL', 295.00),
    ('8/26/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 100.00),
    ('8/26/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 100.00),
    ('8/26/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 85.00),
    ('8/26/2025', 'Gismat', 'Kondapur', '500 P', 50.00),
    ('8/29/2025', 'House Party', 'Sanikpuri', '500 P', 25.00),
    ('8/29/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 45.00),
    ('8/30/2025', 'Element E7', 'Kukatpally', '1000 P', 125.00),
    ('9/1/2025', 'Gismat', 'Dilshuknagar', '500 P', 80.00),
    ('9/1/2025', 'Gismat', 'Kondapur', '500 P', 65.00),
    ('9/1/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 89.00),
    ('9/5/2025', 'This is it café', 'Sanikpuri', '500 P', 19.00),
    ('9/5/2025', 'House Party', 'Sanikpuri', '500 P', 40.00),
    ('9/5/2025', 'Gismat', 'Dilshuknagar', '500 P', 120.00),
    ('9/6/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('9/8/2025', 'Tilaks Kitchen', 'Madhapur', '500 P', 98.00),
    ('9/8/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 120.00),
    ('9/8/2025', 'Alley 91', 'Nanakramguda', '500 P', 31.00),
    ('9/8/2025', 'Alley 91', 'Nanakramguda', '250 EC', 7.00),
    ('9/8/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 42.00),
    ('9/9/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('9/9/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 35.00),
    ('9/11/2025', 'This is it café', 'Sanikpuri', '500 P', 50.00),
    ('9/12/2025', 'Element E7', 'Kukatpally', '1000 P', 75.00),
    ('9/12/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00),
    ('9/12/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('9/16/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('9/16/2025', 'Deccan kitchen', 'Film nagar', '750 P', 26.00),
    ('9/16/2025', 'This is it café', 'Sanikpuri', '500 P', 25.00),
    ('9/16/2025', 'House Party', 'Sanikpuri', '500 P', 35.00),
    ('9/16/2025', 'Gismat', 'Dilshuknagar', '500 P', 75.00),
    ('9/17/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 100.00),
    ('9/17/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('9/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 300.00),
    ('9/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('9/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('9/18/2025', 'Alley 91', 'Nanakramguda', '250 EC', 15.00),
    ('9/18/2025', 'Gismat', 'Kondapur', '500 P', 120.00),
    ('9/18/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 29.00),
    ('9/19/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 325.00),
    ('9/19/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 175.00),
    ('9/19/2025', 'Gismat', 'Lakshmipuram', '500 P', 200.00),
    ('9/23/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 27.00),
    ('9/23/2025', 'Alley 91', 'Nanakramguda', '500 P', 33.00),
    ('9/23/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 33.00),
    ('9/23/2025', 'Deccan kitchen', 'Film nagar', '750 P', 30.00),
    ('9/23/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 35.00),
    ('9/24/2025', 'Gismat', 'Dilshuknagar', '500 P', 120.00),
    ('9/26/2025', 'Gismat', 'Ameerpet', '500 P', 70.00),
    ('9/26/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 50.00),
    ('9/27/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('9/27/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 50.00),
    ('9/27/2025', 'Gismat', 'Chandha nagar', '500 P', 50.00),
    ('9/29/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 80.00),
    ('10/1/2025', 'House Party', 'Sanikpuri', '500 P', 50.00),
    ('10/1/2025', 'This is it café', 'Sanikpuri', '500 P', 60.00),
    ('10/1/2025', 'Element E7', 'Kukatpally', '1000 P', 100.00),
    ('10/6/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('10/6/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 111.00),
    ('10/6/2025', 'Tara South Indian', 'Hitech City', '500 P', 32.00),
    ('10/6/2025', 'Gismat', 'Dilshuknagar', '500 P', 100.00),
    ('10/7/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 100.00),
    ('10/7/2025', 'Alley 91', 'Nanakramguda', '500 P', 27.00),
    ('10/7/2025', 'Alley 91', 'Nanakramguda', '250 EC', 10.00),
    ('10/9/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 320.00),
    ('10/9/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('10/9/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('10/9/2025', 'AAHA', 'Khajaguda', '500 AL', 10.00),
    ('10/13/2025', 'House Party', 'Sanikpuri', '500 P', 70.00),
    ('10/14/2025', 'Deccan kitchen', 'Film nagar', '750 P', 64.00),
    ('10/14/2025', 'Gismat', 'Kondapur', '500 P', 100.00),
    ('10/14/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 55.00),
    ('10/15/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 100.00),
    ('10/15/2025', 'Gismat', 'Dilshuknagar', '500 P', 80.00),
    ('10/16/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 120.00),
    ('10/16/2025', 'This is it café', 'Sanikpuri', '500 P', 51.00),
    ('10/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('10/17/2025', 'Element E7', 'Kukatpally', '1000 P', 100.00),
    ('10/17/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('10/19/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 120.00),
    ('10/21/2025', 'Gismat', 'Lakshmipuram', '500 P', 175.00),
    ('10/21/2025', 'Gismat', 'Tenali', '500 P', 175.00),
    ('10/23/2025', 'Gismat', 'Dilshuknagar', '500 P', 120.00),
    ('10/23/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 20.00),
    ('10/25/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('10/25/2025', 'Tara South Indian', 'Hitech City', '500 P', 100.00),
    ('10/27/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 70.00),
    ('10/27/2025', 'Gismat', 'Main office', '500 P', 10.00),
    ('10/27/2025', 'soul of south', 'Film nagar', '500 P', 49.00),
    ('10/27/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 300.00),
    ('10/31/2025', 'Gismat', 'Chandha nagar', '500 P', 40.00),
    ('10/31/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 31.00),
    ('10/31/2025', 'AAHA', 'Khajaguda', '500 AL', 115.00),
    ('10/31/2025', 'House Party', 'Sanikpuri', '500 P', 30.00),
    ('10/31/2025', 'This is it café', 'Sanikpuri', '500 P', 40.00),
    ('11/2/2025', 'Alley 91', 'Nanakramguda', '500 P', 50.00),
    ('11/2/2025', 'Alley 91', 'Nanakramguda', '250 EC', 10.00),
    ('11/3/2025', 'Gismat', 'Ameerpet', '500 P', 30.00),
    ('11/3/2025', 'Gismat', 'Kondapur', '500 P', 20.00),
    ('11/3/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 50.00),
    ('11/4/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 40.00),
    ('11/5/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 40.00),
    ('11/5/2025', 'Gismat', 'Dilshuknagar', '500 P', 80.00),
    ('11/5/2025', 'Gismat', 'Dilshuknagar', '500 P', 25.00),
    ('11/5/2025', 'Gismat', 'Ameerpet', '500 P', 25.00),
    ('11/5/2025', 'Gismat', 'Ameerpet', '500 P', 80.00),
    ('11/5/2025', 'Intercity', 'Bachupally', '500 EC', 30.00),
    ('11/6/2025', 'Gismat', 'Kondapur', '500 P', 100.00),
    ('11/6/2025', 'Element E7', 'Kukatpally', '1000 P', 120.00),
    ('11/6/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 100.00),
    ('11/6/2025', '1980s Milatry Hotel', 'Khajaguda', '750 AL', 80.00),
    ('11/7/2025', 'Gismat', 'Pragathi Nagar', '500 P', 50.00),
    ('11/7/2025', 'Intercity', 'Bachupally', '500 EC', 30.00),
    ('11/8/2025', 'AAHA', 'Khajaguda', '500 AL', 104.00),
    ('11/8/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 60.00),
    ('11/8/2025', 'Intercity', 'Bachupally', '500 EC', 30.00),
    ('11/8/2025', 'This is it café', 'Sanikpuri', '500 P', 60.00),
    ('11/8/2025', 'House Party', 'Sanikpuri', '500 P', 60.00),
    ('11/10/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 70.00),
    ('11/10/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/11/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('11/11/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('11/12/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/13/2025', 'Intercity', 'Bachupally', '500 EC', 40.00),
    ('11/14/2025', 'Intercity', 'Bachupally', '500 EC', 40.00),
    ('11/15/2025', 'Intercity', 'Bachupally', '500 EC', 40.00),
    ('11/16/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/17/2025', 'Maryadha Ramanna ', ' L B Nagar', '500 P', 100.00),
    ('11/17/2025', 'Gismat', 'Dilshuknagar', '500 P', 100.00),
    ('11/18/2025', 'Golden pavilion', 'Banjara Hills', '750 AL', 40.00),
    ('11/18/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('11/18/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/19/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 55.00),
    ('11/19/2025', 'Gismat', 'Chandha nagar', '500 P', 50.00),
    ('11/20/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/21/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 100.00),
    ('11/21/2025', 'AAHA', 'Khajaguda', '500 AL', 110.00),
    ('11/21/2025', 'Deccan kitchen', 'Film nagar', '750 P', 45.00),
    ('11/22/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('11/22/2025', 'This is it café', 'Sanikpuri', '500 P', 45.00),
    ('11/22/2025', 'soul of south', 'Film nagar', '500 P', 50.00),
    ('11/22/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/24/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/25/2025', 'Gismat', 'Kondapur', '500 P', 100.00),
    ('11/25/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 50.00),
    ('11/26/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/28/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('11/29/2025', 'Gismat', 'Chandha nagar', '500 P', 60.00),
    ('11/29/2025', 'Element E7', 'Kukatpally', '1000 P', 82.00),
    ('11/29/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('11/29/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/1/2025', 'Gismat', 'Dilshuknagar', '500 P', 85.00),
    ('12/1/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/2/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/2/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 350.00),
    ('12/3/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/4/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/4/2025', 'Alley 91', 'Nanakramguda', '500 P', 50.00),
    ('12/4/2025', 'This is it café', 'Sanikpuri', '500 P', 65.00),
    ('12/5/2025', 'Deccan kitchen', 'Film nagar', '750 P', 67.00),
    ('12/5/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 120.00),
    ('12/5/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 63.00),
    ('12/6/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/8/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 100.00),
    ('12/8/2025', 'Gismat', 'Dilshuknagar', '500 P', 120.00),
    ('12/8/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/9/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/10/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/10/2025', 'Alley 91', 'Nanakramguda', '500 P', 30.00),
    ('12/10/2025', 'Alley 91', 'Nanakramguda', '250 EC', 20.00),
    ('12/10/2025', 'Tara South Indian', 'Hitech City', '500 P', 136.00),
    ('12/12/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/13/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/14/2025', 'Intercity', 'Bachupally', '500 EC', 40.00),
    ('12/15/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/15/2025', 'Alley 91', 'Nanakramguda', '250 EC', 25.00),
    ('12/15/2025', 'Maryadha Ramanna ', ' Kondapur', '500 P', 28.00),
    ('12/16/2025', 'Gismat', 'Chandha Nagar', '500 P', 75.00),
    ('12/16/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/17/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/18/2025', 'Intercity', 'Bachupally', '500 EC', 39.00),
    ('12/19/2025', 'House Party', 'Sanikpuri', '500 P', 52.00),
    ('12/19/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 80.00),
    ('12/19/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/20/2025', 'Element E7', 'Kukatpally', '1000 P', 100.00),
    ('12/20/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/20/2025', 'Gismat', 'Dilshuknagar', '500 P', 80.00),
    ('12/20/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 118.00),
    ('12/20/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 35.00),
    ('12/20/2025', 'Hiyya Chrono Jail Mandi', 'Madhapur', '500 P', 97.00),
    ('12/21/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/21/2025', 'This is it café', 'Sanikpuri', '500 P', 19.00),
    ('12/22/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/23/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 350.00),
    ('12/23/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/23/2025', 'soul of south', 'Film nagar', '500 P', 55.00),
    ('12/23/2025', 'Alley 91', 'Nanakramguda', '250 EC', 30.00),
    ('12/23/2025', 'Alley 91', 'Nanakramguda', '500 P', 50.00),
    ('12/23/2025', 'Tawalogy', 'Gandipet', '1000 P', 50.00),
    ('12/23/2025', 'Gismat', 'Ameerpet', '500 P', 80.00),
    ('12/23/2025', 'This is it café', 'Sanikpuri', '500 P', 55.00),
    ('12/24/2025', 'Gismat', 'Dilshuknagar', '500 P', 100.00),
    ('12/24/2025', 'Gismat', 'Kondapur', '500 P', 105.00),
    ('12/24/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/25/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/26/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/27/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/27/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 100.00),
    ('12/27/2025', 'Chaitanya''s Modern Kitchen', 'Khajaguda', '500 P', 128.00),
    ('12/28/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 70.00),
    ('12/28/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/29/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 330.00),
    ('12/29/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/30/2025', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('12/31/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 109.00),
    ('12/31/2025', 'Hiyya Chrono Jail Mandi', 'Madhapur', '500 P', 100.00),
    ('12/31/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 50.00),
    ('1/1/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/2/2026', 'Golden Pavilion', 'Banjara Hills', '750 AL', 29.00),
    ('1/2/2026', 'Benguluru Bhavan', 'Kondapur', '500 P', 105.00),
    ('1/2/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/2/2026', 'Element E7', 'Kukatpally', '1000 P', 120.00),
    ('1/2/2026', 'Gismat', 'Dilshuknagar', '500 P', 100.00),
    ('1/2/2026', 'This is it café', 'Sanikpuri', '500 P', 73.00),
    ('1/2/2026', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('1/2/2026', 'House Party', 'Sanikpuri', '500 P', 50.00),
    ('1/3/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/4/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/4/2026', 'Biryanis and More', 'Ameerpet', '1000 P', 50.00),
    ('1/4/2026', 'Gismat', 'Chandha Nagar', '500 P', 50.00),
    ('1/5/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/6/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/6/2026', 'Biryanis and More', 'Ameerpet', '1000 P', 58.00),
    ('1/6/2026', 'Gismat', 'Ameerpet', '500 P', 70.00),
    ('1/6/2026', 'Happy Monkeys', 'Nagole', '500 P', 50.00),
    ('1/7/2026', 'Alley 91', 'Nanakramguda', '500 P', 50.00),
    ('1/7/2026', 'Alley 91', 'Nanakramguda', '250 EC', 42.00),
    ('1/7/2026', 'soul of south', 'Film nagar', '500 P', 75.00),
    ('1/7/2026', 'Gismat', 'Kondapur', '500 P', 110.00),
    ('1/7/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/7/2026', 'Biryanis and More', 'Ameerpet', '1000 P', 41.00),
    ('1/8/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/9/2026', 'Gismat', 'Dilshuknagar', '500 P', 130.00),
    ('1/9/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/9/2026', 'Alley 91', 'Nanakramguda', '250 EC', 50.00),
    ('1/10/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/11/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/12/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/13/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/14/2026', 'Intercity', 'Bachupally', '500 EC', 50.00),
    ('1/14/2026', 'Hiyya Chrono Jail Mandi', 'Madhapur', '500 P', 100.00),
    ('1/14/2026', 'Benguluru Bhavan', 'Kondapur', '500 P', 100.00),
    ('1/16/2026', 'Intercity', 'Bachupally', '500 EC', 50.00)
  ) AS t(transaction_date_str, client_name, branch, sku, cases)
),
-- Convert date and prepare data
prepared_data AS (
  SELECT 
    TO_DATE(t.transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle case variations and extra spaces)
    CASE 
      WHEN UPPER(TRIM(t.client_name)) = 'HOUSE PARTY' THEN 'House party'
      WHEN UPPER(TRIM(t.client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(t.client_name)) LIKE '%TILAKS%KITCHEN%' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'ELEMENT E7' THEN 'Element E7'
      WHEN UPPER(TRIM(t.client_name)) = 'DECCAN KITCHEN' THEN 'Deccan kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'GOLDEN PAVILION' OR UPPER(TRIM(t.client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(t.client_name)) = 'ATIAS KITCHEN' THEN 'Atias Kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(t.client_name)) = 'TARA SOUTH INDIAN' THEN 'Tara South Indian'
      WHEN UPPER(TRIM(t.client_name)) = 'VARSHA GRAND HOTEL' THEN 'Varsha grand Hotel'
      WHEN UPPER(TRIM(t.client_name)) = 'KRIGO' THEN 'krigo'
      WHEN UPPER(TRIM(t.client_name)) = 'MID LAND' THEN 'Mid land'
      WHEN UPPER(TRIM(t.client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(t.client_name)) = 'BIRYANIS AND MORE' THEN 'Biryanis and More'
      WHEN UPPER(TRIM(t.client_name)) = 'GOOD VIBES' THEN 'Good Vibes'
      WHEN UPPER(TRIM(t.client_name)) = 'THIS IS IT CAFÉ' THEN 'This is it café'
      WHEN UPPER(TRIM(t.client_name)) = 'GISMAT' THEN 'Gismat'
      WHEN UPPER(TRIM(t.client_name)) = 'TONIQUE' THEN 'Tonique'
      WHEN UPPER(TRIM(t.client_name)) = 'FUSION AROMA' THEN 'Fusion Aroma'
      WHEN UPPER(TRIM(t.client_name)) = 'ALLEY 91' THEN 'Alley 91'
      WHEN UPPER(TRIM(t.client_name)) = 'BLOSSAMIN SPA' THEN 'Blossamin Spa'
      WHEN UPPER(TRIM(t.client_name)) = 'JAGAN PAN HOUSE' THEN 'jagan Pan House'
      WHEN UPPER(TRIM(t.client_name)) = 'MARYADHA RAMANNA' OR UPPER(TRIM(t.client_name)) LIKE 'MARYADHA RAMANNA%' THEN 'Maryadha Ramanna'
      WHEN UPPER(TRIM(t.client_name)) = 'CHAITANYA''S MODERN KITCHEN' THEN 'Chaitanya''s Modern Kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'SOUL OF SOUTH' THEN 'soul of south'
      WHEN UPPER(TRIM(t.client_name)) = '1980S MILATRY HOTEL' THEN '1980s Milatry Hotel'
      WHEN UPPER(TRIM(t.client_name)) = 'INTERCITY' THEN 'Intercity'
      WHEN UPPER(TRIM(t.client_name)) = 'HIYYA CHRONO JAIL MANDI' THEN 'Hiyya Chrono Jail Mandi'
      WHEN UPPER(TRIM(t.client_name)) = 'TAWALOGY' THEN 'Tawalogy'
      WHEN UPPER(TRIM(t.client_name)) = 'HAPPY MONKEYS' THEN 'Happy Monkeys'
      ELSE TRIM(t.client_name)
    END as client_name,
    -- Normalize branch names (handle case variations and extra spaces)
    CASE 
      WHEN UPPER(TRIM(t.branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(t.branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(t.branch)) = 'DILSHUKNAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(t.branch)) = 'FILM NAGAR' THEN 'Film nagar'
      WHEN UPPER(TRIM(t.branch)) = 'BACHUPALLY' THEN 'Bachupally'
      WHEN UPPER(TRIM(t.branch)) = 'L B NAGAR' OR UPPER(TRIM(t.branch)) LIKE '%L B NAGAR%' THEN 'L B Nagar'
      WHEN UPPER(TRIM(t.branch)) = 'MAIN OFFICE' THEN 'Main office'
      WHEN UPPER(TRIM(t.branch)) = 'TENALI' THEN 'Tenali'
      WHEN UPPER(TRIM(t.branch)) = 'TIRUMALAGIRI' THEN 'Tirumalagiri'
      WHEN UPPER(TRIM(t.branch)) = 'ANDHRA PRADESH' THEN 'Andhra Pradesh'
      WHEN UPPER(TRIM(t.branch)) = 'BHOODAN POCHAMPALLY' THEN 'Bhoodan Pochampally'
      WHEN UPPER(TRIM(t.branch)) = 'NAGOLE' THEN 'Nagole'
      ELSE TRIM(t.branch)
    END as branch,
    t.sku,
    t.cases,
    -- Round cases to nearest integer for quantity
    ROUND(t.cases)::INTEGER as quantity
  FROM transaction_data t
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
SELECT 
  c.id as customer_id,
  'sale'::TEXT as transaction_type,
  -- Calculate amount: cases * price_per_bottle (from customers) * bottles_per_case (from factory_pricing)
  -- Get the latest factory_pricing record for this SKU on or before the transaction date
  pd.cases * c.price_per_bottle * fp.bottles_per_case as amount,
  -- total_amount is same as amount for sales
  pd.cases * c.price_per_bottle * fp.bottles_per_case as total_amount,
  pd.quantity,
  pd.sku,
  'Sale of ' || pd.cases || ' cases' as description,
  pd.transaction_date
FROM prepared_data pd
INNER JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
INNER JOIN LATERAL (
  -- Get the latest factory_pricing record for this SKU on or before transaction date
  -- Use INNER JOIN to ensure bottles_per_case exists (skip if not found)
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = pd.sku
    AND pricing_date <= pd.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
-- Only insert transactions where all required values are present
WHERE c.price_per_bottle IS NOT NULL
  AND fp.bottles_per_case IS NOT NULL
  AND pd.cases IS NOT NULL
  AND pd.cases > 0
-- Prevent duplicates: Only insert if this exact transaction doesn't already exist
  AND NOT EXISTS (
    SELECT 1 
    FROM sales_transactions st
    WHERE st.customer_id = c.id
      AND st.transaction_date = pd.transaction_date
      AND st.sku = pd.sku
      AND st.quantity = pd.quantity
      AND st.transaction_type = 'sale'
  )
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

-- Verify the import
SELECT 
  'Sales Transactions Imported' as status,
  COUNT(*) as total_transactions,
  SUM(quantity) as total_cases,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_date >= '2025-07-01' AND transaction_date <= '2026-01-31';

-- Show transactions by client with calculated amounts
SELECT 
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity as cases,
  c.price_per_bottle,
  fp.bottles_per_case,
  st.amount as calculated_amount,
  CASE 
    WHEN c.price_per_bottle IS NOT NULL AND fp.bottles_per_case IS NOT NULL 
      THEN 'Calculated: cases × price_per_bottle × bottles_per_case'
    WHEN c.price_per_bottle IS NOT NULL 
      THEN 'WARNING: Using default bottles_per_case = 1'
    ELSE 'WARNING: No price_per_bottle found - amount is 0'
  END as calculation_method
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
INNER JOIN LATERAL (
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = st.sku
    AND pricing_date <= st.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
WHERE st.transaction_date >= '2025-07-01' 
  AND st.transaction_date <= '2026-01-31'
  AND st.transaction_type = 'sale'
ORDER BY st.transaction_date, c.client_name, c.branch;

-- Check for any transactions that couldn't be matched to customers
-- (This will show if any client-branch-SKU combinations don't exist)
-- Note: This uses the same transaction_data CTE structure - see full script for complete data
