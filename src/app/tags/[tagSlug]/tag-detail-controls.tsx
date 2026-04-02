"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface SlugOption {
  slug: string;
  name: string;
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5a2.1 2.1 0 1 1 3 3L7 16l-4 1 1-4 9.5-9.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 3 3" />
    </svg>
  );
}

export function TagDetailControls({
  tagSlug,
  initialName,
  initialTrackSlugs,
  trackOptions
}: {
  tagSlug: string;
  initialName: string;
  initialTrackSlugs: string[];
  trackOptions: SlugOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  const [currentSlug, setCurrentSlug] = useState(tagSlug);
  const [name, setName] = useState(initialName);
  const [trackSlugs, setTrackSlugs] = useState(initialTrackSlugs);
  const [editingName, setEditingName] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingTracks, setSavingTracks] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addTrackSlug, setAddTrackSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trackNameBySlug = useMemo(
    () => Object.fromEntries(trackOptions.map((track) => [track.slug, track.name])),
    [trackOptions]
  );
  const availableTracks = useMemo(
    () =>
      trackOptions
        .filter((track) => !trackSlugs.includes(track.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [trackOptions, trackSlugs]
  );

  async function saveHeader() {
    setSavingHeader(true);
    setErrorMessage(null);
    try {
      const trimmedName = name.trim();
      const nextSlug = ensureNonEmptySlug(trimmedName);
      await api.updateTag(currentSlug, {
        slug: currentSlug,
        name: trimmedName
      });
      setName(trimmedName);
      setCurrentSlug(nextSlug);
      setEditingName(false);
      showToast("Tag updated.");
      router.push(`/tags/${nextSlug}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update tag.");
      showToast("Failed to update tag.", "error");
    } finally {
      setSavingHeader(false);
    }
  }

  async function saveTrackLinks(nextTrackSlugs: string[]) {
    setSavingTracks(true);
    setErrorMessage(null);
    try {
      await api.updateTag(currentSlug, {
        slug: currentSlug,
        trackSlugs: nextTrackSlugs
      });
      setTrackSlugs(nextTrackSlugs);
      showToast("Track links updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update track links.");
      showToast("Failed to update track links.", "error");
    } finally {
      setSavingTracks(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete tag "${name || currentSlug}"? It will be removed from all linked tracks.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteTag(currentSlug);
      showToast("Tag deleted.");
      router.push("/tags");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete tag.");
      showToast("Failed to delete tag.", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {!editingName ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold">{name}</h1>
                <button
                  type="button"
                  className="rounded-lg bg-[color:var(--button-ghost-bg)] px-2 py-1 text-sm text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)]"
                  aria-label="Edit tag name"
                  onClick={() => setEditingName(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-[color:var(--muted)]">{currentSlug}</p>
            </>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TextInput
                className="w-full sm:max-w-md"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <ActionButton disabled={savingHeader || name.trim().length === 0} onClick={saveHeader}>
                {savingHeader ? "Saving..." : "Save"}
              </ActionButton>
              <ActionButton
                tone="ghost"
                disabled={savingHeader}
                onClick={() => {
                  setEditingName(false);
                  setName(initialName);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/tags" className="theme-button-link theme-button-link--ghost">
            Back To Tags
          </Link>
          <ActionButton tone="danger" disabled={deleting || savingHeader} onClick={onDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </ActionButton>
        </div>
      </div>

      <div className="panel grid gap-3 p-4">
        <h2 className="text-lg font-semibold">Tracks</h2>
        {trackSlugs.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {trackSlugs.map((trackSlugItem) => (
              <li key={trackSlugItem} className="flex items-center justify-between gap-2">
                <Link href={`/tracks/${trackSlugItem}`} className="underline-offset-4 hover:underline">
                  {trackNameBySlug[trackSlugItem] ?? trackSlugItem}
                </Link>
                <ActionButton
                  tone="ghost"
                  disabled={savingTracks}
                  onClick={() => saveTrackLinks(trackSlugs.filter((slug) => slug !== trackSlugItem))}
                >
                  Remove
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <select
            className="theme-input"
            value={addTrackSlug}
            disabled={savingTracks || availableTracks.length === 0}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setAddTrackSlug(value);
              if (!value) {
                return;
              }
              setAddTrackSlug("");
              void saveTrackLinks([...trackSlugs, value]);
            }}
          >
            <option value="">Add track...</option>
            {availableTracks.map((track) => (
              <option key={track.slug} value={track.slug}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
    </>
  );
}
