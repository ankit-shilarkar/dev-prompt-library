-- Schema for the Supabase project backing index.html (project ref: npqnunamefcptmmozuxj)
CREATE TABLE prompts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  purpose TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT '💡',
  tag_label TEXT NOT NULL,
  tag_class TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  purpose_note TEXT NOT NULL DEFAULT '',
  preview TEXT NOT NULL DEFAULT '',
  prompt_text TEXT NOT NULL,
  chapter TEXT,
  -- [{ "title": "...", "best_for": "...", "prompt": "..." }]
  examples JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- The site is public and read-only; writes go through the Supabase dashboard / SQL editor.
CREATE POLICY "Public read access" ON prompts
  FOR SELECT TO anon USING (true);

CREATE INDEX idx_prompts_category_slug ON prompts(category_slug);
CREATE INDEX idx_prompts_purpose ON prompts USING GIN(purpose);
CREATE INDEX idx_prompts_fts ON prompts
  USING GIN(to_tsvector('english', title || ' ' || preview || ' ' || purpose_note));
