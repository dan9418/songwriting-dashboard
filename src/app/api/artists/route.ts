import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { createArtistInCloudflare } from "@/lib/cloudflare/entities";

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw badRequest(`${fieldName} must be a string.`);
  }
  return value;
}

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
    const items = await listArtistsFromCloudflare();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const name = requireTrimmedString(body.name, "name");
    const description = optionalString(body.description, "description");
    const projectSlugs = optionalSlugList(body.projectSlugs, "projectSlugs");
    const trackSlugs = optionalSlugList(body.trackSlugs, "trackSlugs");

    const entity = await createArtistInCloudflare(name);

    if (description !== undefined) {
      await queryD1(`UPDATE artists SET description = ? WHERE slug = ?;`, [description, entity.slug]);
    }

    if (projectSlugs) {
      for (const projectSlug of projectSlugs) {
        await queryD1(
          `
          INSERT INTO project_artists (project_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(project_slug, artist_slug) DO NOTHING;
          `,
          [projectSlug, entity.slug]
        );
      }
    }

    if (trackSlugs) {
      for (const trackSlug of trackSlugs) {
        await queryD1(
          `
          INSERT INTO track_artists (track_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, artist_slug) DO NOTHING;
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
