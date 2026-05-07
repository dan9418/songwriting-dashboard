"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { TrackAudioTable } from "@/components/tracks/track-audio-table";
import { TrackMarkdownDocCard } from "@/components/tracks/track-markdown-doc-card";
import { TrackMetadataEditor } from "@/components/tracks/track-metadata-editor";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { ModalShell } from "@/components/ui/modal-shell";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import type { TrackMetadataOption, TrackQuickEditRecord } from "@/lib/tracks/types";

function buildImageHref(imageSlug: string): string {
  return `/api/images/${encodeURIComponent(imageSlug)}`;
}

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
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [track, setTrack] = useState<TrackQuickEditRecord | null>(initialTrack ?? null);
  const [loading, setLoading] = useState(initialTrack === undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const currentTrack = track ?? initialTrack ?? null;
  const sectionLoadError = loading ? null : errorMessage;
  const showAudioSection = showAudio;
  const showNotesSection = showNotes;
  const metadataSectionReady = track !== null;
  const audioSectionReady = track !== null;
  const artworkImageHref = useMemo(() => {
    if (!currentTrack?.displayImageSlug) {
      return null;
    }

    const href = buildImageHref(currentTrack.displayImageSlug);
    return imageVersion > 0 ? `${href}?v=${imageVersion}` : href;
  }, [currentTrack?.displayImageSlug, imageVersion]);

  function openFilePicker() {
    if (uploadingImage || deletingImage) {
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage(null);
      const nextTrack = await api.uploadTrackImage(trackSlug, file);
      setTrack(nextTrack);
      setImageVersion(Date.now());
      showToast(currentTrack?.directImageSlug ? "Track image replaced." : "Track image uploaded.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload track image.";
      setErrorMessage(message);
      showToast("Failed to upload track image.", "error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage() {
    if (!currentTrack?.directImageSlug) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the direct image for "${currentTrack.name || trackSlug}"?`
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingImage(true);
      setErrorMessage(null);
      const nextTrack = await api.deleteTrackImage(trackSlug);
      setTrack(nextTrack);
      setImageVersion(Date.now());
      showToast("Track image deleted.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete track image.";
      setErrorMessage(message);
      showToast("Failed to delete track image.", "error");
    } finally {
      setDeletingImage(false);
    }
  }

  return (
    <ModalShell
      title={modalTitle}
      headerLeading={<AppIcon name="pencil" className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <TrackQuickEditSection
          title="Artwork"
          ready={currentTrack !== null}
          loadingLabel="Loading artwork..."
          errorMessage={sectionLoadError}
        >
          {currentTrack ? (
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <EntityPlaceholderArtwork
                kind="track"
                variant="detail-cover"
                imageHref={artworkImageHref}
                alt={`${currentTrack.name} artwork`}
              />
              <div className="grid gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleFileSelection(event)}
                />
                <p className="text-sm text-[color:var(--muted)]">
                  {currentTrack.directImageSlug
                    ? "This track has direct artwork."
                    : currentTrack.displayImageSlug
                      ? "This track is currently using linked project artwork."
                      : "No artwork uploaded yet."}
                </p>
                {currentTrack.directImageSlug ? (
                  <p className="text-xs text-[color:var(--muted)]">
                    Deleting the direct image will fall back to linked project artwork when available.
                  </p>
                ) : currentTrack.displayImageSlug ? (
                  <p className="text-xs text-[color:var(--muted)]">
                    Uploading a track image will override the linked project artwork shown on the page.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    disabled={uploadingImage || deletingImage}
                    onClick={openFilePicker}
                  >
                    {uploadingImage
                      ? currentTrack.directImageSlug
                        ? "Replacing..."
                        : "Uploading..."
                      : currentTrack.directImageSlug
                        ? "Replace Image"
                        : "Upload Image"}
                  </ActionButton>
                  {currentTrack.directImageSlug ? (
                    <ActionButton
                      tone="danger"
                      disabled={uploadingImage || deletingImage}
                      onClick={() => void handleDeleteImage()}
                    >
                      {deletingImage ? "Deleting..." : "Delete Image"}
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </TrackQuickEditSection>

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
