import { apiErrorResponse } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { createTrackInCloudflare } from "@/lib/cloudflare/entities";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export async function GET() {
  try {
    const items = await listTracksFromCloudflare();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const entity = await createTrackInCloudflare(requireTrimmedString(body.name, "name"));
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
