-- Log of follow-up notes per client/branch. Each row is one note entry.
CREATE TABLE IF NOT EXISTS client_followup_notes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note           text        NOT NULL,
  followup_date  date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cfn_customer_id ON client_followup_notes (customer_id, created_at DESC);

ALTER TABLE client_followup_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on client_followup_notes" ON client_followup_notes;
CREATE POLICY "Allow all on client_followup_notes" ON client_followup_notes
  FOR ALL USING (true) WITH CHECK (true);
