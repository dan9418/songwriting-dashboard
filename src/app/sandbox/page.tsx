"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TextInput } from "@/components/ui/form-controls";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";

interface TrackListItem {
  trackSlug: string;
  title: string;
}

interface FragmentListItem {
  fragmentSlug: string;
  title: string;
}

export default function SandboxPage() {
  const userSlug = DEFAULT_USER_SLUG;
  const [tracks, setTracks] = useState<TrackListItem[]>([]);
  const [fragments, setFragments] = useState<FragmentListItem[]>([]);
  const [trackQuery, setTrackQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [trackResponse, fragmentResponse] = await Promise.all([
          api.listTracks(userSlug),
          api.listFragments(userSlug)
        ]);
        if (ignore) {
          return;
        }

        const sortedTracks = trackResponse.items
          .map((item) => ({ trackSlug: item.trackSlug, title: item.data.title }))
          .sort((a, b) => a.title.localeCompare(b.title));

        const sortedFragments = fragmentResponse.items
          .map((item) => ({ fragmentSlug: item.fragmentSlug, title: item.data.title }))
          .sort((a, b) => a.title.localeCompare(b.title));

        setTracks(sortedTracks);
        setFragments(sortedFragments);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load sandbox lists.");
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
  }, [userSlug]);

  const filteredTracks = useMemo(() => {
    const query = trackQuery.trim().toLowerCase();
    if (!query) {
      return tracks;
    }
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) || track.trackSlug.toLowerCase().includes(query)
    );
  }, [trackQuery, tracks]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <h2 className="text-2xl font-semibold">Sandbox</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Browse draft tracks and fragments. Tracks open in the standalone track page.
        </p>
      </div>

      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}
      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading sandbox...</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Tracks</h3>
            <span className="text-xs text-[color:var(--muted)]">{filteredTracks.length}</span>
          </div>
          <div className="mt-3">
            <TextInput
              value={trackQuery}
              onChange={(event) => setTrackQuery(event.currentTarget.value)}
              placeholder="Filter tracks by name or slug"
            />
          </div>
          <div className="mt-3 grid gap-2">
            {filteredTracks.map((track) => (
              <Link
                key={track.trackSlug}
                href={`/tracks/${track.trackSlug}?from=sandbox&tab=tracks&track=${track.trackSlug}`}
                className="rounded-lg bg-[color:var(--surface)] px-3 py-2 text-sm transition hover:bg-[color:var(--accent-soft)]"
              >
                {track.title}
              </Link>
            ))}
            {!loading && filteredTracks.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No tracks match your filter.</p>
            ) : null}
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Fragments</h3>
            <span className="text-xs text-[color:var(--muted)]">{fragments.length}</span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Read-only list for now.</p>
          <div className="mt-3 grid gap-2">
            {fragments.map((fragment) => (
              <div
                key={fragment.fragmentSlug}
                className="rounded-lg bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)]"
              >
                {fragment.title}
              </div>
            ))}
            {!loading && fragments.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No fragments found.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

