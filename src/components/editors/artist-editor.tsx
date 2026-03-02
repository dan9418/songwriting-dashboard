"use client";

import { useEffect, useState } from "react";
import { ActionButton, Field, PillInput, TextArea, TextInput } from "@/components/ui/form-controls";
import { useUnsavedWarning } from "@/lib/client/use-unsaved-warning";
import type { ArtistData } from "@/lib/client/types";

interface ArtistEditorProps {
  value: ArtistData;
  content: string;
  onSave: (next: ArtistData, content: string) => Promise<void>;
  saving?: boolean;
}

export function ArtistEditor({ value, content, onSave, saving }: ArtistEditorProps) {
  const [draft, setDraft] = useState<ArtistData>(value);
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
        <Field label="Slug">
          <TextInput value={draft.slug} disabled />
        </Field>
        <Field label="Aliases">
          <PillInput
            value={draft.aliases}
            onChange={(aliases) => {
              setDirty(true);
              setDraft((prev) => ({ ...prev, aliases }));
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
      <Field label="Bio">
        <TextArea
          rows={5}
          value={draft.bio ?? ""}
          onChange={(event) => {
            setDirty(true);
            setDraft((prev) => ({ ...prev, bio: event.currentTarget.value || undefined }));
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
        {saving ? "Saving..." : "Save Artist"}
      </ActionButton>
    </div>
  );
}

