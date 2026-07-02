-- Delete duplicate negative factory payment entries inserted by migration 20260701220000.
-- The payments already existed in the DB as positive amounts; the migration added wrong negative duplicates.

DELETE FROM public.factory_payables
WHERE id IN (
  '3378c621-06de-42d9-9736-74c292aef697', -- 2/1  -50,000 Parinay UPI
  'd21fd143-fe63-43a6-8af2-228ead746c24', -- 2/7  -100,000 Bank Transfer
  '1de27f85-01fc-4d23-9e3d-9c22802cf26c', -- 2/10 -35,000 label machine
  'f5ed59ac-c7ec-41dc-b0cc-ae86c49460a7', -- 2/14 -50,000 Parinay UPI
  'd1bee575-63d6-419f-b1c9-bf4bfa13ca7f'  -- 2/21 -50,000 Bank Transfer
);
