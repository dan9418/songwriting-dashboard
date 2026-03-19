"use client";

import { SortableNameTable } from "@/components/entities/sortable-name-table";
import { slugToTitle } from "@/lib/utils/slug-display";

export interface TracksTableItem {
  slug: string;
  name: string;
  projectSlugs: string[];
  artistSlugs: string[];
  imageHref?: string | null;
  hasLyrics: boolean;
  hasChords: boolean;
  hasNotes: boolean;
  audioCount: number;
}

export function TracksTable({
  items,
  withPanel = true
}: {
  items: TracksTableItem[];
  withPanel?: boolean;
}) {
  return (
    <SortableNameTable
      columnHeaders={["Projects", "Artists", "Lyrics", "Chords", "Notes", "Audio"]}
      emptyMessage="No tracks found."
      withPanel={withPanel}
      items={items.map((item) => ({
        id: item.slug,
        name: item.name,
        nameHref: `/tracks/${item.slug}`,
        artwork: {
          kind: "track",
          imageHref: item.imageHref,
          alt: `${item.name} artwork`
        },
        cells: [
          item.projectSlugs.length > 0
            ? {
                links: item.projectSlugs.map((projectSlug) => ({
                  label: slugToTitle(projectSlug),
                  href: `/projects/${projectSlug}`
                }))
              }
            : { text: "-" },
          item.artistSlugs.length > 0
            ? {
                links: item.artistSlugs.map((artistSlug) => ({
                  label: slugToTitle(artistSlug),
                  href: `/artists/${artistSlug}`
                }))
              }
            : { text: "-" },
          { text: item.hasLyrics ? "✓" : "-" },
          { text: item.hasChords ? "✓" : "-" },
          { text: item.hasNotes ? "✓" : "-" },
          {
            text: `${item.audioCount}`
          }
        ]
      }))}
    />
  );
}
