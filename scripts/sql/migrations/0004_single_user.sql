PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS artists_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS projects_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('album', 'ep', 'single', 'setlist')),
  release_date TEXT,
  remaster_date TEXT,
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS tracks_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  lyrics_path TEXT,
  notes_path TEXT,
  chords_path TEXT,
  PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS images_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  path TEXT NOT NULL CHECK (length(trim(path)) > 0),
  PRIMARY KEY (slug),
  UNIQUE (path)
);

CREATE TABLE IF NOT EXISTS social_links_new (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL CHECK (length(trim(platform)) > 0),
  href TEXT NOT NULL CHECK (length(trim(href)) > 0),
  UNIQUE (platform, href)
);

CREATE TABLE IF NOT EXISTS audio_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  track_slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'demo', 'live')),
  type_version INTEGER NOT NULL CHECK (type_version > 0),
  description TEXT,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  date_override TEXT,
  PRIMARY KEY (slug),
  UNIQUE (track_slug, type, type_version),
  FOREIGN KEY (track_slug) REFERENCES tracks_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_images_new (
  artist_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (artist_slug, image_slug),
  FOREIGN KEY (artist_slug) REFERENCES artists_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_social_links_new (
  artist_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (artist_slug, social_link_id),
  FOREIGN KEY (artist_slug) REFERENCES artists_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (social_link_id) REFERENCES social_links_new(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_artists_new (
  project_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (project_slug, artist_slug),
  FOREIGN KEY (project_slug) REFERENCES projects_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (artist_slug) REFERENCES artists_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tracks_new (
  project_slug TEXT NOT NULL,
  track_slug TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1),
  PRIMARY KEY (project_slug, track_slug),
  UNIQUE (project_slug, position),
  FOREIGN KEY (project_slug) REFERENCES projects_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (track_slug) REFERENCES tracks_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_images_new (
  project_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (project_slug, image_slug),
  FOREIGN KEY (project_slug) REFERENCES projects_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_social_links_new (
  project_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (project_slug, social_link_id),
  FOREIGN KEY (project_slug) REFERENCES projects_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (social_link_id) REFERENCES social_links_new(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_artists_new (
  track_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (track_slug, artist_slug),
  FOREIGN KEY (track_slug) REFERENCES tracks_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (artist_slug) REFERENCES artists_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_images_new (
  track_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (track_slug, image_slug),
  FOREIGN KEY (track_slug) REFERENCES tracks_new(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_slug) REFERENCES images_new(slug) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT OR IGNORE INTO artists_new (slug, name, description)
SELECT slug, name, description FROM artists;

INSERT OR IGNORE INTO projects_new (slug, name, description, type, release_date, remaster_date)
SELECT slug, name, description, type, release_date, remaster_date FROM projects;

INSERT OR IGNORE INTO tracks_new (slug, lyrics_path, notes_path, chords_path)
SELECT slug, lyrics_path, notes_path, chords_path FROM tracks;

INSERT OR IGNORE INTO images_new (slug, path)
SELECT slug, path FROM images;

INSERT OR IGNORE INTO social_links_new (id, platform, href)
SELECT id, platform, href FROM social_links;

INSERT OR IGNORE INTO audio_new (slug, track_slug, type, type_version, description, date, date_override)
SELECT slug, track_slug, type, type_version, description, date, date_override FROM audio;

INSERT OR IGNORE INTO artist_images_new (artist_slug, image_slug)
SELECT artist_slug, image_slug FROM artist_images;

INSERT OR IGNORE INTO artist_social_links_new (artist_slug, social_link_id)
SELECT artist_slug, social_link_id FROM artist_social_links;

INSERT OR IGNORE INTO project_artists_new (project_slug, artist_slug)
SELECT project_slug, artist_slug FROM project_artists;

INSERT OR IGNORE INTO project_tracks_new (project_slug, track_slug, position)
SELECT project_slug, track_slug, position FROM project_tracks;

INSERT OR IGNORE INTO project_images_new (project_slug, image_slug)
SELECT project_slug, image_slug FROM project_images;

INSERT OR IGNORE INTO project_social_links_new (project_slug, social_link_id)
SELECT project_slug, social_link_id FROM project_social_links;

INSERT OR IGNORE INTO track_artists_new (track_slug, artist_slug)
SELECT track_slug, artist_slug FROM track_artists;

INSERT OR IGNORE INTO track_images_new (track_slug, image_slug)
SELECT track_slug, image_slug FROM track_images;

DROP TABLE IF EXISTS artist_images;
DROP TABLE IF EXISTS artist_social_links;
DROP TABLE IF EXISTS project_artists;
DROP TABLE IF EXISTS project_tracks;
DROP TABLE IF EXISTS project_images;
DROP TABLE IF EXISTS project_social_links;
DROP TABLE IF EXISTS track_artists;
DROP TABLE IF EXISTS track_images;
DROP TABLE IF EXISTS audio;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS social_links;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;

ALTER TABLE artists_new RENAME TO artists;
ALTER TABLE projects_new RENAME TO projects;
ALTER TABLE tracks_new RENAME TO tracks;
ALTER TABLE images_new RENAME TO images;
ALTER TABLE social_links_new RENAME TO social_links;
ALTER TABLE audio_new RENAME TO audio;
ALTER TABLE artist_images_new RENAME TO artist_images;
ALTER TABLE artist_social_links_new RENAME TO artist_social_links;
ALTER TABLE project_artists_new RENAME TO project_artists;
ALTER TABLE project_tracks_new RENAME TO project_tracks;
ALTER TABLE project_images_new RENAME TO project_images;
ALTER TABLE project_social_links_new RENAME TO project_social_links;
ALTER TABLE track_artists_new RENAME TO track_artists;
ALTER TABLE track_images_new RENAME TO track_images;

CREATE INDEX IF NOT EXISTS idx_audio_track ON audio(track_slug);
CREATE INDEX IF NOT EXISTS idx_artist_images_by_image ON artist_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_artist_social_links_by_social ON artist_social_links(social_link_id);
CREATE INDEX IF NOT EXISTS idx_project_artists_by_artist ON project_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_project_tracks_by_track ON project_tracks(track_slug);
CREATE INDEX IF NOT EXISTS idx_project_images_by_image ON project_images(image_slug);
CREATE INDEX IF NOT EXISTS idx_project_social_links_by_social ON project_social_links(social_link_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_by_artist ON track_artists(artist_slug);
CREATE INDEX IF NOT EXISTS idx_track_images_by_image ON track_images(image_slug);

PRAGMA foreign_keys = ON;
