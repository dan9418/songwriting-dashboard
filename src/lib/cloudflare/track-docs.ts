import matter from "gray-matter";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, getMarkdownObject, putMarkdownObject } from "@/lib/cloudflare/r2";

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

function normalizeDocPath(pathValue: string | null): string | null {
  if (!pathValue) {
    return null;
  }
  if (pathValue.startsWith("users/")) {
    return null;
  }
  return pathValue;
}

function defaultDocPath(trackSlug: string, type: TrackDocType): string {
  return `tracks/${trackSlug}/${type}.md`;
}

async function getPathRow(trackSlug: string, type: TrackDocType): Promise<TrackDocPathRow> {
  const column = DOC_TYPE_TO_COLUMN[type];
  const rows = await queryD1<TrackDocPathRow>(
    `SELECT ${column} AS path FROM tracks WHERE slug = ? LIMIT 1;`,
    [trackSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Track not found: ${trackSlug}`);
  }
  const normalized = normalizeDocPath(row.path);
  if (row.path && normalized === null) {
    await queryD1(`UPDATE tracks SET ${column} = ? WHERE slug = ?;`, [null, trackSlug]);
  }
  return { path: normalized };
}

async function setPathValue(
  trackSlug: string,
  type: TrackDocType,
  path: string | null
): Promise<void> {
  const column = DOC_TYPE_TO_COLUMN[type];
  await queryD1(`UPDATE tracks SET ${column} = ? WHERE slug = ?;`, [path, trackSlug]);
}

function parseMarkdown(content: string) {
  const parsed = matter(content);
  return {
    data: parsed.data as Record<string, unknown>,
    content: parsed.content
  };
}

export async function getTrackDoc(trackSlug: string, type: TrackDocType): Promise<TrackDocRecord> {
  const row = await getPathRow(trackSlug, type);
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
  trackSlug: string,
  type: TrackDocType,
  content: string
): Promise<TrackDocRecord> {
  const row = await getPathRow(trackSlug, type);
  if (row.path) {
    const existingObject = await getMarkdownObject(row.path);
    if (existingObject) {
      throw conflict(`${type} document already exists.`);
    }
    await putMarkdownObject(row.path, content);
    return getTrackDoc(trackSlug, type);
  }

  const path = defaultDocPath(trackSlug, type);
  await putMarkdownObject(path, content);
  await setPathValue(trackSlug, type, path);
  return getTrackDoc(trackSlug, type);
}

export async function updateTrackDoc(
  trackSlug: string,
  type: TrackDocType,
  content: string
): Promise<TrackDocRecord> {
  const row = await getPathRow(trackSlug, type);
  if (!row.path) {
    throw notFound(`${type} document does not exist.`);
  }

  await putMarkdownObject(row.path, content);
  return getTrackDoc(trackSlug, type);
}

export async function deleteTrackDoc(
  trackSlug: string,
  type: TrackDocType
): Promise<{ deleted: boolean }> {
  const row = await getPathRow(trackSlug, type);
  if (!row.path) {
    return { deleted: false };
  }

  await deleteObject(row.path);
  await setPathValue(trackSlug, type, null);
  return { deleted: true };
}
