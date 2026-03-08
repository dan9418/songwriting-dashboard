PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS audio_new (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  track_slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'demo', 'live')),
  type_version INTEGER NOT NULL CHECK (type_version > 0),
  description TEXT,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  date_override TEXT,
  PRIMARY KEY (user_id, slug),
  UNIQUE (user_id, track_slug, type, type_version),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id, track_slug) REFERENCES tracks(user_id, slug) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO audio_new (
  user_id,
  slug,
  track_slug,
  type,
  type_version,
  description,
  date,
  date_override
)
SELECT
  user_id,
  slug,
  track_slug,
  type,
  type_version,
  description,
  CASE
    WHEN date_uploaded LIKE '____-__-__' THEN date_uploaded
    WHEN date_descriptor LIKE '____-__-__' THEN date_descriptor
    WHEN date_descriptor LIKE '____' THEN date_descriptor || '-01-01'
    ELSE '1970-01-01'
  END AS date,
  CASE
    WHEN date_descriptor IS NULL OR trim(date_descriptor) = '' THEN NULL
    WHEN date_descriptor LIKE '____-__-__' THEN NULL
    ELSE date_descriptor
  END AS date_override
FROM audio;

DROP TABLE audio;
ALTER TABLE audio_new RENAME TO audio;

CREATE INDEX IF NOT EXISTS idx_audio_track ON audio(user_id, track_slug);

PRAGMA foreign_keys = ON;
