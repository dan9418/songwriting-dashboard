import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { enforceTrackAudioNaming } from "@/lib/domain/track-audio";
import { getTrack, listTracks, saveTrack } from "@/lib/fs/repositories";

export async function GET(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const url = new URL(request.url);
    const projectSlug = url.searchParams.get("projectSlug") ?? undefined;
    const artistSlug = url.searchParams.get("artistSlug") ?? undefined;
    const scope = url.searchParams.get("scope");
    const items = await listTracks(userSlug, {
      projectSlug,
      artistSlug,
      unassignedOnly: scope === "sandbox"
    });
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    const trackSlug = body.data.slug;
    if (!trackSlug) {
      throw badRequest("Track slug is required in payload data.slug");
    }
    const validatedTrack = enforceTrackAudioNaming(body.data);
    await saveTrack(userSlug, trackSlug, validatedTrack, body.content ?? "");
    const entity = await getTrack(userSlug, trackSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
