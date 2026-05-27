import { conflict, apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import {
  audioExtensionForFileName,
  buildAudioObjectKey,
  contentTypeForAudioExtension,
  defaultAudioName,
  isAudioType
} from "@/lib/audio/metadata";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, objectExists, putObjectData } from "@/lib/cloudflare/r2";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

export const runtime = "nodejs";

interface TrackExistsRow {
  slug: string;
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

function normalizeNullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function audioNameExists(trackSlug: string, name: string): Promise<boolean> {
  const rows = await queryD1<{ id: string }>(
    `
    SELECT id
    FROM audio
    WHERE track_slug = ? AND name = ?
    LIMIT 1;
    `,
    [trackSlug, name]
  );
  return rows.length > 0;
}

async function resolveAudioName(trackSlug: string, type: string, requestedName: string | null): Promise<string> {
  if (requestedName) {
    if (await audioNameExists(trackSlug, requestedName)) {
      throw conflict(`Audio name already exists for this track: ${requestedName}`);
    }
    return requestedName;
  }

  const rows = await queryD1<{ count: number | string }>(
    `SELECT COUNT(*) AS count FROM audio WHERE track_slug = ? AND type = ?;`,
    [trackSlug, type]
  );
  let count = Number(rows[0]?.count ?? 0);
  let name = defaultAudioName(type as "note" | "demo" | "live", count);
  while (await audioNameExists(trackSlug, name)) {
    count += 1;
    name = defaultAudioName(type as "note" | "demo" | "live", count);
  }
  return name;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    await assertTrackExists(trackSlug);

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      throw badRequest("Upload must include a single audio file.");
    }
    if (!fileEntry.name.trim()) {
      throw badRequest("Uploaded file must have a filename.");
    }

    const type = normalizeNullableText(formData.get("type"));
    if (!type || !isAudioType(type)) {
      throw badRequest("Audio type must be note, demo, or live.");
    }
    const date = normalizeNullableText(formData.get("date"));
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw badRequest("Audio date is required and must be YYYY-MM-DD.");
    }
    const dateDescriptor = normalizeNullableText(formData.get("dateDescriptor"));
    const extension = audioExtensionForFileName(fileEntry.name);
    if (!extension) {
      throw badRequest("Audio file extension must be .mp3, .m4a, or .mp4.");
    }

    const audioId = crypto.randomUUID();
    const objectPath = buildAudioObjectKey(trackSlug, audioId, extension);
    if (await objectExists(objectPath)) {
      throw conflict(`Audio object already exists: ${objectPath}`);
    }
    const requestedName = normalizeNullableText(formData.get("name"));
    const name = await resolveAudioName(trackSlug, type, requestedName);

    const payload = new Uint8Array(await fileEntry.arrayBuffer());
    await putObjectData(
      objectPath,
      payload,
      fileEntry.type || contentTypeForAudioExtension(extension)
    );

    try {
      const now = new Date().toISOString();
      await queryD1(
        `
        INSERT INTO audio (
          id,
          track_slug,
          name,
          type,
          date,
          date_descriptor,
          object_key,
          original_filename,
          content_type,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          audioId,
          trackSlug,
          name,
          type,
          date,
          dateDescriptor,
          objectPath,
          fileEntry.name,
          fileEntry.type || contentTypeForAudioExtension(extension),
          now,
          now
        ]
      );
      const track = await getTrackMetadataFromCloudflare(trackSlug);
      if (!track) {
        throw notFound(`Track not found after upload: ${trackSlug}`);
      }
      return ok(track, 201);
    } catch (error) {
      await deleteObject(objectPath).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return apiErrorResponse(error);
  }
}
