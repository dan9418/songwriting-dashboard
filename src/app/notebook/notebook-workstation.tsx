"use client";

import MDEditor from "@uiw/react-md-editor";
import { useEffect, useMemo, useState } from "react";
import { ActionButton, Field, TextArea, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/ui/app-icons";
import { api } from "@/lib/client/api";
import type { NotebookPageListItem, NotebookPageRecord } from "@/lib/domain/models";
import { buildNotebookMarkdown, extractNotebookBody } from "@/lib/notebook/markdown";

type NotebookMode = "readonly" | "edit";

type NotebookDetailsModalState =
  | {
      mode: "create";
      name: string;
      description: string;
      pageType: string;
    }
  | {
      mode: "edit";
      name: string;
      description: string;
      pageType: string;
    }
  | null;

function upsertListItem(
  currentItems: NotebookPageListItem[],
  record: NotebookPageRecord
): NotebookPageListItem[] {
  const nextItem: NotebookPageListItem = {
    slug: record.slug,
    name: record.name,
    description: record.description,
    pageType: record.pageType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };

  const withoutCurrent = currentItems.filter((item) => item.slug !== nextItem.slug);
  return [...withoutCurrent, nextItem].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
  );
}

function createInitialModalState(record?: NotebookPageRecord | null): NotebookDetailsModalState {
  if (!record) {
    return {
      mode: "create",
      name: "",
      description: "",
      pageType: "lyric-fragments"
    };
  }

  return {
    mode: "edit",
    name: record.name,
    description: record.description,
    pageType: record.pageType
  };
}

function NotebookDetailsModal({
  state,
  submitting,
  onClose,
  onSubmit,
  onChange
}: {
  state: NotebookDetailsModalState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: "name" | "description" | "pageType", value: string) => void;
}) {
  if (!state) {
    return null;
  }

  const title = state.mode === "create" ? "Create Notebook Page" : "Edit Page Details";
  const submitLabel =
    state.mode === "create"
      ? submitting
        ? "Creating..."
        : "Create Page"
      : submitting
        ? "Saving..."
        : "Save Details";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8">
      <div className="panel w-full max-w-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {state.mode === "create"
                ? "Create a new notebook page and generate starter markdown with frontmatter."
                : "Update the visible page details and sync them back into the markdown frontmatter."}
            </p>
          </div>
          <ActionButton tone="ghost" disabled={submitting} onClick={onClose}>
            Close
          </ActionButton>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Name">
            <TextInput
              autoFocus
              value={state.name}
              placeholder="Notebook page name"
              onChange={(event) => onChange("name", event.currentTarget.value)}
            />
          </Field>

          <Field label="Description">
            <TextArea
              rows={3}
              value={state.description}
              placeholder="Short description for the page list and header"
              onChange={(event) => onChange("description", event.currentTarget.value)}
            />
          </Field>

          <Field label="Page Type">
            <TextInput
              value={state.pageType}
              placeholder="lyric-fragments"
              onChange={(event) => onChange("pageType", event.currentTarget.value)}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <ActionButton tone="ghost" disabled={submitting} onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={submitting || !state.name.trim() || !state.pageType.trim()} onClick={onSubmit}>
            {submitLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function NotebookWorkstation() {
  const { showToast } = useToast();
  const [pages, setPages] = useState<NotebookPageListItem[]>([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<NotebookPageRecord | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [mode, setMode] = useState<NotebookMode>("readonly");
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const [deletingPage, setDeletingPage] = useState(false);
  const [pageListError, setPageListError] = useState<string | null>(null);
  const [pageDetailError, setPageDetailError] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState<NotebookDetailsModalState>(null);
  const [submittingDetails, setSubmittingDetails] = useState(false);

  const isDirty = useMemo(
    () => Boolean(selectedPage && draftContent !== selectedPage.content),
    [draftContent, selectedPage]
  );

  async function loadPages(preferredSlug?: string | null) {
    setLoadingPages(true);
    setPageListError(null);
    try {
      const nextPages = await api.listNotebookPages();
      setPages(nextPages);

      const candidateSlug =
        preferredSlug ??
        (selectedPageSlug && nextPages.some((item) => item.slug === selectedPageSlug)
          ? selectedPageSlug
          : nextPages[0]?.slug ?? null);

      setSelectedPageSlug(candidateSlug);
      if (!candidateSlug) {
        setSelectedPage(null);
        setDraftContent("");
      }
    } catch (error) {
      setPageListError(error instanceof Error ? error.message : "Failed to load notebook pages.");
    } finally {
      setLoadingPages(false);
    }
  }

  async function loadPage(pageSlug: string) {
    setLoadingPage(true);
    setPageDetailError(null);
    try {
      const record = await api.getNotebookPage(pageSlug);
      setSelectedPage(record);
      setDraftContent(record.content);
    } catch (error) {
      setSelectedPage(null);
      setDraftContent("");
      setPageDetailError(error instanceof Error ? error.message : "Failed to load notebook page.");
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    void loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPageSlug) {
      return;
    }
    void loadPage(selectedPageSlug);
  }, [selectedPageSlug]);

  function canDiscardDraft(): boolean {
    if (!isDirty) {
      return true;
    }
    return window.confirm("Discard unsaved notebook changes?");
  }

  async function handleSaveContent() {
    if (!selectedPage) {
      return;
    }

    setSavingPage(true);
    setPageDetailError(null);
    try {
      const updated = await api.updateNotebookPage(selectedPage.slug, { content: draftContent });
      setSelectedPage(updated);
      setDraftContent(updated.content);
      setPages((currentPages) => upsertListItem(currentPages, updated));
      setMode("readonly");
      showToast("Notebook page saved.");
    } catch (error) {
      setPageDetailError(error instanceof Error ? error.message : "Failed to save notebook page.");
    } finally {
      setSavingPage(false);
    }
  }

  async function handleDeletePage() {
    if (!selectedPage) {
      return;
    }

    if (!window.confirm(`Delete "${selectedPage.name}"?`)) {
      return;
    }

    setDeletingPage(true);
    setPageDetailError(null);
    try {
      await api.deleteNotebookPage(selectedPage.slug);
      const currentIndex = pages.findIndex((page) => page.slug === selectedPage.slug);
      const remainingPages = pages.filter((page) => page.slug !== selectedPage.slug);
      const fallbackPage =
        remainingPages[Math.max(0, currentIndex - 1)] ?? remainingPages[0] ?? null;

      setPages(remainingPages);
      setSelectedPageSlug(fallbackPage?.slug ?? null);
      setSelectedPage(null);
      setDraftContent("");
      setMode("readonly");
      showToast("Notebook page deleted.");
    } catch (error) {
      setPageDetailError(error instanceof Error ? error.message : "Failed to delete notebook page.");
    } finally {
      setDeletingPage(false);
    }
  }

  async function handleSubmitDetails() {
    if (!detailsModal) {
      return;
    }

    setSubmittingDetails(true);
    setPageDetailError(null);
    try {
      if (detailsModal.mode === "create") {
        const created = await api.createNotebookPage({
          name: detailsModal.name,
          description: detailsModal.description,
          pageType: detailsModal.pageType
        });
        setPages((currentPages) => upsertListItem(currentPages, created));
        setSelectedPageSlug(created.slug);
        setSelectedPage(created);
        setDraftContent(created.content);
        setMode("edit");
        setDetailsModal(null);
        showToast("Notebook page created.");
        return;
      }

      if (!selectedPage) {
        return;
      }

      const nextContent = buildNotebookMarkdown(
        {
          name: detailsModal.name,
          description: detailsModal.description,
          pageType: detailsModal.pageType,
          created: selectedPage.createdAt,
          lastModified: selectedPage.updatedAt
        },
        extractNotebookBody(draftContent || selectedPage.content)
      );

      const updated = await api.updateNotebookPage(selectedPage.slug, { content: nextContent });
      setSelectedPage(updated);
      setDraftContent(updated.content);
      setPages((currentPages) => upsertListItem(currentPages, updated));
      setDetailsModal(null);
      showToast("Page details updated.");
    } catch (error) {
      setPageDetailError(
        error instanceof Error ? error.message : "Failed to update notebook page details."
      );
    } finally {
      setSubmittingDetails(false);
    }
  }

  function handleSelectPage(pageSlug: string) {
    if (pageSlug === selectedPageSlug) {
      return;
    }
    if (!canDiscardDraft()) {
      return;
    }
    setMode("readonly");
    setSelectedPageSlug(pageSlug);
  }

  return (
    <>
      <section className="grid gap-4">
        <div className="panel overflow-hidden p-5 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="theme-icon-frame h-12 w-12 shrink-0">
                <AppIcon name="notebook" className="h-6 w-6" />
              </span>
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Notebook
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">Lyrics Workstation</h1>
              </div>
            </div>

            <p className="text-sm text-[color:var(--muted)]">
              Markdown-backed notebook pages stored in Cloudflare D1 and R2.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="panel flex min-h-[38rem] flex-col overflow-hidden">
            <div className="border-b border-[color:var(--border-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Pages</h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    {loadingPages ? "Loading..." : `${pages.length} notebook pages`}
                  </p>
                </div>
                <ActionButton onClick={() => setDetailsModal(createInitialModalState())}>
                  <AppIcon name="plus" className="h-4 w-4" />
                  Add Page
                </ActionButton>
              </div>
            </div>

            {pageListError ? (
              <div className="p-4 text-sm text-red-800">{pageListError}</div>
            ) : null}

            <div className="grid gap-2 overflow-y-auto p-3">
              {!loadingPages && pages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--border-strong)] px-4 py-6 text-sm text-[color:var(--muted)]">
                  No notebook pages yet.
                </div>
              ) : null}

              {pages.map((page) => {
                const isActive = page.slug === selectedPageSlug;

                return (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => handleSelectPage(page.slug)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_10px_24px_rgba(31,48,78,0.12)]"
                        : "border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--bg-panel)]"
                    }`}
                  >
                    <h3 className="truncate text-base font-semibold">{page.name}</h3>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="panel min-h-[38rem] overflow-hidden">
            {selectedPage ? (
              <div className="grid h-full grid-rows-[auto_1fr]">
                <div className="border-b border-[color:var(--border-soft)] p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3">
                        <span className="theme-icon-frame h-12 w-12 shrink-0">
                          <AppIcon name="note" className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            Notebook Page
                          </p>
                          <h2 className="text-2xl font-semibold md:text-3xl">{selectedPage.name}</h2>
                        </div>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                        {selectedPage.description}
                      </p>
                      {isDirty ? (
                        <p className="text-sm font-medium text-[color:var(--accent)]">Unsaved changes</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex overflow-hidden rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] p-1">
                        <button
                          type="button"
                          onClick={() => setMode("readonly")}
                          className={`rounded-md px-3 py-2 text-sm transition ${
                            mode === "readonly"
                              ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                              : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]"
                          }`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode("edit")}
                          className={`rounded-md px-3 py-2 text-sm transition ${
                            mode === "edit"
                              ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                              : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]"
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                      <ActionButton
                        tone="ghost"
                        onClick={() => setDetailsModal(createInitialModalState(selectedPage))}
                      >
                        <AppIcon name="pencil" className="h-4 w-4" />
                        Edit
                      </ActionButton>
                      <ActionButton tone="danger" disabled={deletingPage} onClick={handleDeletePage}>
                        <AppIcon name="trash" className="h-4 w-4" />
                        {deletingPage ? "Deleting..." : "Delete"}
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-5">
                  {pageDetailError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {pageDetailError}
                    </div>
                  ) : null}

                  {loadingPage ? (
                    <div className="rounded-2xl border border-[color:var(--border-soft)] px-4 py-8 text-sm text-[color:var(--muted)]">
                      Loading page...
                    </div>
                  ) : (
                    <div
                      data-color-mode="light"
                      className="min-h-[24rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-white"
                    >
                      {mode === "readonly" ? (
                        <div className="p-5">
                          <MDEditor.Markdown
                            source={
                              extractNotebookBody(draftContent).trim().length > 0
                                ? extractNotebookBody(draftContent)
                                : "_No content yet._"
                            }
                            style={{ backgroundColor: "transparent", padding: 0 }}
                          />
                        </div>
                      ) : (
                        <MDEditor
                          value={draftContent}
                          onChange={(nextValue) => setDraftContent(nextValue ?? "")}
                          preview="live"
                          height={600}
                        />
                      )}
                    </div>
                  )}

                  {mode === "edit" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-[color:var(--muted)]">
                        Save writes the markdown page to R2 and syncs frontmatter metadata back to D1.
                      </p>
                      <div className="flex gap-2">
                        <ActionButton
                          tone="ghost"
                          disabled={savingPage || !selectedPage || !isDirty}
                          onClick={() => setDraftContent(selectedPage.content)}
                        >
                          Revert
                        </ActionButton>
                        <ActionButton disabled={savingPage || !isDirty} onClick={handleSaveContent}>
                          {savingPage ? "Saving..." : "Save Changes"}
                        </ActionButton>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-[color:var(--muted)]">
                {loadingPages ? "Loading notebook..." : "Select a notebook page to begin."}
              </div>
            )}
          </div>
        </div>
      </section>

      <NotebookDetailsModal
        state={detailsModal}
        submitting={submittingDetails}
        onClose={() => setDetailsModal(null)}
        onSubmit={() => {
          void handleSubmitDetails();
        }}
        onChange={(field, value) =>
          setDetailsModal((currentState) =>
            currentState
              ? {
                  ...currentState,
                  [field]: value
                }
              : currentState
          )
        }
      />
    </>
  );
}
