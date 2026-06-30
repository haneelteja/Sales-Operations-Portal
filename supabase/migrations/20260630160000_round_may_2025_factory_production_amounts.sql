-- Round May 2025 factory production amounts to match Elma ledger exactly (2026-06-30).
-- AAHA also gets qty corrected from 67 → 67.5.

UPDATE public.factory_payables SET amount = 3313.00    WHERE id = 'b7114d8e-f622-49eb-b284-a5fde5f670f0'; -- Good Vibes 5/1
UPDATE public.factory_payables SET amount = 6443.00    WHERE id = 'cb22c4d8-3850-49fa-a68f-6b89faa47639'; -- Golden Pavilion 5/1
UPDATE public.factory_payables SET amount = 5015.00    WHERE id = '28ee2a25-1dc9-4c97-a934-253a94f99e74'; -- Biryanis Ameerpet 5/3
UPDATE public.factory_payables SET amount = 7731.00    WHERE id = '864c91f3-3e96-4055-9516-f8c1f03ed11e'; -- Deccan kitchen 5/6
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '0e961663-6782-428e-a168-0b92a1805861'; -- Tilaks kitchen 5/7
UPDATE public.factory_payables SET amount = 10829.00   WHERE id = '4f0906e8-8419-4c5c-9bc6-54e43e0cc628'; -- Element E7 5/8
UPDATE public.factory_payables SET amount = 9204.00    WHERE id = '2e5678d3-348e-4c57-88bf-19b644faf58e'; -- House party 5/10
UPDATE public.factory_payables SET amount = 9204.00    WHERE id = '990949b6-f14e-4e56-b526-09e24f4646fe'; -- This is it café 5/10
UPDATE public.factory_payables SET amount = 16567.00   WHERE id = '37e5ca9e-e0a9-4b29-a25b-dc2bbff3b5b8'; -- Gismat-Ameerpet 5/13
UPDATE public.factory_payables SET amount = 18408.00   WHERE id = '26840258-09af-46f9-97fe-8e9ff8511d9c'; -- Gismat-Dilshuknagar 5/13
UPDATE public.factory_payables SET amount = 8549.00    WHERE id = '34b55162-99db-4ffe-9329-1bd741363dcc'; -- Biryanis Nizampet 5/17
UPDATE public.factory_payables SET amount = 8549.00    WHERE id = '698f8838-38f7-4f76-b6ff-b74926214a0b'; -- Biryanis Tirumalagiri 5/17
UPDATE public.factory_payables SET amount = 35336.00   WHERE id = '0199e0cc-a972-4d61-9e57-795ab90ce571'; -- Biryanis Ongole 5/18
UPDATE public.factory_payables SET amount = 13679.00   WHERE id = '09a674b0-a55f-4c6b-9a4b-4f83f5a2bce1'; -- Element E7 5/19
UPDATE public.factory_payables SET amount = 4909.00    WHERE id = '38b21a13-ea1a-4b78-8405-c193c35fbb3b'; -- Gismat-Chandha Nagar 5/20
UPDATE public.factory_payables SET amount = 17181.00   WHERE id = '57531c05-ec0c-4a7b-9c28-c233b61aa77f'; -- Gismat-Ameerpet 5/20
UPDATE public.factory_payables SET amount = 18408.00   WHERE id = '7734cb14-9ab2-4624-a4ba-7eb12e4c0d6f'; -- Tilaks kitchen 5/23
UPDATE public.factory_payables SET quantity = 67.5, amount = 8284.00 WHERE id = 'b071d531-7e62-4353-9cd5-4e0e36e07daf'; -- AAHA 5/24 (qty fix + amount)
UPDATE public.factory_payables SET amount = 28497.00   WHERE id = '69d43c6f-2e68-42e2-a0ab-1fb752a46e5e'; -- Biryanis Khammam 5/24
UPDATE public.factory_payables SET amount = 42176.00   WHERE id = '63d46ade-b67c-49d3-b9ce-cc924e1e1806'; -- Biryanis Warangal 5/24
UPDATE public.factory_payables SET amount = 5947.00    WHERE id = '90eed661-d4f1-43ab-bbcc-434b6957df21'; -- Golden Pavilion 5/28
UPDATE public.factory_payables SET amount = 13084.00   WHERE id = '746bb967-e0a6-4420-82f1-8f7fe98332dc'; -- Deccan 750ml 5/28
UPDATE public.factory_payables SET amount = 5799.00    WHERE id = '03983b95-d4e4-4c2b-a868-57ce21242f9d'; -- Deccan 250ml 5/28
UPDATE public.factory_payables SET amount = 18776.00   WHERE id = '84312e16-12f8-4a15-9ea9-d804bec7f897'; -- Gismat-Dilshuknagar 5/28
UPDATE public.factory_payables SET amount = 13499.00   WHERE id = 'fc2e12af-65ff-4efe-b732-a682ef6e572f'; -- This is it café 5/28
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '8ef73088-0521-4fb5-95ec-de336b9129fd'; -- Gismat-Ameerpet 5/29
UPDATE public.factory_payables SET amount = 6136.00    WHERE id = '143234e3-ad19-4807-95c4-9df801c386b0'; -- Gismat-Pragathi nagar 5/29
UPDATE public.factory_payables SET amount = 14818.00   WHERE id = '130d762e-9013-446f-9231-59d7f88e460a'; -- Biryanis Gachibowli 5/30
UPDATE public.factory_payables SET amount = 19635.00   WHERE id = 'baf685d7-81b5-4c53-879c-d5b929880be3'; -- Gismat-Kondapur 5/30
UPDATE public.factory_payables SET amount = 9689.00    WHERE id = 'f69dbe1e-160f-4263-a785-87a9692236bd'; -- Atias Kitchen 5/30
UPDATE public.factory_payables SET amount = 8959.00    WHERE id = '4d119d5b-ff64-4bdc-ae90-a5214c0159f6'; -- House party 5/31
UPDATE public.factory_payables SET amount = 13109.00   WHERE id = '16f67405-7a71-45e8-a8c0-d942ed59eb8b'; -- Biryanis Ameerpet 5/31
