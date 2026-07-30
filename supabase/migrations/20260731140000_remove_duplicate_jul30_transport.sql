-- Remove Jul 30 transport entries added by 20260731130000 that duplicated
-- entries the user had already entered manually in the portal.
DELETE FROM transport_expenses
WHERE id IN (
  '7bf412b3-99e4-429b-b1e1-c9cd6c43b61a',  -- Morya Labels Transport ₹330 (duplicate)
  'cf27e8a6-c498-4322-a125-3ff4258511c8'   -- Labels Transport ₹350 (duplicate)
);
