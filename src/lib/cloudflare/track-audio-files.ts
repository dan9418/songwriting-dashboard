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
