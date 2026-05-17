ALTER TABLE client_followup_notes
  ADD COLUMN IF NOT EXISTS created_by text;
