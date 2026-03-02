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
  const [trackSlugRows, setTrackSlugRows] = useState(value.trackSlugs.join("\n"));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  useUnsavedWarning(dirty);

  useEffect(() => {
    setDraft(value);
    setDraftContent(content);
    setTrackSlugRows(value.trackSlugs.join("\n"));
    setDirty(false);
  }, [value, content]);

  function setTrackOrder(nextTrackSlugs: string[]) {
    setDirty(true);
    setTrackSlugRows(nextTrackSlugs.join("\n"));
    setDraft((prev) => ({ ...prev, trackSlugs: nextTrackSlugs }));
  }

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
      <Field label="Ordered Track Slugs (one per line)">
        <TextArea
          rows={8}
          value={trackSlugRows}
          onChange={(event) => {
            const nextRows = event.currentTarget.value;
            setDirty(true);
            setTrackSlugRows(nextRows);
            setDraft((prev) => ({
              ...prev,
              trackSlugs: nextRows
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
            }));
          }}
        />
      </Field>
      {draft.trackSlugs.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-[color:var(--muted)]">Track Order Preview</p>
          <p className="text-xs text-[color:var(--muted)]">Drag and drop rows to reorder tracks.</p>
          {draft.trackSlugs.map((slug, index) => (
            <div
              key={`${slug}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) {
                  setDragIndex(null);
                  return;
                }
                const next = [...draft.trackSlugs];
                const [dragged] = next.splice(dragIndex, 1);
                next.splice(index, 0, dragged);
                setTrackOrder(next);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                dragIndex === index ? "bg-[#eadcc8]" : "bg-[#f8efe3]"
              }`}
            >
              <span className="text-sm">
                {index + 1}. {slug}
              </span>
              <div className="flex gap-2">
                <ActionButton
                  type="button"
                  tone="ghost"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...draft.trackSlugs];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setTrackOrder(next);
                  }}
                >
                  Up
                </ActionButton>
                <ActionButton
                  type="button"
                  tone="ghost"
                  disabled={index === draft.trackSlugs.length - 1}
                  onClick={() => {
                    const next = [...draft.trackSlugs];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setTrackOrder(next);
                  }}
                >
                  Down
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : null}
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
