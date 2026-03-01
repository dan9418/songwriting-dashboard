import { apiErrorResponse } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { enforceTrackAudioNaming } from "@/lib/domain/track-audio";
import { deleteSandboxTrack, getSandboxTrack, saveSandboxTrack } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string }> }
) {
  try {
    const { userSlug, trackSlug } = await context.params;
    const entity = await getSandboxTrack(userSlug, trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string }> }
) {
  try {
    const { userSlug, trackSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    assertSlugMatch(body.data.slug, trackSlug);
    const validatedTrack = enforceTrackAudioNaming(body.data);
    await saveSandboxTrack(userSlug, trackSlug, validatedTrack, body.content ?? "");
    const entity = await getSandboxTrack(userSlug, trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string }> }
) {
  try {
    const { userSlug, trackSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getSandboxTrack(userSlug, trackSlug);
    const nextData = enforceTrackAudioNaming({ ...current.data, ...body.data });
    assertSlugMatch(nextData.slug, trackSlug);
    await saveSandboxTrack(userSlug, trackSlug, nextData, body.content ?? current.content);
    const entity = await getSandboxTrack(userSlug, trackSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string }> }
) {
  try {
    const { userSlug, trackSlug } = await context.params;
    const existed = await deleteSandboxTrack(userSlug, trackSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

