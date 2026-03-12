import { ApiError, apiErrorResponse } from "@/lib/api/errors";

function remoteOnlyFragmentsError(): never {
  throw new ApiError(
    501,
    "INTERNAL_ERROR",
    "Remote-only mode: fragments are not implemented in D1/R2 yet."
  );
}

export async function GET() {
  try {
    remoteOnlyFragmentsError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST() {
  try {
    remoteOnlyFragmentsError();
  } catch (error) {
    return apiErrorResponse(error);
  }
}
