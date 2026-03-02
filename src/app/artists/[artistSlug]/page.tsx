"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArtistEditor } from "@/components/editors/artist-editor";
import { LinkedEntitiesPanel } from "@/components/entities/linked-entities-panel";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { ArtistData } from "@/lib/client/types";

export default function ArtistDetailPage() {
  const params = useParams<{ artistSlug: string }>();
  const artistSlug = params.artistSlug;
  const userSlug = DEFAULT_USER_SLUG;
  const { showToast } = useToast();

  const [entity, setEntity] = useState<{ data: ArtistData; content: string } | null>(null);
  const [projectLinks, setProjectLinks] = useState<Array<{ projectSlug: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [artist, projects] = await Promise.all([
          api.getArtist(userSlug, artistSlug),
          api.listProjects(userSlug, artistSlug)
        ]);
        if (ignore) {
          return;
        }
        setEntity(artist);
        setProjectLinks(
          projects.items.map((item) => ({
            projectSlug: item.projectSlug,
            title: item.data.title
          }))
        );
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load artist.");
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
  }, [artistSlug, userSlug]);

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between p-4">
        <div>
          <h2 className="text-2xl font-semibold">Artist Detail</h2>
          <p className="text-sm text-[color:var(--muted)]">{artistSlug}</p>
        </div>
        <Link
          href="/archive"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Archive
        </Link>
      </div>

      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading artist...</div> : null}
      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}

      <LinkedEntitiesPanel
        sections={[
          {
            key: "projects",
            title: "Projects",
            items: projectLinks.map((project) => ({
              id: project.projectSlug,
              label: project.title,
              href: `/projects/${project.projectSlug}?artist=${artistSlug}`
            })),
            emptyText: "No linked projects."
          }
        ]}
      />

      {entity ? (
        <ArtistEditor
          value={entity.data}
          content={entity.content}
          saving={saving}
          onSave={async (nextData, nextContent) => {
            setSaving(true);
            try {
              const saved = await api.putArtist(userSlug, artistSlug, nextData, nextContent);
              setEntity(saved);
              showToast("Artist updated.");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to save artist.", "error");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}
