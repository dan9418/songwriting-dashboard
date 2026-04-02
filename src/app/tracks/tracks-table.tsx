"use client";

import { useMemo, useState } from "react";
import { SortableNameTable } from "@/components/entities/sortable-name-table";
import { slugToTitle } from "@/lib/utils/slug-display";

export interface TracksTableItem {
  slug: string;
  name: string;
  projectSlugs: string[];
  artistSlugs: string[];
  tagSlugs: string[];
  imageHref?: string | null;
  hasLyrics: boolean;
  hasChords: boolean;
  hasNotes: boolean;
  audioCount: number;
}

const ALL_ARTISTS_FILTER = "__all_artists__";
const UNASSIGNED_ARTIST_FILTER = "__unassigned_artist__";
const ALL_TAGS_FILTER = "__all_tags__";

export function TracksTable({
  items,
  tagOptions,
  withPanel = true
}: {
  items: TracksTableItem[];
  tagOptions: Array<{ slug: string; name: string }>;
  withPanel?: boolean;
}) {
  const [artistFilter, setArtistFilter] = useState(ALL_ARTISTS_FILTER);
  const [tagFilter, setTagFilter] = useState(ALL_TAGS_FILTER);

  const artistOptions = useMemo(() => {
    const slugs = new Set<string>();

    for (const item of items) {
      for (const artistSlug of item.artistSlugs) {
        slugs.add(artistSlug);
      }
    }

    return Array.from(slugs).sort((left, right) =>
      slugToTitle(left).localeCompare(slugToTitle(right))
    );
  }, [items]);

  const tagNameBySlug = useMemo(
    () => Object.fromEntries(tagOptions.map((tag) => [tag.slug, tag.name])),
    [tagOptions]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesArtist =
        artistFilter === ALL_ARTISTS_FILTER
          ? true
          : artistFilter === UNASSIGNED_ARTIST_FILTER
            ? item.artistSlugs.length === 0
            : item.artistSlugs.includes(artistFilter);
      const matchesTag = tagFilter === ALL_TAGS_FILTER ? true : item.tagSlugs.includes(tagFilter);
      return matchesArtist && matchesTag;
    });
  }, [artistFilter, items, tagFilter]);

  const emptyMessage = useMemo(() => {
    if (artistFilter === ALL_ARTISTS_FILTER && tagFilter === ALL_TAGS_FILTER) {
      return "No tracks found.";
    }
    if (artistFilter === UNASSIGNED_ARTIST_FILTER && tagFilter === ALL_TAGS_FILTER) {
      return "No tracks without an assigned artist.";
    }
    if (artistFilter === ALL_ARTISTS_FILTER && tagFilter !== ALL_TAGS_FILTER) {
      return `No tracks found for tag ${tagNameBySlug[tagFilter] ?? tagFilter}.`;
    }
    if (artistFilter === UNASSIGNED_ARTIST_FILTER && tagFilter !== ALL_TAGS_FILTER) {
      return `No unassigned-artist tracks found for tag ${tagNameBySlug[tagFilter] ?? tagFilter}.`;
    }
    if (artistFilter !== ALL_ARTISTS_FILTER && tagFilter === ALL_TAGS_FILTER) {
      return `No tracks found for ${slugToTitle(artistFilter)}.`;
    }
    return `No tracks found for ${slugToTitle(artistFilter)} with tag ${tagNameBySlug[tagFilter] ?? tagFilter}.`;
  }, [artistFilter, tagFilter, tagNameBySlug]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[color:var(--muted)]">Artist filter</span>
            <select
              value={artistFilter}
              onChange={(event) => setArtistFilter(event.currentTarget.value)}
              className="theme-input min-w-64 ring-0"
            >
              <option value={ALL_ARTISTS_FILTER}>All artists</option>
              <option value={UNASSIGNED_ARTIST_FILTER}>No artist assigned</option>
              {artistOptions.map((artistSlug) => (
                <option key={artistSlug} value={artistSlug}>
                  {slugToTitle(artistSlug)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[color:var(--muted)]">Tag filter</span>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.currentTarget.value)}
              className="theme-input min-w-64 ring-0"
            >
              <option value={ALL_TAGS_FILTER}>All tags</option>
              {tagOptions.map((tag) => (
                <option key={tag.slug} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-sm text-[color:var(--muted)]">
          Showing {filteredItems.length.toLocaleString()} of {items.length.toLocaleString()} tracks
        </p>
      </div>

      <SortableNameTable
        columnHeaders={["Projects", "Artists", "Lyrics", "Chords", "Notes", "Audio"]}
        emptyMessage={emptyMessage}
        withPanel={withPanel}
        items={filteredItems.map((item) => ({
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
            { text: item.hasLyrics ? "Yes" : "-" },
            { text: item.hasChords ? "Yes" : "-" },
            { text: item.hasNotes ? "Yes" : "-" },
            {
              text: `${item.audioCount}`
            }
          ]
        }))}
      />
    </div>
  );
}
