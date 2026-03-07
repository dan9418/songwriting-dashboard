PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS artists (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('album', 'ep', 'single', 'setlist')),
  release_date TEXT,
  remaster_date TEXT,
  PRIMARY KEY (user_id, slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tracks (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  lyrics_path TEXT NOT NULL,
  notes_path TEXT NOT NULL,
  chords_path TEXT NOT NULL,
  PRIMARY KEY (user_id, slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS images (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  path TEXT NOT NULL CHECK (length(trim(path)) > 0),
  PRIMARY KEY (user_id, slug),
  UNIQUE (user_id, path),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (length(trim(platform)) > 0),
  href TEXT NOT NULL CHECK (length(trim(href)) > 0),
  UNIQUE (user_id, id),
  UNIQUE (user_id, platform, href),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS audio (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  track_slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'demo', 'live')),
  type_version INTEGER NOT NULL CHECK (type_version > 0),
  description TEXT,
  date_descriptor TEXT NOT NULL CHECK (length(trim(date_descriptor)) > 0),
  date_uploaded TEXT,
  PRIMARY KEY (user_id, slug),
  UNIQUE (user_id, track_slug, type, type_version),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, track_slug) REFERENCES tracks(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_images (
  user_id INTEGER NOT NULL,
  artist_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, artist_slug, image_slug),
  FOREIGN KEY (user_id, artist_slug) REFERENCES artists(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, image_slug) REFERENCES images(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS artist_social_links (
  user_id INTEGER NOT NULL,
  artist_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, artist_slug, social_link_id),
  FOREIGN KEY (user_id, artist_slug) REFERENCES artists(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, social_link_id) REFERENCES social_links(user_id, id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_artists (
  user_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, project_slug, artist_slug),
  FOREIGN KEY (user_id, project_slug) REFERENCES projects(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, artist_slug) REFERENCES artists(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tracks (
  user_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  track_slug TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1),
  PRIMARY KEY (user_id, project_slug, track_slug),
  UNIQUE (user_id, project_slug, position),
  FOREIGN KEY (user_id, project_slug) REFERENCES projects(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, track_slug) REFERENCES tracks(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_images (
  user_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, project_slug, image_slug),
  FOREIGN KEY (user_id, project_slug) REFERENCES projects(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, image_slug) REFERENCES images(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS project_social_links (
  user_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  social_link_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, project_slug, social_link_id),
  FOREIGN KEY (user_id, project_slug) REFERENCES projects(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, social_link_id) REFERENCES social_links(user_id, id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_artists (
  user_id INTEGER NOT NULL,
  track_slug TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, track_slug, artist_slug),
  FOREIGN KEY (user_id, track_slug) REFERENCES tracks(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, artist_slug) REFERENCES artists(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS track_images (
  user_id INTEGER NOT NULL,
  track_slug TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, track_slug, image_slug),
  FOREIGN KEY (user_id, track_slug) REFERENCES tracks(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, image_slug) REFERENCES images(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audio_track ON audio(user_id, track_slug);
CREATE INDEX IF NOT EXISTS idx_social_links_user ON social_links(user_id);

CREATE INDEX IF NOT EXISTS idx_artist_images_by_image ON artist_images(user_id, image_slug);
CREATE INDEX IF NOT EXISTS idx_artist_social_links_by_social ON artist_social_links(user_id, social_link_id);
CREATE INDEX IF NOT EXISTS idx_project_artists_by_artist ON project_artists(user_id, artist_slug);
CREATE INDEX IF NOT EXISTS idx_project_tracks_by_track ON project_tracks(user_id, track_slug);
CREATE INDEX IF NOT EXISTS idx_project_images_by_image ON project_images(user_id, image_slug);
CREATE INDEX IF NOT EXISTS idx_project_social_links_by_social ON project_social_links(user_id, social_link_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_by_artist ON track_artists(user_id, artist_slug);
CREATE INDEX IF NOT EXISTS idx_track_images_by_image ON track_images(user_id, image_slug);
