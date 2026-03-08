import { SortableNameTable } from "@/components/entities/sortable-name-table";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

const USER_SLUG = "dan";

function toTypeLabel(value: "album" | "ep" | "single" | "setlist"): string {
  if (value === "ep") {
    return "EP";
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default async function ProjectsPage() {
  try {
    const sourceItems = await listProjectsFromCloudflare(USER_SLUG);

    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-[color:var(--muted)]">Showing {sourceItems.length} projects for Dan.</p>
        </div>

        <SortableNameTable
          columnHeaders={["Type", "Artists", "Tracks"]}
          emptyMessage="No projects found."
          items={sourceItems.map((project) => ({
            id: project.slug,
            name: project.name || slugToTitle(project.slug),
            nameHref: `/projects#${project.slug}`,
            cells: [
              { text: toTypeLabel(project.type) },
              project.artistSlugs.length > 0
                ? {
                    links: project.artistSlugs.map((artist) => ({
                      label: artist.name || slugToTitle(artist.slug),
                      href: `/artists#${artist.slug}`
                    }))
                  }
                : { text: "-" },
              project.trackSlugs.length > 0
                ? {
                    links: project.trackSlugs.map((trackSlug) => ({
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
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Failed to load projects from Cloudflare D1.
            {error instanceof Error ? ` ${error.message}` : ""}
          </p>
        </div>
      </section>
    );
  }
}
