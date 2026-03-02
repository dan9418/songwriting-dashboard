"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectEditor } from "@/components/editors/project-editor";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { ProjectData } from "@/lib/client/types";

export default function ProjectDetailPage() {
  const params = useParams<{ projectSlug: string }>();
  const searchParams = useSearchParams();
  const projectSlug = params.projectSlug;
  const userSlug = DEFAULT_USER_SLUG;
  const { showToast } = useToast();

  const artistHint = searchParams.get("artist") ?? "artist";

  const [entity, setEntity] = useState<{ data: ProjectData; content: string } | null>(null);
  const [trackLinks, setTrackLinks] = useState<Array<{ trackSlug: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const project = await api.getProject(userSlug, artistHint, projectSlug);
        if (!ignore) {
          setEntity(project);
          const tracks = await api.listTracks(userSlug, {
            projectSlug,
            artistSlug: project.data.artistSlug
          });
          if (!ignore) {
            setTrackLinks(
              tracks.items.map((item) => ({
                trackSlug: item.trackSlug,
                title: item.data.title
              }))
            );
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load project.");
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
  }, [artistHint, projectSlug, userSlug]);

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between p-4">
        <div>
          <h2 className="text-2xl font-semibold">Project Detail</h2>
          <p className="text-sm text-[color:var(--muted)]">{projectSlug}</p>
        </div>
        <Link
          href="/archive"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Archive
        </Link>
      </div>

      {entity ? (
        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Linked Artist</h3>
          <div className="mt-2">
            <Link
              href={`/artists/${entity.data.artistSlug}`}
              className="rounded-lg bg-[#f8efe3] px-3 py-2 text-sm transition hover:bg-[#f0e1cf]"
            >
              {entity.data.artistSlug}
            </Link>
          </div>
        </div>
      ) : null}

      {trackLinks.length > 0 ? (
        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Linked Tracks</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {trackLinks.map((track) => (
              <Link
                key={track.trackSlug}
                href={`/tracks/${track.trackSlug}?from=archive&artist=${entity?.data.artistSlug ?? ""}&project=${projectSlug}&track=${track.trackSlug}`}
                className="rounded-lg bg-[#f8efe3] px-3 py-2 text-sm transition hover:bg-[#f0e1cf]"
              >
                {track.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading project...</div> : null}
      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}

      {entity ? (
        <ProjectEditor
          value={entity.data}
          content={entity.content}
          saving={saving}
          onSave={async (nextData, nextContent) => {
            setSaving(true);
            try {
              const saved = await api.putProject(
                userSlug,
                nextData.artistSlug || artistHint,
                projectSlug,
                nextData,
                nextContent
              );
              setEntity(saved);
              showToast("Project updated.");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to save project.", "error");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}
