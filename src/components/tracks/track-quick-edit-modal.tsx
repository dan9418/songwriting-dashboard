"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TrackAudioTable } from "@/components/tracks/track-audio-table";
import { TrackMarkdownDocCard } from "@/components/tracks/track-markdown-doc-card";
import { TrackMetadataEditor } from "@/components/tracks/track-metadata-editor";
import { AppIcon } from "@/components/ui/app-icons";
import { ModalShell } from "@/components/ui/modal-shell";
import { api } from "@/lib/client/api";
import type { TrackMetadataOption, TrackQuickEditRecord } from "@/lib/tracks/types";

function TrackQuickEditSection({
  title,
  ready,
  loadingLabel,
  errorMessage,
  children
}: {
  title?: string;
  ready: boolean;
  loadingLabel: string;
  errorMessage?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4">
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}

      <div className={title ? "mt-4" : ""}>
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : !ready ? (
          <div className="grid gap-3">
            <p className="text-sm text-[color:var(--muted)]">{loadingLabel}</p>
            <div className="h-10 rounded-xl bg-white/70" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-28 rounded-xl bg-white/70" />
              <div className="h-28 rounded-xl bg-white/70" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function TrackQuickEditModal({
  trackSlug,
  initialTrack,
  showAudio = true,
  showNotes = true,
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
  showNotes?: boolean;
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

  const modalTitle = `${(track ?? initialTrack)?.name ?? trackSlug}`;
  const modalDescription = (track ?? initialTrack)?.slug ?? trackSlug;
  const sectionLoadError = loading ? null : errorMessage;
  const showAudioSection = showAudio;
  const showNotesSection = showNotes;
  const metadataSectionReady = track !== null;
  const audioSectionReady = track !== null;

  return (
    <ModalShell
      title={modalTitle}
      description={modalDescription}
      headerLeading={<AppIcon name="pencil" className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <TrackQuickEditSection
          title="Metadata"
          ready={metadataSectionReady}
          loadingLabel="Loading metadata..."
          errorMessage={sectionLoadError}
        >
          {track ? (
            <TrackMetadataEditor
              trackSlug={track.slug}
              initialName={track.name}
              initialArtistSlugs={track.artistSlugs}
              initialProjectSlugs={track.projectSlugs}
              initialTagSlugs={track.tagSlugs}
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
        </TrackQuickEditSection>

        {showAudioSection ? (
          <TrackQuickEditSection
            title="Audio"
            ready={audioSectionReady}
            loadingLabel="Loading audio..."
            errorMessage={sectionLoadError}
          >
            {track ? <TrackAudioTable trackSlug={track.slug} audio={track.audio} showTitle={false} /> : null}
          </TrackQuickEditSection>
        ) : null}

        {showNotesSection ? (
          <TrackQuickEditSection
            title={undefined}
            ready
            loadingLabel="Loading notes..."
          >
            <TrackMarkdownDocCard trackSlug={trackSlug} type="notes" withPanel={false} showTitle />
          </TrackQuickEditSection>
        ) : null}
      </div>
    </ModalShell>
  );
}
