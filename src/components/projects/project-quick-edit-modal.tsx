"use client";

import { useMemo, useRef, useState } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { Field } from "@/components/ui/field";
import { ModalShell } from "@/components/ui/modal-shell";
import { SelectInput } from "@/components/ui/select-input";
import { TextArea } from "@/components/ui/text-area";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";

type ProjectType = "album" | "ep" | "single" | "setlist";

function buildImageHref(imageSlug: string): string {
  return `/api/images/${encodeURIComponent(imageSlug)}`;
}

export function ProjectQuickEditModal({
  projectSlug,
  initialName,
  initialDescription,
  initialType,
  initialReleaseDate,
  initialRemasterDate,
  initialImageSlug,
  onClose,
  onSaved
}: {
  projectSlug: string;
  initialName: string;
  initialDescription: string;
  initialType: ProjectType;
  initialReleaseDate: string | null;
  initialRemasterDate: string | null;
  initialImageSlug: string | null;
  onClose: () => void;
  onSaved: (next: {
    name: string;
    description: string;
    type: ProjectType;
    releaseDate: string | null;
    remasterDate: string | null;
  }) => void;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [type, setType] = useState<ProjectType>(initialType);
  const [releaseDate, setReleaseDate] = useState(initialReleaseDate ?? "");
  const [remasterDate, setRemasterDate] = useState(initialRemasterDate ?? "");
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

  async function saveProject() {
    setSaving(true);
    setErrorMessage(null);

    try {
      const trimmedName = name.trim();
      const nextReleaseDate = releaseDate.trim() ? releaseDate.trim() : null;
      const nextRemasterDate = remasterDate.trim() ? remasterDate.trim() : null;

      await api.updateProject(projectSlug, {
        slug: projectSlug,
        name: trimmedName,
        description,
        type,
        releaseDate: nextReleaseDate,
        remasterDate: nextRemasterDate
      });
      showToast("Project updated.");
      router.refresh();
      onSaved({
        name: trimmedName,
        description,
        type,
        releaseDate: nextReleaseDate,
        remasterDate: nextRemasterDate
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update project.";
      setErrorMessage(message);
      showToast("Failed to update project.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    const confirmed = window.confirm(
      `Delete project "${name || projectSlug}"? This cannot be undone and linked rows will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);

    try {
      await api.deleteProject(projectSlug);
      showToast("Project deleted.");
      router.push("/projects");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete project.";
      setErrorMessage(message);
      showToast("Failed to delete project.", "error");
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
      const result = await api.uploadProjectImage(projectSlug, file);
      setImageSlug(result.imageSlug);
      setImageVersion(Date.now());
      showToast(hadImage ? "Project image replaced." : "Project image uploaded.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload project image.";
      setErrorMessage(message);
      showToast("Failed to upload project image.", "error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage() {
    if (!imageSlug) {
      return;
    }

    const confirmed = window.confirm(`Delete the image for "${name || projectSlug}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingImage(true);
      setErrorMessage(null);
      await api.deleteProjectImage(projectSlug);
      setImageSlug(null);
      setImageVersion(Date.now());
      showToast("Project image deleted.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete project image.";
      setErrorMessage(message);
      showToast("Failed to delete project image.", "error");
    } finally {
      setDeletingImage(false);
    }
  }

  return (
    <ModalShell
      title={name.trim() || projectSlug}
      headerLeading={<AppIcon name="pencil" className="h-6 w-6" />}
      footer={
        <ActionButton
          tone="danger"
          disabled={saving || deleting || uploadingImage || deletingImage}
          onClick={() => void deleteProject()}
        >
          {deleting ? "Deleting..." : "Delete Project"}
        </ActionButton>
      }
      onClose={onClose}
    >
      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4">
        <h3 className="text-lg font-semibold">Artwork</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
          <EntityPlaceholderArtwork
            kind="project"
            variant="detail-cover"
            imageHref={imageHref}
            alt={`${name || projectSlug} artwork`}
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
              {imageSlug ? "This project has uploaded artwork." : "No artwork uploaded yet."}
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
          <Field label="Type">
            <SelectInput
              options={["album", "ep", "single", "setlist"]}
              value={type}
              onChange={(event) => setType(event.currentTarget.value as ProjectType)}
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Release Date (YYYY-MM-DD)">
              <TextInput value={releaseDate} onChange={(event) => setReleaseDate(event.currentTarget.value)} />
            </Field>
            <Field label="Remaster Date (YYYY-MM-DD)">
              <TextInput
                value={remasterDate}
                onChange={(event) => setRemasterDate(event.currentTarget.value)}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              disabled={saving || deleting || uploadingImage || deletingImage || name.trim().length === 0}
              onClick={saveProject}
            >
              {saving ? "Saving..." : "Save Project"}
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
