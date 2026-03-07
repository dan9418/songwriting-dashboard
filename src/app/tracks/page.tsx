import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";

export const dynamic = "force-dynamic";

const USER_SLUG = "dan";

function formatTrackNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export default async function TracksPage() {
  try {
    const sourceItems = await listTracksFromCloudflare(USER_SLUG);
    const items: TracksTableItem[] = sourceItems.map((item) => ({
      slug: item.slug,
      name: formatTrackNameFromSlug(item.slug),
      audioCount: item.audioCount,
      noteCount: item.noteCount,
      demoCount: item.demoCount,
      liveCount: item.liveCount
    }));

    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Tracks</h1>
          <p className="text-sm text-[color:var(--muted)]">Showing {items.length} tracks for Dan.</p>
        </div>

        <TracksTable items={items} />
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Tracks</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Failed to load tracks from Cloudflare D1.
            {error instanceof Error ? ` ${error.message}` : ""}
          </p>
        </div>
      </section>
    );
  }
}
