"use client";

import { useMemo, useRef, useState } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { Field } from "@/components/ui/field";
import { ModalShell } from "@/components/ui/modal-shell";
import { TextArea } from "@/components/ui/text-area";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

function buildImageHref(imageSlug: string): string {
  return `/api/images/${encodeURIComponent(imageSlug)}`;
}

export function ArtistQuickEditModal({
  artistSlug,
  initialName,
  initialDescription,
  initialImageSlug,
  onClose,
  onSaved
}: {
  artistSlug: string;
  initialName: string;
  initialDescription: string;
  initialImageSlug: string | null;
  onClose: () => void;
  onSaved: (next: { name: string; description: string }) => void;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageSlug, setImageSlug] = useState(initialImageSlug);
  const [imageVersion, setImageVersion] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageHref = useMemo(() => {
    if (!imageSlug) {
      return null;
    }

    const href = buildImageHref(imageSlug);
    return imageVersion > 0 ? `${href}?v=${imageVersion}` : href;
  }, [imageSlug, imageVersion]);

  async function saveArtist() {
    setSaving(true);
    setErrorMessage(null);

    try {
      const trimmedName = name.trim();
      await api.updateArtist(artistSlug, {
        slug: artistSlug,
        name: trimmedName,
        description
      });
      showToast("Artist updated.");
      router.refresh();
      onSaved({ name: trimmedName, description });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update artist.";
      setErrorMessage(message);
      showToast("Failed to update artist.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArtist() {
    const confirmed = window.confirm(
      `Delete artist "${name || artistSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);

    try {
      await api.deleteArtist(artistSlug);
      showToast("Artist deleted.");
      router.push("/artists");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete artist.";
      setErrorMessage(message);
      showToast("Failed to delete artist.", "error");
      setDeleting(false);
    }
  }

  function openFilePicker() {
    if (saving || deleting || uploadingImage || deletingImage) {
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
      const hadImage = Boolean(imageSlug);
      setUploadingImage(true);
      setErrorMessage(null);
      const result = await api.uploadArtistImage(artistSlug, file);
      setImageSlug(result.imageSlug);
      setImageVersion(Date.now());
      showToast(hadImage ? "Artist image replaced." : "Artist image uploaded.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload artist image.";
      setErrorMessage(message);
      showToast("Failed to upload artist image.", "error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage() {
    if (!imageSlug) {
      return;
    }

    const confirmed = window.confirm(`Delete the image for "${name || artistSlug}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingImage(true);
      setErrorMessage(null);
      await api.deleteArtistImage(artistSlug);
      setImageSlug(null);
      setImageVersion(Date.now());
      showToast("Artist image deleted.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete artist image.";
      setErrorMessage(message);
      showToast("Failed to delete artist image.", "error");
    } finally {
      setDeletingImage(false);
    }
  }

  return (
    <ModalShell
      title={name.trim() || artistSlug}
      headerLeading={<AppIcon name="pencil" className="h-6 w-6" />}
      footer={
        <ActionButton
          tone="danger"
          disabled={saving || deleting || uploadingImage || deletingImage}
          onClick={() => void deleteArtist()}
        >
          {deleting ? "Deleting..." : "Delete Artist"}
        </ActionButton>
      }
      onClose={onClose}
    >
      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4">
        <h3 className="text-lg font-semibold">Artwork</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[128px_minmax(0,1fr)] md:items-start">
          <EntityPlaceholderArtwork
            kind="artist"
            variant="detail-avatar"
            imageHref={imageHref}
            alt={`${name || artistSlug} artwork`}
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
              {imageSlug ? "This artist has uploaded artwork." : "No artwork uploaded yet."}
            </p>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                disabled={saving || deleting || uploadingImage || deletingImage}
                onClick={openFilePicker}
              >
                {uploadingImage ? (imageSlug ? "Replacing..." : "Uploading...") : imageSlug ? "Replace Image" : "Upload Image"}
              </ActionButton>
              {imageSlug ? (
                <ActionButton
                  tone="danger"
                  disabled={saving || deleting || uploadingImage || deletingImage}
                  onClick={() => void handleDeleteImage()}
                >
                  {deletingImage ? "Deleting..." : "Delete Image"}
                </ActionButton>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4">
        <h3 className="text-lg font-semibold">Metadata</h3>
        <div className="mt-4 grid gap-3">
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorMessage}
            </p>
          ) : null}
          <Field label="Name">
            <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </Field>
          <div className="flex items-center gap-2">
            <ActionButton
              disabled={saving || deleting || uploadingImage || deletingImage || name.trim().length === 0}
              onClick={saveArtist}
            >
              {saving ? "Saving..." : "Save Artist"}
            </ActionButton>
            <ActionButton tone="ghost" disabled={saving || deleting || uploadingImage || deletingImage} onClick={onClose}>
              Cancel
            </ActionButton>
          </div>
        </div>
      </section>
    </ModalShell>
  );
}
