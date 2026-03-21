import { queryD1 } from "@/lib/cloudflare/d1";

interface ImageSlugRow {
  imageSlug: string;
}

interface EntityImageRow extends ImageSlugRow {
  entitySlug: string;
}

export function imageApiHref(imageSlug: string, origin?: string): string {
  const pathname = `/api/images/${encodeURIComponent(imageSlug)}`;
  if (!origin) {
    return pathname;
  }

  return new URL(pathname, origin).toString();
}

function toSlugMap(rows: EntityImageRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.entitySlug)) {
      map.set(row.entitySlug, row.imageSlug);
    }
  }
  return map;
}

export async function getImagePathBySlug(imageSlug: string): Promise<string | null> {
  const rows = await queryD1<{ path: string }>(
    `
    SELECT path
    FROM images
    WHERE slug = ?
    LIMIT 1;
    `,
    [imageSlug]
  );
  return rows[0]?.path ?? null;
}

export async function getPrimaryArtistImageSlug(artistSlug: string): Promise<string | null> {
  const rows = await queryD1<ImageSlugRow>(
    `
    SELECT i.slug AS imageSlug
    FROM artist_images ai
    INNER JOIN images i
      ON i.slug = ai.image_slug
    WHERE ai.artist_slug = ?
    ORDER BY
      CASE
        WHEN i.slug = ai.artist_slug THEN 0
        ELSE 1
      END,
      i.slug ASC
    LIMIT 1;
    `,
    [artistSlug]
  );
  return rows[0]?.imageSlug ?? null;
}

export async function listPrimaryArtistImageSlugs(): Promise<Map<string, string>> {
  const rows = await queryD1<EntityImageRow>(
    `
    SELECT
      ai.artist_slug AS entitySlug,
      i.slug AS imageSlug
    FROM artist_images ai
    INNER JOIN images i
      ON i.slug = ai.image_slug
    ORDER BY
      ai.artist_slug ASC,
      CASE
        WHEN i.slug = ai.artist_slug THEN 0
        ELSE 1
      END,
      i.slug ASC;
    `
  );
  return toSlugMap(rows);
}

export async function getPrimaryProjectImageSlug(projectSlug: string): Promise<string | null> {
  const rows = await queryD1<ImageSlugRow>(
    `
    SELECT i.slug AS imageSlug
    FROM project_images pi
    INNER JOIN images i
      ON i.slug = pi.image_slug
    WHERE pi.project_slug = ?
    ORDER BY
      CASE
        WHEN i.slug = pi.project_slug || '-front' THEN 0
        WHEN i.slug = pi.project_slug THEN 1
        ELSE 2
      END,
      i.slug ASC
    LIMIT 1;
    `,
    [projectSlug]
  );
  return rows[0]?.imageSlug ?? null;
}

export async function listPrimaryProjectImageSlugs(): Promise<Map<string, string>> {
  const rows = await queryD1<EntityImageRow>(
    `
    SELECT
      pi.project_slug AS entitySlug,
      i.slug AS imageSlug
    FROM project_images pi
    INNER JOIN images i
      ON i.slug = pi.image_slug
    ORDER BY
      pi.project_slug ASC,
      CASE
        WHEN i.slug = pi.project_slug || '-front' THEN 0
        WHEN i.slug = pi.project_slug THEN 1
        ELSE 2
      END,
      i.slug ASC;
    `
  );
  return toSlugMap(rows);
}

export async function getTrackDisplayImageSlug(trackSlug: string): Promise<string | null> {
  const directRows = await queryD1<ImageSlugRow>(
    `
    SELECT i.slug AS imageSlug
    FROM track_images ti
    INNER JOIN images i
      ON i.slug = ti.image_slug
    WHERE ti.track_slug = ?
    ORDER BY
      CASE
        WHEN i.slug = ti.track_slug THEN 0
        ELSE 1
      END,
      i.slug ASC
    LIMIT 1;
    `,
    [trackSlug]
  );
  if (directRows[0]?.imageSlug) {
    return directRows[0].imageSlug;
  }

  const fallbackRows = await queryD1<ImageSlugRow>(
    `
    SELECT i.slug AS imageSlug
    FROM project_tracks pt
    INNER JOIN project_images pi
      ON pi.project_slug = pt.project_slug
    INNER JOIN images i
      ON i.slug = pi.image_slug
    WHERE pt.track_slug = ?
    ORDER BY
      CASE
        WHEN i.slug = pt.project_slug || '-front' THEN 0
        WHEN i.slug = pt.project_slug THEN 1
        ELSE 2
      END,
      pt.position ASC,
      pt.project_slug ASC,
      i.slug ASC
    LIMIT 1;
    `,
    [trackSlug]
  );
  return fallbackRows[0]?.imageSlug ?? null;
}

export async function listTrackDisplayImageSlugs(): Promise<Map<string, string>> {
  const directRows = await queryD1<EntityImageRow>(
    `
    SELECT
      ti.track_slug AS entitySlug,
      i.slug AS imageSlug
    FROM track_images ti
    INNER JOIN images i
      ON i.slug = ti.image_slug
    ORDER BY
      ti.track_slug ASC,
      CASE
        WHEN i.slug = ti.track_slug THEN 0
        ELSE 1
      END,
      i.slug ASC;
    `
  );

  const map = toSlugMap(directRows);

  const fallbackRows = await queryD1<EntityImageRow>(
    `
    SELECT
      pt.track_slug AS entitySlug,
      i.slug AS imageSlug
    FROM project_tracks pt
    INNER JOIN project_images pi
      ON pi.project_slug = pt.project_slug
    INNER JOIN images i
      ON i.slug = pi.image_slug
    ORDER BY
      pt.track_slug ASC,
      CASE
        WHEN i.slug = pt.project_slug || '-front' THEN 0
        WHEN i.slug = pt.project_slug THEN 1
        ELSE 2
      END,
      pt.position ASC,
      pt.project_slug ASC,
      i.slug ASC;
    `
  );

  for (const row of fallbackRows) {
    if (!map.has(row.entitySlug)) {
      map.set(row.entitySlug, row.imageSlug);
    }
  }

  return map;
}
