"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EntityPlaceholderArtwork,
  type ArtworkKind
} from "@/components/entities/entity-placeholder-artwork";
import type { TableCellLink } from "@/components/entities/sortable-name-table";

export interface SortableNameCardField {
  label: string;
  text?: string;
  links?: TableCellLink[];
  linkStyle?: "inline" | "stacked" | "ordered";
}

export interface SortableNameCardItem {
  id: string;
  name: string;
  nameHref?: string;
  subtitle?: string;
  artworkIcon?: ArtworkKind;
  artworkStyle?: "avatar" | "cover";
  fields: SortableNameCardField[];
}

type SortDirection = "asc" | "desc";

function renderLinks(links: TableCellLink[], linkStyle: "inline" | "stacked" | "ordered" = "stacked") {
  if (links.length === 0) {
    return "-";
  }

  if (linkStyle === "ordered") {
    return (
      <ol className="list-decimal space-y-1 pl-5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="underline-offset-4 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ol>
    );
  }

  if (linkStyle === "stacked") {
    return (
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="underline-offset-4 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return links.map((link, index) => (
    <span key={`${link.href}-${link.label}`}>
      {index > 0 ? ", " : null}
      <Link href={link.href} className="underline-offset-4 hover:underline">
        {link.label}
      </Link>
    </span>
  ));
}

function renderFieldValue(field: SortableNameCardField) {
  if (field.links) {
    return renderLinks(field.links, field.linkStyle ?? "stacked");
  }
  return field.text ?? "-";
}

function renderArtwork(item: SortableNameCardItem) {
  if (!item.artworkIcon) {
    return null;
  }

  if (item.artworkStyle === "cover") {
    return <EntityPlaceholderArtwork kind={item.artworkIcon} variant="card-cover" />;
  }

  return <EntityPlaceholderArtwork kind={item.artworkIcon} variant="card-avatar" />;
}

export function SortableNameCardList({
  items,
  emptyMessage,
  sortable = true,
  withPanel = true
}: {
  items: SortableNameCardItem[];
  emptyMessage: string;
  sortable?: boolean;
  withPanel?: boolean;
}) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const effectiveSortDirection = sortable ? sortDirection : "asc";

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) =>
      effectiveSortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    return next;
  }, [effectiveSortDirection, items]);

  const content = (
    <>
      {sortable ? (
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">List</p>
          <button
            type="button"
            onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
            className="rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs transition hover:bg-[#f3e8d7]"
          >
            Sort: {sortDirection === "asc" ? "A-Z" : "Z-A"}
          </button>
        </div>
      ) : null}

      {sortedItems.length === 0 ? <p className="text-sm text-[color:var(--muted)]">{emptyMessage}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {sortedItems.map((item) => (
          <article id={item.id} key={item.id} className="rounded-xl border border-[#ddcfbd] bg-[color:var(--surface)] p-4">
            {renderArtwork(item)}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                {item.nameHref ? (
                  <Link href={item.nameHref} className="underline-offset-4 hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}
              </h2>
              {item.subtitle ? (
                <span className="rounded-full bg-[#f8efe3] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                  {item.subtitle}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-3">
              {item.fields.map((field) => (
                <div key={`${item.id}-${field.label}`} className="grid gap-1">
                  <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">{field.label}</p>
                  <div className="text-sm text-[color:var(--ink)]">{renderFieldValue(field)}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );

  return withPanel ? <div className="panel grid gap-3 p-4">{content}</div> : <div className="grid gap-3">{content}</div>;
}
