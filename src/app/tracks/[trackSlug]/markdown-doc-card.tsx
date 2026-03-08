"use client";

import MDEditor from "@uiw/react-md-editor";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/form-controls";

type DocType = "lyrics" | "chords" | "notes";

interface DocResponse {
  type: DocType;
  path: string | null;
  exists: boolean;
  content: string;
  etag: string | null;
}

function toLabel(type: DocType): string {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function buildStarterText(type: DocType): string {
  return `# ${toLabel(type)}\n\n`;
}

export function MarkdownDocCard({ trackSlug, type }: { trackSlug: string; type: DocType }) {
  const label = useMemo(() => toLabel(type), [type]);
  const endpoint = useMemo(
    () => `/api/tracks/dan/${encodeURIComponent(trackSlug)}/docs/${type}`,
    [trackSlug, type]
  );

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
        body: JSON.stringify({ content: buildStarterText(type) })
      });
      const payload = (await response.json()) as DocResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error?.message : "Failed to create document.");
      }
      setRecord(payload as DocResponse);
      setContent((payload as DocResponse).content);
      setMessage(`${label} file created.`);
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
          etag: null
        });
        setContent("");
        setMessage(`${label} file deleted.`);
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
      <h2 className="text-lg font-semibold">{label}</h2>
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
          <p className="text-xs text-[color:var(--muted)] break-all">{record.path}</p>
          <MDEditor value={content} onChange={(next) => setContent(next ?? "")} preview="edit" height={240} />
          <div className="flex items-center gap-2">
            <ActionButton disabled={saving || deleting} onClick={saveDoc}>
              {saving ? "Saving..." : "Save"}
            </ActionButton>
            <ActionButton tone="danger" disabled={saving || deleting} onClick={removeDoc}>
              {deleting ? "Deleting..." : "Delete"}
            </ActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
