CREATE TABLE IF NOT EXISTS tags (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS track_tags (
  track_slug TEXT NOT NULL,
  tag_slug TEXT NOT NULL,
  PRIMARY KEY (track_slug, tag_slug),
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (tag_slug) REFERENCES tags(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_track_tags_by_tag ON track_tags(tag_slug);
