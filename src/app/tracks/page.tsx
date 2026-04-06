import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  try {
    const [sourceItems, artistItems, projectItems, tagItems] = await Promise.all([
      listTracksFromCloudflare(),
      listArtistsFromCloudflare(),
      listProjectsFromCloudflare(),
      listTagsFromCloudflare(),
    ]);
    const artistNameBySlug = Object.fromEntries(
      artistItems.map((artist) => [artist.slug, artist.name || slugToTitle(artist.slug)])
    );
    const projectNameBySlug = Object.fromEntries(
      projectItems.map((project) => [project.slug, project.name || slugToTitle(project.slug)])
    );
    const tagNameBySlug = Object.fromEntries(
      tagItems.map((tag) => [tag.slug, tag.name || slugToTitle(tag.slug)])
    );
    const items: TracksTableItem[] = sourceItems.map((item) => ({
      slug: item.slug,
      name: item.name,
      projects: item.projectSlugs.map((slug) => ({
        slug,
        name: projectNameBySlug[slug] ?? slugToTitle(slug)
      })),
      artists: item.artistSlugs.map((slug) => ({
        slug,
        name: artistNameBySlug[slug] ?? slugToTitle(slug)
      })),
      tags: item.tagSlugs.map((slug) => ({
        slug,
        name: tagNameBySlug[slug] ?? slugToTitle(slug)
      })),
      hasLyrics: item.hasLyrics,
      hasChords: item.hasChords,
      hasNotes: item.hasNotes,
      audioCount: item.audioCount
    }));

    return (
      <EntityIndexLayout
        icon="track"
        title="Tracks"
        subtitle={`Total: ${items.length.toLocaleString()}`}
        actionHref="/tracks/add"
        actionLabel="Add Track"
      >
        <TracksTable
          items={items}
          artistOptions={artistItems.map((artist) => ({
            slug: artist.slug,
            name: artist.name || slugToTitle(artist.slug)
          }))}
          projectOptions={projectItems.map((project) => ({
            slug: project.slug,
            name: project.name || slugToTitle(project.slug)
          }))}
          tagOptions={tagItems.map((tag) => ({
            slug: tag.slug,
            name: tag.name
          }))}
        />
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="track"
        title="Tracks"
        subtitle={`Failed to load tracks from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/tracks/add"
        actionLabel="Add Track"
      />
    );
  }
}
