import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";

interface ArtistRow {
  slug: string;
  name: string;
  description: string;
}

function asArtistPayload(body: Record<string, unknown>): Record<string, unknown> {
  const maybeData = body.data;
  if (maybeData && typeof maybeData === "object" && !Array.isArray(maybeData)) {
    return maybeData as Record<string, unknown>;
  }
  return body;
}

function requireOptionalString(value: unknown, fieldName: string): string | undefined {
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

async function getArtistRowOrThrow(artistSlug: string): Promise<ArtistRow> {
  const rows = await queryD1<ArtistRow>(
    `
    SELECT slug, name, description
    FROM artists
    WHERE slug = ?
    LIMIT 1;
    `,
    [artistSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Artist not found: ${artistSlug}`);
  }
  return row;
}

export async function GET(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const artists = await listArtistsFromCloudflare();
    const entity = artists.find((item) => item.slug === artistSlug);
    if (!entity) {
      throw notFound(`Artist not found: ${artistSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = asArtistPayload(body);
    assertSlugMatch(payload.slug, artistSlug);
    const current = await getArtistRowOrThrow(artistSlug);
    const nextName =
      payload.name === undefined ? current.name : requireTrimmedString(payload.name, "name");
    const nextDescription = requireOptionalString(payload.description, "description");
    const nextProjectSlugs = optionalSlugList(payload.projectSlugs, "projectSlugs");
    const nextTrackSlugs = optionalSlugList(payload.trackSlugs, "trackSlugs");

    await queryD1(
      `
      UPDATE artists
      SET name = ?, description = ?
      WHERE slug = ?;
      `,
      [nextName, nextDescription ?? current.description, artistSlug]
    );

    if (nextProjectSlugs) {
      await queryD1(`DELETE FROM project_artists WHERE artist_slug = ?;`, [artistSlug]);
      for (const projectSlug of nextProjectSlugs) {
        await queryD1(
          `
          INSERT INTO project_artists (project_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(project_slug, artist_slug) DO NOTHING;
          `,
          [projectSlug, artistSlug]
        );
      }
    }

    if (nextTrackSlugs) {
      await queryD1(`DELETE FROM track_artists WHERE artist_slug = ?;`, [artistSlug]);
      for (const trackSlug of nextTrackSlugs) {
        await queryD1(
          `
          INSERT INTO track_artists (track_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, artist_slug) DO NOTHING;
          `,
          [trackSlug, artistSlug]
        );
      }
    }

    const items = await listArtistsFromCloudflare();
    const updated = items.find((item) => item.slug === artistSlug);
    if (!updated) {
      throw notFound(`Artist not found after update: ${artistSlug}`);
    }
    return ok(updated);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    return PUT(request, context);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const existed = (await queryD1<{ slug: string }>(
      `
      SELECT slug
      FROM artists
      WHERE slug = ?
      LIMIT 1;
      `,
      [artistSlug]
    )).length > 0;
    if (existed) {
      await queryD1(`DELETE FROM artists WHERE slug = ?;`, [artistSlug]);
    }
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
