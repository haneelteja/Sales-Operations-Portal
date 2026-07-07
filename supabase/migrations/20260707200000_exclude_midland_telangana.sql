-- Exclude Mid Land Telangana (AL 750 ml) from profitability.
-- Factory-direct wholesale client — same treatment as Mid Land Andhra Pradesh
-- (removed in 20260706110000_exclude_midland_ap.sql).
--
-- sales_transactions: 4 sales + 2 payments (total sold ₹1,13,694 / paid ₹1,00,000 / outstanding ₹13,694)
-- factory_payables:   4 production entries totalling ₹65,280

DELETE FROM public.sales_transactions
WHERE id IN (
  '88c26596-fc9a-4794-a3ee-f4aa919f32fb',  -- sale  Jun 26 2025  ₹11,904
  '99b3500f-2bde-47ff-8c87-dfea14805de4',  -- sale  Jul 15 2025  ₹13,920
  'f12b50ed-3b48-4a32-b7a5-2a8b693788e2',  -- sale  Aug 02 2025  ₹36,540
  '7f1459d9-8b97-4b14-8e1d-0f6ded4bdddd',  -- sale  Aug 26 2025  ₹51,330
  '9a3f913f-bdfc-448f-8fac-8ce4b4aaeb04',  -- pay   Oct 13 2025  ₹11,904
  '137ea832-8a21-4017-80a8-033bdbf52d94'   -- pay   Oct 13 2025  ₹88,096
);

DELETE FROM public.factory_payables
WHERE id IN (
  '52851e81-0a27-4063-bf84-9f6596b573e3',  -- production Jun 26 2025  ₹7,295
  '9ae5a2ff-e501-4e04-b4f2-b9a3d514e96b',  -- production Jul 15 2025  ₹7,930
  '72aa7243-730c-4a97-8e22-4dd3790f0eef',  -- production Aug 02 2025  ₹20,815
  'c635ecde-ee77-4881-9049-3d51f7016617'   -- production Aug 26 2025  ₹29,240
);
