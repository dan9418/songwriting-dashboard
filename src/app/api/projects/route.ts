import { apiErrorResponse } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { createProjectInCloudflare } from "@/lib/cloudflare/entities";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const entity = await createProjectInCloudflare(requireTrimmedString(body.name, "name"));
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
