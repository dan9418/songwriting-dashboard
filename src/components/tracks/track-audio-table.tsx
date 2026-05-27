"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useProgressRouter } from "@/components/navigation/route-progress";
import { AppIcon } from "@/components/ui/app-icons";
import { ActionButton } from "@/components/ui/action-button";
import { Field } from "@/components/ui/field";
import { ModalShell } from "@/components/ui/modal-shell";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import type { TrackAudioTableItem } from "@/lib/tracks/types";

function formatDateForTable(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  const yearTwo = year.slice(-2);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (!Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) {
    return value;
  }

  return `${monthNumber}/${dayNumber}/${yearTwo}`;
}

function buildTypeIndexes(audioItems: TrackAudioTableItem[]): Map<string, number | null> {
  const byType = new Map<string, TrackAudioTableItem[]>();
  for (const item of audioItems) {
    byType.set(item.type, [...(byType.get(item.type) ?? []), item]);
  }

  const indexes = new Map<string, number | null>();
  for (const items of byType.values()) {
    const descriptorCount = items.filter((item) => item.dateDescriptor).length;
    for (const item of items) {
      if (item.dateDescriptor) {
        indexes.set(item.id, null);
      }
    }

    items
      .filter((item) => !item.dateDescriptor)
      .sort((left, right) => {
        const dateSort = left.date.localeCompare(right.date);
        if (dateSort !== 0) {
          return dateSort;
        }
        return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
      })
      .forEach((item, index) => {
        indexes.set(item.id, descriptorCount + index + 1);
      });
  }
  return indexes;
}

export function TrackAudioTable({
  trackSlug,
  audio,
  title = "Audio",
  showTitle = true
}: {
  trackSlug: string;
  audio: TrackAudioTableItem[];
  title?: string;
  showTitle?: boolean;
}) {
  const router = useProgressRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedAudioSlug, setExpandedAudioSlug] = useState<string | null>(null);
  const [audioItems, setAudioItems] = useState(audio);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioType, setAudioType] = useState<"note" | "demo" | "live">("demo");
  const [audioDate, setAudioDate] = useState("");
  const [audioDateDescriptor, setAudioDateDescriptor] = useState("");
  const [audioName, setAudioName] = useState("");
  const [editingAudio, setEditingAudio] = useState<TrackAudioTableItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"note" | "demo" | "live">("demo");
  const [editDate, setEditDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setAudioItems(audio);
  }, [audio]);

  const typeIndexes = buildTypeIndexes(audioItems);

  function toggleExpanded(slug: string) {
    setExpandedAudioSlug((current) => (current === slug ? null : slug));
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setUploading(true);

    try {
      const updatedTrack = await api.uploadTrackAudio(trackSlug, {
        file: selectedFile,
        type: audioType,
        date: audioDate,
        dateDescriptor: audioDateDescriptor,
        name: audioName
      });
      setAudioItems(updatedTrack.audio);
      setSelectedFile(null);
      setAudioDateDescriptor("");
      setAudioName("");
      setExpandedAudioSlug(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Audio uploaded.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload audio.";
      showToast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(audioItem: TrackAudioTableItem) {
    setEditingAudio(audioItem);
    setEditName(audioItem.name);
    setEditType(audioItem.type as "note" | "demo" | "live");
    setEditDate(audioItem.date);
  }

  async function handleEditSave() {
    if (!editingAudio) {
      return;
    }

    setSavingEdit(true);
    try {
      const updatedTrack = await api.updateTrackAudio(trackSlug, editingAudio.id, {
        name: editName,
        type: editType,
        date: editDate
      });
      setAudioItems(updatedTrack.audio);
      setEditingAudio(null);
      setExpandedAudioSlug(null);
      showToast("Audio details updated.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update audio.";
      showToast(message, "error");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="overflow-x-auto">
      {showTitle ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <table className={`theme-table text-sm ${showTitle ? "mt-3" : ""}`}>
        <thead>
          <tr className="text-xs uppercase tracking-wide">
            <th className="px-2 py-2 font-semibold">Name</th>
            <th className="px-2 py-2 font-semibold">Type</th>
            <th className="px-2 py-2 font-semibold">Index</th>
            <th className="px-2 py-2 font-semibold">Date</th>
            <th className="px-2 py-2 font-semibold">Edit</th>
          </tr>
        </thead>
        <tbody>
          {audioItems.map((audioItem) => {
            const isExpanded = expandedAudioSlug === audioItem.id;

            return (
              <Fragment key={audioItem.id}>
                <tr data-expanded={isExpanded ? "true" : "false"}>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    {audioItem.fileHref ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Play"} ${audioItem.name}`}
                        className="inline-flex items-center gap-2 text-left underline decoration-[color:var(--border-strong)] underline-offset-4 transition hover:text-[color:var(--accent)]"
                        onClick={() => toggleExpanded(audioItem.id)}
                      >
                        <AppIcon
                          name={isExpanded ? "chevron-down" : "chevron-right"}
                          className="h-4 w-4 shrink-0"
                        />
                        {audioItem.name}
                      </button>
                    ) : (
                      <span>
                        {audioItem.name}
                        {audioItem.fileMissing ? (
                          <span className="ml-2 text-xs text-red-700">File missing</span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>{audioItem.type}</td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    {typeIndexes.get(audioItem.id) ?? "--"}
                  </td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    {audioItem.dateDescriptor ?? formatDateForTable(audioItem.date)}
                  </td>
                  <td className={`px-2 py-2 ${isExpanded ? "border-b-0" : ""}`}>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--border)] text-[color:var(--muted)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--ink)]"
                      aria-label={`Edit ${audioItem.name}`}
                      title={`Edit ${audioItem.name}`}
                      onClick={() => openEditModal(audioItem)}
                    >
                      <AppIcon name="pencil" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {isExpanded && audioItem.fileHref ? (
                  <tr>
                    <td colSpan={5} className="px-2 pb-3 pt-0">
                      <audio
                        key={audioItem.id}
                        controls
                        autoPlay
                        preload="metadata"
                        src={audioItem.fileHref}
                        className="w-full"
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {audioItems.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--muted)]">No audio metadata rows found.</p>
      ) : null}

      <div className="mt-6 grid gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp4,audio/x-m4a"
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            setSelectedFile(event.currentTarget.files?.[0] ?? null);
          }}
        />
        <div className="grid gap-2 md:grid-cols-4">
          <select
            value={audioType}
            disabled={uploading}
            className="h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm"
            onChange={(event) => setAudioType(event.currentTarget.value as "note" | "demo" | "live")}
          >
            <option value="note">Note</option>
            <option value="demo">Demo</option>
            <option value="live">Live</option>
          </select>
          <input
            type="date"
            value={audioDate}
            disabled={uploading}
            required
            className="h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm"
            onChange={(event) => setAudioDate(event.currentTarget.value)}
          />
          <input
            type="text"
            value={audioName}
            disabled={uploading}
            placeholder="Name"
            className="h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm"
            onChange={(event) => setAudioName(event.currentTarget.value)}
          />
          <input
            type="text"
            value={audioDateDescriptor}
            disabled={uploading}
            placeholder="Date label"
            className="h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm"
            onChange={(event) => setAudioDateDescriptor(event.currentTarget.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <ActionButton
            tone="ghost"
            className="h-10 justify-center md:self-stretch"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </ActionButton>
          <ActionButton
            tone="ghost"
            className="h-10 justify-center md:self-stretch"
            disabled={uploading || !selectedFile || !audioDate}
            onClick={() => void handleUpload()}
          >
            {uploading ? "Uploading..." : "Upload Audio"}
          </ActionButton>
        </div>
        <p className="text-xs text-[color:var(--muted)]">
          {selectedFile ? selectedFile.name : "No file selected"}
        </p>
      </div>
      {editingAudio ? (
        <ModalShell
          title="Audio Details"
          onClose={() => {
            if (!savingEdit) {
              setEditingAudio(null);
            }
          }}
          footer={
            <div className="flex justify-end gap-2">
              <ActionButton tone="ghost" disabled={savingEdit} onClick={() => setEditingAudio(null)}>
                Cancel
              </ActionButton>
              <ActionButton disabled={savingEdit || !editName.trim() || !editDate} onClick={() => void handleEditSave()}>
                {savingEdit ? "Saving..." : "Save"}
              </ActionButton>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Type">
              <SelectInput
                value={editType}
                options={["note", "demo", "live"]}
                disabled={savingEdit}
                onChange={(event) => setEditType(event.currentTarget.value as "note" | "demo" | "live")}
              />
            </Field>
            <Field label="Name">
              <TextInput
                value={editName}
                disabled={savingEdit}
                onChange={(event) => setEditName(event.currentTarget.value)}
              />
            </Field>
            <Field label="Date">
              <TextInput
                type="date"
                value={editDate}
                disabled={savingEdit}
                onChange={(event) => setEditDate(event.currentTarget.value)}
              />
            </Field>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
