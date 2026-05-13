CREATE TABLE IF NOT EXISTS client_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_name text NOT NULL,
  branch text NOT NULL,
  comments text,
  next_followup_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (dealer_name, branch)
);

CREATE INDEX IF NOT EXISTS idx_client_followups_dealer_branch ON client_followups (dealer_name, branch);

ALTER TABLE client_followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on client_followups" ON client_followups;
CREATE POLICY "Allow all operations on client_followups" ON client_followups FOR ALL USING (true) WITH CHECK (true);
