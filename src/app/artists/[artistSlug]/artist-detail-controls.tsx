"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { ArtistQuickEditModal } from "@/components/artists/artist-quick-edit-modal";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { slugToTitle } from "@/lib/utils/slug-display";

interface ProjectOption {
  slug: string;
  name: string;
}

interface TrackOption {
  slug: string;
  name: string;
}

interface ExternalLink {
  platform: string;
  url: string;
}

export function ArtistDetailControls({
  artistSlug,
  initialName,
  initialDescription,
  initialImageSlug,
  initialProjectSlugs,
  initialTrackSlugs,
  initialExternalLinks,
  imageHref,
  projectOptions,
  trackOptions
}: {
  artistSlug: string;
  initialName: string;
  initialDescription: string;
  initialImageSlug: string | null;
  initialProjectSlugs: string[];
  initialTrackSlugs: string[];
  initialExternalLinks: ExternalLink[];
  imageHref: string | null;
  projectOptions: ProjectOption[];
  trackOptions: TrackOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [projectSlugs, setProjectSlugs] = useState(initialProjectSlugs);
  const [trackSlugs, setTrackSlugs] = useState(initialTrackSlugs);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [savingProjects, setSavingProjects] = useState(false);
  const [savingTracks, setSavingTracks] = useState(false);
  const [addProjectSlug, setAddProjectSlug] = useState("");
  const [addTrackSlug, setAddTrackSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectNameBySlug = useMemo(
    () => Object.fromEntries(projectOptions.map((project) => [project.slug, project.name])),
    [projectOptions]
  );
  const trackNameBySlug = useMemo(
    () => Object.fromEntries(trackOptions.map((track) => [track.slug, track.name])),
    [trackOptions]
  );
  const availableProjects = useMemo(
    () =>
      projectOptions
        .filter((project) => !projectSlugs.includes(project.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [projectOptions, projectSlugs]
  );
  const availableTracks = useMemo(
    () =>
      trackOptions
        .filter((track) => !trackSlugs.includes(track.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [trackOptions, trackSlugs]
  );

  async function saveProjectLinks(nextProjectSlugs: string[]) {
    setSavingProjects(true);
    setErrorMessage(null);
    try {
      await api.updateArtist(artistSlug, {
        slug: artistSlug,
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

  async function saveTrackLinks(nextTrackSlugs: string[]) {
    setSavingTracks(true);
    setErrorMessage(null);
    try {
      await api.updateArtist(artistSlug, {
        slug: artistSlug,
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

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <EntityPlaceholderArtwork
            kind="artist"
            variant="detail-avatar"
            imageHref={imageHref}
            alt={`${name} artwork`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{name}</h1>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                aria-label={`Edit ${name}`}
                onClick={() => setEditingMetadata(true)}
              >
                <AppIcon name="pencil" className="h-4 w-4" />
              </button>
            </div>
            {description.trim() ? (
              <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p>
            ) : null}
            {initialExternalLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm">
                {initialExternalLinks.map((link) => (
                  <a
                    key={`${link.platform}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {slugToTitle(link.platform)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
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

        <div className="panel grid self-start gap-3 p-4">
          <h2 className="text-lg font-semibold">Tracks</h2>
          {trackSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {trackSlugs.map((trackSlug) => (
                <li key={trackSlug} className="flex items-center justify-between gap-2">
                  <Link href={`/tracks/${trackSlug}`} className="underline-offset-4 hover:underline">
                    {trackNameBySlug[trackSlug] ?? trackSlug}
                  </Link>
                  <ActionButton
                    tone="ghost"
                    disabled={savingTracks}
                    onClick={() => saveTrackLinks(trackSlugs.filter((slug) => slug !== trackSlug))}
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
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      {editingMetadata ? (
        <ArtistQuickEditModal
          artistSlug={artistSlug}
          initialName={name}
          initialDescription={description}
          initialImageSlug={initialImageSlug}
          onClose={() => setEditingMetadata(false)}
          onSaved={(next) => {
            setName(next.name);
            setDescription(next.description);
            setEditingMetadata(false);
          }}
        />
      ) : null}
    </>
  );
}
