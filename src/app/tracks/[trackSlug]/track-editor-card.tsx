"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

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

export function TrackEditorCard({
  trackSlug,
  initialName,
  initialArtistSlugs,
  initialProjectSlugs,
  artistOptions,
  projectOptions
}: {
  trackSlug: string;
  initialName: string;
  initialArtistSlugs: string[];
  initialProjectSlugs: string[];
  artistOptions: SlugOption[];
  projectOptions: SlugOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [artistSlugs, setArtistSlugs] = useState(initialArtistSlugs);
  const [projectSlugs, setProjectSlugs] = useState(initialProjectSlugs);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedArtists = useMemo(
    () => [...artistOptions].sort((left, right) => left.name.localeCompare(right.name)),
    [artistOptions]
  );
  const sortedProjects = useMemo(
    () => [...projectOptions].sort((left, right) => left.name.localeCompare(right.name)),
    [projectOptions]
  );

  async function onSave() {
    setSaving(true);
    setErrorMessage(null);
    try {
      await api.updateTrack(trackSlug, {
        slug: trackSlug,
        name: name.trim(),
        artistSlugs,
        projectSlugs
      });
      showToast("Track updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update track.");
      showToast("Failed to update track.", "error");
    } finally {
      setSaving(false);
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
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="panel grid gap-4 p-4">
      <h2 className="text-lg font-semibold">Edit Track</h2>

      <Field label="Name">
        <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </Field>

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
        <p className="text-sm font-medium text-[color:var(--muted)]">Linked Projects</p>
        {sortedProjects.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No projects available.</p>
        ) : (
          <div className="grid gap-1">
            {sortedProjects.map((project) => (
              <label key={project.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={projectSlugs.includes(project.slug)}
                  onChange={() => setProjectSlugs((current) => toggleSlug(current, project.slug))}
                />
                <span>{project.name}</span>
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
          {deleting ? "Deleting..." : "Delete Track"}
        </ActionButton>
        <ActionButton disabled={saving || deleting || name.trim().length === 0} onClick={onSave}>
          {saving ? "Saving..." : "Save Track"}
        </ActionButton>
      </div>
    </div>
  );
}
