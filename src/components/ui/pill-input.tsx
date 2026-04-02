"use client";

import { TextInput } from "./text-input";

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
