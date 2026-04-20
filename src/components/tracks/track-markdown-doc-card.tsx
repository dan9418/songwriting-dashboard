"use client";

import MDEditor from "@uiw/react-md-editor";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";

type DocType = "notes";

interface DocResponse {
  type: DocType;
  path: string | null;
  exists: boolean;
  content: string;
  etag: string | null;
  parsed: {
    data: Record<string, unknown>;
    content: string;
  } | null;
}

function toLabel(type: DocType): string {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function buildStarterText(): string {
  return "# Notes\n\n";
}

export function TrackMarkdownDocCard({ trackSlug, type }: { trackSlug: string; type: DocType }) {
  const [mode, setMode] = useState<"published" | "edit">("published");
  const label = toLabel(type);
  const endpoint = `/api/tracks/${encodeURIComponent(trackSlug)}/docs/${type}`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [record, setRecord] = useState<DocResponse | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = (await response.json()) as DocResponse | { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload && "error" in payload ? payload.error?.message : "Failed to load document.");
        }
        if (!ignore) {
          setRecord(payload as DocResponse);
          setContent((payload as DocResponse).content);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load document.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [endpoint]);

  async function createDoc() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: buildStarterText() })
      });
      const payload = (await response.json()) as DocResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error?.message : "Failed to create document.");
      }
      setRecord(payload as DocResponse);
      setContent((payload as DocResponse).content);
      setMessage(`${label} file created.`);
      setMode("edit");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : `Failed to create ${type} file.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveDoc() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content })
      });
      const payload = (await response.json()) as DocResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error?.message : "Failed to save document.");
      }
      setRecord(payload as DocResponse);
      setContent((payload as DocResponse).content);
      setMessage(`${label} file saved.`);
      setMode("published");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Failed to save ${type} file.`);
    } finally {
      setSaving(false);
    }
  }

  async function removeDoc() {
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { deleted?: boolean } | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error?.message : "Failed to delete document.");
      }
      if ((payload as { deleted?: boolean }).deleted) {
        setRecord({
          type,
          path: null,
          exists: false,
          content: "",
          etag: null,
          parsed: null
        });
        setContent("");
        setMessage(`${label} file deleted.`);
        setMode("published");
      } else {
        setMessage(`${label} file did not exist.`);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Failed to delete ${type} file.`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{label}</h2>

        {record?.exists ? (
          <div className="flex items-center gap-2">
            {mode === "edit" ? (
              <>
                <ActionButton tone="danger" disabled={saving || deleting} onClick={removeDoc}>
                  {deleting ? "Deleting..." : "Delete"}
                </ActionButton>
                <ActionButton disabled={saving || deleting} onClick={saveDoc}>
                  {saving ? "Saving..." : "Save"}
                </ActionButton>
              </>
            ) : (
              <ActionButton disabled={saving || deleting} onClick={() => setMode("edit")}>
                Edit
              </ActionButton>
            )}
          </div>
        ) : null}
      </div>

      {loading ? <p className="mt-2 text-sm text-[color:var(--muted)]">Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-[color:var(--muted)]">{message}</p> : null}

      {!loading && record && !record.exists ? (
        <>
          <p className="mt-2 text-sm text-[color:var(--muted)]">No {type} markdown file exists yet.</p>
          <ActionButton className="mt-3" disabled={saving} onClick={createDoc}>
            {saving ? "Creating..." : `Add ${label} File`}
          </ActionButton>
        </>
      ) : null}

      {!loading && record && record.exists ? (
        <div data-color-mode="light" className="mt-3 grid gap-3">
          {mode === "published" ? (
            <MDEditor.Markdown
              source={
                record.parsed?.content && record.parsed.content.trim().length > 0
                  ? record.parsed.content
                  : "_No content yet._"
              }
              style={{ backgroundColor: "transparent", padding: 0 }}
            />
          ) : null}

          {mode === "edit" ? (
            <MDEditor value={content} onChange={(next) => setContent(next ?? "")} preview="edit" height={240} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
