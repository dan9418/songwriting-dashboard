import { apiErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export async function GET(_: Request) {
  try {
    const items = await listTracksFromCloudflare();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
