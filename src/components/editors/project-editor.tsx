"use client";

import { useEffect, useState } from "react";
import { ActionButton, Field, PillInput, SelectInput, TextArea, TextInput } from "@/components/ui/form-controls";
import { useUnsavedWarning } from "@/lib/client/use-unsaved-warning";
import type { ProjectData } from "@/lib/client/types";

const PROJECT_TYPES: ProjectData["type"][] = ["album", "ep", "single", "setlist"];

interface ProjectEditorProps {
  value: ProjectData;
  content: string;
  onSave: (next: ProjectData, content: string) => Promise<void>;
  saving?: boolean;
}

export function ProjectEditor({ value, content, onSave, saving }: ProjectEditorProps) {
  const [draft, setDraft] = useState<ProjectData>(value);
  const [draftContent, setDraftContent] = useState(content);
  const [dirty, setDirty] = useState(false);

  useUnsavedWarning(dirty);

  useEffect(() => {
    setDraft(value);
    setDraftContent(content);
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
        <Field label="Type">
          <SelectInput
            value={draft.type}
            options={PROJECT_TYPES}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, type: event.currentTarget.value as ProjectData["type"] }));
            }}
          />
        </Field>
        <Field label="Slug">
          <TextInput value={draft.slug} disabled />
        </Field>
        <Field label="Artist Slug">
          <TextInput
            value={draft.artistSlug}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, artistSlug: event.currentTarget.value }));
            }}
          />
        </Field>
        <Field label="Year">
          <TextInput
            type="number"
            value={draft.year ?? ""}
            onChange={(event) => {
              setDirty(true);
              const num = Number(event.currentTarget.value);
              setDraft((prev) => ({ ...prev, year: Number.isFinite(num) ? num : undefined }));
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
      </div>
      <Field label="Description">
        <TextArea
          rows={5}
          value={draft.description ?? ""}
          onChange={(event) => {
            setDirty(true);
            setDraft((prev) => ({ ...prev, description: event.currentTarget.value || undefined }));
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
      <ActionButton
        disabled={saving}
        onClick={async () => {
          await onSave({ ...draft, updatedAt: new Date().toISOString() }, draftContent);
          setDirty(false);
        }}
      >
        {saving ? "Saving..." : "Save Project"}
      </ActionButton>
    </div>
  );
}

