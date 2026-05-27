import { queryD1 } from "@/lib/cloudflare/d1";
import { objectExists } from "@/lib/cloudflare/r2";

export interface TrackAudioFile {
  id: string;
  name: string;
  fileName: string;
  key: string;
  contentType: string | null;
  exists: boolean;
}

interface TrackAudioFileRow {
  id: string;
  name: string;
  objectKey: string;
  originalFilename: string | null;
  contentType: string | null;
}

interface AudioIndexRow {
  id: string;
  trackSlug: string;
  trackName: string;
  name: string;
  type: string;
  date: string;
  dateDescriptor: string | null;
  objectKey: string;
  originalFilename: string | null;
  contentType: string | null;
}

export interface AudioIndexItem {
  id: string;
  trackSlug: string;
  trackName: string;
  name: string;
  fileName: string;
  type: string;
  date: string;
  dateDescriptor: string | null;
  contentType: string | null;
  fileHref: string;
}

export function fileNameFromObjectKey(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] || key;
}

async function rowToTrackAudioFile(row: TrackAudioFileRow): Promise<TrackAudioFile> {
  return {
    id: row.id,
    name: row.name,
    fileName: row.originalFilename ?? fileNameFromObjectKey(row.objectKey),
    key: row.objectKey,
    contentType: row.contentType,
    exists: await objectExists(row.objectKey)
  };
}

export async function listTrackAudioFilesFromD1(
  trackSlug: string
): Promise<TrackAudioFile[]> {
  const rows = await queryD1<TrackAudioFileRow>(
    `
    SELECT
      id,
      name,
      object_key AS objectKey,
      original_filename AS originalFilename,
      content_type AS contentType
    FROM audio
    WHERE track_slug = ?
    ORDER BY type ASC, date ASC, name COLLATE NOCASE ASC, id ASC;
    `,
    [trackSlug]
  );
  return Promise.all(rows.map((row) => rowToTrackAudioFile(row)));
}

export async function getTrackAudioFileFromD1(
  trackSlug: string,
  audioId: string
): Promise<TrackAudioFile | null> {
  const [row] = await queryD1<TrackAudioFileRow>(
    `
    SELECT
      id,
      name,
      object_key AS objectKey,
      original_filename AS originalFilename,
      content_type AS contentType
    FROM audio
    WHERE track_slug = ? AND id = ?
    LIMIT 1;
    `,
    [trackSlug, audioId]
  );
  return row ? rowToTrackAudioFile(row) : null;
}

export async function listAudioIndexItemsFromD1(): Promise<AudioIndexItem[]> {
  const rows = await queryD1<AudioIndexRow>(
    `
    SELECT
      a.id,
      a.track_slug AS trackSlug,
      t.name AS trackName,
      a.name,
      a.type,
      a.date,
      a.date_descriptor AS dateDescriptor,
      a.object_key AS objectKey,
      a.original_filename AS originalFilename,
      a.content_type AS contentType
    FROM audio a
    INNER JOIN tracks t
      ON t.slug = a.track_slug
    ORDER BY t.name COLLATE NOCASE ASC, a.track_slug ASC, a.type ASC, a.date ASC, a.name COLLATE NOCASE ASC, a.id ASC;
    `
  );

  return rows.map((row) => ({
    id: row.id,
    trackSlug: row.trackSlug,
    trackName: row.trackName,
    name: row.name,
    fileName: row.originalFilename ?? fileNameFromObjectKey(row.objectKey),
    type: row.type,
    date: row.date,
    dateDescriptor: row.dateDescriptor,
    contentType: row.contentType,
    fileHref: `/api/tracks/${encodeURIComponent(row.trackSlug)}/audio/${encodeURIComponent(row.id)}`
  }));
}
