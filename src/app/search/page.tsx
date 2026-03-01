"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, Field, PillInput, SelectInput, TextInput } from "@/components/ui/form-controls";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { SearchResult } from "@/lib/client/types";

function openResultRoute(result: SearchResult): string {
  if (result.type === "fragment") {
    return `/sandbox?tab=fragments&fragment=${result.slug}`;
  }
  if (result.path.includes("/sandbox/tracks/")) {
    return `/sandbox?tab=tracks&track=${result.slug}`;
  }
  if (result.type === "track") {
    const parts = result.path.split("/");
    const artistIdx = parts.findIndex((part) => part === "artists");
    const projectIdx = parts.findIndex((part) => part === "projects");
    if (artistIdx >= 0 && projectIdx >= 0) {
      const artistSlug = parts[artistIdx + 1];
      const projectSlug = parts[projectIdx + 1];
      return `/archive?artist=${artistSlug}&project=${projectSlug}&track=${result.slug}`;
    }
  }
  if (result.type === "project") {
    return `/archive?project=${result.slug}`;
  }
  return `/archive?artist=${result.slug}`;
}

export default function SearchPage() {
  const userSlug = DEFAULT_USER_SLUG;
  const router = useRouter();

  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [type, setType] = useState<SearchResult["type"] | "all">("all");
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <h2 className="text-2xl font-semibold">Search</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Full-text lookup across archive and sandbox metadata.
        </p>
      </div>

      <div className="panel grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_200px_220px_auto] md:items-end">
        <Field label="Query">
          <TextInput value={q} onChange={(event) => setQ(event.currentTarget.value)} placeholder="night drive..." />
        </Field>
        <Field label="Type">
          <SelectInput
            value={type}
            options={["all", "artist", "project", "track", "fragment"]}
            onChange={(event) => setType(event.currentTarget.value as SearchResult["type"] | "all")}
          />
        </Field>
        <Field label="Tags">
          <PillInput value={tags} onChange={setTags} />
        </Field>
        <ActionButton
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const response = await api.search(userSlug, q, tags, type);
              setItems(response.items);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Search failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Searching..." : "Search"}
        </ActionButton>
      </div>

      {error ? <div className="panel border-red-300 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3">
        {items.map((result) => (
          <button
            key={result.id}
            className="panel grid gap-1 p-4 text-left transition hover:-translate-y-[1px] hover:shadow-lg"
            onClick={() => router.push(openResultRoute(result))}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{result.title}</h3>
              <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs uppercase tracking-wide">
                {result.type}
              </span>
            </div>
            <p className="text-xs text-[color:var(--muted)]">{result.path}</p>
            <p className="text-sm text-[color:var(--ink)]">{result.snippet || "No snippet."}</p>
          </button>
        ))}
        {!loading && items.length === 0 ? (
          <div className="panel p-4 text-sm text-[color:var(--muted)]">No results yet. Try a broad query.</div>
        ) : null}
      </div>
    </section>
  );
}

