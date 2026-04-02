import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { createTagInCloudflare } from "@/lib/cloudflare/entities";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";

function optionalSlugList(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw badRequest(`${fieldName} must be an array of slugs.`);
  }
  const list = value.map((item) => requireTrimmedString(item, `${fieldName}[]`));
  const deduped = Array.from(new Set(list));
  if (deduped.length !== list.length) {
    throw badRequest(`${fieldName} must not contain duplicates.`);
  }
  return deduped;
}

export async function GET() {
  try {
    const items = await listTagsFromCloudflare();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const name = requireTrimmedString(body.name, "name");
    const trackSlugs = optionalSlugList(body.trackSlugs, "trackSlugs");

    const entity = await createTagInCloudflare(name);

    if (trackSlugs) {
      for (const trackSlug of trackSlugs) {
        await queryD1(
          `
          INSERT INTO track_tags (track_slug, tag_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, tag_slug) DO NOTHING;
          `,
          [trackSlug, entity.slug]
        );
      }
    }

    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
