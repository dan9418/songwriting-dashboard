import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { createBackupZipStream } from "@/lib/cloudflare/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBackupKind(value: string): "text" | "media" {
  if (value === "text" || value === "media") {
    return value;
  }
  throw badRequest(`Invalid backup type: ${value}`);
}

export async function GET(_: Request, context: { params: Promise<{ kind: string }> }) {
  try {
    const { kind } = await context.params;
    const backup = createBackupZipStream(parseBackupKind(kind));
    const headers = new Headers();
    headers.set("content-type", "application/zip");
    headers.set("content-disposition", `attachment; filename="${backup.fileName}"`);
    headers.set("cache-control", "no-store");

    return new Response(backup.stream, { headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
