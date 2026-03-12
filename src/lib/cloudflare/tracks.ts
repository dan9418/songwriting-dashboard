import { queryD1 } from "@/lib/cloudflare/d1";
import { listObjectSummaries } from "@/lib/cloudflare/r2";
import { syncTrackAudioMetadataFromR2 } from "@/lib/cloudflare/audio-sync";
import { listTrackAudioFilesFromR2 } from "@/lib/cloudflare/track-audio-files";

interface TrackRow {
  slug: string;
  name: string;
  audioCount: number | string;
  noteCount: number | string;
  demoCount: number | string;
  liveCount: number | string;
}

interface TrackArtistRow {
  trackSlug: string;
  artistSlug: string;
}

interface TrackProjectRow {
  trackSlug: string;
  projectSlug: string;
}

export interface CloudflareTrackListItem {
  slug: string;
  name: string;
  projectSlugs: string[];
  artistSlugs: string[];
  hasLyrics: boolean;
  hasChords: boolean;
  hasNotes: boolean;
  audioCount: number;
  noteCount: number;
  demoCount: number;
  liveCount: number;
}

interface AudioRow {
  slug: string;
  type: string;
  typeVersion: number | string;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

export interface CloudflareTrackAudioItem {
  slug: string;
  fileName: string;
  fileHref: string | null;
  type: string;
  typeVersion: number;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

export interface CloudflareTrackMetadata extends CloudflareTrackListItem {
  audio: CloudflareTrackAudioItem[];
}

function toInt(value: number | string | null): number {
  if (value === null) {
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}

interface TrackDocFlags {
  hasLyrics: boolean;
  hasChords: boolean;
  hasNotes: boolean;
}

function createEmptyTrackDocFlags(): TrackDocFlags {
  return {
    hasLyrics: false,
    hasChords: false,
    hasNotes: false
  };
}

function applyDocFlag(flags: TrackDocFlags, docType: string): TrackDocFlags {
  if (docType === "lyrics") {
    return { ...flags, hasLyrics: true };
  }
  if (docType === "chords") {
    return { ...flags, hasChords: true };
  }
  if (docType === "notes") {
    return { ...flags, hasNotes: true };
  }
  return flags;
}

async function listTrackDocFlagsByTrackSlug(): Promise<Map<string, TrackDocFlags>> {
  const summaries = await listObjectSummaries({
    prefix: "tracks/",
    limit: 10000
  });
  const map = new Map<string, TrackDocFlags>();

  for (const item of summaries) {
    const match = /^tracks\/([^/]+)\/(lyrics|chords|notes)\.md$/i.exec(item.key);
    if (!match) {
      continue;
    }
    const trackSlug = match[1];
    const docType = match[2].toLowerCase();
    const current = map.get(trackSlug) ?? createEmptyTrackDocFlags();
    map.set(trackSlug, applyDocFlag(current, docType));
  }

  return map;
}

async function getTrackDocFlags(trackSlug: string): Promise<TrackDocFlags> {
  const summaries = await listObjectSummaries({
    prefix: `tracks/${trackSlug}/`,
    limit: 200
  });
  let flags = createEmptyTrackDocFlags();

  for (const item of summaries) {
    const match = new RegExp(`^tracks/${trackSlug}/(lyrics|chords|notes)\\.md$`, "i").exec(item.key);
    if (!match) {
      continue;
    }
    flags = applyDocFlag(flags, match[1].toLowerCase());
  }

  return flags;
}

export async function listTracksFromCloudflare(): Promise<CloudflareTrackListItem[]> {
  const docFlagsByTrack =
    (await listTrackDocFlagsByTrackSlug().catch(() => null)) ?? new Map<string, TrackDocFlags>();
  const rows = await queryD1<TrackRow>(
    `
    SELECT
      t.slug AS slug,
      t.name AS name,
      COALESCE(a.audioCount, 0) AS audioCount,
      COALESCE(a.noteCount, 0) AS noteCount,
      COALESCE(a.demoCount, 0) AS demoCount,
      COALESCE(a.liveCount, 0) AS liveCount
    FROM tracks t
    LEFT JOIN (
      SELECT
        track_slug,
        COUNT(*) AS audioCount,
        SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) AS noteCount,
        SUM(CASE WHEN type = 'demo' THEN 1 ELSE 0 END) AS demoCount,
        SUM(CASE WHEN type = 'live' THEN 1 ELSE 0 END) AS liveCount
      FROM audio
      GROUP BY track_slug
    ) a ON a.track_slug = t.slug
    ORDER BY t.slug ASC;
    `
  );
  const trackProjectRows = await queryD1<TrackProjectRow>(
    `
    SELECT
      track_slug AS trackSlug,
      project_slug AS projectSlug
    FROM project_tracks
    ORDER BY project_slug ASC, position ASC, track_slug ASC;
    `
  );
  const trackArtistRows = await queryD1<TrackArtistRow>(
    `
    SELECT
      track_slug AS trackSlug,
      artist_slug AS artistSlug
    FROM track_artists
    `
  );
  const projectSlugsByTrack = new Map<string, string[]>();
  for (const row of trackProjectRows) {
    const existing = projectSlugsByTrack.get(row.trackSlug) ?? [];
    existing.push(row.projectSlug);
    projectSlugsByTrack.set(row.trackSlug, existing);
  }
  const artistSlugsByTrack = new Map<string, string[]>();
  for (const row of trackArtistRows) {
    const existing = artistSlugsByTrack.get(row.trackSlug) ?? [];
    existing.push(row.artistSlug);
    artistSlugsByTrack.set(row.trackSlug, existing);
  }

  return rows.map((row) => ({
    ...(docFlagsByTrack.get(row.slug) ?? createEmptyTrackDocFlags()),
    slug: row.slug,
    name: row.name,
    projectSlugs: projectSlugsByTrack.get(row.slug) ?? [],
    artistSlugs: artistSlugsByTrack.get(row.slug) ?? [],
    audioCount: toInt(row.audioCount),
    noteCount: toInt(row.noteCount),
    demoCount: toInt(row.demoCount),
    liveCount: toInt(row.liveCount)
  }));
}

export async function getTrackMetadataFromCloudflare(
  trackSlug: string
): Promise<CloudflareTrackMetadata | null> {
  const [track] = await queryD1<TrackRow>(
    `
    SELECT
      t.slug AS slug,
      t.name AS name,
      COALESCE(a.audioCount, 0) AS audioCount,
      COALESCE(a.noteCount, 0) AS noteCount,
      COALESCE(a.demoCount, 0) AS demoCount,
      COALESCE(a.liveCount, 0) AS liveCount
    FROM tracks t
    LEFT JOIN (
      SELECT
        track_slug,
        COUNT(*) AS audioCount,
        SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) AS noteCount,
        SUM(CASE WHEN type = 'demo' THEN 1 ELSE 0 END) AS demoCount,
        SUM(CASE WHEN type = 'live' THEN 1 ELSE 0 END) AS liveCount
      FROM audio
      GROUP BY track_slug
    ) a ON a.track_slug = t.slug
    WHERE t.slug = ?
    LIMIT 1;
    `,
    [trackSlug]
  );

  if (!track) {
    return null;
  }

  await syncTrackAudioMetadataFromR2(trackSlug);

  const audioRows = await queryD1<AudioRow>(
    `
    SELECT
      slug,
      type,
      type_version AS typeVersion,
      description,
      date,
      date_override AS dateOverride
    FROM audio
    WHERE track_slug = ?
    ORDER BY type ASC, type_version ASC, slug ASC;
    `,
    [trackSlug]
  );
  const artistRows = await queryD1<{ artistSlug: string }>(
    `
    SELECT artist_slug AS artistSlug
    FROM track_artists
    WHERE track_slug = ?;
    `,
    [trackSlug]
  );
  const projectRows = await queryD1<{ projectSlug: string }>(
    `
    SELECT project_slug AS projectSlug
    FROM project_tracks
    WHERE track_slug = ?
    ORDER BY project_slug ASC, position ASC;
    `,
    [trackSlug]
  );
  const audioFiles = await listTrackAudioFilesFromR2(trackSlug);
  const audioFileBySlug = new Map(audioFiles.map((item) => [item.slug, item]));
  const noteCount = audioRows.filter((item) => item.type === "note").length;
  const demoCount = audioRows.filter((item) => item.type === "demo").length;
  const liveCount = audioRows.filter((item) => item.type === "live").length;
  const docFlags = await getTrackDocFlags(trackSlug).catch(() => createEmptyTrackDocFlags());

  return {
    ...docFlags,
    slug: track.slug,
    name: track.name,
    projectSlugs: projectRows.map((item) => item.projectSlug),
    artistSlugs: artistRows.map((item) => item.artistSlug),
    audioCount: audioRows.length,
    noteCount,
    demoCount,
    liveCount,
    audio: audioRows.map((item) => ({
      slug: item.slug,
      fileName: audioFileBySlug.get(item.slug)?.fileName ?? item.slug,
      fileHref: audioFileBySlug.get(item.slug)
        ? `/api/tracks/${encodeURIComponent(trackSlug)}/audio/${encodeURIComponent(item.slug)}`
        : null,
      type: item.type,
      typeVersion: toInt(item.typeVersion),
      description: item.description,
      date: item.date,
      dateOverride: item.dateOverride
    }))
  };
}
