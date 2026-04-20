import { conflict, apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, objectExists, putObjectData } from "@/lib/cloudflare/r2";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";
import { getTrackAudioFileFromR2 } from "@/lib/cloudflare/track-audio-files";
import { parseR2AudioMetadata } from "@/lib/audio/r2-audio-metadata";

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

function buildAudioObjectPath(trackSlug: string, fileName: string): string {
  return `tracks/${trackSlug}/audio/${fileName}`;
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

    const parsed = parseR2AudioMetadata(trackSlug, fileEntry.name);
    const existingAudio = await getTrackAudioFileFromR2(trackSlug, parsed.slug);
    if (existingAudio) {
      throw conflict(`Audio file already exists for slug: ${parsed.slug}`);
    }

    const objectPath = buildAudioObjectPath(trackSlug, fileEntry.name);
    if (await objectExists(objectPath)) {
      throw conflict(`Audio file already exists: ${fileEntry.name}`);
    }

    const payload = new Uint8Array(await fileEntry.arrayBuffer());
    await putObjectData(objectPath, payload, fileEntry.type || "application/octet-stream");

    try {
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
