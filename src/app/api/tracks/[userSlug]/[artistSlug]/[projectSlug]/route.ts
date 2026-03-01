import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { enforceTrackAudioNaming } from "@/lib/domain/track-audio";
import { getTrack, listTracks, saveTrack } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ userSlug: string; artistSlug: string; projectSlug: string }> }
) {
  try {
    const { userSlug, artistSlug, projectSlug } = await context.params;
    const items = await listTracks(userSlug, artistSlug, projectSlug);
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userSlug: string; artistSlug: string; projectSlug: string }> }
) {
  try {
    const { userSlug, artistSlug, projectSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    const trackSlug = body.data.slug;
    if (!trackSlug) {
      throw badRequest("Track slug is required in payload data.slug");
    }
    const validatedTrack = enforceTrackAudioNaming(body.data);
    await saveTrack(userSlug, artistSlug, projectSlug, trackSlug, validatedTrack, body.content ?? "");
    const entity = await getTrack(userSlug, artistSlug, projectSlug, trackSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

