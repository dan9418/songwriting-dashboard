import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { SortableNameCardList } from "@/components/entities/sortable-name-card-list";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

function toTypeLabel(value: "album" | "ep" | "single" | "setlist"): string {
  if (value === "ep") {
    return "EP";
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default async function ProjectsPage() {
  try {
    const sourceItems = await listProjectsFromCloudflare();

    return (
      <EntityIndexLayout
        icon="project"
        title="Projects"
        subtitle={`Total: ${sourceItems.length.toLocaleString()}`}
        actionHref="/projects/add"
        actionLabel="Add Project"
      >
        <SortableNameCardList
          emptyMessage="No projects found."
          sortable={false}
          withPanel={false}
          items={sourceItems.map((project) => ({
            id: project.slug,
            name: project.name || slugToTitle(project.slug),
            nameHref: `/projects/${project.slug}`,
            subtitle: toTypeLabel(project.type),
            artworkIcon: "project",
            artworkStyle: "cover",
            fields: [
              {
                label: "Artists",
                links: project.artistSlugs.map((artist) => ({
                  label: artist.name || slugToTitle(artist.slug),
                  href: `/artists/${artist.slug}`
                })),
                linkStyle: "stacked"
              },
              {
                label: "Tracks",
                links: project.trackSlugs.map((trackSlug) => ({
                  label: slugToTitle(trackSlug),
                  href: `/tracks/${trackSlug}`
                })),
                linkStyle: "ordered"
              }
            ]
          }))}
        />
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="project"
        title="Projects"
        subtitle={`Failed to load projects from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/projects/add"
        actionLabel="Add Project"
      />
    );
  }
}
