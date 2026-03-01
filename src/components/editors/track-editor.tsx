"use client";

import { useEffect, useState } from "react";
import { ActionButton, Field, PillInput, SelectInput, TextArea, TextInput } from "@/components/ui/form-controls";
import { useUnsavedWarning } from "@/lib/client/use-unsaved-warning";
import type { AudioVersionData, TrackData } from "@/lib/client/types";

const TRACK_STATUSES: TrackData["status"][] = ["idea", "in-progress", "recorded", "released"];

interface TrackEditorProps {
  value: TrackData;
  content: string;
  onSave: (next: TrackData, content: string) => Promise<void>;
  saving?: boolean;
}

function normalizeAudioLine(line: string): AudioVersionData | null {
  const [fileName, category, version, recordedDate, description = ""] = line.split("|").map((part) => part.trim());
  if (!fileName || !category || !version || !recordedDate) {
    return null;
  }
  return {
    fileName,
    slug: "",
    category,
    versionNumber: Number(version),
    recordedDate,
    description: description || undefined
  };
}

function linesFromAudio(versions: AudioVersionData[]): string {
  return versions
    .map((item) =>
      [item.fileName, item.category, String(item.versionNumber), item.recordedDate, item.description ?? ""].join(
        " | "
      )
    )
    .join("\n");
}

export function TrackEditor({ value, content, onSave, saving }: TrackEditorProps) {
  const [draft, setDraft] = useState<TrackData>(value);
  const [draftContent, setDraftContent] = useState(content);
  const [audioRows, setAudioRows] = useState(linesFromAudio(value.audioVersions));
  const [dirty, setDirty] = useState(false);

  useUnsavedWarning(dirty);

  useEffect(() => {
    setDraft(value);
    setDraftContent(content);
    setAudioRows(linesFromAudio(value.audioVersions));
    setDirty(false);
  }, [value, content]);

  return (
    <div className="panel grid gap-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Title">
          <TextInput
            value={draft.title}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, title: event.currentTarget.value }));
            }}
          />
        </Field>
        <Field label="Status">
          <SelectInput
            value={draft.status}
            options={TRACK_STATUSES}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, status: event.currentTarget.value as TrackData["status"] }));
            }}
          />
        </Field>
        <Field label="BPM">
          <TextInput
            type="number"
            value={draft.bpm ?? ""}
            onChange={(event) => {
              setDirty(true);
              const valueNumber = Number(event.currentTarget.value);
              setDraft((prev) => ({ ...prev, bpm: Number.isFinite(valueNumber) ? valueNumber : undefined }));
            }}
          />
        </Field>
        <Field label="Key">
          <TextInput
            value={draft.key ?? ""}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, key: event.currentTarget.value || undefined }));
            }}
          />
        </Field>
        <Field label="Tags">
          <PillInput
            value={draft.tags}
            onChange={(tags) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, tags }));
            }}
          />
        </Field>
        <Field label="Artists">
          <PillInput
            value={draft.artistSlugs}
            onChange={(artistSlugs) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, artistSlugs }));
            }}
          />
        </Field>
      </div>

      <Field label="Audio Versions (fileName | category | versionNumber | MM-DD-YY | optionalDescription)">
        <TextArea
          rows={6}
          value={audioRows}
          onChange={(event) => {
            setDirty(true);
            const nextRows = event.currentTarget.value;
            setAudioRows(nextRows);
            const parsed = nextRows
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map(normalizeAudioLine)
              .filter((row): row is AudioVersionData => row !== null);
            setDraft((prev) => ({ ...prev, audioVersions: parsed }));
          }}
        />
      </Field>

      <Field label="Lyrics">
        <TextArea
          rows={8}
          value={draft.lyrics ?? ""}
          onChange={(event) => {
            setDirty(true);
            setDraft((prev) => ({ ...prev, lyrics: event.currentTarget.value || undefined }));
          }}
        />
      </Field>

      <Field label="Markdown Content">
        <TextArea
          rows={8}
          value={draftContent}
          onChange={(event) => {
            setDirty(true);
            setDraftContent(event.currentTarget.value);
          }}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          disabled={saving}
          onClick={async () => {
            await onSave({ ...draft, updatedAt: new Date().toISOString() }, draftContent);
            setDirty(false);
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </ActionButton>
      </div>
    </div>
  );
}

