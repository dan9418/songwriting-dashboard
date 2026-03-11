import { apiErrorResponse } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { deleteFragment, getFragment, saveFragment } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ fragmentSlug: string }> }
) {
  try {
    const { fragmentSlug } = await context.params;
    const entity = await getFragment(fragmentSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ fragmentSlug: string }> }
) {
  try {
    const { fragmentSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    assertSlugMatch(body.data.slug, fragmentSlug);
    await saveFragment(fragmentSlug, body.data, body.content ?? "");
    const entity = await getFragment(fragmentSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ fragmentSlug: string }> }
) {
  try {
    const { fragmentSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getFragment(fragmentSlug);
    const nextData = { ...current.data, ...body.data };
    assertSlugMatch(nextData.slug, fragmentSlug);
    await saveFragment(fragmentSlug, nextData, body.content ?? current.content);
    const entity = await getFragment(fragmentSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ fragmentSlug: string }> }) {
  try {
    const { fragmentSlug } = await context.params;
    const existed = await deleteFragment(fragmentSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
