"use client";

import Link from "next/link";
import { ActionButton, Field } from "@/components/ui/form-controls";

export interface LinkedEntityItem {
  id: string;
  label: string;
  href: string;
}

export interface LinkedEntitySelectorOption {
  value: string;
  label: string;
}

export interface LinkedEntitySelector {
  label: string;
  value: string;
  options: LinkedEntitySelectorOption[];
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  disabled?: boolean;
}

export interface LinkedEntitySection {
  key: string;
  title: string;
  items: LinkedEntityItem[];
  emptyText?: string;
  selector?: LinkedEntitySelector;
}

export function LinkedEntitiesPanel({
  title = "Linked Entities",
  sections
}: {
  title?: string;
  sections: LinkedEntitySection[];
}) {
  return (
    <div className="panel grid gap-4 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {sections.map((section) => (
        <div key={section.key} className="grid gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
            {section.title}
          </p>
          {section.items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-lg bg-[#f8efe3] px-3 py-2 text-sm transition hover:bg-[#f0e1cf]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : section.selector ? (
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <Field label={section.selector.label}>
                <select
                  value={section.selector.value}
                  onChange={(event) => section.selector?.onChange(event.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d9ccb8] bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
                >
                  {section.selector.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <ActionButton
                disabled={
                  section.selector.disabled ||
                  !section.selector.value ||
                  section.selector.options.length === 0
                }
                onClick={section.selector.onSubmit}
              >
                {section.selector.submitLabel}
              </ActionButton>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">{section.emptyText ?? "No linked entities."}</p>
          )}
        </div>
      ))}
    </div>
  );
}

