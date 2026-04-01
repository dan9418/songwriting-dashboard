import { apiErrorResponse } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import {
  createNotebookPage,
  listNotebookPages
} from "@/lib/cloudflare/notebook-pages";
import { createNotebookPageBodySchema } from "@/lib/domain/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pages = await listNotebookPages();
    return ok(pages);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createNotebookPageBodySchema.parse(await parseJsonBody(request));
    const record = await createNotebookPage(body);
    return ok(record, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
