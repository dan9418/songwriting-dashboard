import { apiErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listR2BucketData } from "@/lib/cloudflare/admin";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ bucket: string }> }) {
  try {
    const { bucket } = await context.params;
    const objects = await listR2BucketData(bucket, 200);
    return ok({ objects });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
