-- Round July 2025 factory production amounts to match Elma ledger exactly (2026-06-30).
-- Also fixes Golden Pavilion 7/1 qty (59→58.66, net of −0.34 return) and amount.

UPDATE public.factory_payables SET quantity = 58.66, amount = 5814.00  WHERE id = '30215651-c41d-4055-9a62-169fd0b69114'; -- Golden Pavilion 7/1 (qty+amount fix)
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = 'fcb81c6c-b718-4602-88de-3d7f0183ea92'; -- This is it café 7/1
UPDATE public.factory_payables SET amount = 3682.00    WHERE id = '71514fa2-5d08-41b4-ab7c-649b745e2705'; -- Gismat-Kondapur 7/1
UPDATE public.factory_payables SET amount = 5645.00    WHERE id = 'b6195114-6403-4d67-b633-6702ba7d4904'; -- Alley 91 7/1
UPDATE public.factory_payables SET amount = 12886.00   WHERE id = 'ddac9a6f-602f-466b-bb80-7b5df97c5c78'; -- Gismat-Ameerpet 7/2
UPDATE public.factory_payables SET amount = 11627.00   WHERE id = '543b7ef7-b97b-4f88-ab22-0bb036225664'; -- Element E7 7/2
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '56755057-9a1c-4491-8260-1360c0ad6304'; -- Gismat-Dilshuknagar 7/3
UPDATE public.factory_payables SET amount = 6750.00    WHERE id = '3e384aad-6d70-4274-a5cc-0dbfd1bd3f29'; -- House Party 7/6
UPDATE public.factory_payables SET amount = 2700.00    WHERE id = '6f963a4c-8c2d-47aa-bd44-5d7197a5b786'; -- Tilaks kitchen 7/6
UPDATE public.factory_payables SET amount = 3682.00    WHERE id = '22d11f6f-e2ae-480f-930f-9bc821801ea6'; -- Gismat-Kondapur 7/6
UPDATE public.factory_payables SET amount = 11399.00   WHERE id = '01de783d-4d08-43ef-9876-890216fc719a'; -- Biryanis Gachibowli 7/6
UPDATE public.factory_payables SET amount = 8590.00    WHERE id = '10256b77-d352-407b-89d7-3edaafe445a6'; -- Benguluru Bhavan 7/9
UPDATE public.factory_payables SET amount = 11045.00   WHERE id = 'ca490f75-5d6d-4df8-b860-e9b0873e82b6'; -- Tilaks kitchen 7/9
UPDATE public.factory_payables SET amount = 9818.00    WHERE id = 'daafd6a8-ff62-4968-87fb-4a7146347743'; -- Gismat-Kondapur 7/9
UPDATE public.factory_payables SET amount = 11045.00   WHERE id = 'd29c3ea2-61d1-4986-94e4-bee2c3ab6995'; -- Benguluru Bhavan 7/11
UPDATE public.factory_payables SET amount = 9818.00    WHERE id = '76be6439-0914-4915-988e-7985f416eb0d'; -- Gismat-Chandha Nagar 7/12
UPDATE public.factory_payables SET amount = 8590.00    WHERE id = '88af7c5b-4396-4f3f-b0fa-af399c00d81b'; -- Gismat-Ameerpet 7/12
UPDATE public.factory_payables SET amount = 9818.00    WHERE id = '4827753a-380d-4709-94a6-c5d5b357654e'; -- Gismat-Dilshuknagar 7/14
UPDATE public.factory_payables SET amount = 21658.00   WHERE id = '92ca323a-c84a-4908-b613-409f841b19ec'; -- Biryanis Ongole 7/15
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '362b4766-9654-4391-baa0-faa4fe9e3933'; -- Gismat-Lakshmipuram 7/15
UPDATE public.factory_payables SET amount = 7930.00    WHERE id = '9ae5a2ff-e501-4e04-b4f2-b9a3d514e96b'; -- Mid land TS 7/15
UPDATE public.factory_payables SET amount = 7363.00    WHERE id = '0aad09c0-f45e-4b6b-bb89-66dfeb4dfa44'; -- Benguluru Bhavan 7/16
UPDATE public.factory_payables SET amount = 6013.00    WHERE id = 'c3b2e75b-fdde-46b6-aa78-3e911edbd210'; -- Gismat-Kondapur 7/16
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '13835fc6-1df9-4056-988c-e9f4d6ddf3e6'; -- Gismat-Ameerpet 7/18
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '59c71399-fb12-4cb9-9088-1f5990cad24c'; -- Tilaks kitchen 7/18
UPDATE public.factory_payables SET amount = 6136.00    WHERE id = '65b7a75e-a462-49f4-848a-b78a41d602ac'; -- House Party 7/20
UPDATE public.factory_payables SET amount = 28497.00   WHERE id = '7a7b0b52-1d72-4a45-bca7-829cbfffef4c'; -- Biryanis Khammam 7/22
UPDATE public.factory_payables SET amount = 12886.00   WHERE id = 'c35e81b6-fbab-4c17-9f04-824d1b36c5ae'; -- Mid land AP 7/22
UPDATE public.factory_payables SET amount = 4460.00    WHERE id = '98aef727-eb29-4dea-a3fc-774c45189837'; -- Blossamin Spa 7/23
UPDATE public.factory_payables SET amount = 5699.00    WHERE id = '7691ae1a-6a55-4a72-b4ad-c0e6756b45ee'; -- Biryanis Tirumalagiri 7/23
UPDATE public.factory_payables SET amount = 12272.00   WHERE id = '8d5e6e55-fb09-46c8-bcde-ce8a2b310aba'; -- Gismat-DilshukNagar 7/24
UPDATE public.factory_payables SET amount = 7240.00    WHERE id = 'd6983f9b-d27f-4619-ab57-5566c45b6640'; -- Benguluru Bhavan 7/25
UPDATE public.factory_payables SET amount = 28497.00   WHERE id = 'c08c387c-5091-4fb6-b19c-1de274a71d62'; -- Biryanis Warangal 7/25
UPDATE public.factory_payables SET amount = 6136.00    WHERE id = 'c7d32933-e690-4a8b-bfe8-08b167b7ee07'; -- This is it café 7/25
UPDATE public.factory_payables SET amount = 5699.00    WHERE id = 'd6b9526c-a34f-4f07-be22-e36ccd329a0d'; -- Biryanis Gachibowli 7/25
UPDATE public.factory_payables SET amount = 1274.00    WHERE id = '1b91e2a8-ee54-4573-b528-472528fbb1a2'; -- Blossamin Spa 7/26
UPDATE public.factory_payables SET amount = 9119.00    WHERE id = '60981796-39f8-40a5-8fbc-2414e456a87b'; -- Element E7 7/26
UPDATE public.factory_payables SET amount = 8590.00    WHERE id = '447485b7-7ee3-4930-b181-fabeb6991ea7'; -- Gismat-Ameerpet 7/26
UPDATE public.factory_payables SET amount = 6136.00    WHERE id = '79bd61ef-f414-4d38-8c18-9ff908afeda6'; -- Gismat-Pragathi nagar 7/29
UPDATE public.factory_payables SET amount = 5699.00    WHERE id = '41ca45ff-a509-47cf-bc16-5c8cf1ef3456'; -- Biryanis Nizampet 7/29
UPDATE public.factory_payables SET amount = 5129.00    WHERE id = '33f8509b-8f9e-4305-842f-038624a63964'; -- Atias Kitchen 7/31
