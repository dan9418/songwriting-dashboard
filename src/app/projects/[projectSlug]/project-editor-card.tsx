"use client";

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

function toggleSlug(list: string[], slug: string): string[] {
  if (list.includes(slug)) {
    return list.filter((item) => item !== slug);
  }
  return [...list, slug];
}

export function ProjectEditorCard({
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedArtists = useMemo(
    () => [...artistOptions].sort((left, right) => left.name.localeCompare(right.name)),
    [artistOptions]
  );
  const sortedTracks = useMemo(
    () => [...trackOptions].sort((left, right) => left.name.localeCompare(right.name)),
    [trackOptions]
  );

  async function onSave() {
    setSaving(true);
    setErrorMessage(null);
    try {
      await api.updateProject(projectSlug, {
        slug: projectSlug,
        name: name.trim(),
        description,
        type,
        releaseDate: releaseDate.trim() ? releaseDate.trim() : null,
        remasterDate: remasterDate.trim() ? remasterDate.trim() : null,
        artistSlugs,
        trackSlugs
      });
      showToast("Project updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update project.");
      showToast("Failed to update project.", "error");
    } finally {
      setSaving(false);
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
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="panel grid gap-4 p-4">
      <h2 className="text-lg font-semibold">Edit Project</h2>

      <Field label="Name">
        <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </Field>

      <Field label="Description">
        <TextArea
          rows={3}
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

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Release Date (YYYY-MM-DD)">
          <TextInput value={releaseDate} onChange={(event) => setReleaseDate(event.currentTarget.value)} />
        </Field>
        <Field label="Remaster Date (YYYY-MM-DD)">
          <TextInput value={remasterDate} onChange={(event) => setRemasterDate(event.currentTarget.value)} />
        </Field>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium text-[color:var(--muted)]">Linked Artists</p>
        {sortedArtists.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No artists available.</p>
        ) : (
          <div className="grid gap-1">
            {sortedArtists.map((artist) => (
              <label key={artist.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={artistSlugs.includes(artist.slug)}
                  onChange={() => setArtistSlugs((current) => toggleSlug(current, artist.slug))}
                />
                <span>{artist.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium text-[color:var(--muted)]">Linked Tracks</p>
        {sortedTracks.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No tracks available.</p>
        ) : (
          <div className="grid gap-1">
            {sortedTracks.map((track) => (
              <label key={track.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={trackSlugs.includes(track.slug)}
                  onChange={() => setTrackSlugs((current) => toggleSlug(current, track.slug))}
                />
                <span>{track.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <ActionButton tone="danger" disabled={saving || deleting} onClick={onDelete}>
          {deleting ? "Deleting..." : "Delete Project"}
        </ActionButton>
        <ActionButton disabled={saving || deleting || name.trim().length === 0} onClick={onSave}>
          {saving ? "Saving..." : "Save Project"}
        </ActionButton>
      </div>
    </div>
  );
}
