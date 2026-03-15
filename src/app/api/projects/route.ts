import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { createProjectInCloudflare } from "@/lib/cloudflare/entities";

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw badRequest(`${fieldName} must be a string.`);
  }
  return value;
}

function optionalDate(value: unknown, fieldName: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw badRequest(`${fieldName} must be a string or null.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw badRequest(`${fieldName} must be in YYYY-MM-DD format.`);
  }
  return trimmed;
}

function optionalProjectType(value: unknown): "album" | "ep" | "single" | "setlist" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "album" || value === "ep" || value === "single" || value === "setlist") {
    return value;
  }
  throw badRequest(`type must be one of: album, ep, single, setlist.`);
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
    const items = await listProjectsFromCloudflare();
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
    const type = optionalProjectType(body.type);
    const releaseDate = optionalDate(body.releaseDate, "releaseDate");
    const remasterDate = optionalDate(body.remasterDate, "remasterDate");
    const artistSlugs = optionalSlugList(body.artistSlugs, "artistSlugs");
    const trackSlugs = optionalSlugList(body.trackSlugs, "trackSlugs");

    const entity = await createProjectInCloudflare(name);

    await queryD1(
      `
      UPDATE projects
      SET
        description = ?,
        type = ?,
        release_date = ?,
        remaster_date = ?
      WHERE slug = ?;
      `,
      [description ?? "", type ?? "single", releaseDate ?? null, remasterDate ?? null, entity.slug]
    );

    if (artistSlugs) {
      for (const artistSlug of artistSlugs) {
        await queryD1(
          `
          INSERT INTO project_artists (project_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(project_slug, artist_slug) DO NOTHING;
          `,
          [entity.slug, artistSlug]
        );
      }
    }

    if (trackSlugs) {
      for (const [index, trackSlug] of trackSlugs.entries()) {
        await queryD1(
          `
          INSERT INTO project_tracks (project_slug, track_slug, position)
          VALUES (?, ?, ?)
          ON CONFLICT(project_slug, track_slug) DO UPDATE SET position = excluded.position;
          `,
          [entity.slug, trackSlug, index + 1]
        );
      }
    }

    const items = await listProjectsFromCloudflare();
    const created = items.find((item) => item.slug === entity.slug);
    if (!created) {
      throw notFound(`Project not found after create: ${entity.slug}`);
    }
    return ok(created, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
