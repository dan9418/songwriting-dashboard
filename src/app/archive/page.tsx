"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";

interface ArtistNode {
  artistSlug: string;
  title: string;
  projects: Array<{ projectSlug: string; title: string; trackCount: number }>;
}

export default function ArchivePage() {
  const userSlug = DEFAULT_USER_SLUG;
  const [nodes, setNodes] = useState<ArtistNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadHierarchy() {
      setLoading(true);
      setError(null);
      try {
        const artistsResponse = await api.listArtists(userSlug);
        const artists = artistsResponse.items.map((item) => ({
          artistSlug: item.artistSlug,
          title: item.data.title
        }));

        const withProjects = await Promise.all(
          artists.map(async (artist) => {
            const projectsResponse = await api.listProjects(userSlug, artist.artistSlug);
            return {
              ...artist,
              projects: projectsResponse.items.map((project) => ({
                projectSlug: project.projectSlug,
                title: project.data.title,
                trackCount: project.data.trackSlugs?.length ?? 0
              }))
            };
          })
        );

        if (!ignore) {
          setNodes(withProjects);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load archive hierarchy.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadHierarchy();
    return () => {
      ignore = true;
    };
  }, [userSlug]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <h2 className="text-2xl font-semibold">Archive</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Hierarchical artist/project index. Open any item to edit metadata.
        </p>
      </div>

      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading archive...</div> : null}
      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="grid gap-4">
        {nodes.map((artist) => (
          <div key={artist.artistSlug} className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/artists/${artist.artistSlug}`}
                className="text-lg font-semibold text-[color:var(--ink)] underline-offset-4 hover:underline"
              >
                {artist.title}
              </Link>
              <span className="text-xs text-[color:var(--muted)]">
                {artist.projects.length} project{artist.projects.length === 1 ? "" : "s"}
              </span>
            </div>

            {artist.projects.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {artist.projects.map((project) => (
                  <Link
                    key={project.projectSlug}
                    href={`/projects/${project.projectSlug}?artist=${artist.artistSlug}`}
                    className="flex items-center justify-between rounded-lg bg-[#f8efe3] px-3 py-2 text-sm transition hover:bg-[#f0e1cf]"
                  >
                    <span>{project.title}</span>
                    <span className="text-xs text-[color:var(--muted)]">
                      {project.trackCount} track{project.trackCount === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--muted)]">No projects linked to this artist.</p>
            )}
          </div>
        ))}
        {!loading && nodes.length === 0 ? (
          <div className="panel p-4 text-sm text-[color:var(--muted)]">No artists found.</div>
        ) : null}
      </div>
    </section>
  );
}
