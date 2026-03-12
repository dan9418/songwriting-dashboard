import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";

type ProjectType = "album" | "ep" | "single" | "setlist";

interface ProjectRow {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  releaseDate: string | null;
  remasterDate: string | null;
}

function asProjectPayload(body: Record<string, unknown>): Record<string, unknown> {
  const maybeData = body.data;
  if (maybeData && typeof maybeData === "object" && !Array.isArray(maybeData)) {
    return maybeData as Record<string, unknown>;
  }
  return body;
}

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

function optionalProjectType(value: unknown): ProjectType | undefined {
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

async function getProjectRowForArtistOrThrow(
  artistSlug: string,
  projectSlug: string
): Promise<ProjectRow> {
  const rows = await queryD1<ProjectRow>(
    `
    SELECT
      p.slug AS slug,
      p.name AS name,
      p.description AS description,
      p.type AS type,
      p.release_date AS releaseDate,
      p.remaster_date AS remasterDate
    FROM projects p
    INNER JOIN project_artists pa
      ON pa.project_slug = p.slug
    WHERE p.slug = ?
      AND pa.artist_slug = ?
    LIMIT 1;
    `,
    [projectSlug, artistSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Project not found: ${projectSlug}`);
  }
  return row;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { artistSlug, projectSlug } = await context.params;
    const projects = await listProjectsFromCloudflare();
    const entity = projects.find(
      (item) => item.slug === projectSlug && item.artistSlugs.some((artist) => artist.slug === artistSlug)
    );
    if (!entity) {
      throw notFound(`Project not found: ${projectSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { artistSlug, projectSlug } = await context.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = asProjectPayload(body);
    assertSlugMatch(payload.slug, projectSlug);

    const current = await getProjectRowForArtistOrThrow(artistSlug, projectSlug);
    const nextName =
      payload.name === undefined ? current.name : requireTrimmedString(payload.name, "name");
    const nextDescription = optionalString(payload.description, "description");
    const nextType = optionalProjectType(payload.type);
    const nextReleaseDate = optionalDate(payload.releaseDate, "releaseDate");
    const nextRemasterDate = optionalDate(payload.remasterDate, "remasterDate");
    const nextArtistSlugs = optionalSlugList(payload.artistSlugs, "artistSlugs");
    const nextTrackSlugs = optionalSlugList(payload.trackSlugs, "trackSlugs");

    if (nextArtistSlugs && !nextArtistSlugs.includes(artistSlug)) {
      throw badRequest(`artistSlugs must include route artist slug: ${artistSlug}`);
    }

    await queryD1(
      `
      UPDATE projects
      SET
        name = ?,
        description = ?,
        type = ?,
        release_date = ?,
        remaster_date = ?
      WHERE slug = ?;
      `,
      [
        nextName,
        nextDescription ?? current.description,
        nextType ?? current.type,
        nextReleaseDate === undefined ? current.releaseDate : nextReleaseDate,
        nextRemasterDate === undefined ? current.remasterDate : nextRemasterDate,
        projectSlug
      ]
    );

    if (nextArtistSlugs) {
      await queryD1(`DELETE FROM project_artists WHERE project_slug = ?;`, [projectSlug]);
      for (const nextArtistSlug of nextArtistSlugs) {
        await queryD1(
          `
          INSERT INTO project_artists (project_slug, artist_slug)
          VALUES (?, ?)
          ON CONFLICT(project_slug, artist_slug) DO NOTHING;
          `,
          [projectSlug, nextArtistSlug]
        );
      }
    }

    if (nextTrackSlugs) {
      await queryD1(`DELETE FROM project_tracks WHERE project_slug = ?;`, [projectSlug]);
      for (const [index, trackSlug] of nextTrackSlugs.entries()) {
        await queryD1(
          `
          INSERT INTO project_tracks (project_slug, track_slug, position)
          VALUES (?, ?, ?)
          ON CONFLICT(project_slug, track_slug) DO UPDATE SET position = excluded.position;
          `,
          [projectSlug, trackSlug, index + 1]
        );
      }
    }

    const projects = await listProjectsFromCloudflare();
    const entity = projects.find(
      (item) => item.slug === projectSlug && item.artistSlugs.some((artist) => artist.slug === artistSlug)
    );
    if (!entity) {
      throw notFound(`Project not found after update: ${projectSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    return PUT(request, context);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ artistSlug: string; projectSlug: string }> }
) {
  try {
    const { artistSlug, projectSlug } = await context.params;
    await getProjectRowForArtistOrThrow(artistSlug, projectSlug);
    await queryD1(`DELETE FROM projects WHERE slug = ?;`, [projectSlug]);
    return deleted(true);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return deleted(false);
    }
    return apiErrorResponse(error);
  }
}
