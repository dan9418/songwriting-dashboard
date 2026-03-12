import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { createProjectInCloudflare } from "@/lib/cloudflare/entities";

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

function optionalProjectType(
  value: unknown
): "album" | "ep" | "single" | "setlist" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "album" || value === "ep" || value === "single" || value === "setlist") {
    return value;
  }
  throw badRequest(`type must be one of: album, ep, single, setlist.`);
}

async function assertArtistExists(artistSlug: string): Promise<void> {
  const rows = await queryD1<{ slug: string }>(
    `
    SELECT slug
    FROM artists
    WHERE slug = ?
    LIMIT 1;
    `,
    [artistSlug]
  );
  if (rows.length === 0) {
    throw notFound(`Artist not found: ${artistSlug}`);
  }
}

export async function GET(_: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const { artistSlug } = await context.params;
    const items = await listProjectsFromCloudflare();
    const filtered = items.filter((item) => item.artistSlugs.some((artist) => artist.slug === artistSlug));
    return ok({ items: filtered });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ artistSlug: string }> }) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = asProjectPayload(body);
    const { artistSlug } = await context.params;

    await assertArtistExists(artistSlug);

    const name = requireTrimmedString(payload.name, "name");
    const type = optionalProjectType(payload.type);
    const description = optionalString(payload.description, "description");
    const releaseDate = optionalDate(payload.releaseDate, "releaseDate");
    const remasterDate = optionalDate(payload.remasterDate, "remasterDate");

    const created = await createProjectInCloudflare(name);
    await queryD1(
      `
      INSERT INTO project_artists (project_slug, artist_slug)
      VALUES (?, ?)
      ON CONFLICT(project_slug, artist_slug) DO NOTHING;
      `,
      [created.slug, artistSlug]
    );

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
      [
        description ?? "",
        type ?? "single",
        releaseDate ?? null,
        remasterDate ?? null,
        created.slug
      ]
    );

    const items = await listProjectsFromCloudflare();
    const entity = items.find((item) => item.slug === created.slug);
    if (!entity) {
      throw notFound(`Project not found after create: ${created.slug}`);
    }
    return ok(entity, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
