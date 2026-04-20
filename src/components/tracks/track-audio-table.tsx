"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { AppIcon } from "@/components/ui/app-icons";
import { ActionButton } from "@/components/ui/action-button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
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
  trackSlug,
  audio,
  title = "Audio",
  showTitle = true
}: {
  trackSlug: string;
  audio: TrackAudioTableItem[];
  title?: string;
  showTitle?: boolean;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedAudioSlug, setExpandedAudioSlug] = useState<string | null>(null);
  const [audioItems, setAudioItems] = useState(audio);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setAudioItems(audio);
  }, [audio]);

  function toggleExpanded(slug: string) {
    setExpandedAudioSlug((current) => (current === slug ? null : slug));
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setUploading(true);

    try {
      const updatedTrack = await api.uploadTrackAudio(trackSlug, selectedFile);
      setAudioItems(updatedTrack.audio);
      setSelectedFile(null);
      setExpandedAudioSlug(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Audio uploaded.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload audio.";
      showToast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="overflow-x-auto">
      {showTitle ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <table className={`theme-table text-sm ${showTitle ? "mt-3" : ""}`}>
        <thead>
          <tr className="text-xs uppercase tracking-wide">
            <th className="px-2 py-2 font-semibold">Filename</th>
            <th className="px-2 py-2 font-semibold">Version</th>
            <th className="px-2 py-2 font-semibold">Description</th>
            <th className="px-2 py-2 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {audioItems.map((audioItem) => {
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
      {audioItems.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--muted)]">No audio metadata rows found.</p>
      ) : null}

      <div className="mt-6 grid gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp4,audio/x-m4a"
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            setSelectedFile(event.currentTarget.files?.[0] ?? null);
          }}
        />
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <ActionButton
            tone="ghost"
            className="h-10 justify-center md:self-stretch"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </ActionButton>
          <ActionButton
            tone="ghost"
            className="h-10 justify-center md:self-stretch"
            disabled={uploading || !selectedFile}
            onClick={() => void handleUpload()}
          >
            {uploading ? "Uploading..." : "Upload Audio"}
          </ActionButton>
        </div>
        <p className="text-xs text-[color:var(--muted)]">
          {selectedFile
            ? selectedFile.name
            : "{track-slug}_{category}_v{version}_{date}_{optionalDescription}.{mp3|m4a|mp4}"}
        </p>
      </div>
    </div>
  );
}
