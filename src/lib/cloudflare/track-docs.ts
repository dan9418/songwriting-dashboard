import matter from "gray-matter";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, getMarkdownObject, putMarkdownObject } from "@/lib/cloudflare/r2";

export type TrackDocType = "notes";

const TRACK_DOC_TYPE = "notes";
const TRACK_DOC_FILE_NAME = "lyrics.md";

interface TrackExistsRow {
  slug: string;
}

export interface TrackDocRecord {
  type: TrackDocType;
  path: string;
  exists: boolean;
  content: string;
  etag: string | null;
  parsed: {
    data: Record<string, unknown>;
    content: string;
  } | null;
}

export function parseTrackDocType(value: string): TrackDocType {
  if (value === TRACK_DOC_TYPE) {
    return value;
  }
  throw badRequest(`Invalid doc type: ${value}`);
}

export function getCanonicalTrackDocPath(trackSlug: string): string {
  return `tracks/${trackSlug}/${TRACK_DOC_FILE_NAME}`;
}

export function parseCanonicalTrackDocPath(path: string): { trackSlug: string } | null {
  const match = /^tracks\/([^/]+)\/lyrics\.md$/i.exec(path);
  if (!match) {
    return null;
  }
  return {
    trackSlug: match[1]
  };
}

function parseMarkdown(content: string) {
  const parsed = matter(content);
  return {
    data: parsed.data as Record<string, unknown>,
    content: parsed.content
  };
}

async function assertTrackExists(trackSlug: string): Promise<void> {
  const rows = await queryD1<TrackExistsRow>(
    `
    SELECT slug
    FROM tracks
    WHERE slug = ?
    LIMIT 1;
    `,
    [trackSlug]
  );
  if (rows.length === 0) {
    throw notFound(`Track not found: ${trackSlug}`);
  }
}

export async function getTrackDoc(trackSlug: string, type: TrackDocType): Promise<TrackDocRecord> {
  await assertTrackExists(trackSlug);
  const path = getCanonicalTrackDocPath(trackSlug);
  const object = await getMarkdownObject(path);
  if (!object) {
    return {
      type: TRACK_DOC_TYPE,
      path,
      exists: false,
      content: "",
      etag: null,
      parsed: null
    };
  }

  return {
    type,
    path,
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
  await assertTrackExists(trackSlug);
  const path = getCanonicalTrackDocPath(trackSlug);
  const existingObject = await getMarkdownObject(path);
  if (existingObject) {
    throw conflict(`${type} document already exists.`);
  }

  await putMarkdownObject(path, content);
  return getTrackDoc(trackSlug, type);
}

export async function updateTrackDoc(
  trackSlug: string,
  type: TrackDocType,
  content: string
): Promise<TrackDocRecord> {
  await assertTrackExists(trackSlug);
  const path = getCanonicalTrackDocPath(trackSlug);
  const existingObject = await getMarkdownObject(path);
  if (!existingObject) {
    throw notFound(`${type} document does not exist.`);
  }

  await putMarkdownObject(path, content);
  return getTrackDoc(trackSlug, type);
}

export async function deleteTrackDoc(
  trackSlug: string,
  _type: TrackDocType
): Promise<{ deleted: boolean }> {
  void _type;
  await assertTrackExists(trackSlug);
  const path = getCanonicalTrackDocPath(trackSlug);
  const existingObject = await getMarkdownObject(path);
  if (!existingObject) {
    return { deleted: false };
  }

  await deleteObject(path);
  return { deleted: true };
}
