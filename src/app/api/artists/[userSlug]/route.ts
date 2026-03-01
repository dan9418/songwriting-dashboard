import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, type WriteMarkdownBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { getArtist, listArtists, saveArtist } from "@/lib/fs/repositories";

export async function GET(_: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const items = await listArtists(userSlug);
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const body = await parseJsonBody<WriteMarkdownBody<{ slug?: string } & Record<string, unknown>>>(request);
    const artistSlug = body.data.slug;
    if (!artistSlug) {
      throw badRequest("Artist slug is required in payload data.slug");
    }
    await saveArtist(userSlug, artistSlug, body.data, body.content ?? "");
    const entity = await getArtist(userSlug, artistSlug);
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

