import { apiErrorResponse, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { reconcileTrackAudioObjects } from "@/lib/cloudflare/audio-sync";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const reconciliation = await reconcileTrackAudioObjects(trackSlug);
    const track = await getTrackMetadataFromCloudflare(trackSlug);
    if (!track) {
      throw notFound(`Track not found: ${trackSlug}`);
    }
    return ok({ track, reconciliation });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
