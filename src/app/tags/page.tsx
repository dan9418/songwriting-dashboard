import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { SortableNameTable, type SortableNameTableItem } from "@/components/entities/sortable-name-table";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  try {
    const tags = await listTagsFromCloudflare();
    const items: SortableNameTableItem[] = tags.map((tag) => ({
      id: tag.slug,
      name: tag.name,
      nameHref: `/tags/${tag.slug}`,
      cells: [
        {
          text: tag.trackSlugs.length.toLocaleString()
        },
        {
          links: tag.trackSlugs.map((track) => ({
            label: track.name,
            href: `/tracks/${track.slug}`
          }))
        }
      ]
    }));

    return (
      <EntityIndexLayout
        icon="tag"
        title="Tags"
        subtitle={`Total: ${items.length.toLocaleString()}`}
        actionHref="/tags/add"
        actionLabel="Add Tag"
      >
        <SortableNameTable
          items={items}
          columnHeaders={["Tracks", "Linked Tracks"]}
          emptyMessage="No tags found."
          withPanel={false}
        />
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="tag"
        title="Tags"
        subtitle={`Failed to load tags from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/tags/add"
        actionLabel="Add Tag"
      />
    );
  }
}
