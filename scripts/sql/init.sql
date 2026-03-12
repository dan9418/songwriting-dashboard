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

CREATE TABLE IF NOT EXISTS images (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  path TEXT NOT NULL CHECK (length(trim(path)) > 0),
  PRIMARY KEY (slug),
  UNIQUE (path)
);

CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL CHECK (length(trim(platform)) > 0),
  href TEXT NOT NULL CHECK (length(trim(href)) > 0),
  UNIQUE (platform, href)
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

CREATE TABLE IF NOT EXISTS artist_social_links (
  artist_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (artist_slug, social_link_id),
  FOREIGN KEY (artist_slug) REFERENCES artists(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (social_link_id) REFERENCES social_links(id) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE TABLE IF NOT EXISTS project_social_links (
  project_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (project_slug, social_link_id),
  FOREIGN KEY (project_slug) REFERENCES projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (social_link_id) REFERENCES social_links(id) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE INDEX IF NOT EXISTS idx_artist_images_by_image ON artist_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_artist_social_links_by_social ON artist_social_links(social_link_id);
CREATE INDEX IF NOT EXISTS idx_project_artists_by_artist ON project_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_project_tracks_by_track ON project_tracks(track_slug);
CREATE INDEX IF NOT EXISTS idx_project_images_by_image ON project_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_project_social_links_by_social ON project_social_links(social_link_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_by_artist ON track_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_track_images_by_image ON track_images(image_slug);
