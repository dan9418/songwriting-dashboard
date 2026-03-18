PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS artist_social_links;
DROP TABLE IF EXISTS project_social_links;
DROP TABLE IF EXISTS social_links;

CREATE TABLE IF NOT EXISTS external_links (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL CHECK (length(trim(platform)) > 0),
  url TEXT NOT NULL CHECK (length(trim(url)) > 0),
  UNIQUE (url)
);

CREATE TABLE IF NOT EXISTS artist_external_links (
  artist_slug TEXT NOT NULL,
  external_link_id INTEGER NOT NULL,
  PRIMARY KEY (artist_slug, external_link_id),
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (external_link_id) REFERENCES external_links(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_external_links (
  project_slug TEXT NOT NULL,
  external_link_id INTEGER NOT NULL,
  PRIMARY KEY (project_slug, external_link_id),
  FOREIGN KEY (project_slug) REFERENCES projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (external_link_id) REFERENCES external_links(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_external_links (
  track_slug TEXT NOT NULL,
  external_link_id INTEGER NOT NULL,
  PRIMARY KEY (track_slug, external_link_id),
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (external_link_id) REFERENCES external_links(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artist_external_links_by_link ON artist_external_links(external_link_id);
CREATE INDEX IF NOT EXISTS idx_project_external_links_by_link ON project_external_links(external_link_id);
CREATE INDEX IF NOT EXISTS idx_track_external_links_by_link ON track_external_links(external_link_id);

PRAGMA foreign_keys = ON;
