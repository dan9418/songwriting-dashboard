PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS tracks_new (
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  PRIMARY KEY (slug)
);

INSERT INTO tracks_new (slug, name)
SELECT
  slug,
  trim(replace(slug, '-', ' '))
FROM tracks;

DROP TABLE tracks;
ALTER TABLE tracks_new RENAME TO tracks;

PRAGMA foreign_keys = ON;
