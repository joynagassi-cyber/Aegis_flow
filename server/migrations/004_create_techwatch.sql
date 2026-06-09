CREATE TABLE IF NOT EXISTS tech_watch_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL,
  domain_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  learning_impact TEXT,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  source_urls JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_techwatch_domain ON tech_watch_reports(domain_id);
CREATE INDEX IF NOT EXISTS idx_techwatch_status ON tech_watch_reports(status);
CREATE INDEX IF NOT EXISTS idx_techwatch_triggered ON tech_watch_reports(triggered_at DESC);
