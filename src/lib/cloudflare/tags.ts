import { notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";

interface TagRow {
  slug: string;
  name: string;
}

interface TagTrackRow {
  tagSlug: string;
  trackSlug: string;
  trackName: string;
}

export interface CloudflareTagTrackItem {
  slug: string;
  name: string;
}

export interface CloudflareTagListItem {
  slug: string;
  name: string;
  trackSlugs: CloudflareTagTrackItem[];
}

export type CloudflareTagMetadata = CloudflareTagListItem;

export async function listTagsFromCloudflare(): Promise<CloudflareTagListItem[]> {
  const [tagRows, tagTrackRows] = await Promise.all([
    queryD1<TagRow>(
      `
      SELECT slug, name
      FROM tags
      ORDER BY name COLLATE NOCASE ASC, slug ASC;
      `
    ),
    queryD1<TagTrackRow>(
      `
      SELECT
        tt.tag_slug AS tagSlug,
        tt.track_slug AS trackSlug,
        t.name AS trackName
      FROM track_tags tt
      INNER JOIN tracks t
        ON t.slug = tt.track_slug
      ORDER BY tt.tag_slug ASC, t.name COLLATE NOCASE ASC, tt.track_slug ASC;
      `
    )
  ]);

  const tracksByTag = new Map<string, CloudflareTagTrackItem[]>();
  for (const row of tagTrackRows) {
    const existing = tracksByTag.get(row.tagSlug) ?? [];
    existing.push({
      slug: row.trackSlug,
      name: row.trackName
    });
    tracksByTag.set(row.tagSlug, existing);
  }

  return tagRows.map((tag) => ({
    slug: tag.slug,
    name: tag.name,
    trackSlugs: tracksByTag.get(tag.slug) ?? []
  }));
}

export async function getTagMetadataFromCloudflare(tagSlug: string): Promise<CloudflareTagMetadata | null> {
  const [tag] = await queryD1<TagRow>(
    `
    SELECT slug, name
    FROM tags
    WHERE slug = ?
    LIMIT 1;
    `,
    [tagSlug]
  );

  if (!tag) {
    return null;
  }

  const trackRows = await queryD1<TagTrackRow>(
    `
    SELECT
      tt.tag_slug AS tagSlug,
      tt.track_slug AS trackSlug,
      t.name AS trackName
    FROM track_tags tt
    INNER JOIN tracks t
      ON t.slug = tt.track_slug
    WHERE tt.tag_slug = ?
    ORDER BY t.name COLLATE NOCASE ASC, tt.track_slug ASC;
    `,
    [tagSlug]
  );

  return {
    slug: tag.slug,
    name: tag.name,
    trackSlugs: trackRows.map((row) => ({
      slug: row.trackSlug,
      name: row.trackName
    }))
  };
}

export async function getTagMetadataFromCloudflareOrThrow(tagSlug: string): Promise<CloudflareTagMetadata> {
  const tag = await getTagMetadataFromCloudflare(tagSlug);
  if (!tag) {
    throw notFound(`Tag not found: ${tagSlug}`);
  }
  return tag;
}
