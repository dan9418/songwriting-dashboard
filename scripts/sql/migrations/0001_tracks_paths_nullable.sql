PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS tracks_new (
  user_id INTEGER NOT NULL,
  slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
  lyrics_path TEXT,
  notes_path TEXT,
  chords_path TEXT,
  PRIMARY KEY (user_id, slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO tracks_new (user_id, slug, lyrics_path, notes_path, chords_path)
SELECT user_id, slug, lyrics_path, notes_path, chords_path
FROM tracks;

DROP TABLE tracks;
ALTER TABLE tracks_new RENAME TO tracks;

PRAGMA foreign_keys = ON;
