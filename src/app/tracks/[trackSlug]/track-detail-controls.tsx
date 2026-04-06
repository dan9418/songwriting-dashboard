"use client";

import Link from "next/link";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { TrackMetadataEditor } from "@/components/tracks/track-metadata-editor";
import { ActionButton } from "@/components/ui/action-button";
import { useToast } from "@/components/ui/toast";
import type { TrackMetadataOption } from "@/lib/tracks/types";
import { api } from "@/lib/client/api";

export function TrackDetailControls({
  trackSlug,
  initialName,
  initialArtistSlugs,
  initialProjectSlugs,
  initialTagSlugs,
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
  imageHref: string | null;
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete track "${initialName || trackSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteTrack(trackSlug);
      showToast("Track deleted.");
      router.push("/tracks");
      router.refresh();
    } catch {
      showToast("Failed to delete track.", "error");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <EntityPlaceholderArtwork
            kind="track"
            variant="detail-cover"
            imageHref={imageHref}
            alt={`${initialName} artwork`}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold">{initialName}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{trackSlug}</p>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
              Quick metadata updates for the track itself live here. Audio files, artwork, and markdown docs stay
              below.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/tracks" className="theme-button-link theme-button-link--ghost">
            Back To Tracks
          </Link>
          <ActionButton tone="danger" onClick={onDelete}>
            Delete
          </ActionButton>
        </div>
      </div>

      <TrackMetadataEditor
        trackSlug={trackSlug}
        initialName={initialName}
        initialArtistSlugs={initialArtistSlugs}
        initialProjectSlugs={initialProjectSlugs}
        initialTagSlugs={initialTagSlugs}
        artistOptions={artistOptions}
        projectOptions={projectOptions}
        tagOptions={tagOptions}
        title="Metadata"
        description="Rename the track or update its linked artists, projects, and tags."
        withPanel
      />
    </div>
  );
}
