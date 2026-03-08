import { SortableNameTable } from "@/components/entities/sortable-name-table";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

const USER_SLUG = "dan";

export default async function ArtistsPage() {
  try {
    const sourceItems = await listArtistsFromCloudflare(USER_SLUG);

    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Artists</h1>
          <p className="text-sm text-[color:var(--muted)]">Showing {sourceItems.length} artists for Dan.</p>
        </div>

        <SortableNameTable
          columnHeaders={["Projects", "Tracks"]}
          emptyMessage="No artists found."
          items={sourceItems.map((artist) => ({
            id: artist.slug,
            name: artist.name || slugToTitle(artist.slug),
            nameHref: `/artists#${artist.slug}`,
            cells: [
              artist.projectSlugs.length > 0
                ? {
                    links: artist.projectSlugs.map((project) => ({
                      label: project.name || slugToTitle(project.slug),
                      href: `/projects#${project.slug}`
                    }))
                  }
                : { text: "-" },
              artist.trackSlugs.length > 0
                ? {
                    links: artist.trackSlugs.map((trackSlug) => ({
                      label: slugToTitle(trackSlug),
                      href: `/tracks/${trackSlug}`
                    }))
                  }
                : { text: "-" }
            ]
          }))}
        />
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Artists</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Failed to load artists from Cloudflare D1.
            {error instanceof Error ? ` ${error.message}` : ""}
          </p>
        </div>
      </section>
    );
  }
}
