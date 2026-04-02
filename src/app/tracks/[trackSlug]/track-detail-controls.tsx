"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

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

export function TrackDetailControls({
  trackSlug,
  initialName,
  initialArtistSlugs,
  initialProjectSlugs,
  imageHref,
  artistOptions,
  projectOptions
}: {
  trackSlug: string;
  initialName: string;
  initialArtistSlugs: string[];
  initialProjectSlugs: string[];
  imageHref: string | null;
  artistOptions: SlugOption[];
  projectOptions: SlugOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialName);
  const [artistSlugs, setArtistSlugs] = useState(initialArtistSlugs);
  const [projectSlugs, setProjectSlugs] = useState(initialProjectSlugs);
  const [editingName, setEditingName] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingArtists, setSavingArtists] = useState(false);
  const [savingProjects, setSavingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addArtistSlug, setAddArtistSlug] = useState("");
  const [addProjectSlug, setAddProjectSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const artistNameBySlug = useMemo(
    () => Object.fromEntries(artistOptions.map((artist) => [artist.slug, artist.name])),
    [artistOptions]
  );
  const projectNameBySlug = useMemo(
    () => Object.fromEntries(projectOptions.map((project) => [project.slug, project.name])),
    [projectOptions]
  );
  const availableArtists = useMemo(
    () =>
      artistOptions
        .filter((artist) => !artistSlugs.includes(artist.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [artistOptions, artistSlugs]
  );
  const availableProjects = useMemo(
    () =>
      projectOptions
        .filter((project) => !projectSlugs.includes(project.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [projectOptions, projectSlugs]
  );

  async function saveHeader() {
    setSavingHeader(true);
    setErrorMessage(null);
    try {
      const trimmedName = name.trim();
      await api.updateTrack(trackSlug, {
        slug: trackSlug,
        name: trimmedName
      });
      setName(trimmedName);
      setEditingName(false);
      showToast("Track name updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update track name.");
      showToast("Failed to update track name.", "error");
    } finally {
      setSavingHeader(false);
    }
  }

  async function saveArtistLinks(nextArtistSlugs: string[]) {
    setSavingArtists(true);
    setErrorMessage(null);
    try {
      await api.updateTrack(trackSlug, {
        slug: trackSlug,
        artistSlugs: nextArtistSlugs
      });
      setArtistSlugs(nextArtistSlugs);
      showToast("Artist links updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update artist links.");
      showToast("Failed to update artist links.", "error");
    } finally {
      setSavingArtists(false);
    }
  }

  async function saveProjectLinks(nextProjectSlugs: string[]) {
    setSavingProjects(true);
    setErrorMessage(null);
    try {
      await api.updateTrack(trackSlug, {
        slug: trackSlug,
        projectSlugs: nextProjectSlugs
      });
      setProjectSlugs(nextProjectSlugs);
      showToast("Project links updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update project links.");
      showToast("Failed to update project links.", "error");
    } finally {
      setSavingProjects(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete track "${name || trackSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteTrack(trackSlug);
      showToast("Track deleted.");
      router.push("/tracks");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete track.");
      showToast("Failed to delete track.", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <EntityPlaceholderArtwork
            kind="track"
            variant="detail-cover"
            imageHref={imageHref}
            alt={`${name} artwork`}
          />
          <div className="min-w-0 flex-1">
          {!editingName ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold">{name}</h1>
                <button
                  type="button"
                  className="rounded-lg bg-[color:var(--button-ghost-bg)] px-2 py-1 text-sm text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)]"
                  aria-label="Edit track name"
                  onClick={() => setEditingName(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-[color:var(--muted)]">{trackSlug}</p>
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
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/tracks" className="theme-button-link theme-button-link--ghost">
            Back To Tracks
          </Link>
          <ActionButton tone="danger" disabled={deleting || savingHeader} onClick={onDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </ActionButton>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="panel grid self-start gap-3 p-4">
          <h2 className="text-lg font-semibold">Artists</h2>
          {artistSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No artists linked.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {artistSlugs.map((artistSlug) => (
                <li key={artistSlug} className="flex items-center justify-between gap-2">
                  <Link href={`/artists/${artistSlug}`} className="underline-offset-4 hover:underline">
                    {artistNameBySlug[artistSlug] ?? artistSlug}
                  </Link>
                  <ActionButton
                    tone="ghost"
                    disabled={savingArtists}
                    onClick={() => saveArtistLinks(artistSlugs.filter((slug) => slug !== artistSlug))}
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
              value={addArtistSlug}
              disabled={savingArtists || availableArtists.length === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAddArtistSlug(value);
                if (!value) {
                  return;
                }
                setAddArtistSlug("");
                void saveArtistLinks([...artistSlugs, value]);
              }}
            >
              <option value="">Add artist...</option>
              {availableArtists.map((artist) => (
                <option key={artist.slug} value={artist.slug}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel grid self-start gap-3 p-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          {projectSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No projects linked.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {projectSlugs.map((projectSlug) => (
                <li key={projectSlug} className="flex items-center justify-between gap-2">
                  <Link href={`/projects/${projectSlug}`} className="underline-offset-4 hover:underline">
                    {projectNameBySlug[projectSlug] ?? projectSlug}
                  </Link>
                  <ActionButton
                    tone="ghost"
                    disabled={savingProjects}
                    onClick={() => saveProjectLinks(projectSlugs.filter((slug) => slug !== projectSlug))}
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
              value={addProjectSlug}
              disabled={savingProjects || availableProjects.length === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAddProjectSlug(value);
                if (!value) {
                  return;
                }
                setAddProjectSlug("");
                void saveProjectLinks([...projectSlugs, value]);
              }}
            >
              <option value="">Add project...</option>
              {availableProjects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
    </>
  );
}
