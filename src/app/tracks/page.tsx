import Link from "next/link";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { TracksTable, type TracksTableItem } from "@/app/tracks/tracks-table";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  try {
    const sourceItems = await listTracksFromCloudflare();
    const items: TracksTableItem[] = sourceItems.map((item) => ({
      slug: item.slug,
      name: slugToTitle(item.slug),
      projectSlugs: item.projectSlugs,
      artistSlugs: item.artistSlugs,
      audioCount: item.audioCount,
      noteCount: item.noteCount,
      demoCount: item.demoCount,
      liveCount: item.liveCount
    }));

    return (
      <section className="grid gap-4">
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-2xl font-semibold">Tracks</h1>
            <p className="text-sm text-[color:var(--muted)]">Showing {items.length} tracks.</p>
          </div>
          <Link
            href="/tracks/add"
            className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
          >
            Add Track
          </Link>
        </div>

        <TracksTable items={items} />
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-2xl font-semibold">Tracks</h1>
            <p className="text-sm text-[color:var(--muted)]">
              Failed to load tracks from Cloudflare D1.
              {error instanceof Error ? ` ${error.message}` : ""}
            </p>
          </div>
          <Link
            href="/tracks/add"
            className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
          >
            Add Track
          </Link>
        </div>
      </section>
    );
  }
}
