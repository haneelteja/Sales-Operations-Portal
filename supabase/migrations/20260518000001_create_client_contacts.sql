-- Contact persons per client+branch for payment reminders.
-- Multiple contacts per client+branch, each with a role.
CREATE TABLE IF NOT EXISTS client_contacts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name   text        NOT NULL,
  branch        text        NOT NULL,
  contact_name  text        NOT NULL,
  phone         text        NOT NULL,
  role          text        NOT NULL CHECK (role IN ('store_manager', 'manager', 'owner')),
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_lookup
  ON client_contacts (client_name, branch, is_active);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on client_contacts" ON client_contacts;
CREATE POLICY "Allow all on client_contacts" ON client_contacts
  FOR ALL USING (true) WITH CHECK (true);
