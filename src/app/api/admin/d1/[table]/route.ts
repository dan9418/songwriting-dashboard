import { apiErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { listD1TableData } from "@/lib/cloudflare/admin";

export async function GET(_: Request, context: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await context.params;
    const rows = await listD1TableData(table, 100);
    return ok({ rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
