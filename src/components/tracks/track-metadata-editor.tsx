"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { api } from "@/lib/client/api";
import type { TrackMetadataOption } from "@/lib/tracks/types";

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sortOptions(options: TrackMetadataOption[]): TrackMetadataOption[] {
  return [...options].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
}

function buildOptionMap(options: TrackMetadataOption[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.slug, option.name]));
}

function SelectionChips({
  selectedSlugs,
  nameBySlug,
  onRemove,
  emptyLabel
}: {
  selectedSlugs: string[];
  nameBySlug: Record<string, string>;
  onRemove: (slug: string) => void;
  emptyLabel: string;
}) {
  if (selectedSlugs.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedSlugs.map((slug) => (
        <button
          key={slug}
          type="button"
          onClick={() => onRemove(slug)}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] px-3 py-1 text-sm transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]"
        >
          <span className="truncate">{nameBySlug[slug] ?? slug}</span>
          <span aria-hidden className="text-xs">
            x
          </span>
        </button>
      ))}
    </div>
  );
}

function RelationshipField({
  label,
  selectedSlugs,
  options,
  addLabel,
  emptyLabel,
  disabled,
  onChange
}: {
  label: string;
  selectedSlugs: string[];
  options: TrackMetadataOption[];
  addLabel: string;
  emptyLabel: string;
  disabled?: boolean;
  onChange: (nextValue: string[]) => void;
}) {
  const optionNameBySlug = useMemo(() => buildOptionMap(options), [options]);
  const availableOptions = useMemo(
    () => sortOptions(options.filter((option) => !selectedSlugs.includes(option.slug))),
    [options, selectedSlugs]
  );

  return (
    <Field label={label}>
      <div className="grid gap-3">
        <SelectionChips
          selectedSlugs={selectedSlugs}
          nameBySlug={optionNameBySlug}
          onRemove={(slug) => onChange(selectedSlugs.filter((value) => value !== slug))}
          emptyLabel={emptyLabel}
        />
        <select
          className="theme-input ring-0"
          value=""
          disabled={disabled || availableOptions.length === 0}
          onChange={(event) => {
            const nextSlug = event.currentTarget.value;
            if (!nextSlug) {
              return;
            }
            onChange([...selectedSlugs, nextSlug]);
          }}
        >
          <option value="">{availableOptions.length === 0 ? "No more options" : addLabel}</option>
          {availableOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export function TrackMetadataEditor({
  trackSlug,
  initialName,
  initialArtistSlugs,
  initialProjectSlugs,
  initialTagSlugs,
  artistOptions,
  projectOptions,
  tagOptions,
  title,
  description,
  withPanel = true,
  submitLabel = "Save Changes",
  onCancel,
  onSaved
}: {
  trackSlug: string;
  initialName: string;
  initialArtistSlugs: string[];
  initialProjectSlugs: string[];
  initialTagSlugs: string[];
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
  title?: string;
  description?: string;
  withPanel?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  const [savedName, setSavedName] = useState(initialName);
  const [savedArtistSlugs, setSavedArtistSlugs] = useState(initialArtistSlugs);
  const [savedProjectSlugs, setSavedProjectSlugs] = useState(initialProjectSlugs);
  const [savedTagSlugs, setSavedTagSlugs] = useState(initialTagSlugs);
  const [name, setName] = useState(initialName);
  const [artistSlugs, setArtistSlugs] = useState(initialArtistSlugs);
  const [projectSlugs, setProjectSlugs] = useState(initialProjectSlugs);
  const [tagSlugs, setTagSlugs] = useState(initialTagSlugs);
  const [allTagOptions, setAllTagOptions] = useState(tagOptions);
  const [newTagName, setNewTagName] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedName(initialName);
    setSavedArtistSlugs(initialArtistSlugs);
    setSavedProjectSlugs(initialProjectSlugs);
    setSavedTagSlugs(initialTagSlugs);
    setName(initialName);
    setArtistSlugs(initialArtistSlugs);
    setProjectSlugs(initialProjectSlugs);
    setTagSlugs(initialTagSlugs);
  }, [initialArtistSlugs, initialName, initialProjectSlugs, initialTagSlugs, trackSlug]);

  useEffect(() => {
    setAllTagOptions(tagOptions);
  }, [tagOptions]);

  const isDirty =
    name.trim() !== savedName ||
    !arraysEqual(artistSlugs, savedArtistSlugs) ||
    !arraysEqual(projectSlugs, savedProjectSlugs) ||
    !arraysEqual(tagSlugs, savedTagSlugs);

  function resetDraft() {
    setName(savedName);
    setArtistSlugs(savedArtistSlugs);
    setProjectSlugs(savedProjectSlugs);
    setTagSlugs(savedTagSlugs);
    setNewTagName("");
    setErrorMessage(null);
  }

  async function handleCreateTag() {
    setCreatingTag(true);
    setErrorMessage(null);

    try {
      const created = await api.createTag({
        name: newTagName
      });
      const nextOption = { slug: created.slug, name: created.name };
      setAllTagOptions((current) => sortOptions([...current, nextOption]));
      setTagSlugs((current) => (current.includes(created.slug) ? current : [...current, created.slug]));
      setNewTagName("");
      showToast("Tag created. Save changes to link it to this track.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Failed to create tag.";
      setErrorMessage(nextMessage);
      showToast("Failed to create tag.", "error");
    } finally {
      setCreatingTag(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);

    try {
      const trimmedName = name.trim();
      await api.updateTrack(trackSlug, {
        slug: trackSlug,
        name: trimmedName,
        artistSlugs,
        projectSlugs,
        tagSlugs
      });

      setSavedName(trimmedName);
      setSavedArtistSlugs(artistSlugs);
      setSavedProjectSlugs(projectSlugs);
      setSavedTagSlugs(tagSlugs);
      showToast("Track metadata updated.");
      onSaved?.();
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Failed to update track metadata.";
      setErrorMessage(nextMessage);
      showToast("Failed to update track metadata.", "error");
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <div className="grid gap-4">
      {title || description ? (
        <div className="grid gap-1">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {description ? <p className="text-sm text-[color:var(--muted)]">{description}</p> : null}
          <p className="text-sm text-[color:var(--muted)]">{trackSlug}</p>
        </div>
      ) : (
        <p className="text-sm text-[color:var(--muted)]">{trackSlug}</p>
      )}

      <Field label="Track Name">
        <TextInput
          value={name}
          disabled={saving}
          placeholder="Track name"
          onChange={(event) => setName(event.currentTarget.value)}
        />
      </Field>

      <div className="grid gap-4 xl:grid-cols-3">
        <RelationshipField
          label="Artists"
          selectedSlugs={artistSlugs}
          options={artistOptions}
          addLabel="Add artist..."
          emptyLabel="No artists linked."
          disabled={saving}
          onChange={setArtistSlugs}
        />
        <RelationshipField
          label="Projects"
          selectedSlugs={projectSlugs}
          options={projectOptions}
          addLabel="Add project..."
          emptyLabel="No projects linked."
          disabled={saving}
          onChange={setProjectSlugs}
        />
        <div className="grid gap-4">
          <RelationshipField
            label="Tags"
            selectedSlugs={tagSlugs}
            options={allTagOptions}
            addLabel="Add tag..."
            emptyLabel="No tags linked."
            disabled={saving || creatingTag}
            onChange={setTagSlugs}
          />
          <Field label="Create New Tag">
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextInput
                value={newTagName}
                disabled={saving || creatingTag}
                placeholder="New tag name"
                onChange={(event) => setNewTagName(event.currentTarget.value)}
              />
              <ActionButton
                disabled={saving || creatingTag || newTagName.trim().length === 0}
                onClick={handleCreateTag}
              >
                {creatingTag ? "Creating..." : "Create Tag"}
              </ActionButton>
            </div>
          </Field>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <ActionButton tone="ghost" disabled={saving || creatingTag} onClick={onCancel}>
            Cancel
          </ActionButton>
        ) : null}
        <ActionButton tone="ghost" disabled={saving || creatingTag || !isDirty} onClick={resetDraft}>
          Reset
        </ActionButton>
        <ActionButton
          disabled={saving || creatingTag || name.trim().length === 0 || !isDirty}
          onClick={handleSave}
        >
          {saving ? "Saving..." : submitLabel}
        </ActionButton>
      </div>
    </div>
  );

  return withPanel ? <div className="panel p-4">{content}</div> : content;
}
