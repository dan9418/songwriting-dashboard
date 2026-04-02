"use client";

import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton, Field, SelectInput, TextArea, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

type ProjectType = "album" | "ep" | "single" | "setlist";

interface SlugOption {
  slug: string;
  name: string;
}

function moveItem(values: string[], fromIndex: number, toIndex: number) {
  const next = [...values];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function AddProjectForm({
  artistOptions,
  trackOptions
}: {
  artistOptions: SlugOption[];
  trackOptions: SlugOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("single");
  const [releaseDate, setReleaseDate] = useState("");
  const [remasterDate, setRemasterDate] = useState("");
  const [artistSlugs, setArtistSlugs] = useState<string[]>([]);
  const [trackSlugs, setTrackSlugs] = useState<string[]>([]);
  const [addArtistSlug, setAddArtistSlug] = useState("");
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

  return (
    <form
      className="panel grid gap-4 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setSubmitting(true);
        try {
          const created = await api.postProject({
            name,
            description,
            type,
            releaseDate: releaseDate.trim() ? releaseDate.trim() : null,
            remasterDate: remasterDate.trim() ? remasterDate.trim() : null,
            artistSlugs,
            trackSlugs
          });
          showToast("Project created.");
          router.push(`/projects/${created.slug}`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to create project.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="grid gap-3">
          <Field label="Name">
            <TextInput
              autoFocus
              value={name}
              placeholder="Project name"
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Field label="Slug">
            <TextInput value={derivedSlug} placeholder="Derived from name" disabled />
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={description}
              placeholder="Optional project description"
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
        </div>

        <div className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold">Tracks</h2>
            <p className="text-sm text-[color:var(--muted)]">Selected tracks keep the order shown here.</p>
          </div>

          {trackSlugs.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No tracks linked.</p>
          ) : (
            <ol className="grid gap-2 text-sm">
              {trackSlugs.map((trackSlug, index) => (
                <li key={trackSlug} className="rounded-xl border border-[color:var(--border-strong)] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[color:var(--button-ghost-hover)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{trackNameBySlug[trackSlug] ?? trackSlug}</span>
                    <div className="flex items-center gap-2">
                      <ActionButton
                        type="button"
                        tone="ghost"
                        disabled={submitting || index === 0}
                        onClick={() =>
                          setTrackSlugs((current) => moveItem(current, index, index - 1))
                        }
                      >
                        Up
                      </ActionButton>
                      <ActionButton
                        type="button"
                        tone="ghost"
                        disabled={submitting || index === trackSlugs.length - 1}
                        onClick={() =>
                          setTrackSlugs((current) => moveItem(current, index, index + 1))
                        }
                      >
                        Down
                      </ActionButton>
                      <ActionButton
                        type="button"
                        tone="ghost"
                        disabled={submitting}
                        onClick={() => setTrackSlugs((current) => current.filter((slug) => slug !== trackSlug))}
                      >
                        Remove
                      </ActionButton>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
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

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !derivedSlug}>
          {submitting ? "Creating..." : "Create Project"}
        </ActionButton>
      </div>
    </form>
  );
}
