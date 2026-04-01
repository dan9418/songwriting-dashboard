import { apiErrorResponse } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import {
  deleteNotebookPage,
  getNotebookPage,
  updateNotebookPage
} from "@/lib/cloudflare/notebook-pages";
import { updateNotebookPageBodySchema } from "@/lib/domain/schemas";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ pageSlug: string }> }
) {
  try {
    const { pageSlug } = await context.params;
    const record = await getNotebookPage(pageSlug);
    return ok(record);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ pageSlug: string }> }
) {
  try {
    const { pageSlug } = await context.params;
    const body = updateNotebookPageBodySchema.parse(await parseJsonBody(request));
    const record = await updateNotebookPage(pageSlug, body.content);
    return ok(record);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ pageSlug: string }> }
) {
  try {
    const { pageSlug } = await context.params;
    const result = await deleteNotebookPage(pageSlug);
    return ok(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
