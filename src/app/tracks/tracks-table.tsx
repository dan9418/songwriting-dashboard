"use client";

import { useMemo, useState } from "react";

export interface TracksTableItem {
  slug: string;
  name: string;
  audioCount: number;
  noteCount: number;
  demoCount: number;
  liveCount: number;
}

type SortDirection = "asc" | "desc";

export function TracksTable({ items }: { items: TracksTableItem[] }) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) =>
      sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    return next;
  }, [items, sortDirection]);

  return (
    <div className="panel overflow-x-auto p-4">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#ddcfbd] text-xs uppercase tracking-wide text-[color:var(--muted)]">
            <th className="px-2 py-2 font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-left"
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              >
                Name
                <span aria-hidden>{sortDirection === "asc" ? "▲" : "▼"}</span>
              </button>
            </th>
            <th className="px-2 py-2 font-semibold">Audio</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr key={item.slug} className="border-b border-[#efe3d3] align-top">
              <td className="px-2 py-2 font-medium text-[color:var(--ink)]">{item.name}</td>
              <td className="px-2 py-2">
                {item.audioCount} total ({item.noteCount} note, {item.demoCount} demo, {item.liveCount} live)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedItems.length === 0 ? <p className="mt-3 text-sm text-[color:var(--muted)]">No tracks found.</p> : null}
    </div>
  );
}
