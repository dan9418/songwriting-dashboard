import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

interface TrackRow {
  slug: string;
  name: string;
}

function asTrackPayload(body: Record<string, unknown>): Record<string, unknown> {
  const maybeData = body.data;
  if (maybeData && typeof maybeData === "object" && !Array.isArray(maybeData)) {
    return maybeData as Record<string, unknown>;
  }
  return body;
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

function optionalProjectSlug(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return [];
  }
  if (typeof value !== "string") {
    throw badRequest(`projectSlug must be a string or null.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  return [trimmed];
}

async function getTrackRowOrThrow(trackSlug: string): Promise<TrackRow> {
  const rows = await queryD1<TrackRow>(
    `
    SELECT slug, name
    FROM tracks
    WHERE slug = ?
    LIMIT 1;
    `,
    [trackSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Track not found: ${trackSlug}`);
  }
  return row;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const entity = await getTrackMetadataFromCloudflare(trackSlug);
    if (!entity) {
      throw notFound(`Track not found: ${trackSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ trackSlug: string }> }
) {
  try {
    const { trackSlug } = await context.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = asTrackPayload(body);
    assertSlugMatch(payload.slug, trackSlug);

    const current = await getTrackRowOrThrow(trackSlug);
    const nextName =
      payload.name === undefined ? current.name : requireTrimmedString(payload.name, "name");
    const nextArtistSlugs = optionalSlugList(payload.artistSlugs, "artistSlugs");
    const nextProjectSlugs =
      optionalSlugList(payload.projectSlugs, "projectSlugs") ?? optionalProjectSlug(payload.projectSlug);

    await queryD1(
      `
      UPDATE tracks
      SET name = ?
      WHERE slug = ?;
      `,
      [nextName, trackSlug]
    );

    if (nextArtistSlugs) {
      await queryD1(`DELETE FROM track_artists WHERE track_slug = ?;`, [trackSlug]);
      for (const artistSlug of nextArtistSlugs) {
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

    if (nextProjectSlugs) {
      await queryD1(`DELETE FROM project_tracks WHERE track_slug = ?;`, [trackSlug]);
      for (const projectSlug of nextProjectSlugs) {
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
          [projectSlug, trackSlug, nextPosition]
        );
      }
    }

    const entity = await getTrackMetadataFromCloudflare(trackSlug);
    if (!entity) {
      throw notFound(`Track not found after update: ${trackSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ trackSlug: string }> }) {
  try {
    return PUT(request, context);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ trackSlug: string }> }) {
  try {
    const { trackSlug } = await context.params;
    const existed = (await queryD1<{ slug: string }>(
      `
      SELECT slug
      FROM tracks
      WHERE slug = ?
      LIMIT 1;
      `,
      [trackSlug]
    )).length > 0;
    if (existed) {
      await queryD1(`DELETE FROM tracks WHERE slug = ?;`, [trackSlug]);
    }
    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
