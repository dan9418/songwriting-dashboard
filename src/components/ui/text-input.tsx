"use client";

import type { InputHTMLAttributes } from "react";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`theme-input ring-0 ${props.className ?? ""}`}
    />
  );
}
