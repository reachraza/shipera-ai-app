-- ============================================================
-- Inbound Emails Table
-- Stores raw emails received from carriers via webhook
-- ============================================================

CREATE TABLE IF NOT EXISTS inbound_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  raw_headers JSONB DEFAULT '{}',
  matched_carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by sender email
CREATE INDEX IF NOT EXISTS idx_inbound_emails_from ON inbound_emails(from_email);

-- Index for org scoping
CREATE INDEX IF NOT EXISTS idx_inbound_emails_org ON inbound_emails(org_id);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inbound emails in their org" ON inbound_emails
  FOR SELECT USING (org_id = public.get_user_org_id());

-- Allow service role to insert (webhook writes bypass RLS)
-- No insert policy needed for authenticated users — only the webhook inserts.
