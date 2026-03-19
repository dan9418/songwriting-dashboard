import { apiErrorResponse, notFound } from "@/lib/api/errors";
import { getImagePathBySlug } from "@/lib/cloudflare/images";
import { getObjectData } from "@/lib/cloudflare/r2";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ imageSlug: string }> }
) {
  try {
    const { imageSlug } = await context.params;
    const imagePath = await getImagePathBySlug(imageSlug);
    if (!imagePath) {
      throw notFound(`Image not found for slug: ${imageSlug}`);
    }

    const object = await getObjectData(imagePath);
    if (!object) {
      throw notFound(`R2 object not found: ${imagePath}`);
    }

    const headers = new Headers();
    headers.set("content-type", object.contentType ?? "application/octet-stream");
    if (object.etag) {
      headers.set("etag", object.etag);
    }

    return new Response(new Uint8Array(object.body), { status: 200, headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
