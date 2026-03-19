"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import {
  ActionButton,
  Field,
  SelectInput,
  TextArea,
  TextInput
} from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { slugToTitle } from "@/lib/utils/slug-display";

type ProjectType = "album" | "ep" | "single" | "setlist";

interface SlugOption {
  slug: string;
  name: string;
}

interface ExternalLink {
  platform: string;
  url: string;
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5a2.1 2.1 0 1 1 3 3L7 16l-4 1 1-4 9.5-9.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 3 3" />
    </svg>
  );
}

function UnlinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6.5 6.5 8a3 3 0 0 0 4.2 4.2l1.6-1.6M12 13.5 13.5 12A3 3 0 1 0 9.3 7.8L7.7 9.4"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 4 12 12" />
    </svg>
  );
}

function GripIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="6" cy="5" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
      <circle cx="6" cy="15" r="1.2" />
      <circle cx="11" cy="5" r="1.2" />
      <circle cx="11" cy="10" r="1.2" />
      <circle cx="11" cy="15" r="1.2" />
    </svg>
  );
}

function createTrackNameMap(trackOptions: SlugOption[]) {
  return Object.fromEntries(trackOptions.map((track) => [track.slug, track.name]));
}

function moveItem(values: string[], fromIndex: number, toIndex: number) {
  const next = [...values];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function ProjectDetailControls({
  projectSlug,
  initialName,
  initialDescription,
  initialType,
  initialReleaseDate,
  initialRemasterDate,
  initialArtistSlugs,
  initialTrackSlugs,
  initialExternalLinks,
  imageHref,
  artistOptions,
  trackOptions
}: {
  projectSlug: string;
  initialName: string;
  initialDescription: string;
  initialType: ProjectType;
  initialReleaseDate: string | null;
  initialRemasterDate: string | null;
  initialArtistSlugs: string[];
  initialTrackSlugs: string[];
  initialExternalLinks: ExternalLink[];
  imageHref: string | null;
  artistOptions: SlugOption[];
  trackOptions: SlugOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [type, setType] = useState<ProjectType>(initialType);
  const [releaseDate, setReleaseDate] = useState(initialReleaseDate ?? "");
  const [remasterDate, setRemasterDate] = useState(initialRemasterDate ?? "");
  const [artistSlugs, setArtistSlugs] = useState(initialArtistSlugs);
  const [trackSlugs, setTrackSlugs] = useState(initialTrackSlugs);
  const [trackNamesBySlug, setTrackNamesBySlug] = useState<Record<string, string>>(
    createTrackNameMap(trackOptions)
  );

  const [draftTrackSlugs, setDraftTrackSlugs] = useState(initialTrackSlugs);
  const [draftTrackNamesBySlug, setDraftTrackNamesBySlug] = useState<Record<string, string>>(
    createTrackNameMap(trackOptions)
  );

  const [editingName, setEditingName] = useState(false);
  const [editingTracks, setEditingTracks] = useState(false);
  const [editingTrackSlug, setEditingTrackSlug] = useState<string | null>(null);
  const [draggedTrackSlug, setDraggedTrackSlug] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingArtists, setSavingArtists] = useState(false);
  const [savingTracks, setSavingTracks] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addArtistSlug, setAddArtistSlug] = useState("");
  const [addTrackSlug, setAddTrackSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const artistNameBySlug = useMemo(
    () => Object.fromEntries(artistOptions.map((artist) => [artist.slug, artist.name])),
    [artistOptions]
  );
  const availableArtists = useMemo(
    () =>
      artistOptions
        .filter((artist) => !artistSlugs.includes(artist.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [artistOptions, artistSlugs]
  );
  const availableTracks = useMemo(
    () =>
      trackOptions
        .filter((track) => !draftTrackSlugs.includes(track.slug))
        .map((track) => ({
          slug: track.slug,
          name: draftTrackNamesBySlug[track.slug] ?? track.name
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [draftTrackNamesBySlug, draftTrackSlugs, trackOptions]
  );
  const hasBlankDraftTrackName = useMemo(
    () => draftTrackSlugs.some((slug) => !(draftTrackNamesBySlug[slug] ?? "").trim()),
    [draftTrackNamesBySlug, draftTrackSlugs]
  );

  async function saveHeader() {
    setSavingHeader(true);
    setErrorMessage(null);
    try {
      const trimmedName = name.trim();
      await api.updateProject(projectSlug, {
        slug: projectSlug,
        name: trimmedName,
        description,
        type,
        releaseDate: releaseDate.trim() ? releaseDate.trim() : null,
        remasterDate: remasterDate.trim() ? remasterDate.trim() : null
      });
      setName(trimmedName);
      setEditingName(false);
      showToast("Project updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update project.");
      showToast("Failed to update project.", "error");
    } finally {
      setSavingHeader(false);
    }
  }

  async function saveArtistLinks(nextArtistSlugs: string[]) {
    setSavingArtists(true);
    setErrorMessage(null);
    try {
      await api.updateProject(projectSlug, {
        slug: projectSlug,
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

  function beginTrackEditing() {
    setDraftTrackSlugs(trackSlugs);
    setDraftTrackNamesBySlug({ ...trackNamesBySlug });
    setEditingTrackSlug(null);
    setDraggedTrackSlug(null);
    setAddTrackSlug("");
    setEditingTracks(true);
    setErrorMessage(null);
  }

  function cancelTrackEditing() {
    setDraftTrackSlugs(trackSlugs);
    setDraftTrackNamesBySlug({ ...trackNamesBySlug });
    setEditingTrackSlug(null);
    setDraggedTrackSlug(null);
    setAddTrackSlug("");
    setEditingTracks(false);
    setErrorMessage(null);
  }

  function updateDraftTrackName(trackSlug: string, value: string) {
    setDraftTrackNamesBySlug((current) => ({
      ...current,
      [trackSlug]: value
    }));
  }

  function unlinkDraftTrack(trackSlug: string) {
    setDraftTrackSlugs((current) => current.filter((slug) => slug !== trackSlug));
    if (editingTrackSlug === trackSlug) {
      setEditingTrackSlug(null);
    }
    if (draggedTrackSlug === trackSlug) {
      setDraggedTrackSlug(null);
    }
  }

  function addDraftTrack(trackSlug: string) {
    if (!trackSlug || draftTrackSlugs.includes(trackSlug)) {
      return;
    }
    setDraftTrackSlugs((current) => [...current, trackSlug]);
    setDraftTrackNamesBySlug((current) => ({
      ...current,
      [trackSlug]: current[trackSlug] ?? trackNamesBySlug[trackSlug] ?? trackSlug
    }));
  }

  function reorderDraftTracks(targetTrackSlug: string) {
    if (!draggedTrackSlug || draggedTrackSlug === targetTrackSlug) {
      return;
    }
    setDraftTrackSlugs((current) => {
      const fromIndex = current.indexOf(draggedTrackSlug);
      const toIndex = current.indexOf(targetTrackSlug);
      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }
      return moveItem(current, fromIndex, toIndex);
    });
  }

  async function saveTrackChanges() {
    setSavingTracks(true);
    setErrorMessage(null);
    try {
      const normalizedTrackNames = { ...draftTrackNamesBySlug };
      for (const trackSlug of draftTrackSlugs) {
        const nextName = (normalizedTrackNames[trackSlug] ?? trackNamesBySlug[trackSlug] ?? "").trim();
        if (!nextName) {
          throw new Error("Track names cannot be empty.");
        }
        normalizedTrackNames[trackSlug] = nextName;
      }

      const trackNameUpdates = draftTrackSlugs.flatMap((trackSlug) => {
        const currentName = (trackNamesBySlug[trackSlug] ?? "").trim();
        const nextName = normalizedTrackNames[trackSlug];
        if (!nextName || nextName === currentName) {
          return [];
        }
        return [
          {
            slug: trackSlug,
            name: nextName
          }
        ];
      });

      await api.updateProject(projectSlug, {
        slug: projectSlug,
        trackSlugs: draftTrackSlugs,
        trackNameUpdates: trackNameUpdates.length > 0 ? trackNameUpdates : undefined
      });

      setTrackSlugs(draftTrackSlugs);
      setTrackNamesBySlug((current) => ({
        ...current,
        ...normalizedTrackNames
      }));
      setDraftTrackNamesBySlug((current) => ({
        ...current,
        ...normalizedTrackNames
      }));
      setEditingTracks(false);
      setEditingTrackSlug(null);
      setDraggedTrackSlug(null);
      setAddTrackSlug("");
      showToast("Tracks updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update track links.");
      showToast("Failed to update tracks.", "error");
    } finally {
      setSavingTracks(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete project "${name || projectSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteProject(projectSlug);
      showToast("Project deleted.");
      router.push("/projects");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete project.");
      showToast("Failed to delete project.", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <EntityPlaceholderArtwork
            kind="project"
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
                  aria-label="Edit project header"
                  onClick={() => setEditingName(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-[color:var(--muted)]">
                {projectSlug} {String.fromCharCode(8226)} {type}
              </p>
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
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Release: {releaseDate.trim() || "-"} | Remaster: {remasterDate.trim() || "-"}
              </p>
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
              <Field label="Type">
                <SelectInput
                  options={["album", "ep", "single", "setlist"]}
                  value={type}
                  onChange={(event) => setType(event.currentTarget.value as ProjectType)}
                />
              </Field>
              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Release Date (YYYY-MM-DD)">
                  <TextInput
                    value={releaseDate}
                    onChange={(event) => setReleaseDate(event.currentTarget.value)}
                  />
                </Field>
                <Field label="Remaster Date (YYYY-MM-DD)">
                  <TextInput
                    value={remasterDate}
                    onChange={(event) => setRemasterDate(event.currentTarget.value)}
                  />
                </Field>
              </div>
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
                    setType(initialType);
                    setReleaseDate(initialReleaseDate ?? "");
                    setRemasterDate(initialRemasterDate ?? "");
                  }}
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          )}
        </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Link href="/projects" className="theme-button-link theme-button-link--ghost">
            Back To Projects
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
                    onClick={() =>
                      saveArtistLinks(artistSlugs.filter((slug) => slug !== artistSlug))
                    }
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Tracks</h2>
              {editingTracks ? (
                <p className="text-sm text-[color:var(--muted)]">
                  Drag to reorder. Track name changes and unlinks stay local until you save.
                </p>
              ) : null}
            </div>
            {!editingTracks ? (
              <ActionButton tone="ghost" aria-label="Edit tracks" onClick={beginTrackEditing}>
                <PencilIcon className="h-4 w-4" />
              </ActionButton>
            ) : (
              <div className="flex items-center gap-2">
                <ActionButton
                  disabled={savingTracks || hasBlankDraftTrackName}
                  onClick={saveTrackChanges}
                >
                  {savingTracks ? "Saving..." : "Save"}
                </ActionButton>
                <ActionButton tone="ghost" disabled={savingTracks} onClick={cancelTrackEditing}>
                  Cancel
                </ActionButton>
              </div>
            )}
          </div>

          {!editingTracks ? (
            trackSlugs.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
            ) : (
              <ol className="list-decimal pl-5 text-sm">
                {trackSlugs.map((trackSlug) => (
                  <li key={trackSlug}>
                    <Link href={`/tracks/${trackSlug}`} className="underline-offset-4 hover:underline">
                      {trackNamesBySlug[trackSlug] ?? trackSlug}
                    </Link>
                  </li>
                ))}
              </ol>
            )
          ) : (
            <>
              {draftTrackSlugs.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  No tracks linked. Add a track below to start building the project order.
                </p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {draftTrackSlugs.map((trackSlug, index) => {
                    const isEditingTrack = editingTrackSlug === trackSlug;
                    const draftName = draftTrackNamesBySlug[trackSlug] ?? trackNamesBySlug[trackSlug] ?? trackSlug;
                    return (
                      <li
                        key={trackSlug}
                        draggable={!savingTracks}
                        onDragStart={() => setDraggedTrackSlug(trackSlug)}
                        onDragEnd={() => setDraggedTrackSlug(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          reorderDraftTracks(trackSlug);
                          setDraggedTrackSlug(null);
                        }}
                        className={`rounded-xl border px-3 py-3 transition ${
                          draggedTrackSlug === trackSlug
                            ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                            : "border-[color:var(--border-strong)] bg-[color:var(--surface)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-1 cursor-grab rounded-md p-1 text-[color:var(--muted)] transition hover:bg-[color:var(--button-ghost-hover)] active:cursor-grabbing"
                            aria-label={`Drag to reorder ${draftName}`}
                          >
                            <GripIcon className="h-4 w-4" />
                          </button>
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[color:var(--button-ghost-hover)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            {isEditingTrack ? (
                              <div className="grid gap-2">
                                <TextInput
                                  value={draftName}
                                  disabled={savingTracks}
                                  onChange={(event) => updateDraftTrackName(trackSlug, event.currentTarget.value)}
                                  onBlur={() => {
                                    if ((draftTrackNamesBySlug[trackSlug] ?? "").trim()) {
                                      setEditingTrackSlug(null);
                                    }
                                  }}
                                />
                                <p className="text-xs text-[color:var(--muted)]">{trackSlug}</p>
                              </div>
                            ) : (
                              <div className="grid gap-1">
                                <Link href={`/tracks/${trackSlug}`} className="truncate font-medium underline-offset-4 hover:underline">
                                  {draftName}
                                </Link>
                                <p className="text-xs text-[color:var(--muted)]">{trackSlug}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-[color:var(--button-ghost-bg)] p-2 text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Edit ${draftName}`}
                              disabled={savingTracks}
                              onClick={() =>
                                setEditingTrackSlug((current) => (current === trackSlug ? null : trackSlug))
                              }
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-[color:var(--button-ghost-bg)] p-2 text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Unlink ${draftName} from this project`}
                              disabled={savingTracks}
                              onClick={() => unlinkDraftTrack(trackSlug)}
                            >
                              <UnlinkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
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
                    addDraftTrack(value);
                    setAddTrackSlug("");
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

              {hasBlankDraftTrackName ? (
                <p className="text-sm text-red-700">Every linked track needs a name before you can save.</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
    </>
  );
}
