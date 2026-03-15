import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  try {
    const sourceItems = await listTracksFromCloudflare();
    const items: TracksTableItem[] = sourceItems.map((item) => ({
      slug: item.slug,
      name: item.name,
      projectSlugs: item.projectSlugs,
      artistSlugs: item.artistSlugs,
      hasLyrics: item.hasLyrics,
      hasChords: item.hasChords,
      hasNotes: item.hasNotes,
      audioCount: item.audioCount,
    }));

    return (
      <EntityIndexLayout
        icon="track"
        title="Tracks"
        subtitle={`Total: ${items.length.toLocaleString()}`}
        actionHref="/tracks/add"
        actionLabel="Add Track"
      >
        <TracksTable items={items} withPanel={false} />
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
