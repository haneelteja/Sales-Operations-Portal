-- Round Deccan kitchen 4/11 AL 750ml 58 cases: ₹5,748.96 → ₹5,749 to match Elma ledger.
-- Already applied directly; this migration records it for history.
UPDATE public.factory_payables
SET amount = 5749.00
WHERE id = 'bd0710d8-f3dd-43a5-8587-14e6381efb27'
  AND amount != 5749.00;
