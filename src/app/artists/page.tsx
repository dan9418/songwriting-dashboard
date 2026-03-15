import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { SortableNameCardList } from "@/components/entities/sortable-name-card-list";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  try {
    const sourceItems = await listArtistsFromCloudflare();

    return (
      <EntityIndexLayout
        icon="artist"
        title="Artists"
        subtitle={`Total: ${sourceItems.length.toLocaleString()}`}
        actionHref="/artists/add"
        actionLabel="Add Artist"
      >
        <SortableNameCardList
          emptyMessage="No artists found."
          sortable={false}
          withPanel={false}
          items={sourceItems.map((artist) => ({
            id: artist.slug,
            name: artist.name,
            nameHref: `/artists/${artist.slug}`,
            artworkIcon: "artist",
            artworkStyle: "avatar",
            fields: [
              {
                label: "Projects",
                links: artist.projectSlugs.map((project) => ({
                  label: project.name,
                  href: `/projects/${project.slug}`
                })),
                linkStyle: "stacked"
              }
            ]
          }))}
        />
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="artist"
        title="Artists"
        subtitle={`Failed to load artists from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/artists/add"
        actionLabel="Add Artist"
      />
    );
  }
}
