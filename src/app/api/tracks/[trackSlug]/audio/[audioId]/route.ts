import { apiErrorResponse, badRequest, conflict, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { isAudioType } from "@/lib/audio/metadata";
import { queryD1 } from "@/lib/cloudflare/d1";
import { getObjectData, getObjectDataRange } from "@/lib/cloudflare/r2";
import { getTrackAudioFileFromD1 } from "@/lib/cloudflare/track-audio-files";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ trackSlug: string; audioId: string }> }
) {
  try {
    const { trackSlug, audioId } = await context.params;
    const audioFile = await getTrackAudioFileFromD1(trackSlug, audioId);
    if (!audioFile) {
      throw notFound(`Audio file metadata not found for id: ${audioId}`);
    }

    const requestedRange = request.headers.get("range");
    const object = requestedRange
      ? await getObjectDataRange(audioFile.key, requestedRange)
      : await getObjectData(audioFile.key);
    if (!object) {
      throw notFound(`R2 object not found: ${audioFile.key}`);
    }

    const headers = new Headers();
    headers.set("content-type", object.contentType ?? "application/octet-stream");
    headers.set("content-disposition", `inline; filename="${audioFile.fileName.replace(/"/g, "")}"`);
    headers.set("accept-ranges", object.acceptRanges ?? "bytes");
    if (object.etag) {
      headers.set("etag", object.etag);
    }
    if (object.contentLength !== null) {
      headers.set("content-length", String(object.contentLength));
    }
    if (object.contentRange) {
      headers.set("content-range", object.contentRange);
    }

    const payload = new Uint8Array(object.body);
    return new Response(payload, { status: object.contentRange ? 206 : 200, headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ trackSlug: string; audioId: string }> }
) {
  try {
    const { trackSlug, audioId } = await context.params;
    const payload = (await request.json()) as {
      name?: unknown;
      type?: unknown;
      date?: unknown;
    };
    const name = nullableText(payload.name);
    if (!name) {
      throw badRequest("Audio name is required.");
    }
    const type = nullableText(payload.type);
    if (!type || !isAudioType(type)) {
      throw badRequest("Audio type must be note, demo, or live.");
    }
    const date = nullableText(payload.date);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw badRequest("Audio date is required and must be YYYY-MM-DD.");
    }

    const [current] = await queryD1<{ id: string }>(
      `
      SELECT id
      FROM audio
      WHERE track_slug = ? AND id = ?
      LIMIT 1;
      `,
      [trackSlug, audioId]
    );
    if (!current) {
      throw notFound(`Audio file metadata not found for id: ${audioId}`);
    }

    const [nameConflict] = await queryD1<{ id: string }>(
      `
      SELECT id
      FROM audio
      WHERE track_slug = ? AND name = ? AND id <> ?
      LIMIT 1;
      `,
      [trackSlug, name, audioId]
    );
    if (nameConflict) {
      throw conflict(`Audio name already exists for this track: ${name}`);
    }

    await queryD1(
      `
      UPDATE audio
      SET
        name = ?,
        type = ?,
        date = ?,
        date_descriptor = NULL,
        updated_at = ?
      WHERE track_slug = ? AND id = ?;
      `,
      [name, type, date, new Date().toISOString(), trackSlug, audioId]
    );

    const track = await getTrackMetadataFromCloudflare(trackSlug);
    if (!track) {
      throw notFound(`Track not found after audio update: ${trackSlug}`);
    }
    return ok(track);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
