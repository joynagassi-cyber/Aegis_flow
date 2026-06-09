CREATE TABLE IF NOT EXISTS checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_type TEXT NOT NULL CHECK (objective_type IN ('saas', 'geoai')),
  section_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(objective_type, section_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_section ON checklist_progress(objective_type, section_id);
