import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { createTrackInCloudflare } from "@/lib/cloudflare/entities";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

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
    const items = await listTracksFromCloudflare();
    return ok({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const name = requireTrimmedString(body.name, "name");
    const artistSlugs = optionalSlugList(body.artistSlugs, "artistSlugs");
    const projectSlugs = optionalSlugList(body.projectSlugs, "projectSlugs");
    const tagSlugs = optionalSlugList(body.tagSlugs, "tagSlugs");

    const entity = await createTrackInCloudflare(name);

    if (artistSlugs) {
      for (const artistSlug of artistSlugs) {
        await queryD1(
          `
          INSERT INTO track_artists (track_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, artist_slug) DO NOTHING;
          `,
          [entity.slug, artistSlug]
        );
      }
    }

    if (projectSlugs) {
      for (const projectSlug of projectSlugs) {
        const rows = await queryD1<{ nextPosition: number | string }>(
          `
          SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
          FROM project_tracks
          WHERE project_slug = ?;
          `,
          [projectSlug]
        );
        const nextPosition = Number(rows[0]?.nextPosition ?? 1);
        await queryD1(
          `
          INSERT INTO project_tracks (project_slug, track_slug, position)
          VALUES (?, ?, ?)
          ON CONFLICT(project_slug, track_slug) DO UPDATE SET position = excluded.position;
          `,
          [projectSlug, entity.slug, nextPosition]
        );
      }
    }

    if (tagSlugs) {
      for (const tagSlug of tagSlugs) {
        await queryD1(
          `
          INSERT INTO track_tags (track_slug, tag_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, tag_slug) DO NOTHING;
          `,
          [entity.slug, tagSlug]
        );
      }
    }

    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
