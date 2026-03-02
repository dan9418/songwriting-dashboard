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
        <div className="flex items-center gap-2">
          {entity ? (
            <Link
              href={`/artists/${entity.data.artistSlug}`}
              className="rounded-lg bg-[#d8e3ff] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#c8d8ff]"
            >
              Artist: {entity.data.artistSlug}
            </Link>
          ) : null}
          <Link
            href="/archive"
            className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
          >
            Back To Archive
          </Link>
        </div>
      </div>

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
