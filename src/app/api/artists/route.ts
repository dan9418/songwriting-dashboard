import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { createArtistInCloudflare } from "@/lib/cloudflare/entities";
import { getArtist, listArtists, saveArtist } from "@/lib/fs/repositories";

export async function GET() {
  try {
    const items = await listArtists();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    if ("name" in body) {
      const entity = await createArtistInCloudflare(requireTrimmedString(body.name, "name"));
      return ok(entity, 201);
    }
    const legacyBody = body as { data?: { slug?: string } & Record<string, unknown>; content?: string };
    const artistSlug = legacyBody.data?.slug;
    if (!artistSlug) {
      throw badRequest("Artist slug is required in payload data.slug");
    }
    await saveArtist(artistSlug, legacyBody.data, legacyBody.content ?? "");
    const entity = await getArtist(artistSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
