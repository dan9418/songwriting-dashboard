import { apiErrorResponse } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { deleteProject, getProject, saveProject } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    const entity = await getProject(projectSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    assertSlugMatch(body.data.slug, projectSlug);
    await saveProject(projectSlug, body.data, body.content ?? "");
    const entity = await getProject(projectSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getProject(projectSlug);
    const nextData = { ...current.data, ...body.data };
    assertSlugMatch(nextData.slug, projectSlug);
    await saveProject(projectSlug, nextData, body.content ?? current.content);
    const entity = await getProject(projectSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    const existed = await deleteProject(projectSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
