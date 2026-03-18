-- Seed external_links and entity join tables from:
-- - personal-site-6/src/data/music.data.ts
-- - personal-site-6/src/data/links.data.ts
--
-- Assumptions:
-- - Share/tracking params are removed from URLs before insert.
-- - Meaningful YouTube params (`v`, `list`) are preserved.
-- - `OLD_PROJECTS` is treated as part of `dan-bednarczyk`, not a separate artist.
-- - Empty placeholder lyrics links are ignored.
-- - This script assumes referenced artists and projects already exist.

PRAGMA foreign_keys = ON;

INSERT INTO external_links (platform, url) VALUES
  ('spotify', 'https://open.spotify.com/artist/37bMMmv82uI3xhb0S8hL9V'),
  ('apple-music', 'https://music.apple.com/us/artist/dan-bednarczyk/1590781822'),
  ('bandcamp', 'https://danbednarczyk.bandcamp.com/'),
  ('instagram', 'https://www.instagram.com/dan.bednarczyk'),
  ('youtube', 'https://www.youtube.com/@dan.bednarczyk'),
  ('weekly-beats', 'https://weeklybeats.com/pineapple_dan'),
  ('spotify', 'https://open.spotify.com/artist/3ZbSgXEfKaAstGgsa7pQKr'),
  ('apple-music', 'https://music.apple.com/us/artist/jonah/1690975960'),
  ('bandcamp', 'https://jonahmakesmusic.bandcamp.com/'),
  ('instagram', 'https://www.instagram.com/jonah_makesmusic'),
  ('soundcloud', 'https://soundcloud.com/livingfiction'),
  ('facebook', 'https://www.facebook.com/TheVectors14'),
  ('youtube', 'https://www.youtube.com/channel/UCVJVbOg-thDA-qI4L_fHfdg'),
  ('bandcamp', 'https://danbednarczyk.bandcamp.com/album/sketches-from-sacramento'),
  ('spotify', 'https://open.spotify.com/album/7KsbPTh2cD9NbFC3gVknOL'),
  ('apple-music', 'https://music.apple.com/us/album/need-not-ep/1615109361'),
  ('bandcamp', 'https://danbednarczyk.bandcamp.com/album/need-not'),
  ('spotify', 'https://open.spotify.com/album/7s6ButedifP4Vq3dnN1UmF'),
  ('apple-music', 'https://music.apple.com/us/album/silent-city/1628196809'),
  ('bandcamp', 'https://danbednarczyk.bandcamp.com/album/silent-city'),
  ('spotify', 'https://open.spotify.com/album/53xq4Ix2OMP1stgt3kUQQh'),
  ('apple-music', 'https://music.apple.com/us/album/dynamite-nonstick/1817583166'),
  ('bandcamp', 'https://jonahmakesmusic.bandcamp.com/album/dynamite-nonstick'),
  ('spotify', 'https://open.spotify.com/album/0GVBwavRQ0w9loTrVlajbw'),
  ('apple-music', 'https://music.apple.com/us/album/crooked-spine-ep/1738724560'),
  ('bandcamp', 'https://jonahmakesmusic.bandcamp.com/album/crooked-spine'),
  ('soundcloud', 'https://soundcloud.com/livingfiction/peanut-butter-jam'),
  ('soundcloud', 'https://soundcloud.com/livingfiction/sets/songs-and-how-not-to-write-them'),
  ('youtube', 'https://www.youtube.com/watch?v=WDdDrvqkbOk&list=PLF0EOAvsOKeCp_HowkIF6CVeExxuDXYRm'),
  ('soundcloud', 'https://soundcloud.com/livingfiction/sets/the-vectors-yellow-snow'),
  ('youtube', 'https://www.youtube.com/watch?v=f2EV4bBB4E8&list=PLF0EOAvsOKeAv8CK8nJT1sRIGEK17w96s'),
  ('soundcloud', 'https://soundcloud.com/danbednarczyk/sets/human-architecture'),
  ('youtube', 'https://www.youtube.com/watch?v=vzKuYdfCpdk'),
  ('soundcloud', 'https://soundcloud.com/livingfiction/sets/out-of-reach'),
  ('youtube', 'https://www.youtube.com/watch?v=mL2CbEXX6lo&list=PLF0EOAvsOKeDZnT4z2Z-tZaFzL0qVuk6f')
ON CONFLICT(url) DO UPDATE SET
  platform = excluded.platform;

INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://open.spotify.com/artist/37bMMmv82uI3xhb0S8hL9V';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://music.apple.com/us/artist/dan-bednarczyk/1590781822';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://danbednarczyk.bandcamp.com/';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://www.instagram.com/dan.bednarczyk';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://www.youtube.com/@dan.bednarczyk';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'dan-bednarczyk', id FROM external_links WHERE url = 'https://weeklybeats.com/pineapple_dan';

INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'jonah', id FROM external_links WHERE url = 'https://open.spotify.com/artist/3ZbSgXEfKaAstGgsa7pQKr';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'jonah', id FROM external_links WHERE url = 'https://music.apple.com/us/artist/jonah/1690975960';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'jonah', id FROM external_links WHERE url = 'https://jonahmakesmusic.bandcamp.com/';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'jonah', id FROM external_links WHERE url = 'https://www.instagram.com/jonah_makesmusic';

INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'the-vectors', id FROM external_links WHERE url = 'https://soundcloud.com/livingfiction';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'the-vectors', id FROM external_links WHERE url = 'https://www.facebook.com/TheVectors14';
INSERT OR IGNORE INTO artist_external_links (artist_slug, external_link_id)
SELECT 'the-vectors', id FROM external_links WHERE url = 'https://www.youtube.com/channel/UCVJVbOg-thDA-qI4L_fHfdg';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'sketches-from-sacramento', id FROM external_links WHERE url = 'https://danbednarczyk.bandcamp.com/album/sketches-from-sacramento';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'need-not', id FROM external_links WHERE url = 'https://open.spotify.com/album/7KsbPTh2cD9NbFC3gVknOL';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'need-not', id FROM external_links WHERE url = 'https://music.apple.com/us/album/need-not-ep/1615109361';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'need-not', id FROM external_links WHERE url = 'https://danbednarczyk.bandcamp.com/album/need-not';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'silent-city', id FROM external_links WHERE url = 'https://open.spotify.com/album/7s6ButedifP4Vq3dnN1UmF';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'silent-city', id FROM external_links WHERE url = 'https://music.apple.com/us/album/silent-city/1628196809';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'silent-city', id FROM external_links WHERE url = 'https://danbednarczyk.bandcamp.com/album/silent-city';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'dynamite-nonstick', id FROM external_links WHERE url = 'https://open.spotify.com/album/53xq4Ix2OMP1stgt3kUQQh';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'dynamite-nonstick', id FROM external_links WHERE url = 'https://music.apple.com/us/album/dynamite-nonstick/1817583166';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'dynamite-nonstick', id FROM external_links WHERE url = 'https://jonahmakesmusic.bandcamp.com/album/dynamite-nonstick';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'crooked-spine', id FROM external_links WHERE url = 'https://open.spotify.com/album/0GVBwavRQ0w9loTrVlajbw';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'crooked-spine', id FROM external_links WHERE url = 'https://music.apple.com/us/album/crooked-spine-ep/1738724560';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'crooked-spine', id FROM external_links WHERE url = 'https://jonahmakesmusic.bandcamp.com/album/crooked-spine';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'peanut-butter-jam', id FROM external_links WHERE url = 'https://soundcloud.com/livingfiction/peanut-butter-jam';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'songs-and-how-not-to-write-them', id FROM external_links WHERE url = 'https://soundcloud.com/livingfiction/sets/songs-and-how-not-to-write-them';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'songs-and-how-not-to-write-them', id FROM external_links WHERE url = 'https://www.youtube.com/watch?v=WDdDrvqkbOk&list=PLF0EOAvsOKeCp_HowkIF6CVeExxuDXYRm';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'yellow-snow', id FROM external_links WHERE url = 'https://soundcloud.com/livingfiction/sets/the-vectors-yellow-snow';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'yellow-snow', id FROM external_links WHERE url = 'https://www.youtube.com/watch?v=f2EV4bBB4E8&list=PLF0EOAvsOKeAv8CK8nJT1sRIGEK17w96s';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'human-architecture', id FROM external_links WHERE url = 'https://soundcloud.com/danbednarczyk/sets/human-architecture';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'human-architecture', id FROM external_links WHERE url = 'https://www.youtube.com/watch?v=vzKuYdfCpdk';

INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'out-of-reach', id FROM external_links WHERE url = 'https://soundcloud.com/livingfiction/sets/out-of-reach';
INSERT OR IGNORE INTO project_external_links (project_slug, external_link_id)
SELECT 'out-of-reach', id FROM external_links WHERE url = 'https://www.youtube.com/watch?v=mL2CbEXX6lo&list=PLF0EOAvsOKeDZnT4z2Z-tZaFzL0qVuk6f';
