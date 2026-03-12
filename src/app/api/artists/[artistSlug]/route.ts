import { ApiError, apiErrorResponse, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";

function remoteOnlyWriteError(): never {
  throw new ApiError(
    501,
    "INTERNAL_ERROR",
    "Remote-only mode: artist write endpoints are not implemented for D1/R2 yet."
  );
}

export async function GET(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const artists = await listArtistsFromCloudflare();
    const entity = artists.find((item) => item.slug === artistSlug);
    if (!entity) {
      throw notFound(`Artist not found: ${artistSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT() {
  try {
    remoteOnlyWriteError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH() {
  try {
    remoteOnlyWriteError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    remoteOnlyWriteError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}
