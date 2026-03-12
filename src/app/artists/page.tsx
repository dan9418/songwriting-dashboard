import Link from "next/link";
import { SortableNameCardList } from "@/components/entities/sortable-name-card-list";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  try {
    const sourceItems = await listArtistsFromCloudflare();

    return (
      <section className="grid gap-4">
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-2xl font-semibold">Artists</h1>
            <p className="text-sm text-[color:var(--muted)]">Showing {sourceItems.length} artists.</p>
          </div>
          <Link
            href="/artists/add"
            className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
          >
            Add Artist
          </Link>
        </div>

        <SortableNameCardList
          emptyMessage="No artists found."
          items={sourceItems.map((artist) => ({
            id: artist.slug,
            name: artist.name || slugToTitle(artist.slug),
            nameHref: `/artists#${artist.slug}`,
            fields: [
              {
                label: "Projects",
                links: artist.projectSlugs.map((project) => ({
                  label: project.name || slugToTitle(project.slug),
                  href: `/projects#${project.slug}`
                })),
                linkStyle: "stacked"
              },
              {
                label: "Tracks",
                links: artist.trackSlugs.map((trackSlug) => ({
                  label: slugToTitle(trackSlug),
                  href: `/tracks/${trackSlug}`
                })),
                linkStyle: "ordered"
              }
            ]
          }))}
        />
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-2xl font-semibold">Artists</h1>
            <p className="text-sm text-[color:var(--muted)]">
              Failed to load artists from Cloudflare D1.
              {error instanceof Error ? ` ${error.message}` : ""}
            </p>
          </div>
          <Link
            href="/artists/add"
            className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]"
          >
            Add Artist
          </Link>
        </div>
      </section>
    );
  }
}
