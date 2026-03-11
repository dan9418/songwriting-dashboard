import { apiErrorResponse } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { enforceTrackAudioNaming } from "@/lib/domain/track-audio";
import { deleteTrack, getTrack, saveTrack } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const entity = await getTrack(trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    assertSlugMatch(body.data.slug, trackSlug);
    const validatedTrack = enforceTrackAudioNaming(body.data);
    await saveTrack(trackSlug, validatedTrack, body.content ?? "");
    const entity = await getTrack(trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getTrack(trackSlug);
    const nextData = enforceTrackAudioNaming({ ...current.data, ...body.data });
    assertSlugMatch(nextData.slug, trackSlug);
    await saveTrack(trackSlug, nextData, body.content ?? current.content);
    const entity = await getTrack(trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ trackSlug: string }> }) {
  try {
    const { trackSlug } = await context.params;
    const existed = await deleteTrack(trackSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
