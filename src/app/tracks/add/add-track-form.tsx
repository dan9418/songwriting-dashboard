"use client";

import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton, Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface SlugOption {
  slug: string;
  name: string;
}

export function AddTrackForm({
  artistOptions,
  projectOptions
}: {
  artistOptions: SlugOption[];
  projectOptions: SlugOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [artistSlugs, setArtistSlugs] = useState<string[]>([]);
  const [projectSlugs, setProjectSlugs] = useState<string[]>([]);
  const [addArtistSlug, setAddArtistSlug] = useState("");
  const [addProjectSlug, setAddProjectSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const derivedSlug = useMemo(() => {
    try {
      return ensureNonEmptySlug(name);
    } catch {
      return "";
    }
  }, [name]);

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

  return (
    <form
      className="panel grid gap-4 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setSubmitting(true);
        try {
          const created = await api.createTrack({
            name,
            artistSlugs,
            projectSlugs
          });
          showToast("Track created.");
          router.push(`/tracks/${created.slug}`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to create track.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Name">
            <TextInput
              autoFocus
              value={name}
              placeholder="Track name"
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Field label="Slug">
            <TextInput value={derivedSlug} placeholder="Derived from name" disabled />
          </Field>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Artists</h2>
            {artistSlugs.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No artists linked.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {artistSlugs.map((artistSlug) => (
                  <li key={artistSlug} className="flex items-center justify-between gap-2">
                    <span>{artistNameBySlug[artistSlug] ?? artistSlug}</span>
                    <ActionButton
                      type="button"
                      tone="ghost"
                      disabled={submitting}
                      onClick={() => setArtistSlugs((current) => current.filter((slug) => slug !== artistSlug))}
                    >
                      Remove
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
            <select
              className="theme-input"
              value={addArtistSlug}
              disabled={submitting || availableArtists.length === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAddArtistSlug(value);
                if (!value) {
                  return;
                }
                setArtistSlugs((current) => [...current, value]);
                setAddArtistSlug("");
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

          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Projects</h2>
            {projectSlugs.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No projects linked.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {projectSlugs.map((projectSlug) => (
                  <li key={projectSlug} className="flex items-center justify-between gap-2">
                    <span>{projectNameBySlug[projectSlug] ?? projectSlug}</span>
                    <ActionButton
                      type="button"
                      tone="ghost"
                      disabled={submitting}
                      onClick={() => setProjectSlugs((current) => current.filter((slug) => slug !== projectSlug))}
                    >
                      Remove
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
            <select
              className="theme-input"
              value={addProjectSlug}
              disabled={submitting || availableProjects.length === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAddProjectSlug(value);
                if (!value) {
                  return;
                }
                setProjectSlugs((current) => [...current, value]);
                setAddProjectSlug("");
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

      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !derivedSlug}>
          {submitting ? "Creating..." : "Create Track"}
        </ActionButton>
      </div>
    </form>
  );
}
