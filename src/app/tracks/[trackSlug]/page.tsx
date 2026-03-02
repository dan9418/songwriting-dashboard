"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrackEditor } from "@/components/editors/track-editor";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { TrackData } from "@/lib/client/types";

function getBackHref(searchParams: URLSearchParams): string {
  const from = searchParams.get("from");
  if (from === "archive") {
    const artist = searchParams.get("artist");
    const project = searchParams.get("project");
    const track = searchParams.get("track");
    const params = new URLSearchParams();
    if (artist) params.set("artist", artist);
    if (project) params.set("project", project);
    if (track) params.set("track", track);
    const query = params.toString();
    return query ? `/archive?${query}` : "/archive";
  }
  if (from === "sandbox") {
    return "/sandbox?tab=tracks";
  }
  return "/archive";
}

export default function TrackDetailPage() {
  const params = useParams<{ trackSlug: string }>();
  const searchParams = useSearchParams();
  const userSlug = DEFAULT_USER_SLUG;
  const { showToast } = useToast();

  const trackSlug = params.trackSlug;
  const [entity, setEntity] = useState<{ data: TrackData; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getTrack(userSlug, trackSlug);
        if (!ignore) {
          setEntity(response);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load track.");
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
  }, [trackSlug, userSlug]);

  const backHref = useMemo(() => getBackHref(searchParams), [searchParams]);

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between p-4">
        <div>
          <h2 className="text-2xl font-semibold">Track Detail</h2>
          <p className="text-sm text-[color:var(--muted)]">{trackSlug}</p>
        </div>
        <Link
          href={backHref}
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back
        </Link>
      </div>

      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}
      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading track...</div> : null}

      {entity ? (
        <TrackEditor
          value={entity.data}
          content={entity.content}
          saving={saving}
          onSave={async (nextData, nextContent) => {
            setSaving(true);
            try {
              const saved = await api.putTrack(userSlug, trackSlug, nextData, nextContent);
              setEntity(saved);
              showToast("Track updated.");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to save track.", "error");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}

