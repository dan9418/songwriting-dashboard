import { apiErrorResponse, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { syncTrackAudioMetadataFromR2 } from "@/lib/cloudflare/audio-sync";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const sync = await syncTrackAudioMetadataFromR2(trackSlug);
    const track = await getTrackMetadataFromCloudflare(trackSlug);
    if (!track) {
      throw notFound(`Track not found: ${trackSlug}`);
    }
    return ok({ track, sync });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
