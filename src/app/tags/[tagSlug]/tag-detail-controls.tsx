"use client";

import { useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { ActionButton } from "@/components/ui/action-button";
import { AppIcon } from "@/components/ui/app-icons";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

export function TagDetailControls({
  tagSlug,
  initialName
}: {
  tagSlug: string;
  initialName: string;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();

  const [currentSlug, setCurrentSlug] = useState(tagSlug);
  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function saveHeader() {
    setSavingHeader(true);
    setErrorMessage(null);
    try {
      const trimmedName = name.trim();
      const nextSlug = ensureNonEmptySlug(trimmedName);
      await api.updateTag(currentSlug, {
        slug: currentSlug,
        name: trimmedName
      });
      setName(trimmedName);
      setCurrentSlug(nextSlug);
      setEditingName(false);
      showToast("Tag updated.");
      router.push(`/tags/${nextSlug}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update tag.");
      showToast("Failed to update tag.", "error");
    } finally {
      setSavingHeader(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete tag "${name || currentSlug}"? It will be removed from all linked tracks.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteTag(currentSlug);
      showToast("Tag deleted.");
      router.push("/tracks");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete tag.");
      showToast("Failed to delete tag.", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {!editingName ? (
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{name}</h1>
              <button
                type="button"
                className="rounded-lg bg-[color:var(--button-ghost-bg)] px-2 py-1 text-sm text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)]"
                aria-label="Edit tag name"
                onClick={() => setEditingName(true)}
              >
                <AppIcon name="pencil" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TextInput
                className="w-full sm:max-w-md"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <ActionButton disabled={savingHeader || name.trim().length === 0} onClick={saveHeader}>
                {savingHeader ? "Saving..." : "Save"}
              </ActionButton>
              <ActionButton
                tone="ghost"
                disabled={savingHeader}
                onClick={() => {
                  setEditingName(false);
                  setName(initialName);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          )}
        </div>
        {editingName ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <ActionButton tone="danger" disabled={deleting || savingHeader} onClick={onDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </ActionButton>
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
    </>
  );
}
