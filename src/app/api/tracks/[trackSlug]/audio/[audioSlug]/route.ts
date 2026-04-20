import { apiErrorResponse, notFound } from "@/lib/api/errors";
import { getObjectData, getObjectDataRange } from "@/lib/cloudflare/r2";
import { getTrackAudioFileFromR2 } from "@/lib/cloudflare/track-audio-files";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ trackSlug: string; audioSlug: string }> }
) {
  try {
    const { trackSlug, audioSlug } = await context.params;
    const audioFile = await getTrackAudioFileFromR2(trackSlug, audioSlug);
    if (!audioFile) {
      throw notFound(`Audio file not found for slug: ${audioSlug}`);
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
