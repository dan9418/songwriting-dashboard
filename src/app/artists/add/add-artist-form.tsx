"use client";

import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { Field } from "@/components/ui/field";
import { TextArea } from "@/components/ui/text-area";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface SlugOption {
  slug: string;
  name: string;
}

export function AddArtistForm({
  projectOptions,
  trackOptions
}: {
  projectOptions: SlugOption[];
  trackOptions: SlugOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectSlugs, setProjectSlugs] = useState<string[]>([]);
  const [trackSlugs, setTrackSlugs] = useState<string[]>([]);
  const [addProjectSlug, setAddProjectSlug] = useState("");
  const [addTrackSlug, setAddTrackSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const derivedSlug = useMemo(() => {
    try {
      return ensureNonEmptySlug(name);
    } catch {
      return "";
    }
  }, [name]);

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

  return (
    <form
      className="panel grid gap-4 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setSubmitting(true);
        try {
          const created = await api.postArtist({
            name,
            description,
            projectSlugs,
            trackSlugs
          });
          showToast("Artist created.");
          router.push(`/artists/${created.slug}`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to create artist.");
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
              placeholder="Artist name"
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Field label="Slug">
            <TextInput value={derivedSlug} placeholder="Derived from name" disabled />
          </Field>
          <Field label="Description">
            <TextArea
              rows={4}
              value={description}
              placeholder="Optional artist description"
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4">
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

          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Tracks</h2>
            {trackSlugs.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {trackSlugs.map((trackSlug) => (
                  <li key={trackSlug} className="flex items-center justify-between gap-2">
                    <span>{trackNameBySlug[trackSlug] ?? trackSlug}</span>
                    <ActionButton
                      type="button"
                      tone="ghost"
                      disabled={submitting}
                      onClick={() => setTrackSlugs((current) => current.filter((slug) => slug !== trackSlug))}
                    >
                      Remove
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
            <select
              className="theme-input"
              value={addTrackSlug}
              disabled={submitting || availableTracks.length === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAddTrackSlug(value);
                if (!value) {
                  return;
                }
                setTrackSlugs((current) => [...current, value]);
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
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !derivedSlug}>
          {submitting ? "Creating..." : "Create Artist"}
        </ActionButton>
      </div>
    </form>
  );
}
