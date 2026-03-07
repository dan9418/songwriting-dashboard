import { apiErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export async function GET(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    // Keep request arg to preserve route signature consistency in this folder.
    void request;
    const items = await listTracksFromCloudflare(userSlug);
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
