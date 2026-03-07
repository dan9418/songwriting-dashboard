import { queryD1 } from "@/lib/cloudflare/d1";
import { resolveUserId } from "@/lib/cloudflare/users";

interface TrackRow {
  slug: string;
  projectSlug: string | null;
  projectPosition: number | null;
  lyricsPath: string | null;
  notesPath: string | null;
  chordsPath: string | null;
  audioCount: number | string;
  noteCount: number | string;
  demoCount: number | string;
  liveCount: number | string;
}

export interface CloudflareTrackListItem {
  slug: string;
  projectSlug: string | null;
  projectPosition: number | null;
  lyricsPath: string | null;
  notesPath: string | null;
  chordsPath: string | null;
  audioCount: number;
  noteCount: number;
  demoCount: number;
  liveCount: number;
}

function toInt(value: number | string | null): number {
  if (value === null) {
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}

export async function listTracksFromCloudflare(userSlug: string): Promise<CloudflareTrackListItem[]> {
  const userId = await resolveUserId(userSlug);
  const rows = await queryD1<TrackRow>(
    `
    SELECT
      t.slug AS slug,
      MIN(pt.project_slug) AS projectSlug,
      MIN(pt.position) AS projectPosition,
      t.lyrics_path AS lyricsPath,
      t.notes_path AS notesPath,
      t.chords_path AS chordsPath,
      COUNT(a.slug) AS audioCount,
      SUM(CASE WHEN a.type = 'note' THEN 1 ELSE 0 END) AS noteCount,
      SUM(CASE WHEN a.type = 'demo' THEN 1 ELSE 0 END) AS demoCount,
      SUM(CASE WHEN a.type = 'live' THEN 1 ELSE 0 END) AS liveCount
    FROM tracks t
    LEFT JOIN project_tracks pt
      ON pt.user_id = t.user_id AND pt.track_slug = t.slug
    LEFT JOIN audio a
      ON a.user_id = t.user_id AND a.track_slug = t.slug
    WHERE t.user_id = ?
    GROUP BY t.slug, t.lyrics_path, t.notes_path, t.chords_path
    ORDER BY
      CASE WHEN MIN(pt.project_slug) IS NULL THEN 1 ELSE 0 END,
      MIN(pt.project_slug),
      MIN(pt.position),
      t.slug;
    `,
    [userId]
  );

  return rows.map((row) => ({
    slug: row.slug,
    projectSlug: row.projectSlug,
    projectPosition: row.projectPosition,
    lyricsPath: row.lyricsPath,
    notesPath: row.notesPath,
    chordsPath: row.chordsPath,
    audioCount: toInt(row.audioCount),
    noteCount: toInt(row.noteCount),
    demoCount: toInt(row.demoCount),
    liveCount: toInt(row.liveCount)
  }));
}
