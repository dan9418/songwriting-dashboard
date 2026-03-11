"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface CreateEntityFormProps {
  entityLabel: string;
  submitLabel: string;
  successMessage: string;
  helperText?: string;
  createEntity: (name: string) => Promise<{ slug: string }>;
  getSuccessHref: (slug: string) => string;
}

export function CreateEntityForm({
  entityLabel,
  submitLabel,
  successMessage,
  helperText,
  createEntity,
  getSuccessHref
}: CreateEntityFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const derivedSlug = useMemo(() => {
    try {
      return ensureNonEmptySlug(name);
    } catch {
      return "";
    }
  }, [name]);

  return (
    <form
      className="panel grid gap-4 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setSubmitting(true);
        try {
          const created = await createEntity(name);
          showToast(successMessage);
          router.push(getSuccessHref(created.slug));
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : `Failed to create ${entityLabel.toLowerCase()}.`);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3">
        <Field label="Name">
          <TextInput
            autoFocus
            value={name}
            placeholder={`${entityLabel} name`}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </Field>
        <Field label="Slug">
          <TextInput value={derivedSlug} placeholder="Derived from name" disabled />
        </Field>
      </div>
      {helperText ? <p className="text-sm text-[color:var(--muted)]">{helperText}</p> : null}
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}
      <div className="flex justify-end">
        <ActionButton type="submit" disabled={submitting || !derivedSlug}>
          {submitting ? "Creating..." : submitLabel}
        </ActionButton>
      </div>
    </form>
  );
}
