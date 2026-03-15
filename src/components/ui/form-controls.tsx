"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-[color:var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`theme-input ring-0 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`theme-input ring-0 ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(
  props: Omit<SelectHTMLAttributes<HTMLSelectElement>, "type"> & { options: string[] }
) {
  return (
    <select
      {...props}
      className={`theme-input ring-0 ${props.className ?? ""}`}
    >
      {props.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function PillInput({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value.join(", ")}
      onChange={(event) =>
        onChange(
          event.currentTarget.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder ?? "tag-one, tag-two"}
    />
  );
}

export function ActionButton({
  children,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-hover)]"
      : tone === "danger"
        ? "bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-hover)]"
        : "bg-[color:var(--button-ghost-bg)] text-[color:var(--button-ghost-text)] hover:bg-[color:var(--button-ghost-hover)]";

  return (
    <button
      {...props}
      className={`rounded-lg border border-transparent px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
