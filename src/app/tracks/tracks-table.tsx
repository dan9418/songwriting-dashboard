"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TrackQuickEditModal } from "@/components/tracks/track-quick-edit-modal";
import { ModalShell } from "@/components/ui/modal-shell";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import {
  DEFAULT_TRACK_QUERY_STATE,
  TRACK_QUERY_UNASSIGNED_VALUE,
  buildTrackQuerySearchParams,
  equalTrackQueryState,
  filterAndSortTracks,
  parseTrackQueryState,
  updateTrackQueryState,
  type TrackQueryState,
  type TrackSortKey
} from "@/lib/tracks/query";
import {
  EMPTY_SLUG_DELTA,
  hasBulkMetadataChanges,
  type TrackBulkMetadataOperation
} from "@/lib/tracks/bulk";
import type { TrackMetadataOption } from "@/lib/tracks/types";

export interface TracksTableItem {
  slug: string;
  name: string;
  projects: TrackMetadataOption[];
  artists: TrackMetadataOption[];
  tags: TrackMetadataOption[];
  hasNotes: boolean;
  audioCount: number;
}

type TrackQueryStateUpdater =
  | Partial<TrackQueryState>
  | ((current: TrackQueryState) => TrackQueryState);

interface DualSelectionFieldProps {
  label: string;
  options: TrackMetadataOption[];
  positiveLabel: string;
  negativeLabel: string;
  positiveValues: string[];
  negativeValues: string[];
  disabled?: boolean;
  leadingContent?: ReactNode;
  footerContent?: ReactNode;
  onPositiveChange: (nextValue: string[]) => void;
  onNegativeChange: (nextValue: string[]) => void;
}

function truncateLabel(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function sortOptions(options: TrackMetadataOption[]): TrackMetadataOption[] {
  return [...options].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
}

function createNameMap(options: TrackMetadataOption[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.slug, option.name]));
}

function withUnassignedOption(options: TrackMetadataOption[]): TrackMetadataOption[] {
  return [{ slug: TRACK_QUERY_UNASSIGNED_VALUE, name: "Unassigned" }, ...options];
}

function removeValue(values: string[], slug: string): string[] {
  return values.filter((value) => value !== slug);
}

function addValue(values: string[], slug: string): string[] {
  return values.includes(slug) ? values : [...values, slug];
}

function buildSelectionPrompt(actionLabel: string, itemLabel: string, hasOptions: boolean) {
  if (!hasOptions) {
    return "No more options";
  }

  return `Select ${itemLabel.toLocaleLowerCase()} to ${actionLabel.toLocaleLowerCase()}...`;
}

function SlugChipList({
  values,
  options,
  emptyLabel,
  onRemove
}: {
  values: string[];
  options: TrackMetadataOption[];
  emptyLabel: string;
  onRemove: (slug: string) => void;
}) {
  const nameBySlug = useMemo(() => createNameMap(options), [options]);

  if (values.length === 0) {
    return <p className="text-xs text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((slug) => (
        <button
          key={slug}
          type="button"
          onClick={() => onRemove(slug)}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]"
        >
          <span className="truncate">{nameBySlug[slug] ?? slug}</span>
          <span aria-hidden>x</span>
        </button>
      ))}
    </div>
  );
}

function DualSelectionField({
  label,
  options,
  positiveLabel,
  negativeLabel,
  positiveValues,
  negativeValues,
  disabled,
  leadingContent,
  footerContent,
  onPositiveChange,
  onNegativeChange
}: DualSelectionFieldProps) {
  const availablePositiveOptions = useMemo(
    () => sortOptions(options.filter((option) => !positiveValues.includes(option.slug))),
    [options, positiveValues]
  );
  const availableNegativeOptions = useMemo(
    () => sortOptions(options.filter((option) => !negativeValues.includes(option.slug))),
    [options, negativeValues]
  );

  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <div className="grid gap-3">
        {leadingContent}
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            {positiveLabel}
          </p>
          <SlugChipList
            values={positiveValues}
            options={options}
            emptyLabel={`No ${positiveLabel.toLocaleLowerCase()} selections.`}
            onRemove={(slug) => onPositiveChange(removeValue(positiveValues, slug))}
          />
          <select
            className="theme-input ring-0"
            value=""
            disabled={disabled || availablePositiveOptions.length === 0}
            onChange={(event) => {
              const slug = event.currentTarget.value;
              if (!slug) {
                return;
              }
              onPositiveChange(addValue(positiveValues, slug));
              onNegativeChange(removeValue(negativeValues, slug));
            }}
          >
            <option value="">{buildSelectionPrompt(positiveLabel, label, availablePositiveOptions.length > 0)}</option>
            {availablePositiveOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            {negativeLabel}
          </p>
          <SlugChipList
            values={negativeValues}
            options={options}
            emptyLabel={`No ${negativeLabel.toLocaleLowerCase()} selections.`}
            onRemove={(slug) => onNegativeChange(removeValue(negativeValues, slug))}
          />
          <select
            className="theme-input ring-0"
            value=""
            disabled={disabled || availableNegativeOptions.length === 0}
            onChange={(event) => {
              const slug = event.currentTarget.value;
              if (!slug) {
                return;
              }
              onNegativeChange(addValue(negativeValues, slug));
              onPositiveChange(removeValue(positiveValues, slug));
            }}
          >
            <option value="">{buildSelectionPrompt(negativeLabel, label, availableNegativeOptions.length > 0)}</option>
            {availableNegativeOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        {footerContent}
      </div>
    </div>
  );
}

function MetadataLinks({
  items,
  hrefBase,
  emptyLabel = "-",
  charLimit = 24,
  wrap = false
}: {
  items: TrackMetadataOption[];
  hrefBase: string;
  emptyLabel?: string;
  charLimit?: number;
  wrap?: boolean;
}) {
  if (items.length === 0) {
    return <span className="text-[color:var(--muted)]">{emptyLabel}</span>;
  }

  return (
    <span
      className={`inline-flex min-w-0 items-center ${
        wrap ? "flex-wrap whitespace-normal" : "overflow-hidden whitespace-nowrap"
      }`}
    >
      {items.map((item, index) => (
        <span key={item.slug} className="shrink-0">
          {index > 0 ? <span className="text-[color:var(--muted)]">, </span> : null}
          <Link href={`${hrefBase}/${item.slug}`} className="underline-offset-4 hover:underline">
            {truncateLabel(item.name, charLimit)}
          </Link>
        </span>
      ))}
    </span>
  );
}

function SortableHeader({
  label,
  sortKey,
  queryState,
  onSort
}: {
  label: string;
  sortKey: TrackSortKey;
  queryState: TrackQueryState;
  onSort: (sortKey: TrackSortKey) => void;
}) {
  const isActive = queryState.sortKey === sortKey;
  const indicator = !isActive ? "-" : queryState.sortDirection === "asc" ? "^" : "v";

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left transition hover:text-[color:var(--ink)]"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span aria-hidden className="text-[10px]">
        {indicator}
      </span>
    </button>
  );
}

function createEmptyBulkDraft(): Pick<TrackBulkMetadataOperation, "artists" | "projects" | "tags"> {
  return {
    artists: { ...EMPTY_SLUG_DELTA },
    projects: { ...EMPTY_SLUG_DELTA },
    tags: { ...EMPTY_SLUG_DELTA }
  };
}

function BulkEditDialog({
  selectedCount,
  draft,
  artistOptions,
  projectOptions,
  tagOptions,
  saving,
  onClose,
  onSubmit,
  onTagCreated,
  onChange
}: {
  selectedCount: number;
  draft: Pick<TrackBulkMetadataOperation, "artists" | "projects" | "tags">;
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTagCreated: (tag: TrackMetadataOption) => void;
  onChange: Dispatch<SetStateAction<Pick<TrackBulkMetadataOperation, "artists" | "projects" | "tags">>>;
}) {
  const { showToast } = useToast();
  const hasChanges = hasBulkMetadataChanges({
    trackSlugs: ["placeholder"],
    ...draft
  });
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreateTag() {
    setCreatingTag(true);
    setErrorMessage(null);

    try {
      const created = await api.createTag({
        name: newTagName
      });
      const nextTag = { slug: created.slug, name: created.name };
      onTagCreated(nextTag);
      onChange((current) => ({
        ...current,
        tags: {
          add: addValue(current.tags.add, created.slug),
          remove: removeValue(current.tags.remove, created.slug)
        }
      }));
      setNewTagName("");
      showToast("Tag created and added to the bulk update.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Failed to create tag.";
      setErrorMessage(nextMessage);
      showToast("Failed to create tag.", "error");
    } finally {
      setCreatingTag(false);
    }
  }

  return (
    <ModalShell
      title="Bulk Track Metadata"
      description={`Apply add/remove changes to ${selectedCount.toLocaleString()} selected tracks.`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton tone="ghost" disabled={saving || creatingTag} onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={saving || creatingTag || !hasChanges} onClick={onSubmit}>
            {saving ? "Applying..." : "Apply Changes"}
          </ActionButton>
        </div>
      }
    >
      <div className="grid gap-4">
        <DualSelectionField
          label="Artists"
          options={artistOptions}
          positiveLabel="Add"
          negativeLabel="Remove"
          positiveValues={draft.artists.add}
          negativeValues={draft.artists.remove}
          disabled={saving}
          onPositiveChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              artists: {
                ...current.artists,
                add: nextValue
              }
            }))
          }
          onNegativeChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              artists: {
                ...current.artists,
                remove: nextValue
              }
            }))
          }
        />
        <DualSelectionField
          label="Projects"
          options={projectOptions}
          positiveLabel="Add"
          negativeLabel="Remove"
          positiveValues={draft.projects.add}
          negativeValues={draft.projects.remove}
          disabled={saving}
          onPositiveChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              projects: {
                ...current.projects,
                add: nextValue
              }
            }))
          }
          onNegativeChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              projects: {
                ...current.projects,
                remove: nextValue
              }
            }))
          }
        />
        <DualSelectionField
          label="Tags"
          options={tagOptions}
          positiveLabel="ADD"
          negativeLabel="REMOVE"
          positiveValues={draft.tags.add}
          negativeValues={draft.tags.remove}
          disabled={saving}
          onPositiveChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              tags: {
                ...current.tags,
                add: nextValue
              }
            }))
          }
          onNegativeChange={(nextValue) =>
            onChange((current) => ({
              ...current,
              tags: {
                ...current.tags,
                remove: nextValue
              }
            }))
          }
          leadingContent={
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                CREATE
              </p>
              <div className="grid gap-2">
                <TextInput
                  value={newTagName}
                  disabled={saving || creatingTag}
                  placeholder="New tag name"
                  onChange={(event) => setNewTagName(event.currentTarget.value)}
                />
                <ActionButton
                  className="justify-center sm:self-start"
                  disabled={saving || creatingTag || newTagName.trim().length === 0}
                  onClick={() => void handleCreateTag()}
                >
                  {creatingTag ? "Creating..." : "Create Tag"}
                </ActionButton>
              </div>
            </div>
          }
        />
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
        ) : null}
      </div>
    </ModalShell>
  );
}

export function TracksTable({
  items,
  artistOptions,
  projectOptions,
  tagOptions
}: {
  items: TracksTableItem[];
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const urlQueryState = useMemo(
    () => parseTrackQueryState(new URLSearchParams(searchParamsString)),
    [searchParamsString]
  );
  const [draftQueryState, setDraftQueryState] = useState<TrackQueryState>(urlQueryState);
  const [selectedTrackSlugs, setSelectedTrackSlugs] = useState<string[]>([]);
  const [editingTrackSlug, setEditingTrackSlug] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDraft, setBulkDraft] =
    useState<Pick<TrackBulkMetadataOperation, "artists" | "projects" | "tags">>(createEmptyBulkDraft);
  const [allTagOptions, setAllTagOptions] = useState(tagOptions);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const draftQueryStateRef = useRef(draftQueryState);

  const filteredItems = useMemo(() => filterAndSortTracks(items, draftQueryState), [items, draftQueryState]);
  const queryArtistOptions = useMemo(() => withUnassignedOption(artistOptions), [artistOptions]);
  const queryProjectOptions = useMemo(() => withUnassignedOption(projectOptions), [projectOptions]);
  const queryTagOptions = useMemo(() => withUnassignedOption(allTagOptions), [allTagOptions]);
  const filteredTrackSlugs = useMemo(() => filteredItems.map((item) => item.slug), [filteredItems]);
  const selectedSet = useMemo(() => new Set(selectedTrackSlugs), [selectedTrackSlugs]);
  const filteredSelectedCount = filteredTrackSlugs.filter((slug) => selectedSet.has(slug)).length;
  const isAllFilteredSelected = filteredItems.length > 0 && filteredSelectedCount === filteredItems.length;
  const isPartiallySelected =
    filteredSelectedCount > 0 && filteredSelectedCount < filteredItems.length;
  const editingItem = editingTrackSlug ? items.find((item) => item.slug === editingTrackSlug) ?? null : null;

  useEffect(() => {
    if (!selectAllRef.current) {
      return;
    }
    selectAllRef.current.indeterminate = isPartiallySelected;
  }, [isPartiallySelected]);

  useEffect(() => {
    const availableTrackSlugs = new Set(items.map((item) => item.slug));
    setSelectedTrackSlugs((current) => current.filter((trackSlug) => availableTrackSlugs.has(trackSlug)));
  }, [items]);

  useEffect(() => {
    setAllTagOptions(tagOptions);
  }, [tagOptions]);

  useEffect(() => {
    setDraftQueryState((current) => (equalTrackQueryState(current, urlQueryState) ? current : urlQueryState));
  }, [urlQueryState]);

  useEffect(() => {
    draftQueryStateRef.current = draftQueryState;
  }, [draftQueryState]);

  const updateUrlState = useCallback((nextState: TrackQueryState) => {
    const nextSearchParams = buildTrackQuerySearchParams(nextState);
    const nextSearch = nextSearchParams.toString();

    startTransition(() => {
      router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
    });
  }, [pathname, router, startTransition]);

  function patchQueryState(
    patch: TrackQueryStateUpdater,
    options?: { debounceTitle?: boolean }
  ) {
    const currentState = draftQueryStateRef.current;
    const nextState =
      typeof patch === "function" ? patch(currentState) : updateTrackQueryState(currentState, patch);
    draftQueryStateRef.current = nextState;
    setDraftQueryState(nextState);

    if (options?.debounceTitle) {
      return;
    }

    updateUrlState(nextState);
  }

  useEffect(() => {
    if (draftQueryState.title === urlQueryState.title) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateUrlState(draftQueryState);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftQueryState, updateUrlState, urlQueryState]);

  function toggleTrackSelection(trackSlug: string) {
    setSelectedTrackSlugs((current) =>
      current.includes(trackSlug) ? current.filter((value) => value !== trackSlug) : [...current, trackSlug]
    );
  }

  function toggleSelectAll() {
    setSelectedTrackSlugs((current) => {
      if (isAllFilteredSelected) {
        return current.filter((slug) => !filteredTrackSlugs.includes(slug));
      }
      const next = new Set(current);
      for (const slug of filteredTrackSlugs) {
        next.add(slug);
      }
      return Array.from(next);
    });
  }

  async function applyBulkChanges() {
    const payload: TrackBulkMetadataOperation = {
      trackSlugs: selectedTrackSlugs,
      ...bulkDraft
    };

    if (!hasBulkMetadataChanges(payload)) {
      return;
    }

    setBulkSaving(true);

    try {
      await api.bulkUpdateTracks(payload);
      showToast(`Updated ${selectedTrackSlugs.length.toLocaleString()} tracks.`);
      setBulkOpen(false);
      setBulkDraft(createEmptyBulkDraft());
      setSelectedTrackSlugs([]);
      router.refresh();
    } catch {
      showToast("Failed to apply bulk metadata changes.", "error");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="panel p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 lg:min-w-[22rem] lg:flex-1">
              <Field label="Title Search">
                <TextInput
                  value={draftQueryState.title}
                  placeholder="Filter by track title"
                  onChange={(event) =>
                    patchQueryState({ title: event.currentTarget.value }, { debounceTitle: true })
                  }
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex overflow-hidden rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] p-1">
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    draftQueryState.matchMode === "all"
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                      : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]"
                  }`}
                  onClick={() => patchQueryState({ matchMode: "all" })}
                >
                  Match All
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    draftQueryState.matchMode === "any"
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                      : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]"
                  }`}
                  onClick={() => patchQueryState({ matchMode: "any" })}
                >
                  Match Any
                </button>
              </div>

              <ActionButton
                tone="ghost"
                onClick={() => {
                  setDraftQueryState(DEFAULT_TRACK_QUERY_STATE);
                  updateUrlState(DEFAULT_TRACK_QUERY_STATE);
                }}
              >
                Clear Filters
              </ActionButton>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <DualSelectionField
              label="Artists"
              options={queryArtistOptions}
              positiveLabel="Include"
              negativeLabel="Exclude"
              positiveValues={draftQueryState.artistInclude}
              negativeValues={draftQueryState.artistExclude}
              onPositiveChange={(nextValue) => patchQueryState({ artistInclude: nextValue })}
              onNegativeChange={(nextValue) => patchQueryState({ artistExclude: nextValue })}
            />
            <DualSelectionField
              label="Projects"
              options={queryProjectOptions}
              positiveLabel="Include"
              negativeLabel="Exclude"
              positiveValues={draftQueryState.projectInclude}
              negativeValues={draftQueryState.projectExclude}
              onPositiveChange={(nextValue) => patchQueryState({ projectInclude: nextValue })}
              onNegativeChange={(nextValue) => patchQueryState({ projectExclude: nextValue })}
            />
            <DualSelectionField
              label="Tags"
              options={queryTagOptions}
              positiveLabel="Include"
              negativeLabel="Exclude"
              positiveValues={draftQueryState.tagInclude}
              negativeValues={draftQueryState.tagExclude}
              onPositiveChange={(nextValue) => patchQueryState({ tagInclude: nextValue })}
              onNegativeChange={(nextValue) => patchQueryState({ tagExclude: nextValue })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
            <p>
              Showing {filteredItems.length.toLocaleString()} of {items.length.toLocaleString()} tracks
            </p>
            <p>
              Selected {selectedTrackSlugs.length.toLocaleString()}
              {filteredSelectedCount > 0 ? ` (${filteredSelectedCount.toLocaleString()} visible)` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="theme-table tracks-table text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.12em]">
                <th className="w-12 px-2 py-1.5 font-semibold">
                  <div className="flex items-center justify-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      disabled={filteredItems.length === 0}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="min-w-[16rem] px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="min-w-[9rem] px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Projects"
                    sortKey="projects"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="min-w-[9rem] px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Artists"
                    sortKey="artists"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="min-w-[7rem] px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Tags"
                    sortKey="tags"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="w-16 px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Notes"
                    sortKey="notes"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="w-16 px-2 py-1.5 font-semibold">
                  <SortableHeader
                    label="Audio"
                    sortKey="audio"
                    queryState={draftQueryState}
                    onSort={(sortKey) =>
                      patchQueryState({
                        sortKey,
                        sortDirection:
                          draftQueryState.sortKey === sortKey && draftQueryState.sortDirection === "asc"
                            ? "desc"
                            : "asc"
                      })
                    }
                  />
                </th>
                <th className="w-12 px-2 py-1.5 text-center font-semibold">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center text-[color:var(--ink)] transition hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedTrackSlugs.length === 0}
                    aria-label="Bulk edit selected tracks"
                    onClick={() => {
                      setBulkDraft(createEmptyBulkDraft());
                      setBulkOpen(true);
                    }}
                  >
                    <AppIcon name="pencil" className="h-4 w-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isSelected = selectedSet.has(item.slug);

                return (
                  <tr key={item.slug} id={item.slug} data-selected={isSelected ? "true" : "false"}>
                    <td className="px-2 py-1.5 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTrackSelection(item.slug)}
                          aria-label={`Select ${item.name}`}
                        />
                      </div>
                    </td>
                    <td className="max-w-0 px-2 py-1.5 align-middle">
                      <div className="overflow-hidden">
                        <Link
                          href={`/tracks/${item.slug}`}
                          className="inline-block max-w-full truncate font-medium underline-offset-4 hover:underline"
                        >
                          {truncateLabel(item.name, 36)}
                        </Link>
                      </div>
                    </td>
                    <td className="max-w-[9rem] px-2 py-1.5 align-middle whitespace-nowrap">
                      <MetadataLinks items={item.projects} hrefBase="/projects" charLimit={18} />
                    </td>
                    <td className="max-w-[9rem] px-2 py-1.5 align-middle whitespace-nowrap">
                      <MetadataLinks items={item.artists} hrefBase="/artists" charLimit={18} />
                    </td>
                    <td className="max-w-[7rem] px-2 py-1.5 align-middle whitespace-normal">
                      <MetadataLinks items={item.tags} hrefBase="/tags" charLimit={14} wrap />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-middle">{item.hasNotes ? "\u2713" : "-"}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-middle">{truncateLabel(String(item.audioCount), 4)}</td>
                    <td className="px-2 py-1.5 align-middle text-center">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-1 text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--accent)]"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setEditingTrackSlug(item.slug)}
                      >
                        <AppIcon name="pencil" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 ? (
          <p className="px-4 py-4 text-sm text-[color:var(--muted)]">No tracks match the current query.</p>
        ) : null}
      </div>

      {editingItem ? (
        <TrackQuickEditModal
          trackSlug={editingItem.slug}
          showAudio
          artistOptions={artistOptions}
          projectOptions={projectOptions}
          tagOptions={allTagOptions}
          onClose={() => setEditingTrackSlug(null)}
          onSaved={() => setEditingTrackSlug(null)}
        />
      ) : null}

      {bulkOpen ? (
        <BulkEditDialog
          selectedCount={selectedTrackSlugs.length}
          draft={bulkDraft}
          artistOptions={artistOptions}
          projectOptions={projectOptions}
          tagOptions={allTagOptions}
          saving={bulkSaving}
          onClose={() => setBulkOpen(false)}
          onSubmit={() => void applyBulkChanges()}
          onTagCreated={(tag) =>
            setAllTagOptions((current) =>
              sortOptions(current.some((option) => option.slug === tag.slug) ? current : [...current, tag])
            )
          }
          onChange={setBulkDraft}
        />
      ) : null}
    </div>
  );
}
