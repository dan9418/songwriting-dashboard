CREATE TABLE IF NOT EXISTS notebook_pages (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  page_type TEXT NOT NULL CHECK (length(trim(page_type)) > 0),
  storage_path TEXT NOT NULL CHECK (length(trim(storage_path)) > 0),
  created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
  updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
  PRIMARY KEY (slug),
  UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_notebook_pages_name ON notebook_pages(name);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_page_type ON notebook_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_updated_at ON notebook_pages(updated_at);
