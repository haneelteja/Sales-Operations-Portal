-- Round September 2025 factory production amounts to match Elma ledger exactly (2026-07-01).
-- Also fixes Golden Pavilion 9/9 qty 35→34 (net of −1 return in sales).

UPDATE public.factory_payables SET quantity = 34                  WHERE id = '7392d208-6759-4496-9e4c-78490c5e97e3'; -- Golden Pavilion 9/9 (qty fix, amount already correct)

UPDATE public.factory_payables SET amount = 10922.00  WHERE id = 'c92b9354-b175-4605-9285-72083890d1e4'; -- Benguluru Bhavan 9/1
UPDATE public.factory_payables SET amount = 7977.00   WHERE id = 'e26d967d-9bd2-407a-b652-0127e04218b0'; -- Gismat-Kondapur 9/1
UPDATE public.factory_payables SET amount = 9818.00   WHERE id = '1177e6e5-e496-4353-bf23-877a8244aef8'; -- Gismat-DilshukNagar 9/1
UPDATE public.factory_payables SET amount = 2332.00   WHERE id = '34522cd9-4384-458f-b1da-616ac694403e'; -- This is it café 9/5
UPDATE public.factory_payables SET amount = 14726.00  WHERE id = '5d74d7f8-7df8-4429-a557-2894094bc76a'; -- Gismat-DilshukNagar 9/5
UPDATE public.factory_payables SET amount = 28497.00  WHERE id = '87646aeb-2260-4380-9978-116657653636'; -- Biryanis Warangal 9/6
UPDATE public.factory_payables SET amount = 14726.00  WHERE id = 'c003d1cb-4479-4894-a988-c11073dbe15f'; -- Benguluru Bhavan 9/8
UPDATE public.factory_payables SET amount = 12027.00  WHERE id = 'e6d5e166-39ba-415c-8cd9-7c76d8637c41'; -- Tilaks kitchen 9/8
UPDATE public.factory_payables SET amount = 3804.00   WHERE id = '292e92cd-a969-47f8-a349-13e60a0e2c51'; -- Alley 91 9/8
UPDATE public.factory_payables SET amount = 1041.00   WHERE id = 'e1c07f84-854d-40a0-bb5a-44ca5358c53a'; -- Alley 91 - 250ml 9/8
UPDATE public.factory_payables SET amount = 4787.00   WHERE id = '2caa1a4f-dbf0-4ca9-96fc-8ff81e64308e'; -- Atias Kitchen 9/8
UPDATE public.factory_payables SET amount = 12272.00  WHERE id = 'bf4a0355-c216-4827-bb39-5dda2247b968'; -- Gismat-Ameerpet 9/9
UPDATE public.factory_payables SET amount = 6136.00   WHERE id = '84f348a9-8daa-4fb0-91a7-18c0fabfca74'; -- This is it café 9/11
UPDATE public.factory_payables SET amount = 8549.00   WHERE id = '06261dbc-2a15-473b-a366-ccc63b8a3119'; -- Element E7 9/12
UPDATE public.factory_payables SET amount = 6136.00   WHERE id = '42a259d3-155f-4c18-8a72-305220d59a54'; -- Gismat-Pragathi Nagar 9/12
UPDATE public.factory_payables SET amount = 5699.00   WHERE id = '76398fcd-d814-4472-b5af-fc2a99d426bb'; -- Chaitanya's Modern Kitchen 9/12
UPDATE public.factory_payables SET amount = 11399.00  WHERE id = 'ab850e37-bffa-4575-8990-32e0e9f7dd49'; -- Biryanis Gachibowli 9/16
UPDATE public.factory_payables SET amount = 3068.00   WHERE id = '5c51ea72-ecc5-45a5-82b4-17bc1183e26f'; -- This is it café 9/16
UPDATE public.factory_payables SET amount = 4295.00   WHERE id = '45c01888-9a6e-4f3a-8dd6-3602ecf748ae'; -- House Party 9/16
UPDATE public.factory_payables SET amount = 9204.00   WHERE id = '082f710a-bb2a-4200-b0ee-9087c133654b'; -- Gismat-Dilshuknagar 9/16
UPDATE public.factory_payables SET amount = 12272.00  WHERE id = 'a9df9d86-69f9-4709-9963-0b8bccde434e'; -- Benguluru Bhavan 9/17
UPDATE public.factory_payables SET amount = 12272.00  WHERE id = '1345dedc-5226-4aa7-824f-c5fc278476b0'; -- Maryadha Ramanna Kondapur 9/17
UPDATE public.factory_payables SET amount = 34196.00  WHERE id = '4fd0d1c8-36ce-4b7e-af5a-b0efa2c45d50'; -- Biryanis Khammam 9/17
UPDATE public.factory_payables SET amount = 5699.00   WHERE id = '54e10fa8-432b-4f15-bd41-4c86e9d0e0a4'; -- Biryanis Chandha Nagar 9/18
UPDATE public.factory_payables SET amount = 5699.00   WHERE id = '5d415b45-4c6e-4e6c-9245-c2e2a9080c43'; -- Biryanis Tirumalagiri 9/18
UPDATE public.factory_payables SET amount = 2230.00   WHERE id = '5f1d5bda-8e1f-4ad6-ab97-7ac0779b04c4'; -- Alley 91 - 250ml 9/18
UPDATE public.factory_payables SET amount = 14726.00  WHERE id = '6c2206d6-2a16-4a95-8a9b-8f8e92d75e9a'; -- Gismat-Kondapur 9/18
UPDATE public.factory_payables SET amount = 3559.00   WHERE id = '203fc714-4ed4-467f-ae06-f22fafc047aa'; -- Chaitanya's Modern Kitchen 9/18
UPDATE public.factory_payables SET amount = 37046.00  WHERE id = '4218cf5a-9864-4129-bed3-8825b7ca8c65'; -- Biryanis Ongole 9/19
UPDATE public.factory_payables SET amount = 19948.00  WHERE id = '52926d9a-21bb-4006-bb38-79407e827f1e'; -- Biryanis Narakoduru 9/19
UPDATE public.factory_payables SET amount = 24544.00  WHERE id = '5cff46e6-50f9-45be-b994-dd7d3d4edcf4'; -- Gismat-Lakshmipuram 9/19
UPDATE public.factory_payables SET amount = 3313.00   WHERE id = '373317b9-d73a-4ae8-a12e-d5c202bcfc12'; -- Chaitanya's Modern Kitchen 9/23
UPDATE public.factory_payables SET amount = 2974.00   WHERE id = '93b34f55-83b3-4efa-8882-ce1ec0da130b'; -- Deccan kitchen 750ml 9/23
UPDATE public.factory_payables SET amount = 5204.00   WHERE id = '83a2523a-2657-4552-9812-4a036a434e7f'; -- Deccan kitchen 250ml 9/23
UPDATE public.factory_payables SET amount = 4050.00   WHERE id = '9341ff23-6d66-48fc-acee-3918289b7667'; -- Alley 91 9/23
UPDATE public.factory_payables SET amount = 14726.00  WHERE id = '15372256-c2d0-4da1-9784-748e770d2dbc'; -- Gismat-Dilshuknagar 9/24
UPDATE public.factory_payables SET amount = 8590.00   WHERE id = '1ab5e39a-3d98-4012-b8d9-d07586b2b2d1'; -- Gismat-Ameerpet 9/26
UPDATE public.factory_payables SET amount = 12272.00  WHERE id = 'ddd100a3-0fb9-4ba6-83e6-2058017ab32e'; -- Benguluru Bhavan 9/27
