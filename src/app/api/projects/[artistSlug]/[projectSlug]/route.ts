import { ApiError, apiErrorResponse, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";

function remoteOnlyWriteError(): never {
  throw new ApiError(
    501,
    "INTERNAL_ERROR",
    "Remote-only mode: project write endpoints are not implemented for D1/R2 yet."
  );
}

export async function GET(
  _: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { artistSlug, projectSlug } = await context.params;
    const projects = await listProjectsFromCloudflare();
    const entity = projects.find(
      (item) => item.slug === projectSlug && item.artistSlugs.some((artist) => artist.slug === artistSlug)
    );
    if (!entity) {
      throw notFound(`Project not found: ${projectSlug}`);
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
