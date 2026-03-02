"use client";

import Link from "next/link";
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  useUnsavedWarning(dirty);

  useEffect(() => {
    setDraft(value);
    setDraftContent(content);
    setDirty(false);
  }, [value, content]);

  function setTrackOrder(nextTrackSlugs: string[]) {
    setDirty(true);
    setDraft((prev) => ({ ...prev, trackSlugs: nextTrackSlugs }));
  }

  function setTrackSlugAt(index: number, nextSlug: string) {
    const next = [...draft.trackSlugs];
    next[index] = nextSlug;
    setTrackOrder(next);
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
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[color:var(--muted)]">Ordered Track Slugs</p>
          <ActionButton
            type="button"
            tone="ghost"
            onClick={() => setTrackOrder([...draft.trackSlugs, ""])}
          >
            Add Track
          </ActionButton>
        </div>
        <p className="text-xs text-[color:var(--muted)]">
          Edit slugs inline. Drag rows or use Up/Down to reorder.
        </p>
        {draft.trackSlugs.length === 0 ? (
          <p className="rounded-lg bg-[#f8efe3] px-3 py-2 text-sm text-[color:var(--muted)]">
            No tracks in this project yet.
          </p>
        ) : null}
        {draft.trackSlugs.map((slug, index) => (
          <div
            key={`${index}-${slug}`}
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
            className={`grid gap-2 rounded-lg px-3 py-2 ${
              dragIndex === index ? "bg-[#d8e3ff]" : "bg-[#f8efe3]"
            }`}
          >
            <div className="grid items-center gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="text-sm text-[color:var(--muted)]">{index + 1}.</span>
              <TextInput
                value={slug}
                placeholder="track-slug"
                onChange={(event) => setTrackSlugAt(index, event.currentTarget.value)}
              />
              <ActionButton
                type="button"
                tone="danger"
                onClick={() => {
                  const next = draft.trackSlugs.filter((_, i) => i !== index);
                  setTrackOrder(next);
                }}
              >
                Remove
              </ActionButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {slug.trim() ? (
                <Link
                  href={`/tracks/${slug.trim()}?from=archive&artist=${draft.artistSlug}&project=${draft.slug}&track=${slug.trim()}`}
                  className="rounded-lg bg-[#d8e3ff] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#c8d8ff]"
                >
                  Open
                </Link>
              ) : null}
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
