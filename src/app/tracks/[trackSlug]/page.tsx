"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LinkedEntitiesPanel } from "@/components/entities/linked-entities-panel";
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
  const [artists, setArtists] = useState<Array<{ slug: string; title: string }>>([]);
  const [projects, setProjects] = useState<Array<{ slug: string; title: string; artistSlug: string }>>([]);
  const [artistSelection, setArtistSelection] = useState("");
  const [projectSelection, setProjectSelection] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [response, artistsResponse] = await Promise.all([
          api.getTrack(userSlug, trackSlug),
          api.listArtists(userSlug)
        ]);

        const artistOptions = artistsResponse.items.map((item) => ({
          slug: item.artistSlug,
          title: item.data.title
        }));
        const projectsNested = await Promise.all(
          artistOptions.map(async (artist) => {
            const projectsResponse = await api.listProjects(userSlug, artist.slug);
            return projectsResponse.items.map((project) => ({
              slug: project.projectSlug,
              title: project.data.title,
              artistSlug: project.data.artistSlug
            }));
          })
        );

        if (!ignore) {
          setEntity(response);
          setArtists(artistOptions);
          setProjects(projectsNested.flat());
          setArtistSelection(artistOptions[0]?.slug ?? "");
          setProjectSelection(projectsNested.flat()[0]?.slug ?? "");
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
  const projectLookup = useMemo(() => {
    const map = new Map<string, { slug: string; title: string; artistSlug: string }>();
    for (const project of projects) {
      map.set(project.slug, project);
    }
    return map;
  }, [projects]);

  async function saveLinkedEntities(nextData: TrackData, successMessage: string) {
    setSaving(true);
    try {
      const saved = await api.putTrack(userSlug, trackSlug, nextData, entity?.content ?? "");
      setEntity(saved);
      showToast(successMessage);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update links.", "error");
    } finally {
      setSaving(false);
    }
  }

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
        <LinkedEntitiesPanel
          sections={[
            {
              key: "artists",
              title: "Artists",
              items: entity.data.artistSlugs.map((artistSlug) => ({
                id: artistSlug,
                label: artists.find((item) => item.slug === artistSlug)?.title ?? artistSlug,
                href: `/artists/${artistSlug}`
              })),
              selector:
                entity.data.artistSlugs.length === 0
                  ? {
                      label: "Select Existing Artist",
                      value: artistSelection,
                      options: artists.map((artist) => ({
                        value: artist.slug,
                        label: artist.title
                      })),
                      onChange: setArtistSelection,
                      onSubmit: async () => {
                        if (!artistSelection) {
                          return;
                        }
                        await saveLinkedEntities(
                          { ...entity.data, artistSlugs: [artistSelection], updatedAt: new Date().toISOString() },
                          "Artist linked."
                        );
                      },
                      submitLabel: "Link Artist",
                      disabled: saving
                    }
                  : undefined
            },
            {
              key: "project",
              title: "Project",
              items: entity.data.projectSlug
                ? [
                    {
                      id: entity.data.projectSlug,
                      label: projectLookup.get(entity.data.projectSlug)?.title ?? entity.data.projectSlug,
                      href: `/projects/${entity.data.projectSlug}?artist=${projectLookup.get(entity.data.projectSlug)?.artistSlug ?? ""}`
                    }
                  ]
                : [],
              selector:
                !entity.data.projectSlug
                  ? {
                      label: "Select Existing Project",
                      value: projectSelection,
                      options: projects.map((project) => ({
                        value: project.slug,
                        label: project.title
                      })),
                      onChange: setProjectSelection,
                      onSubmit: async () => {
                        if (!projectSelection) {
                          return;
                        }
                        const selectedProject = projectLookup.get(projectSelection);
                        await saveLinkedEntities(
                          {
                            ...entity.data,
                            projectSlug: projectSelection,
                            artistSlugs:
                              entity.data.artistSlugs.length > 0
                                ? entity.data.artistSlugs
                                : selectedProject
                                  ? [selectedProject.artistSlug]
                                  : [],
                            updatedAt: new Date().toISOString()
                          },
                          "Project linked."
                        );
                      },
                      submitLabel: "Link Project",
                      disabled: saving
                    }
                  : undefined
            }
          ]}
        />
      ) : null}

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
