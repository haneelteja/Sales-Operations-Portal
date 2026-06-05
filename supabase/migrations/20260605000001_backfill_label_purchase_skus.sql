-- Backfill null SKUs on label_purchases using each client's configured SKU

-- P 500 ml
UPDATE label_purchases
SET sku = 'P 500 ml'
WHERE id IN (
  '38fab926-1b47-42ba-8461-40192f6e4a46', -- 5/19 Jismat
  '04b481c7-c132-427a-be88-e4394e9ef0a0', -- 5/19 Hiyya Dino Mandi
  '5109513f-30a7-481d-9d85-af7054c25f2a', -- 5/19 Hiyya Chrono Jail Mandi
  'f58d5538-f3ce-4152-a9fa-21266b03660c', -- 5/16 Soul of South
  'eba0ebbc-a8fc-4627-a0f1-85d5c50dee56', -- 5/16 Benguluru Bhavan
  '677782e6-2141-4ebb-b7c0-806b7f03c8ca', -- 5/16 Gismat
  '886a31e7-20d9-4a1d-888d-ba050f11cbe2', -- 5/16 This is it café
  '2bd87811-0865-4596-bfed-44d92f310de7', -- 5/8  Hiyya Dino Mandi
  'c53cb01c-3e4f-4ccf-8419-78fc194ed585', -- 5/6  Hiyya Dino Mandi (Haneel)
  '7854090a-d03d-4e39-9df2-2ccd09e7ca3d', -- 4/30 Chaitanya's Modern Kitchen
  'c123c076-127b-486f-ae5c-45b7a48da351', -- 4/30 Gismat
  '641e494d-0a16-44e2-a03c-84c3fd5842b2', -- 4/28 Chaitanya's Modern Kitchen
  'f3a0f264-5887-4639-9da0-f2c018013735', -- 4/28 Iron hill café
  '01e41eb1-6bfd-4b3d-940d-36f7185976c4', -- 4/28 Soul of South
  'ee995ffd-1a02-452f-96d9-81c308066138', -- 4/28 Maryadha Ramanna
  '70ad2e41-f1e0-4bc6-b2a2-2060b7714728', -- 4/28 Benguluru Bhavan
  'e35177a0-f33d-4918-bfc0-9c8018296f17', -- 4/28 Gismat
  '59310645-4f9e-4be4-b2c0-eb73f0420b14', -- 4/11 Iron hill café (JSR Printers)
  '4b11fe30-7c77-44df-a9ff-5f328a5a0c7c', -- 3/31 Chaitanya's Modern Kitchen
  'b89d9c04-b1d6-44a4-b9af-940ee9737ff8', -- 3/31 Benguluru Bhavan
  '51a3d084-b2dc-49b1-b5ca-47836d72a245', -- 3/31 This is it café
  '3b702474-0ecc-40c3-8afb-1f89f29a5d70'  -- 3/31 Tara South Indian
);

-- P 1000 ml
UPDATE label_purchases
SET sku = 'P 1000 ml'
WHERE id IN (
  'abffb97e-31c3-4a91-a550-9d0c0d19af9d', -- 5/16 Element E7
  'c7f4f6ca-1377-41d9-b244-1faa5f946ab6', -- 5/16 Tawalogy
  '513aecb1-e44f-4276-892a-0fc04d1407ae', -- 5/16 Biryanis and More
  'f750728b-1f96-4212-b766-8b91873c0dcf'  -- 4/28 Biryanis and More
);

-- P 750 ml
UPDATE label_purchases
SET sku = 'P 750 ml'
WHERE id IN (
  '594dae9a-f445-4e0b-abeb-3fc297c2bebb', -- 4/30 Illuzion
  '795423ff-3eb4-4ae7-9308-504864305308'  -- 3/31 Illuzion
);

-- AL 500 ml
UPDATE label_purchases
SET sku = 'AL 500 ml'
WHERE id = 'ab650a18-9f84-4865-bf31-2e5ae8bec795'; -- 3/31 Aaha (GMG labels)
