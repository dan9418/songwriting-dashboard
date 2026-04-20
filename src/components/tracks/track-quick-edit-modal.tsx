"use client";

import { useEffect, useState } from "react";
import { TrackMetadataEditor } from "@/components/tracks/track-metadata-editor";
import { AppIcon } from "@/components/ui/app-icons";
import { ModalShell } from "@/components/ui/modal-shell";
import { api } from "@/lib/client/api";
import type { TrackMetadataOption, TrackQuickEditRecord } from "@/lib/tracks/types";

export function TrackQuickEditModal({
  trackSlug,
  initialTrack,
  showAudio = false,
  artistOptions,
  projectOptions,
  tagOptions,
  footerActions,
  onClose,
  onSaved
}: {
  trackSlug: string;
  initialTrack?: TrackQuickEditRecord;
  showAudio?: boolean;
  artistOptions: TrackMetadataOption[];
  projectOptions: TrackMetadataOption[];
  tagOptions: TrackMetadataOption[];
  footerActions?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [track, setTrack] = useState<TrackQuickEditRecord | null>(initialTrack ?? null);
  const [loading, setLoading] = useState(initialTrack === undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      setLoading(initialTrack === undefined);
      setErrorMessage(null);

      try {
        const nextTrack = await api.getTrack(trackSlug);
        if (cancelled) {
          return;
        }
        setTrack(nextTrack);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Failed to load track metadata.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrack();

    return () => {
      cancelled = true;
    };
  }, [initialTrack, trackSlug]);

  const modalTitle = `Edit: ${(track ?? initialTrack)?.name ?? trackSlug}`;
  const modalDescription = (track ?? initialTrack)?.slug ?? trackSlug;

  return (
    <ModalShell
      title={modalTitle}
      description={modalDescription}
      headerLeading={<AppIcon name="pencil" className="h-6 w-6" />}
      onClose={onClose}
    >
      {track ? (
        <TrackMetadataEditor
          trackSlug={track.slug}
          initialName={track.name}
          initialArtistSlugs={track.artistSlugs}
          initialProjectSlugs={track.projectSlugs}
          initialTagSlugs={track.tagSlugs}
          initialAudio={track.audio}
          showAudio={showAudio}
          artistOptions={artistOptions}
          projectOptions={projectOptions}
          tagOptions={tagOptions}
          withPanel={false}
          submitLabel="Save Track"
          footerActions={footerActions}
          onCancel={onClose}
          onSaved={onSaved}
        />
      ) : null}
      {loading && !track ? <p className="text-sm text-[color:var(--muted)]">Loading track metadata...</p> : null}
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}
    </ModalShell>
  );
}
