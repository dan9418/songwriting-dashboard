"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { TrackQuickEditModal } from "@/components/tracks/track-quick-edit-modal";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { useToast } from "@/components/ui/toast";
import type { TrackAudioTableItem, TrackMetadataOption } from "@/lib/tracks/types";
import { api } from "@/lib/client/api";

function buildOptionMap(options: TrackMetadataOption[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.slug, option.name]));
}

function MetadataTextRow({
  label,
  slugs,
  nameBySlug,
  hrefBase,
  emptyLabel
}: {
  label: string;
  slugs: string[];
  nameBySlug: Record<string, string>;
  hrefBase: string;
  emptyLabel: string;
}) {
  if (slugs.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <p className="text-sm text-[color:var(--muted)]">
      <span className="font-medium text-[color:var(--ink)]">{label}: </span>
      {slugs.map((slug, index) => (
        <span key={slug}>
          {index > 0 ? <span>, </span> : null}
          <Link
            href={`${hrefBase}/${slug}`}
            className="underline-offset-4 transition hover:text-[color:var(--accent)] hover:underline"
          >
            {nameBySlug[slug] ?? slug}
          </Link>
        </span>
      ))}
    </p>
  );
}

function TagPillList({
  slugs,
  nameBySlug,
  hrefBase,
  emptyLabel
}: {
  slugs: string[];
  nameBySlug: Record<string, string>;
  hrefBase: string;
  emptyLabel: string;
}) {
  if (slugs.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slugs.map((slug) => (
        <Link
          key={slug}
          href={`${hrefBase}/${slug}`}
          className="inline-flex max-w-full items-center rounded-full border border-[color:var(--border-strong)] bg-white px-3 py-1 text-sm underline-offset-4 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:underline"
        >
          <span className="truncate">{nameBySlug[slug] ?? slug}</span>
        </Link>
      ))}
    </div>
  );
}

export function TrackDetailControls({
  trackSlug,
  initialName,
  initialArtistSlugs,
  initialProjectSlugs,
  initialTagSlugs,
  initialAudio,
  imageHref,
  artistOptions,
  projectOptions,
  tagOptions
}: {
  trackSlug: string;
  initialName: string;
  initialArtistSlugs: string[];
  initialProjectSlugs: string[];
  initialTagSlugs: string[];
  initialAudio: TrackAudioTableItem[];
  imageHref: string | null;
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const artistNameBySlug = useMemo(() => buildOptionMap(artistOptions), [artistOptions]);
  const projectNameBySlug = useMemo(() => buildOptionMap(projectOptions), [projectOptions]);
  const tagNameBySlug = useMemo(() => buildOptionMap(tagOptions), [tagOptions]);

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete track "${initialName || trackSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await api.deleteTrack(trackSlug);
      showToast("Track deleted.");
      router.push("/tracks");
      router.refresh();
    } catch {
      showToast("Failed to delete track.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            <EntityPlaceholderArtwork
              kind="track"
              variant="detail-cover"
              imageHref={imageHref}
              alt={`${initialName} artwork`}
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold">{initialName}</h1>
              <div className="mt-2 grid gap-1.5">
                <MetadataTextRow
                  label="Artist"
                  slugs={initialArtistSlugs}
                  nameBySlug={artistNameBySlug}
                  hrefBase="/artists"
                  emptyLabel="No artists linked."
                />
                <MetadataTextRow
                  label="Project"
                  slugs={initialProjectSlugs}
                  nameBySlug={projectNameBySlug}
                  hrefBase="/projects"
                  emptyLabel="No projects linked."
                />
              </div>
              <div className="mt-3">
                <TagPillList
                  slugs={initialTagSlugs}
                  nameBySlug={tagNameBySlug}
                  hrefBase="/tags"
                  emptyLabel="No tags linked."
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              aria-label={`Edit ${initialName}`}
              onClick={() => setEditingMetadata(true)}
            >
              <AppIcon name="pencil" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {editingMetadata ? (
        <TrackQuickEditModal
          trackSlug={trackSlug}
          initialTrack={{
            slug: trackSlug,
            name: initialName,
            artistSlugs: initialArtistSlugs,
            projectSlugs: initialProjectSlugs,
            tagSlugs: initialTagSlugs,
            audio: initialAudio
          }}
          artistOptions={artistOptions}
          projectOptions={projectOptions}
          tagOptions={tagOptions}
          footerActions={
            <ActionButton tone="danger" disabled={deleting} onClick={() => void onDelete()}>
              {deleting ? "Deleting..." : "Delete Track"}
            </ActionButton>
          }
          onClose={() => setEditingMetadata(false)}
          onSaved={() => setEditingMetadata(false)}
        />
      ) : null}
    </div>
  );
}
