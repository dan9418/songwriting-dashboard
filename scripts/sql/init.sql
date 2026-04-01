PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS artists (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS projects (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('album', 'ep', 'single', 'setlist')),
  release_date TEXT,
  remaster_date TEXT,
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS tracks (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  PRIMARY KEY (slug)
);

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

CREATE TABLE IF NOT EXISTS images (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  path TEXT NOT NULL CHECK (length(trim(path)) > 0),
  PRIMARY KEY (slug),
  UNIQUE (path)
);

CREATE TABLE IF NOT EXISTS external_links (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL CHECK (length(trim(platform)) > 0),
  url TEXT NOT NULL CHECK (length(trim(url)) > 0),
  UNIQUE (url)
);

CREATE TABLE IF NOT EXISTS audio (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  track_slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'demo', 'live')),
  type_version INTEGER NOT NULL CHECK (type_version > 0),
  description TEXT,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  date_override TEXT,
  PRIMARY KEY (slug),
  UNIQUE (track_slug, type, type_version),
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_images (
  artist_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (artist_slug, image_slug),
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_external_links (
  artist_slug TEXT NOT NULL,
  external_link_id INTEGER NOT NULL,
  PRIMARY KEY (artist_slug, external_link_id),
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (external_link_id) REFERENCES external_links(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_artists (
  project_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (project_slug, artist_slug),
  FOREIGN KEY (project_slug) REFERENCES projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tracks (
  project_slug TEXT NOT NULL,
  track_slug TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1),
  PRIMARY KEY (project_slug, track_slug),
  UNIQUE (project_slug, position),
  FOREIGN KEY (project_slug) REFERENCES projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_images (
  project_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (project_slug, image_slug),
  FOREIGN KEY (project_slug) REFERENCES projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images(slug) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE TABLE IF NOT EXISTS track_artists (
  track_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (track_slug, artist_slug),
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_images (
  track_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (track_slug, image_slug),
  FOREIGN KEY (track_slug) REFERENCES tracks(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audio_track ON audio(track_slug);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_name ON notebook_pages(name);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_page_type ON notebook_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_updated_at ON notebook_pages(updated_at);

CREATE INDEX IF NOT EXISTS idx_artist_images_by_image ON artist_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_artist_external_links_by_link ON artist_external_links(external_link_id);
CREATE INDEX IF NOT EXISTS idx_project_artists_by_artist ON project_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_project_tracks_by_track ON project_tracks(track_slug);
CREATE INDEX IF NOT EXISTS idx_project_images_by_image ON project_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_project_external_links_by_link ON project_external_links(external_link_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_by_artist ON track_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_track_external_links_by_link ON track_external_links(external_link_id);
CREATE INDEX IF NOT EXISTS idx_track_images_by_image ON track_images(image_slug);
