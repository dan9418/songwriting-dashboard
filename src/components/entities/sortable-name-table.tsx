"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EntityPlaceholderArtwork,
  type ArtworkKind
} from "@/components/entities/entity-placeholder-artwork";

export interface TableCellLink {
  label: string;
  href: string;
}

export interface SortableNameTableItem {
  id: string;
  name: string;
  nameHref?: string;
  artwork?: {
    kind: ArtworkKind;
    imageHref?: string | null;
    alt?: string;
  };
  cells: Array<
    | {
        text: string;
      }
    | {
        links: TableCellLink[];
      }
  >;
}

type SortDirection = "asc" | "desc";

function renderLinks(links: TableCellLink[]) {
  if (links.length === 0) {
    return "-";
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

export function SortableNameTable({
  items,
  columnHeaders,
  emptyMessage,
  withPanel = true
}: {
  items: SortableNameTableItem[];
  columnHeaders: string[];
  emptyMessage: string;
  withPanel?: boolean;
}) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) =>
      sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    return next;
  }, [items, sortDirection]);

  const content = (
    <div className="overflow-x-auto">
      <table className="theme-table text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide">
            <th className="px-2 py-2 font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-left"
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              >
                Name
                <span aria-hidden>{sortDirection === "asc" ? "^" : "v"}</span>
              </button>
            </th>
            {columnHeaders.map((header) => (
              <th key={header} className="px-2 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr id={item.id} key={item.id} className="align-top">
              <td className="px-2 py-2 font-medium text-[color:var(--ink)]">
                <div className="flex items-center gap-3">
                  {item.artwork ? (
                    <EntityPlaceholderArtwork
                      kind={item.artwork.kind}
                      variant="table-thumb"
                      imageHref={item.artwork.imageHref}
                      alt={item.artwork.alt}
                    />
                  ) : null}
                  <div className="min-w-0">
                    {item.nameHref ? (
                      <Link href={item.nameHref} className="underline-offset-4 hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </div>
                </div>
              </td>
              {item.cells.map((cell, index) => (
                <td key={`${item.id}-${index}`} className="px-2 py-2">
                  {"text" in cell ? cell.text : renderLinks(cell.links)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {sortedItems.length === 0 ? <p className="mt-3 text-sm text-[color:var(--muted)]">{emptyMessage}</p> : null}
    </div>
  );

  return withPanel ? <div className="panel p-4">{content}</div> : content;
}
