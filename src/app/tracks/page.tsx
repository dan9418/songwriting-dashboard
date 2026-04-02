import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { imageApiHref, listTrackDisplayImageSlugs } from "@/lib/cloudflare/images";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  try {
    const [sourceItems, tagItems, imageSlugsByTrack, requestOrigin] = await Promise.all([
      listTracksFromCloudflare(),
      listTagsFromCloudflare(),
      listTrackDisplayImageSlugs(),
      getRequestOrigin()
    ]);
    const items: TracksTableItem[] = sourceItems.map((item) => ({
      slug: item.slug,
      name: item.name,
      projectSlugs: item.projectSlugs,
      artistSlugs: item.artistSlugs,
      tagSlugs: item.tagSlugs,
      hasLyrics: item.hasLyrics,
      hasChords: item.hasChords,
      hasNotes: item.hasNotes,
      audioCount: item.audioCount,
      imageHref: imageSlugsByTrack.get(item.slug)
        ? imageApiHref(imageSlugsByTrack.get(item.slug) ?? "", requestOrigin)
        : null
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
          tagOptions={tagItems.map((tag) => ({
            slug: tag.slug,
            name: tag.name
          }))}
          withPanel={false}
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
