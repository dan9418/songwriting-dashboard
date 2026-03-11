import { apiErrorResponse } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { deleteArtist, getArtist, saveArtist } from "@/lib/fs/repositories";

export async function GET(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const entity = await getArtist(artistSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    assertSlugMatch(body.data.slug, artistSlug);
    await saveArtist(artistSlug, body.data, body.content ?? "");
    const entity = await getArtist(artistSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getArtist(artistSlug);
    const nextData = { ...current.data, ...body.data };
    assertSlugMatch(nextData.slug, artistSlug);
    await saveArtist(artistSlug, nextData, body.content ?? current.content);
    const entity = await getArtist(artistSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const existed = await deleteArtist(artistSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
