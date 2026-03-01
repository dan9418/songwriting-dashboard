import { apiErrorResponse } from "@/lib/api/errors";
import { parseListQueryParam } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { searchUserData, type SearchType } from "@/lib/search/index";

function parseType(value: string | null): SearchType | undefined {
  if (!value) {
    return undefined;
  }
  if (value === "artist" || value === "project" || value === "track" || value === "fragment") {
    return value;
  }
  return undefined;
}

export async function GET(request: Request, context: { params: Promise<{ userSlug: string }> }) {
  try {
    const { userSlug } = await context.params;
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const tags = parseListQueryParam(url.searchParams, "tags");
    const type = parseType(url.searchParams.get("type"));
    const items = await searchUserData(userSlug, { q, tags, type });
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

