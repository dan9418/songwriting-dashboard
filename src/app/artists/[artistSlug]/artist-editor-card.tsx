"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, Field, TextArea, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

interface ProjectOption {
  slug: string;
  name: string;
  artistSlugs: string[];
}

function toggleSlug(list: string[], slug: string): string[] {
  if (list.includes(slug)) {
    return list.filter((item) => item !== slug);
  }
  return [...list, slug];
}

export function ArtistEditorCard({
  artistSlug,
  initialName,
  initialDescription,
  initialProjectSlugs,
  projectOptions
}: {
  artistSlug: string;
  initialName: string;
  initialDescription: string;
  initialProjectSlugs: string[];
  projectOptions: ProjectOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [selectedProjectSlugs, setSelectedProjectSlugs] = useState(initialProjectSlugs);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedProjects = useMemo(
    () => [...projectOptions].sort((left, right) => left.name.localeCompare(right.name)),
    [projectOptions]
  );

  async function onSave() {
    setSaving(true);
    setErrorMessage(null);
    try {
      await api.updateArtist(artistSlug, {
        slug: artistSlug,
        name: name.trim(),
        description
      });

      const selectedSet = new Set(selectedProjectSlugs);
      for (const project of projectOptions) {
        const currentlyLinked = project.artistSlugs.includes(artistSlug);
        const shouldBeLinked = selectedSet.has(project.slug);
        if (currentlyLinked === shouldBeLinked) {
          continue;
        }

        const nextArtistSlugs = shouldBeLinked
          ? Array.from(new Set([...project.artistSlugs, artistSlug]))
          : project.artistSlugs.filter((slug) => slug !== artistSlug);

        await api.updateProject(project.slug, {
          slug: project.slug,
          artistSlugs: nextArtistSlugs
        });
      }

      showToast("Artist updated.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update artist.");
      showToast("Failed to update artist.", "error");
    } finally {
      setSaving(false);
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
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="panel grid gap-4 p-4">
      <h2 className="text-lg font-semibold">Edit Artist</h2>

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
                  checked={selectedProjectSlugs.includes(project.slug)}
                  onChange={() =>
                    setSelectedProjectSlugs((current) => toggleSlug(current, project.slug))
                  }
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
          {deleting ? "Deleting..." : "Delete Artist"}
        </ActionButton>
        <ActionButton disabled={saving || deleting || name.trim().length === 0} onClick={onSave}>
          {saving ? "Saving..." : "Save Artist"}
        </ActionButton>
      </div>
    </div>
  );
}
