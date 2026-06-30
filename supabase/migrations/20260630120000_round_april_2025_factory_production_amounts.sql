-- Round April 2025 factory production amounts to match Elma ledger exactly.
-- DB stored fractional amounts from pricing rate math; Elma records whole rupees per line.

UPDATE public.factory_payables SET amount = 9818.00  WHERE id = 'd95da5fa-8a37-492b-aab5-fce89f4ab5de'; -- Tilaks 4/11 P 500ml 80 cases
UPDATE public.factory_payables SET amount = 8222.00  WHERE id = '0c3e6e3a-cac6-4b06-a0cb-4e23916c1766'; -- House party 4/15 P 500ml 67 cases
UPDATE public.factory_payables SET amount = 4541.00  WHERE id = '2d309455-a214-4b05-867e-e9c975cdd7c3'; -- This is it café 4/15 P 500ml 37 cases
UPDATE public.factory_payables SET amount = 10922.00 WHERE id = 'c4ada6a4-dc57-477e-bccc-bd047c3ff53c'; -- Tilaks 4/24 P 500ml 89 cases
UPDATE public.factory_payables SET amount = 7854.00  WHERE id = '354744e3-cffa-4012-9f0d-6690b93daeaf'; -- This is it café 4/29 P 500ml 64 cases
UPDATE public.factory_payables SET amount = 4758.00  WHERE id = 'bd760cd2-55ad-474d-ab8c-1000cf34a842'; -- Golden Pavilion 4/11 AL 750ml 48 cases
UPDATE public.factory_payables SET amount = 11399.00 WHERE id = 'bc5690f8-55d9-493c-9be5-062a8cdf6476'; -- Element E7 4/25 P 1000ml 100 cases
UPDATE public.factory_payables SET amount = 3122.00  WHERE id = '479f6596-2245-4db8-8cad-aa1cde35c19d'; -- Deccan kitchen 4/11 250 EC 21 cases
UPDATE public.factory_payables SET amount = 3568.00  WHERE id = '7ce35369-297d-458d-9046-3b7a0f7602d3'; -- Deccan kitchen 4/2 AL 750ml 36 cases
UPDATE public.factory_payables SET amount = 3469.00  -- Golden Pavilion 4/2 AL 750ml 35 cases (inserted by prior migration)
WHERE customer_id = '19a0035e-cee5-4d54-92c8-93184cda4fd3'
  AND transaction_date = '2025-04-02'
  AND transaction_type = 'production'
  AND sku = 'AL 750 ml'
  AND quantity = 35;
