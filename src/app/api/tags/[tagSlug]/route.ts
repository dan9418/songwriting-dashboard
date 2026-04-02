import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { assertSlugMatch, parseJsonBody, requireTrimmedString } from "@/lib/api/request";
import { deleted, ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { assertSlugAvailable } from "@/lib/cloudflare/entities";
import { getTagMetadataFromCloudflare, getTagMetadataFromCloudflareOrThrow } from "@/lib/cloudflare/tags";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface TagRow {
  slug: string;
  name: string;
}

function asTagPayload(body: Record<string, unknown>): Record<string, unknown> {
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

async function getTagRowOrThrow(tagSlug: string): Promise<TagRow> {
  const rows = await queryD1<TagRow>(
    `
    SELECT slug, name
    FROM tags
    WHERE slug = ?
    LIMIT 1;
    `,
    [tagSlug]
  );
  const row = rows[0];
  if (!row) {
    throw notFound(`Tag not found: ${tagSlug}`);
  }
  return row;
}

export async function GET(_: Request, context: { params: Promise<{ tagSlug: string }> }) {
  try {
    const { tagSlug } = await context.params;
    const entity = await getTagMetadataFromCloudflareOrThrow(tagSlug);
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ tagSlug: string }> }) {
  try {
    const { tagSlug } = await context.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = asTagPayload(body);
    assertSlugMatch(payload.slug, tagSlug);

    const current = await getTagRowOrThrow(tagSlug);
    const nextName =
      payload.name === undefined ? current.name : requireTrimmedString(payload.name, "name");
    const nextTrackSlugs = optionalSlugList(payload.trackSlugs, "trackSlugs");
    const nextSlug = ensureNonEmptySlug(nextName);

    if (nextSlug !== current.slug) {
      await assertSlugAvailable("tags", nextSlug, current.slug);
    }

    await queryD1(
      `
      UPDATE tags
      SET slug = ?, name = ?
      WHERE slug = ?;
      `,
      [nextSlug, nextName, current.slug]
    );

    if (nextTrackSlugs) {
      await queryD1(`DELETE FROM track_tags WHERE tag_slug = ?;`, [nextSlug]);
      for (const trackSlug of nextTrackSlugs) {
        await queryD1(
          `
          INSERT INTO track_tags (track_slug, tag_slug)
          VALUES (?, ?)
          ON CONFLICT(track_slug, tag_slug) DO NOTHING;
          `,
          [trackSlug, nextSlug]
        );
      }
    }

    const entity = await getTagMetadataFromCloudflare(nextSlug);
    if (!entity) {
      throw notFound(`Tag not found after update: ${nextSlug}`);
    }
    return ok(entity);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ tagSlug: string }> }) {
  try {
    return PUT(request, context);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ tagSlug: string }> }) {
  try {
    const { tagSlug } = await context.params;
    const existed = (await queryD1<{ slug: string }>(
      `
      SELECT slug
      FROM tags
      WHERE slug = ?
      LIMIT 1;
      `,
      [tagSlug]
    )).length > 0;

    if (existed) {
      await queryD1(`DELETE FROM tags WHERE slug = ?;`, [tagSlug]);
    }

    return deleted(existed);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
