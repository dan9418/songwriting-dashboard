"use client";

import type { SelectHTMLAttributes } from "react";

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
