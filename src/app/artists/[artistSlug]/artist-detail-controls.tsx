"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { ActionButton, Field, TextArea, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

interface ProjectOption {
  slug: string;
  name: string;
}

interface TrackOption {
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

export function ArtistDetailControls({
  artistSlug,
  initialName,
  initialDescription,
  initialProjectSlugs,
  initialTrackSlugs,
  projectOptions,
  trackOptions
}: {
  artistSlug: string;
  initialName: string;
  initialDescription: string;
  initialProjectSlugs: string[];
  initialTrackSlugs: string[];
  projectOptions: ProjectOption[];
  trackOptions: TrackOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [editingName, setEditingName] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectNameBySlug = useMemo(
    () => Object.fromEntries(projectOptions.map((project) => [project.slug, project.name])),
    [projectOptions]
  );
  const trackNameBySlug = useMemo(
    () => Object.fromEntries(trackOptions.map((track) => [track.slug, track.name])),
    [trackOptions]
  );

  const projectSlugs = initialProjectSlugs;
  const trackSlugs = initialTrackSlugs;

  async function saveHeader() {
    setSavingHeader(true);
    setErrorMessage(null);
    try {
      const trimmedName = name.trim();
      await api.updateArtist(artistSlug, {
        slug: artistSlug,
        name: trimmedName,
        description
      });
      setName(trimmedName);
      setEditingName(false);
      showToast("Artist updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update artist.");
      showToast("Failed to update artist.", "error");
    } finally {
      setSavingHeader(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete artist "${name || artistSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteArtist(artistSlug);
      showToast("Artist deleted.");
      router.push("/artists");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete artist.");
      showToast("Failed to delete artist.", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <EntityPlaceholderArtwork kind="artist" variant="detail-avatar" />
          <div className="min-w-0 flex-1">
            {!editingName ? (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold">{name}</h1>
                  <button
                    type="button"
                    className="rounded-lg bg-[color:var(--button-ghost-bg)] px-2 py-1 text-sm text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)]"
                    aria-label="Edit artist header"
                    onClick={() => setEditingName(true)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-[color:var(--muted)]">{artistSlug}</p>
                {description.trim() ? (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p>
                ) : null}
              </>
            ) : (
              <div className="grid gap-2">
                <Field label="Name">
                  <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
                </Field>
                <Field label="Description">
                  <TextArea
                    rows={2}
                    value={description}
                    onChange={(event) => setDescription(event.currentTarget.value)}
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <ActionButton
                    disabled={savingHeader || name.trim().length === 0}
                    onClick={saveHeader}
                  >
                    {savingHeader ? "Saving..." : "Save"}
                  </ActionButton>
                  <ActionButton
                    tone="ghost"
                    disabled={savingHeader}
                    onClick={() => {
                      setEditingName(false);
                      setName(initialName);
                      setDescription(initialDescription);
                    }}
                  >
                    Cancel
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/artists" className="theme-button-link theme-button-link--ghost">
            Back To Artists
          </Link>
          <ActionButton tone="danger" disabled={deleting || savingHeader} onClick={onDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </ActionButton>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="panel grid self-start gap-3 p-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          {projectSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No projects linked.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {projectSlugs.map((projectSlug) => (
                <li key={projectSlug}>
                  <Link href={`/projects/${projectSlug}`} className="underline-offset-4 hover:underline">
                    {projectNameBySlug[projectSlug] ?? projectSlug}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel grid self-start gap-3 p-4">
          <h2 className="text-lg font-semibold">Tracks</h2>
          {trackSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {trackSlugs.map((trackSlug) => (
                <li key={trackSlug}>
                  <Link href={`/tracks/${trackSlug}`} className="underline-offset-4 hover:underline">
                    {trackNameBySlug[trackSlug] ?? trackSlug}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
    </>
  );
}
