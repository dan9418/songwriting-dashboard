import matter from "gray-matter";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, getMarkdownObject, putMarkdownObject } from "@/lib/cloudflare/r2";
import { resolveUserId } from "@/lib/cloudflare/users";

export type TrackDocType = "lyrics" | "chords" | "notes";

const DOC_TYPE_TO_COLUMN: Record<TrackDocType, "lyrics_path" | "chords_path" | "notes_path"> = {
  lyrics: "lyrics_path",
  chords: "chords_path",
  notes: "notes_path"
};

interface TrackDocPathRow {
  path: string | null;
}

export interface TrackDocRecord {
  type: TrackDocType;
  path: string | null;
  exists: boolean;
  content: string;
  etag: string | null;
  parsed: {
    data: Record<string, unknown>;
    content: string;
  } | null;
}

export function parseTrackDocType(value: string): TrackDocType {
  if (value === "lyrics" || value === "chords" || value === "notes") {
    return value;
  }
  throw badRequest(`Invalid doc type: ${value}`);
}

function defaultDocPath(userSlug: string, trackSlug: string, type: TrackDocType): string {
  return `users/${userSlug}/tracks/${trackSlug}/${type}.md`;
}

async function getPathRow(userSlug: string, trackSlug: string, type: TrackDocType): Promise<TrackDocPathRow> {
  const userId = await resolveUserId(userSlug);
  const column = DOC_TYPE_TO_COLUMN[type];
  const rows = await queryD1<TrackDocPathRow>(
    `SELECT ${column} AS path FROM tracks WHERE user_id = ? AND slug = ? LIMIT 1;`,
    [userId, trackSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Track not found: ${trackSlug}`);
  }
  return row;
}

async function setPathValue(
  userSlug: string,
  trackSlug: string,
  type: TrackDocType,
  path: string | null
): Promise<void> {
  const userId = await resolveUserId(userSlug);
  const column = DOC_TYPE_TO_COLUMN[type];
  await queryD1(`UPDATE tracks SET ${column} = ? WHERE user_id = ? AND slug = ?;`, [path, userId, trackSlug]);
}

function parseMarkdown(content: string) {
  const parsed = matter(content);
  return {
    data: parsed.data as Record<string, unknown>,
    content: parsed.content
  };
}

export async function getTrackDoc(userSlug: string, trackSlug: string, type: TrackDocType): Promise<TrackDocRecord> {
  const row = await getPathRow(userSlug, trackSlug, type);
  if (!row.path) {
    return {
      type,
      path: null,
      exists: false,
      content: "",
      etag: null,
      parsed: null
    };
  }

  const object = await getMarkdownObject(row.path);
  if (!object) {
    return {
      type,
      path: row.path,
      exists: false,
      content: "",
      etag: null,
      parsed: null
    };
  }

  return {
    type,
    path: row.path,
    exists: true,
    content: object.content,
    etag: object.etag,
    parsed: parseMarkdown(object.content)
  };
}

export async function createTrackDoc(
  userSlug: string,
  trackSlug: string,
  type: TrackDocType,
  content: string
): Promise<TrackDocRecord> {
  const row = await getPathRow(userSlug, trackSlug, type);
  if (row.path) {
    const existingObject = await getMarkdownObject(row.path);
    if (existingObject) {
      throw conflict(`${type} document already exists.`);
    }
    await putMarkdownObject(row.path, content);
    return getTrackDoc(userSlug, trackSlug, type);
  }

  const path = defaultDocPath(userSlug, trackSlug, type);
  await putMarkdownObject(path, content);
  await setPathValue(userSlug, trackSlug, type, path);
  return getTrackDoc(userSlug, trackSlug, type);
}

export async function updateTrackDoc(
  userSlug: string,
  trackSlug: string,
  type: TrackDocType,
  content: string
): Promise<TrackDocRecord> {
  const row = await getPathRow(userSlug, trackSlug, type);
  if (!row.path) {
    throw notFound(`${type} document does not exist.`);
  }

  await putMarkdownObject(row.path, content);
  return getTrackDoc(userSlug, trackSlug, type);
}

export async function deleteTrackDoc(
  userSlug: string,
  trackSlug: string,
  type: TrackDocType
): Promise<{ deleted: boolean }> {
  const row = await getPathRow(userSlug, trackSlug, type);
  if (!row.path) {
    return { deleted: false };
  }

  await deleteObject(row.path);
  await setPathValue(userSlug, trackSlug, type, null);
  return { deleted: true };
}
