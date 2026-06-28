import { notFound } from "next/navigation";
import { TagDetailControls } from "@/app/tags/[tagSlug]/tag-detail-controls";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { getTagMetadataFromCloudflare, listTagsFromCloudflare } from "@/lib/cloudflare/tags";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

export default async function TagBySlugPage({
  params
}: {
  params: Promise<{ tagSlug: string }>;
}) {
  const { tagSlug } = await params;
  const [tag, sourceItems, artistItems, projectItems, tagItems] = await Promise.all([
    getTagMetadataFromCloudflare(tagSlug),
    listTracksFromCloudflare(),
    listArtistsFromCloudflare(),
    listProjectsFromCloudflare(),
    listTagsFromCloudflare()
  ]);

  if (!tag) {
    notFound();
  }

  const artistNameBySlug = Object.fromEntries(
    artistItems.map((artist) => [artist.slug, artist.name || slugToTitle(artist.slug)])
  );
  const projectNameBySlug = Object.fromEntries(
    projectItems.map((project) => [project.slug, project.name || slugToTitle(project.slug)])
  );
  const tagNameBySlug = Object.fromEntries(
    tagItems.map((tagItem) => [tagItem.slug, tagItem.name || slugToTitle(tagItem.slug)])
  );
  const linkedTrackSlugs = new Set(tag.trackSlugs.map((track) => track.slug));
  const items: TracksTableItem[] = sourceItems
    .filter((item) => linkedTrackSlugs.has(item.slug))
    .map((item) => ({
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
      hasNotes: item.hasNotes,
      audioCount: item.audioCount
    }));

  return (
    <section className="grid gap-4">
      <TagDetailControls tagSlug={tag.slug} initialName={tag.name} />
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
        tagOptions={tagItems.map((tagItem) => ({
          slug: tagItem.slug,
          name: tagItem.name
        }))}
        showFilters={false}
        showTagsColumn={false}
      />
    </section>
  );
}
