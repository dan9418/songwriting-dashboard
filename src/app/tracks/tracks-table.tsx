"use client";

import { SortableNameTable } from "@/components/entities/sortable-name-table";
import { slugToTitle } from "@/lib/utils/slug-display";

export interface TracksTableItem {
  slug: string;
  name: string;
  projectSlug: string | null;
  artistSlugs: string[];
  audioCount: number;
  noteCount: number;
  demoCount: number;
  liveCount: number;
}

export function TracksTable({ items }: { items: TracksTableItem[] }) {
  return (
    <SortableNameTable
      columnHeaders={["Project", "Artists", "Audio"]}
      emptyMessage="No tracks found."
      items={items.map((item) => ({
        id: item.slug,
        name: item.name,
        nameHref: `/tracks/${item.slug}`,
        cells: [
          item.projectSlug
            ? {
                links: [{ label: slugToTitle(item.projectSlug), href: `/projects#${item.projectSlug}` }]
              }
            : { text: "-" },
          item.artistSlugs.length > 0
            ? {
                links: item.artistSlugs.map((artistSlug) => ({
                  label: slugToTitle(artistSlug),
                  href: `/artists#${artistSlug}`
                }))
              }
            : { text: "-" },
          {
            text: `${item.audioCount} total (${item.noteCount} note, ${item.demoCount} demo, ${item.liveCount} live)`
          }
        ]
      }))}
    />
  );
}
