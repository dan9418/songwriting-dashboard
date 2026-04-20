"use client";

import { Fragment, useState } from "react";
import { AppIcon } from "@/components/ui/app-icons";
import type { TrackAudioTableItem } from "@/lib/tracks/types";

function formatDateForTable(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  const yearTwo = year.slice(-2);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (!Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) {
    return value;
  }

  return `${monthNumber}/${dayNumber}/${yearTwo}`;
}

export function TrackAudioTable({
  audio,
  title = "Audio"
}: {
  audio: TrackAudioTableItem[];
  title?: string;
}) {
  const [expandedAudioSlug, setExpandedAudioSlug] = useState<string | null>(null);

  function toggleExpanded(slug: string) {
    setExpandedAudioSlug((current) => (current === slug ? null : slug));
  }

  return (
    <div className="overflow-x-auto">
      <h2 className="text-lg font-semibold">{title}</h2>
      <table className="theme-table mt-3 text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide">
            <th className="px-2 py-2 font-semibold">Filename</th>
            <th className="px-2 py-2 font-semibold">Version</th>
            <th className="px-2 py-2 font-semibold">Description</th>
            <th className="px-2 py-2 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {audio.map((audioItem) => {
            const isExpanded = expandedAudioSlug === audioItem.slug;

            return (
              <Fragment key={audioItem.slug}>
                <tr data-expanded={isExpanded ? "true" : "false"}>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    {audioItem.fileHref ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Play"} ${audioItem.fileName}`}
                        className="inline-flex items-center gap-2 text-left underline decoration-[color:var(--border-strong)] underline-offset-4 transition hover:text-[color:var(--accent)]"
                        onClick={() => toggleExpanded(audioItem.slug)}
                      >
                        <AppIcon
                          name={isExpanded ? "chevron-down" : "chevron-right"}
                          className="h-4 w-4 shrink-0"
                        />
                        {audioItem.fileName}
                      </button>
                    ) : (
                      audioItem.fileName
                    )}
                  </td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>{`${audioItem.type} v${audioItem.typeVersion}`}</td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>{audioItem.description ?? "-"}</td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    {audioItem.dateOverride ?? formatDateForTable(audioItem.date)}
                  </td>
                </tr>
                {isExpanded && audioItem.fileHref ? (
                  <tr>
                    <td colSpan={4} className="px-2 pb-3 pt-0">
                      <audio
                        key={audioItem.slug}
                        controls
                        autoPlay
                        preload="metadata"
                        src={audioItem.fileHref}
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
      {audio.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--muted)]">No audio metadata rows found.</p>
      ) : null}
    </div>
  );
}
