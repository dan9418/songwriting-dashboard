import { ApiError, apiErrorResponse, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

function remoteOnlyWriteError(): never {
  throw new ApiError(
    501,
    "INTERNAL_ERROR",
    "Remote-only mode: track write endpoints are not implemented for D1/R2 yet."
  );
}

export async function GET(
  _: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const entity = await getTrackMetadataFromCloudflare(trackSlug);
    if (!entity) {
      throw notFound(`Track not found: ${trackSlug}`);
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
