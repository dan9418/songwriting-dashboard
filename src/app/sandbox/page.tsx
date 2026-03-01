"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FragmentEditor } from "@/components/editors/fragment-editor";
import { TrackEditor } from "@/components/editors/track-editor";
import { ActionButton, Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import type { FragmentData, TrackData } from "@/lib/client/types";

function nowStamp() {
  return new Date().toISOString();
}

function buildNewTrack(userSlug: string, slug: string): TrackData {
  const now = nowStamp();
  return {
    slug,
    title: slug.replace(/-/g, " "),
    tags: [],
    createdAt: now,
    updatedAt: now,
    userSlug,
    artistSlugs: [],
    status: "idea",
    audioVersions: []
  };
}

function buildNewFragment(userSlug: string, slug: string): FragmentData {
  const now = nowStamp();
  return {
    slug,
    title: slug.replace(/-/g, " "),
    tags: [],
    createdAt: now,
    updatedAt: now,
    userSlug,
    text: "",
    relatedTrackSlugs: []
  };
}

export default function SandboxPage() {
  const userSlug = DEFAULT_USER_SLUG;
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [tab, setTab] = useState<"tracks" | "fragments">("tracks");
  const [trackSlug, setTrackSlug] = useState("");
  const [fragmentSlug, setFragmentSlug] = useState("");

  const [tracks, setTracks] = useState<Array<{ trackSlug: string; title: string }>>([]);
  const [fragments, setFragments] = useState<Array<{ fragmentSlug: string; title: string }>>([]);
  const [trackEntity, setTrackEntity] = useState<{ data: TrackData; content: string } | null>(null);
  const [fragmentEntity, setFragmentEntity] = useState<{ data: FragmentData; content: string } | null>(null);

  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (nextTab === "tracks" || nextTab === "fragments") {
      setTab(nextTab);
    }
    const track = searchParams.get("track");
    const fragment = searchParams.get("fragment");
    if (track) {
      setTrackSlug(track);
    }
    if (fragment) {
      setFragmentSlug(fragment);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTracks() {
      try {
        const response = await api.listTracks(userSlug, { scope: "sandbox" });
        const nextTracks = response.items.map((item) => ({ trackSlug: item.trackSlug, title: item.data.title }));
        setTracks(nextTracks);
        setTrackSlug((prev) => prev || nextTracks[0]?.trackSlug || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sandbox tracks.");
      }
    }
    loadTracks();
  }, [userSlug]);

  useEffect(() => {
    async function loadFragments() {
      try {
        const response = await api.listFragments(userSlug);
        const nextFragments = response.items.map((item) => ({
          fragmentSlug: item.fragmentSlug,
          title: item.data.title
        }));
        setFragments(nextFragments);
        setFragmentSlug((prev) => prev || nextFragments[0]?.fragmentSlug || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fragments.");
      }
    }
    loadFragments();
  }, [userSlug]);

  useEffect(() => {
    if (!trackSlug) {
      setTrackEntity(null);
      return;
    }
    api.getTrack(userSlug, trackSlug).then(setTrackEntity).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load track.");
    });
  }, [trackSlug, userSlug]);

  useEffect(() => {
    if (!fragmentSlug) {
      setFragmentEntity(null);
      return;
    }
    api.getFragment(userSlug, fragmentSlug).then(setFragmentEntity).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load fragment.");
    });
  }, [fragmentSlug, userSlug]);

  const activeLabel = useMemo(() => (tab === "tracks" ? "Tracks" : "Fragments"), [tab]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <h2 className="text-2xl font-semibold">Sandbox</h2>
        <p className="text-sm text-[color:var(--muted)]">{activeLabel} workspace</p>
        <div className="mt-3 flex gap-2">
          <ActionButton tone={tab === "tracks" ? "primary" : "ghost"} onClick={() => setTab("tracks")}>
            Tracks
          </ActionButton>
          <ActionButton tone={tab === "fragments" ? "primary" : "ghost"} onClick={() => setTab("fragments")}>
            Fragments
          </ActionButton>
        </div>
      </div>

      {error ? <div className="panel border-red-300 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="panel p-3">
          <Field label={`Create ${tab === "tracks" ? "Track" : "Fragment"} Slug`}>
            <TextInput value={newSlug} onChange={(event) => setNewSlug(event.currentTarget.value)} />
          </Field>
          <ActionButton
            className="mt-2 w-full"
            onClick={async () => {
              if (!newSlug.trim()) {
                return;
              }
              setSaving(true);
              try {
                if (tab === "tracks") {
                  const created = await api.postTrack(userSlug, buildNewTrack(userSlug, newSlug.trim()), "");
                  setTrackSlug(created.data.slug);
                  showToast("Sandbox track created.");
                  const response = await api.listTracks(userSlug, { scope: "sandbox" });
                  setTracks(response.items.map((item) => ({ trackSlug: item.trackSlug, title: item.data.title })));
                } else {
                  const created = await api.postFragment(
                    userSlug,
                    buildNewFragment(userSlug, newSlug.trim()),
                    ""
                  );
                  setFragmentSlug(created.data.slug);
                  showToast("Fragment created.");
                  const response = await api.listFragments(userSlug);
                  setFragments(
                    response.items.map((item) => ({ fragmentSlug: item.fragmentSlug, title: item.data.title }))
                  );
                }
                setNewSlug("");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Create failed.", "error");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Creating..." : "Create"}
          </ActionButton>

          <div className="mt-4 grid gap-2">
            {(tab === "tracks" ? tracks : fragments).map((item) => {
              const slug = tab === "tracks" ? (item as { trackSlug: string }).trackSlug : (item as { fragmentSlug: string }).fragmentSlug;
              const title = item.title;
              const active = tab === "tracks" ? trackSlug === slug : fragmentSlug === slug;
              return (
                <button
                  key={slug}
                  className={`rounded-lg px-2 py-1 text-left text-sm ${
                    active ? "bg-[color:var(--accent-soft)]" : "hover:bg-[#f2eadf]"
                  }`}
                  onClick={() => {
                    if (tab === "tracks") {
                      setTrackSlug(slug);
                    } else {
                      setFragmentSlug(slug);
                    }
                  }}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {tab === "tracks" ? (
            trackEntity ? (
              <TrackEditor
                value={trackEntity.data}
                content={trackEntity.content}
                saving={saving}
                onSave={async (nextData, nextContent) => {
                  setSaving(true);
                  try {
                    const saved = await api.putTrack(userSlug, nextData.slug, nextData, nextContent);
                    setTrackEntity(saved);
                    showToast("Sandbox track saved.");
                    const response = await api.listTracks(userSlug, { scope: "sandbox" });
                    setTracks(response.items.map((item) => ({ trackSlug: item.trackSlug, title: item.data.title })));
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Save failed.", "error");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            ) : (
              <div className="panel p-4 text-sm text-[color:var(--muted)]">Select or create a sandbox track.</div>
            )
          ) : fragmentEntity ? (
            <FragmentEditor
              value={fragmentEntity.data}
              content={fragmentEntity.content}
              saving={saving}
              onSave={async (nextData, nextContent) => {
                setSaving(true);
                try {
                  const saved = await api.putFragment(userSlug, nextData.slug, nextData, nextContent);
                  setFragmentEntity(saved);
                  showToast("Fragment saved.");
                  const response = await api.listFragments(userSlug);
                  setFragments(
                    response.items.map((item) => ({ fragmentSlug: item.fragmentSlug, title: item.data.title }))
                  );
                } catch (err) {
                  showToast(err instanceof Error ? err.message : "Save failed.", "error");
                } finally {
                  setSaving(false);
                }
              }}
            />
          ) : (
            <div className="panel p-4 text-sm text-[color:var(--muted)]">Select or create a fragment.</div>
          )}
        </div>
      </div>
    </section>
  );
}
