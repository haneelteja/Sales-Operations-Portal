-- Festival broadcast campaigns
CREATE TABLE IF NOT EXISTS festival_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  template_id      uuid,
  template_name    text        NOT NULL DEFAULT '',
  media_url        text,
  media_type       text        CHECK (media_type IS NULL OR media_type IN ('image', 'video')),
  media_filename   text,
  scheduled_at     timestamptz NOT NULL,
  status           text        NOT NULL DEFAULT 'scheduled'
                               CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  total_recipients int         NOT NULL DEFAULT 0,
  sent_count       int         NOT NULL DEFAULT 0,
  failed_count     int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festival_campaigns_status_scheduled_at
  ON festival_campaigns (status, scheduled_at);

-- Per-recipient send tracking
CREATE TABLE IF NOT EXISTS festival_campaign_recipients (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        NOT NULL REFERENCES festival_campaigns(id) ON DELETE CASCADE,
  client_name  text        NOT NULL,
  branch       text        NOT NULL,
  contact_name text        NOT NULL,
  phone        text        NOT NULL,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'sent', 'failed')),
  error_msg    text,
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festival_recipients_campaign_id
  ON festival_campaign_recipients (campaign_id, status);

ALTER TABLE festival_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on festival_campaigns"
  ON festival_campaigns FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on festival_campaign_recipients"
  ON festival_campaign_recipients FOR ALL USING (true) WITH CHECK (true);

-- Public storage bucket for festival campaign media (images / videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-media',
  'campaign-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/avi', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read campaign-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated upload campaign-media"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated update campaign-media"
  ON storage.objects FOR UPDATE USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated delete campaign-media"
  ON storage.objects FOR DELETE USING (bucket_id = 'campaign-media');
