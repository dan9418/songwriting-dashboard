"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  Field,
  SelectInput,
  TextArea,
  TextInput
} from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

type ProjectType = "album" | "ep" | "single" | "setlist";

interface SlugOption {
  slug: string;
  name: string;
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

  const [editingName, setEditingName] = useState(false);
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
  const trackNameBySlug = useMemo(
    () => Object.fromEntries(trackOptions.map((track) => [track.slug, track.name])),
    [trackOptions]
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
        .filter((track) => !trackSlugs.includes(track.slug))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [trackOptions, trackSlugs]
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

  async function saveTrackLinks(nextTrackSlugs: string[]) {
    setSavingTracks(true);
    setErrorMessage(null);
    try {
      await api.updateProject(projectSlug, {
        slug: projectSlug,
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
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          {!editingName ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold">{name}</h1>
                <button
                  type="button"
                  className="rounded-lg bg-[#f4eadb] px-2 py-1 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
                  aria-label="Edit project header"
                  onClick={() => setEditingName(true)}
                >
                  ✎
                </button>
              </div>
              <p className="text-sm text-[color:var(--muted)]">
                {projectSlug} {String.fromCharCode(8226)} {type}
              </p>
              {description.trim() ? (
                <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p>
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
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
          >
            Back To Projects
          </Link>
          <ActionButton tone="danger" disabled={deleting || savingHeader} onClick={onDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel grid gap-3 p-4">
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
              className="w-full rounded-lg border border-[#d9ccb8] bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
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

        <div className="panel grid gap-3 p-4">
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
              className="w-full rounded-lg border border-[#d9ccb8] bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
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
    </>
  );
}
