"use client";

import { useEffect, useState } from "react";
import { ActionButton, Field, PillInput, TextArea, TextInput } from "@/components/ui/form-controls";
import { useUnsavedWarning } from "@/lib/client/use-unsaved-warning";
import type { FragmentData } from "@/lib/client/types";

interface FragmentEditorProps {
  value: FragmentData;
  content: string;
  onSave: (next: FragmentData, content: string) => Promise<void>;
  saving?: boolean;
}

export function FragmentEditor({ value, content, onSave, saving }: FragmentEditorProps) {
  const [draft, setDraft] = useState(value);
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
        <Field label="Mood">
          <TextInput
            value={draft.mood ?? ""}
            onChange={(event) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, mood: event.currentTarget.value || undefined }));
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
        <Field label="Related Tracks">
          <PillInput
            value={draft.relatedTrackSlugs}
            onChange={(relatedTrackSlugs) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, relatedTrackSlugs }));
            }}
          />
        </Field>
      </div>
      <Field label="Fragment Text">
        <TextArea
          rows={8}
          value={draft.text}
          onChange={(event) => {
            setDirty(true);
            setDraft((prev) => ({ ...prev, text: event.currentTarget.value }));
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
        {saving ? "Saving..." : "Save Changes"}
      </ActionButton>
    </div>
  );
}

