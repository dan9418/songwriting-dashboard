import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { getProject, listProjects, saveProject } from "@/lib/fs/repositories";

export async function GET(
  _: Request,
  context: { params: Promise<{ userSlug: string; artistSlug: string }> }
) {
  try {
    const { userSlug, artistSlug } = await context.params;
    const items = await listProjects(userSlug, artistSlug);
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userSlug: string; artistSlug: string }> }
) {
  try {
    const { userSlug, artistSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    const projectSlug = body.data.slug;
    if (!projectSlug) {
      throw badRequest("Project slug is required in payload data.slug");
    }
    await saveProject(userSlug, artistSlug, projectSlug, body.data, body.content ?? "");
    const entity = await getProject(userSlug, artistSlug, projectSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

