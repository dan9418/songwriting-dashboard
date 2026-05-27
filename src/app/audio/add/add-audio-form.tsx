"use client";

import { useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

interface TrackOption {
  slug: string;
  name: string;
}

export function AddAudioForm({ trackOptions }: { trackOptions: TrackOption[] }) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [trackSlug, setTrackSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<"note" | "demo" | "live">("demo");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [dateDescriptor, setDateDescriptor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = Boolean(trackSlug && file && date);

  return (
    <form
      className="panel grid gap-4 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!file || !trackSlug) {
          return;
        }
        setErrorMessage(null);
        setSubmitting(true);
        try {
          await api.uploadTrackAudio(trackSlug, {
            file,
            type,
            date,
            dateDescriptor,
            name
          });
          showToast("Audio uploaded.");
          router.push(`/tracks/${trackSlug}`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to upload audio.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Track">
            <select
              className="theme-input"
              value={trackSlug}
              required
              disabled={submitting || trackOptions.length === 0}
              onChange={(event) => setTrackSlug(event.currentTarget.value)}
            >
              <option value="">Choose a track...</option>
              {trackOptions.map((track) => (
                <option key={track.slug} value={track.slug}>
                  {track.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="File">
            <input
              type="file"
              accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp4,audio/x-m4a"
              required
              disabled={submitting}
              className="theme-input"
              onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Type">
            <select
              className="theme-input"
              value={type}
              disabled={submitting}
              onChange={(event) => setType(event.currentTarget.value as "note" | "demo" | "live")}
            >
              <option value="note">Note</option>
              <option value="demo">Demo</option>
              <option value="live">Live</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-3">
          <Field label="Date">
            <TextInput
              type="date"
              value={date}
              required
              disabled={submitting}
              onChange={(event) => setDate(event.currentTarget.value)}
            />
          </Field>
          <Field label="Name">
            <TextInput
              value={name}
              placeholder="Optional display name"
              disabled={submitting}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Field label="Date Label">
            <TextInput
              value={dateDescriptor}
              placeholder="Optional label"
              disabled={submitting}
              onChange={(event) => setDateDescriptor(event.currentTarget.value)}
            />
          </Field>
        </div>
      </div>

      {trackOptions.length === 0 ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Create a track before adding audio.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Uploading..." : "Upload Audio"}
        </ActionButton>
      </div>
    </form>
  );
}
