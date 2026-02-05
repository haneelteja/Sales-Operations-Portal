-- ==============================================
-- CREATE WHATSAPP ATTACHMENTS STORAGE BUCKET
-- ==============================================
-- Bucket for temporary PDF uploads so 360Messenger can fetch them via signed URL.
-- Edge function whatsapp-send uploads invoice PDFs here and passes the signed URL to the API.
-- Date: 2025-01-27
-- ==============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-attachments',
  'whatsapp-attachments',
  false,
  52428800,  -- 50 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Only service role (edge function) should access this bucket; service role bypasses RLS.
-- This policy denies anon/authenticated unless we add a more permissive one later.
-- No policy needed for service role (bypasses RLS).
