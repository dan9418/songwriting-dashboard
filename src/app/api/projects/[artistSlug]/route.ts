import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";

function remoteOnlyWriteError(): never {
  throw new ApiError(
    501,
    "INTERNAL_ERROR",
    "Remote-only mode: project write endpoints are not implemented for D1/R2 yet."
  );
}

export async function GET(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const items = await listProjectsFromCloudflare();
    const filtered = items.filter((item) => item.artistSlugs.some((artist) => artist.slug === artistSlug));
    return ok({ items: filtered });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST() {
  try {
    remoteOnlyWriteError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}
