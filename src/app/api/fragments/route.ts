import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { getFragment, listFragmentsWithSummary, saveFragment } from "@/lib/fs/repositories";

export async function GET(_: Request) {
  try {
    const result = await listFragmentsWithSummary();
    return ok(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    const fragmentSlug = body.data.slug;
    if (!fragmentSlug) {
      throw badRequest("Fragment slug is required in payload data.slug");
    }
    await saveFragment(fragmentSlug, body.data, body.content ?? "");
    const entity = await getFragment(fragmentSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
