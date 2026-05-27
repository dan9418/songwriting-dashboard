"use client";

import { useMemo, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface TrackOption {
  slug: string;
  name: string;
}

export function AddTagForm({ trackOptions }: { trackOptions: TrackOption[] }) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [trackSlugs, setTrackSlugs] = useState<string[]>([]);
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
  const trackNameBySlug = useMemo(
    () => Object.fromEntries(trackOptions.map((track) => [track.slug, track.name])),
    [trackOptions]
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
          const created = await api.createTag({
            name,
            trackSlugs
          });
          showToast("Tag created.");
          router.push(`/tags/${created.slug}`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to create tag.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3 self-start">
          <Field label="Name">
            <TextInput
              autoFocus
              value={name}
              placeholder="Tag name"
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Field label="Slug">
            <TextInput value={derivedSlug} placeholder="Derived from name" disabled />
          </Field>
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

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !derivedSlug}>
          {submitting ? "Creating..." : "Create Tag"}
        </ActionButton>
      </div>
    </form>
  );
}
