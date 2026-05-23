import { apiErrorResponse } from "@/lib/api/errors";
import { createFullBackupZip } from "@/lib/cloudflare/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backup = await createFullBackupZip();
    const headers = new Headers();
    headers.set("content-type", "application/zip");
    headers.set("content-disposition", `attachment; filename="${backup.fileName}"`);
    headers.set("cache-control", "no-store");
    headers.set("content-length", String(backup.body.byteLength));

    const body = backup.body.buffer.slice(
      backup.body.byteOffset,
      backup.body.byteOffset + backup.body.byteLength
    ) as ArrayBuffer;

    return new Response(body, { headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
