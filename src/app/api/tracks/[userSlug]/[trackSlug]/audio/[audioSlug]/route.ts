import { apiErrorResponse, notFound } from "@/lib/api/errors";
import { getObjectData } from "@/lib/cloudflare/r2";
import { getTrackAudioFileFromR2 } from "@/lib/cloudflare/track-audio-files";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string; audioSlug: string }> }
) {
  try {
    const { userSlug, trackSlug, audioSlug } = await context.params;
    const audioFile = await getTrackAudioFileFromR2(userSlug, trackSlug, audioSlug);
    if (!audioFile) {
      throw notFound(`Audio file not found for slug: ${audioSlug}`);
    }

    const object = await getObjectData(audioFile.key);
    if (!object) {
      throw notFound(`R2 object not found: ${audioFile.key}`);
    }

    const headers = new Headers();
    headers.set("content-type", object.contentType ?? "application/octet-stream");
    headers.set("content-disposition", `inline; filename="${audioFile.fileName.replace(/"/g, "")}"`);
    if (object.etag) {
      headers.set("etag", object.etag);
    }

    const payload = new Uint8Array(object.body);
    return new Response(payload, { status: 200, headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
