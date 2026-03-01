"use client";

import { useEffect, useState } from "react";
import { ActionButton, Field, PillInput, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/api";
import { DEFAULT_USER_SLUG } from "@/lib/client/config";
import { useUnsavedWarning } from "@/lib/client/use-unsaved-warning";
import type { UserData } from "@/lib/client/types";

export default function AccountPage() {
  const userSlug = DEFAULT_USER_SLUG;
  const { showToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useUnsavedWarning(dirty);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getUser(userSlug);
        setUser(response.data);
        setContent(response.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userSlug]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <h2 className="text-2xl font-semibold">Account</h2>
        <p className="text-sm text-[color:var(--muted)]">User metadata and local preferences.</p>
      </div>
      {error ? <div className="panel border-red-300 p-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="panel p-4 text-sm text-[color:var(--muted)]">Loading account...</div> : null}

      {user ? (
        <div className="panel grid gap-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Display Name">
              <TextInput
                value={user.displayName}
                onChange={(event) => {
                  setDirty(true);
                  setUser((prev) => (prev ? { ...prev, displayName: event.currentTarget.value } : prev));
                }}
              />
            </Field>
            <Field label="Timezone">
              <TextInput
                value={user.timezone}
                onChange={(event) => {
                  setDirty(true);
                  setUser((prev) => (prev ? { ...prev, timezone: event.currentTarget.value } : prev));
                }}
              />
            </Field>
            <Field label="Default Artists">
              <PillInput
                value={user.defaultArtistSlugs}
                onChange={(defaultArtistSlugs) => {
                  setDirty(true);
                  setUser((prev) => (prev ? { ...prev, defaultArtistSlugs } : prev));
                }}
              />
            </Field>
            <Field label="Tags">
              <PillInput
                value={user.tags}
                onChange={(tags) => {
                  setDirty(true);
                  setUser((prev) => (prev ? { ...prev, tags } : prev));
                }}
              />
            </Field>
          </div>
          <Field label="Profile Markdown Content">
            <textarea
              rows={8}
              value={content}
              onChange={(event) => {
                setDirty(true);
                setContent(event.currentTarget.value);
              }}
              className="w-full rounded-lg border border-[#d9ccb8] bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
            />
          </Field>
          <ActionButton
            disabled={saving}
            onClick={async () => {
              if (!user) {
                return;
              }
              setSaving(true);
              try {
                const next = await api.patchUser(userSlug, user, content);
                setUser(next.data);
                setContent(next.content);
                setDirty(false);
                showToast("Account updated.");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Save failed.", "error");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save Account"}
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}

