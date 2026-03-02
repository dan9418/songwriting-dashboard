"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActionButton } from "@/components/ui/form-controls";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { TrackImportSummary } from "@/lib/client/types";

export default function ArchivePage() {
  const searchParams = useSearchParams();
  const userSlug = DEFAULT_USER_SLUG;

  const [artists, setArtists] = useState<Array<{ artistSlug: string; title: string }>>([]);
  const [projects, setProjects] = useState<Array<{ projectSlug: string; title: string }>>([]);
  const [tracks, setTracks] = useState<Array<{ trackSlug: string; title: string }>>([]);
  const [trackImportSummary, setTrackImportSummary] = useState<TrackImportSummary | null>(null);

  const [artistSlug, setArtistSlug] = useState<string>("");
  const [projectSlug, setProjectSlug] = useState<string>("");
  const [trackSlug, setTrackSlug] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialArtist = searchParams.get("artist");
    const initialProject = searchParams.get("project");
    const initialTrack = searchParams.get("track");
    setArtistSlug(initialArtist ?? "");
    setProjectSlug(initialProject ?? "");
    setTrackSlug(initialTrack ?? "");
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    async function loadArtists() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.listArtists(userSlug);
        if (ignore) {
          return;
        }
        const nextArtists = response.items.map((item) => ({
          artistSlug: item.artistSlug,
          title: item.data.title
        }));
        setArtists(nextArtists);
        setArtistSlug((prev) => prev || nextArtists[0]?.artistSlug || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load artists.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadArtists();
    return () => {
      ignore = true;
    };
  }, [userSlug]);

  useEffect(() => {
    if (!artistSlug) {
      setProjects([]);
      return;
    }
    let ignore = false;
    async function loadProjects() {
      try {
        const response = await api.listProjects(userSlug, artistSlug);
        if (ignore) {
          return;
        }
        const nextProjects = response.items.map((item) => ({
          projectSlug: item.projectSlug,
          title: item.data.title
        }));
        setProjects(nextProjects);
        setProjectSlug((prev) => prev || nextProjects[0]?.projectSlug || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects.");
      }
    }
    loadProjects();
    return () => {
      ignore = true;
    };
  }, [artistSlug, userSlug]);

  useEffect(() => {
    if (!artistSlug || !projectSlug) {
      setTracks([]);
      setTrackImportSummary(null);
      return;
    }
    let ignore = false;
    async function loadTracks() {
      try {
        const response = await api.listTracks(userSlug, { projectSlug, artistSlug });
        if (ignore) {
          return;
        }
        setTrackImportSummary(response.summary);
        const nextTracks = response.items.map((item) => ({
          trackSlug: item.trackSlug,
          title: item.data.title
        }));
        setTracks(nextTracks);
        setTrackSlug((prev) => prev || nextTracks[0]?.trackSlug || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tracks.");
      }
    }
    loadTracks();
    return () => {
      ignore = true;
    };
  }, [artistSlug, projectSlug, userSlug]);

  const headerMeta = useMemo(() => {
    const artistTitle = artists.find((artist) => artist.artistSlug === artistSlug)?.title ?? "No artist";
    const projectTitle = projects.find((project) => project.projectSlug === projectSlug)?.title ?? "No project";
    return `${artistTitle} / ${projectTitle}`;
  }, [artistSlug, artists, projectSlug, projects]);

  return (
    <section className="grid gap-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-2xl font-semibold">Archive</h2>
          <p className="text-sm text-[color:var(--muted)]">{headerMeta}</p>
        </div>
        <ActionButton
          tone="ghost"
          onClick={() => {
            setArtistSlug("");
            setProjectSlug("");
            setTrackSlug("");
          }}
        >
          Clear Selection
        </ActionButton>
      </div>

      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}
      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading archive...</div> : null}

      <div className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
        <div className="panel p-3">
          <h3 className="mb-2 text-sm font-semibold">Artists</h3>
          <div className="grid gap-2">
            {artists.map((artist) => (
              <button
                key={artist.artistSlug}
                className={`rounded-lg px-2 py-1 text-left text-sm ${
                  artist.artistSlug === artistSlug ? "bg-[color:var(--accent-soft)]" : "hover:bg-[#f2eadf]"
                }`}
                onClick={() => {
                  setArtistSlug(artist.artistSlug);
                  setProjectSlug("");
                  setTrackSlug("");
                }}
              >
                {artist.title}
              </button>
            ))}
            {artists.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No artists found.</p> : null}
          </div>
        </div>

        <div className="panel p-3">
          <h3 className="mb-2 text-sm font-semibold">Projects</h3>
          <div className="grid gap-2">
            {projects.map((project) => (
              <button
                key={project.projectSlug}
                className={`rounded-lg px-2 py-1 text-left text-sm ${
                  project.projectSlug === projectSlug ? "bg-[color:var(--accent-soft)]" : "hover:bg-[#f2eadf]"
                }`}
                onClick={() => {
                  setProjectSlug(project.projectSlug);
                  setTrackSlug("");
                }}
              >
                {project.title}
              </button>
            ))}
            {projects.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No projects found.</p> : null}
          </div>
        </div>

        <div className="panel p-3">
          <h3 className="mb-2 text-sm font-semibold">Tracks</h3>
          {trackImportSummary ? (
            <p className="mb-2 text-xs text-[color:var(--muted)]">
              Imported {trackImportSummary.loaded}/{trackImportSummary.total} tracks
              {trackImportSummary.failed > 0 ? ` (${trackImportSummary.failed} failed)` : ""}.
              {` Showing ${trackImportSummary.matched}.`}
            </p>
          ) : null}
          <div className="grid gap-2">
            {tracks.map((track) => (
              <Link
                key={track.trackSlug}
                href={`/tracks/${track.trackSlug}?from=archive&artist=${artistSlug}&project=${projectSlug}&track=${track.trackSlug}`}
                className={`rounded-lg px-2 py-1 text-left text-sm ${
                  track.trackSlug === trackSlug ? "bg-[color:var(--accent-soft)]" : "hover:bg-[#f2eadf]"
                }`}
              >
                {track.title}
              </Link>
            ))}
            {tracks.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No tracks found.</p> : null}
          </div>
        </div>

      </div>
    </section>
  );
}
