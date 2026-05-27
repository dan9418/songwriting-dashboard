"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/app-icons";
import type { AudioIndexItem } from "@/lib/cloudflare/track-audio-files";

function formatDate(item: AudioIndexItem): string {
  return item.dateDescriptor ?? item.date;
}

export function AudioIndexTable({ items }: { items: AudioIndexItem[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const groups = useMemo(() => {
    const next = new Map<string, { trackSlug: string; trackName: string; items: AudioIndexItem[] }>();
    for (const item of items) {
      const group = next.get(item.trackSlug) ?? {
        trackSlug: item.trackSlug,
        trackName: item.trackName,
        items: []
      };
      group.items.push(item);
      next.set(item.trackSlug, group);
    }
    return Array.from(next.values());
  }, [items]);

  if (items.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">No audio files found.</p>;
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <section key={group.trackSlug} className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">{group.trackName}</h2>
            <Link href={`/tracks/${group.trackSlug}`} className="theme-button-link theme-button-link--ghost">
              Track Page
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="theme-table text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-semibold">Audio</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const isPlaying = playingId === item.id;
                  return (
                    <Fragment key={item.id}>
                      <tr className="align-top">
                        <td className={`px-2 py-2 font-medium ${isPlaying ? "border-b-0" : ""}`}>
                          <button
                            type="button"
                            className="inline-flex max-w-full items-center gap-2 text-left underline-offset-4 hover:underline"
                            onClick={() => setPlayingId((current) => (current === item.id ? null : item.id))}
                          >
                            <AppIcon name={isPlaying ? "pause" : "play"} className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </button>
                        </td>
                        <td className={`px-2 py-2 ${isPlaying ? "border-b-0" : ""}`}>{item.type}</td>
                        <td className={`px-2 py-2 ${isPlaying ? "border-b-0" : ""}`}>{formatDate(item)}</td>
                        <td className={`px-2 py-2 ${isPlaying ? "border-b-0" : ""}`}>{item.fileName}</td>
                      </tr>
                      {isPlaying ? (
                        <tr>
                          <td colSpan={4} className="px-2 pb-3 pt-0">
                            <audio
                              key={item.id}
                              controls
                              preload="metadata"
                              src={item.fileHref}
                              className="w-full"
                            >
                              Your browser does not support audio playback.
                            </audio>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
