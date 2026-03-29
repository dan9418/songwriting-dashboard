"use client";

import MDEditor from "@uiw/react-md-editor";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/ui/app-icons";
import type { NotebookSamplePage } from "@/app/notebook/notebook-sample-pages";

type NotebookMode = "readonly" | "edit";

interface NotebookPageMetadata {
  name: string;
  description: string;
  created: string;
  lastModified: string;
}

interface ParsedNotebookPage extends NotebookSamplePage {
  metadata: NotebookPageMetadata;
  body: string;
  parseError: string | null;
}

const DEFAULT_PAGE_DESCRIPTION = "Fresh notebook page for lyric fragments, lists, and markdown headings.";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "untitled-page";
}

function buildRawPage(metadata: NotebookPageMetadata, body: string): string {
  return `---
name: ${metadata.name}
description: ${metadata.description}
created: ${metadata.created}
last_modified: ${metadata.lastModified}
---

${body}`.trim();
}

function parseNotebookPage(page: NotebookSamplePage): ParsedNotebookPage {
  const normalized = page.rawContent.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return {
      ...page,
      metadata: {
        name: page.fileName.replace(/\.md$/, ""),
        description: "Notebook page is missing frontmatter metadata.",
        created: "",
        lastModified: ""
      },
      body: normalized,
      parseError: "Missing frontmatter block."
    };
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex < 0) {
    return {
      ...page,
      metadata: {
        name: page.fileName.replace(/\.md$/, ""),
        description: "Notebook page frontmatter could not be parsed.",
        created: "",
        lastModified: ""
      },
      body: normalized,
      parseError: "Frontmatter block is not closed."
    };
  }

  const rawFrontmatter = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5);
  const fields = new Map<string, string>();

  for (const line of rawFrontmatter.split("\n")) {
    const dividerIndex = line.indexOf(":");
    if (dividerIndex < 0) {
      continue;
    }
    const key = line.slice(0, dividerIndex).trim();
    const value = line.slice(dividerIndex + 1).trim();
    fields.set(key, value);
  }

  return {
    ...page,
    metadata: {
      name: fields.get("name") ?? page.fileName.replace(/\.md$/, ""),
      description: fields.get("description") ?? "",
      created: fields.get("created") ?? "",
      lastModified: fields.get("last_modified") ?? ""
    },
    body,
    parseError: null
  };
}

export function NotebookWorkstation({ initialPages }: { initialPages: NotebookSamplePage[] }) {
  const [pages, setPages] = useState(initialPages);
  const [selectedPageId, setSelectedPageId] = useState(initialPages[0]?.id ?? null);
  const [mode, setMode] = useState<NotebookMode>("readonly");
  const { showToast } = useToast();

  const parsedPages = useMemo(() => pages.map(parseNotebookPage), [pages]);
  const selectedPage =
    parsedPages.find((page) => page.id === selectedPageId) ?? parsedPages[0] ?? null;

  function updateSelectedPageRawContent(nextRawContent: string) {
    if (!selectedPage) {
      return;
    }

    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === selectedPage.id
          ? {
              ...page,
              rawContent: nextRawContent
            }
          : page
      )
    );
  }

  function handleAddPage() {
    const stamp = new Date().toISOString();
    const nextIndex = pages.length + 1;
    const name = `New Page ${nextIndex}`;
    const newPage: NotebookSamplePage = {
      id: `mock-page-${Date.now()}`,
      fileName: `${slugify(name)}.md`,
      rawContent: buildRawPage(
        {
          name,
          description: DEFAULT_PAGE_DESCRIPTION,
          created: stamp,
          lastModified: stamp
        },
        "# Untitled\n\n- Capture a new lyric fragment here"
      )
    };

    setPages((currentPages) => [...currentPages, newPage]);
    setSelectedPageId(newPage.id);
    setMode("edit");
    showToast("Mock page added. Changes reset on refresh.");
  }

  function handleRenamePage() {
    if (!selectedPage) {
      return;
    }
    const nextName = window.prompt("Rename notebook page", selectedPage.metadata.name)?.trim();
    if (!nextName) {
      return;
    }

    const nextRawContent = buildRawPage(
      {
        ...selectedPage.metadata,
        name: nextName,
        lastModified: new Date().toISOString()
      },
      selectedPage.body
    );

    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === selectedPage.id
          ? {
              ...page,
              fileName: `${slugify(nextName)}.md`,
              rawContent: nextRawContent
            }
          : page
      )
    );
    showToast("Mock page renamed. Changes reset on refresh.");
  }

  function handleDeletePage() {
    if (!selectedPage) {
      return;
    }

    if (pages.length === 1) {
      showToast("Keep at least one page in the notebook mock.", "error");
      return;
    }

    if (!window.confirm(`Delete "${selectedPage.metadata.name}" from this notebook mock?`)) {
      return;
    }

    const selectedIndex = parsedPages.findIndex((page) => page.id === selectedPage.id);
    const nextPages = pages.filter((page) => page.id !== selectedPage.id);
    const fallbackPage = nextPages[Math.max(0, selectedIndex - 1)] ?? nextPages[0] ?? null;

    setPages(nextPages);
    setSelectedPageId(fallbackPage?.id ?? null);
    setMode("readonly");
    showToast("Mock page deleted. Changes reset on refresh.");
  }

  return (
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
            Mock interactions only. Changes reset on refresh.
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
                  {parsedPages.length} mocked markdown files
                </p>
              </div>
              <ActionButton onClick={handleAddPage}>
                <AppIcon name="plus" className="h-4 w-4" />
                Add Page
              </ActionButton>
            </div>
          </div>

          <div className="grid gap-2 overflow-y-auto p-3">
            {parsedPages.map((page) => {
              const isActive = page.id === selectedPage?.id;

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_10px_24px_rgba(31,48,78,0.12)]"
                      : "border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--bg-panel)]"
                  }`}
                >
                  <h3 className="truncate text-base font-semibold">{page.metadata.name}</h3>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="panel min-h-[38rem] overflow-hidden">
          {selectedPage ? (
            <div className="grid h-full grid-rows-[auto_auto_1fr]">
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
                        <h2 className="text-2xl font-semibold md:text-3xl">
                          {selectedPage.metadata.name}
                        </h2>
                      </div>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                      {selectedPage.metadata.description}
                    </p>
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
                    <ActionButton tone="ghost" onClick={handleRenamePage}>
                      <AppIcon name="pencil" className="h-4 w-4" />
                      Edit
                    </ActionButton>
                    <ActionButton tone="danger" onClick={handleDeletePage}>
                      <AppIcon name="trash" className="h-4 w-4" />
                      Delete
                    </ActionButton>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5">
                {selectedPage.parseError ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {selectedPage.parseError} The notebook mock will keep rendering, but metadata
                    cards may be incomplete until the frontmatter is fixed.
                  </div>
                ) : null}

                <div data-color-mode="light" className="min-h-[24rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-white">
                  {mode === "readonly" ? (
                    <div className="p-5">
                      <MDEditor.Markdown
                        source={selectedPage.body.trim().length > 0 ? selectedPage.body : "_No content yet._"}
                        style={{ backgroundColor: "transparent", padding: 0 }}
                      />
                    </div>
                  ) : (
                    <MDEditor
                      value={selectedPage.rawContent}
                      onChange={(nextValue) => updateSelectedPageRawContent(nextValue ?? "")}
                      preview="live"
                      height={600}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-[color:var(--muted)]">
              No notebook pages found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
