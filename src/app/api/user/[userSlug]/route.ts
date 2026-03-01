import { apiErrorResponse } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { deleteUser, getUser, saveUser } from "@/lib/fs/repositories";

export async function GET(_: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const entity = await getUser(userSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody>(request);
    await saveUser(userSlug, body.data, body.content ?? "");
    const entity = await getUser(userSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<Partial<Record<string, unknown>>>>(request);
    const current = await getUser(userSlug);
    await saveUser(userSlug, { ...current.data, ...body.data }, body.content ?? current.content);
    const entity = await getUser(userSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const existed = await deleteUser(userSlug);
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

